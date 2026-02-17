export const runtime = 'nodejs';
import { neon } from '@neondatabase/serverless';
import { initDB } from '../../../lib/db-init.js';
import { promises as dns } from 'dns';

// ========================================
// Phase 1+2+3: 高精度AI検出ロジック
// ========================================

// Phase 2: アクセス間隔チェック用キャッシュ
const accessCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamp] of accessCache.entries()) {
    if (now - timestamp > 5 * 60 * 1000) {
      accessCache.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ========================================
// Phase 3 NEW: 既知AIクローラーのIPレンジ
// ========================================
// 各社が公式に公開しているCIDRリスト（定期的に更新推奨）
const AI_IP_RANGES = [
  // OpenAI / ChatGPT
  { cidr: '23.102.140.112/28', name: 'ChatGPT' },
  { cidr: '13.65.240.240/28', name: 'ChatGPT' },
  { cidr: '52.230.152.0/24', name: 'ChatGPT' },
  { cidr: '40.83.2.64/28',   name: 'ChatGPT' },
  // Anthropic / Claude
  { cidr: '160.79.104.0/23', name: 'Claude' },
  // Google (Gemini / GoogleBot)
  { cidr: '66.249.64.0/19',  name: 'Gemini' },
  { cidr: '66.249.80.0/20',  name: 'Gemini' },
  // Perplexity
  { cidr: '52.7.25.0/24',    name: 'Perplexity' },
  // Common Crawl
  { cidr: '66.80.224.0/21',  name: 'CommonCrawl' },
];

// CIDRマッチング（IPv4のみ）
function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpInCidr(ip, cidr) {
  try {
    const [range, bits] = cidr.split('/');
    const mask = ~(0xffffffff >>> parseInt(bits)) >>> 0;
    return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
  } catch {
    return false;
  }
}

function checkIpRange(ip) {
  if (!ip || ip === 'unknown' || ip.includes(':')) return null; // IPv6はスキップ
  for (const { cidr, name } of AI_IP_RANGES) {
    if (isIpInCidr(ip, cidr)) return name;
  }
  return null;
}

// ========================================
// Phase 3 NEW: DNS逆引き検証
// ========================================
// 既知のAIクローラーホスト名パターン
const AI_HOSTNAMES = [
  { pattern: 'googlebot.com',      name: 'Gemini' },
  { pattern: 'google.com',         name: 'Gemini' },
  { pattern: 'crawl.baidu.com',    name: 'Baidu' },
  { pattern: 'openai.com',         name: 'ChatGPT' },
  { pattern: 'anthropic.com',      name: 'Claude' },
  { pattern: 'perplexity.ai',      name: 'Perplexity' },
  { pattern: 'commoncrawl.org',    name: 'CommonCrawl' },
  { pattern: 'bytedance.com',      name: 'ByteDance' },
  { pattern: 'applebot.apple.com', name: 'Apple AI' },
  { pattern: 'bingbot.msn.com',    name: 'Bing AI' },
  { pattern: 'cohere.com',         name: 'Cohere' },
];

async function dnsReverseLookup(ip) {
  if (!ip || ip === 'unknown' || ip.includes(':')) return null;
  try {
    const hostnames = await Promise.race([
      dns.reverse(ip),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
    for (const hostname of hostnames) {
      for (const { pattern, name } of AI_HOSTNAMES) {
        if (hostname.endsWith(pattern)) return name;
      }
    }
    return null;
  } catch {
    return null; // タイムアウトやエラーは無視
  }
}

// ========================================
// User-Agent パターン辞書（200種類以上）
// ========================================
const AI_CRAWLERS_DB = {
  chatgpt: {
    name: 'ChatGPT',
    patterns: [
      'gptbot', 'chatgpt-user', 'chatgpt', 'openai-bot',
      'oai-searchbot', 'openai', 'gpt-3', 'gpt-4',
      'openaibot', 'chat-gpt', 'chatgpt-plugin'
    ]
  },
  claude: {
    name: 'Claude',
    patterns: [
      'claude-web', 'claude', 'anthropic', 'claudebot',
      'anthropic-ai', 'claude-bot', 'anthropicbot'
    ]
  },
  gemini: {
    name: 'Gemini',
    patterns: [
      'gemini', 'google-extended', 'bard', 'googleother',
      'google-inspectiontool', 'apis-google', 'googlebot-video',
      'googlebot-news', 'google-site-verification',
      'adsbot-google', 'mediapartners-google'
    ]
  },
  perplexity: {
    name: 'Perplexity',
    patterns: ['perplexitybot', 'perplexity', 'perplexbot', 'perplexity-ai']
  },
  cohere: {
    name: 'Cohere',
    patterns: ['cohere-ai', 'cohere', 'coherebot']
  },
  you: {
    name: 'You.com',
    patterns: ['youbot', 'you.com', 'youchat']
  },
  bing: {
    name: 'Bing AI',
    patterns: ['bingbot', 'msnbot', 'msnbot-media', 'adidxbot', 'bingpreview', 'msn ', 'edgebot']
  },
  meta: {
    name: 'Meta AI',
    patterns: ['facebookbot', 'facebookexternalhit', 'meta-externalagent', 'facebot', 'instagrambot', 'whatsappbot']
  },
  bytedance: {
    name: 'ByteDance',
    patterns: ['bytespider', 'bytedance', 'toutiaospider', 'douyinbot']
  },
  yandex: {
    name: 'Yandex',
    patterns: ['yandexbot', 'yadirectfetcher', 'yandex', 'yandexmobilebot']
  },
  apple: {
    name: 'Apple AI',
    patterns: ['applebot', 'applebot-extended', 'apple-pubsub']
  },
  amazon: {
    name: 'Amazon',
    patterns: ['amazonbot', 'alexa', 'ia_archiver']
  },
  commoncrawl: {
    name: 'CommonCrawl',
    patterns: ['ccbot', 'commoncrawl', 'cc-bot']
  },
  anthropic: {
    name: 'Anthropic (other)',
    patterns: ['anthropic']
  },
  baidu: {
    name: 'Baidu',
    patterns: ['baiduspider', 'baidu']
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    patterns: ['duckduckbot', 'duckduckgo']
  },
  semrush: {
    name: 'Semrush',
    patterns: ['semrushbot', 'semrush']
  },
  ahrefs: {
    name: 'Ahrefs',
    patterns: ['ahrefsbot', 'ahrefs']
  },
  screaming_frog: {
    name: 'Screaming Frog',
    patterns: ['screaming frog', 'screamingfrog']
  },
  dataforseo: {
    name: 'DataForSEO',
    patterns: ['dataforseobot', 'dataforseo']
  },
  dotbot: {
    name: 'DotBot',
    patterns: ['dotbot', 'moz.com']
  },
  petalbot: {
    name: 'PetalBot',
    patterns: ['petalbot', 'aspiegel']
  }
};

// ========================================
// Phase 3 NEW: HEADメソッド検出
// ========================================
// ブラウザはほぼHEADを使わない → クローラーの強いシグナル
function checkHeadMethod(method) {
  return method === 'HEAD';
}

// ========================================
// Phase 3 NEW: ヘッダーパターン精度向上
// ========================================
function analyzeHeaders(headers) {
  const signals = {
    // Sec-Fetch系（ブラウザは必ず付ける Chrome/Firefox/Edge）
    noSecFetch:
      !headers.get('sec-fetch-site') &&
      !headers.get('sec-fetch-mode') &&
      !headers.get('sec-fetch-dest'),

    // Client Hintsなし（モダンブラウザは必ず付ける）
    noClientHints:
      !headers.get('sec-ch-ua') &&
      !headers.get('sec-ch-ua-mobile') &&
      !headers.get('sec-ch-ua-platform'),

    // Accept-Languageが空 or 単一（ブラウザは複数指定）
    simpleLang: (() => {
      const lang = headers.get('accept-language') || '';
      return lang === '' || lang.split(',').length === 1;
    })(),

    // Accept が */* のみ（ブラウザはtext/html等を含む）
    genericAccept: (() => {
      const accept = headers.get('accept') || '';
      return !accept.includes('text/html') && accept.includes('*/*');
    })(),

    // Refererなし
    noReferer:
      !headers.get('referer') && !headers.get('referrer'),

    // Cookieなし
    noCookie: !headers.get('cookie'),

    // Connection: close（クローラーは永続接続を維持しない傾向）
    connectionClose:
      (headers.get('connection') || '').toLowerCase() === 'close',

    // DNT（Do Not Track）なし かつ Sec-Fetchもない（ブラウザ系の特徴がゼロ）
    noBrowserSignals:
      !headers.get('dnt') &&
      !headers.get('sec-fetch-site') &&
      !headers.get('upgrade-insecure-requests'),
  };

  // スコア計算
  const score =
    (signals.noSecFetch ? 3 : 0) +       // 最も信頼度高い
    (signals.noClientHints ? 2 : 0) +    // 信頼度高い
    (signals.genericAccept ? 1 : 0) +
    (signals.simpleLang ? 1 : 0) +
    (signals.noReferer ? 1 : 0) +
    (signals.noCookie ? 1 : 0) +
    (signals.connectionClose ? 1 : 0) +
    (signals.noBrowserSignals ? 1 : 0);

  return { signals, score };
}

// ========================================
// メイン検出ロジック（Phase 1+2+3統合）
// ========================================
async function detectAICrawlerAdvanced(headers, ip, method) {
  const userAgent = (headers.get('user-agent') || '').toLowerCase();
  let detectedCrawler = null;
  let detectionMethod = 'unknown';

  // === Layer 1: User-Agent マッチ（最優先・既存） ===
  for (const [, crawler] of Object.entries(AI_CRAWLERS_DB)) {
    for (const pattern of crawler.patterns) {
      if (userAgent.includes(pattern)) {
        detectedCrawler = crawler.name;
        detectionMethod = 'user-agent';
        break;
      }
    }
    if (detectedCrawler) break;
  }
  if (detectedCrawler) return { crawler: detectedCrawler, method: detectionMethod };

  // === Layer 2 NEW: IPレンジチェック ===
  const ipRangeMatch = checkIpRange(ip);
  if (ipRangeMatch) {
    return { crawler: ipRangeMatch, method: 'ip-range' };
  }

  // === Layer 3 NEW: DNS逆引き（非同期・2秒タイムアウト） ===
  const dnsMatch = await dnsReverseLookup(ip);
  if (dnsMatch) {
    return { crawler: dnsMatch, method: 'dns-reverse' };
  }

  // === Layer 4 NEW: HEADメソッド検出 ===
  if (checkHeadMethod(method)) {
    const looksLikeBot = /bot|crawler|spider|scraper/.test(userAgent);
    return {
      crawler: looksLikeBot ? 'Unknown Bot (HEAD)' : 'Unknown Crawler (HEAD)',
      method: 'head-method'
    };
  }

  // === Layer 5: アクセス間隔チェック（既存Phase2） ===
  const now = Date.now();
  const lastAccess = accessCache.get(ip);
  let isRapidAccess = false;
  if (lastAccess && (now - lastAccess) < 300) {
    isRapidAccess = true;
  }
  accessCache.set(ip, now);

  // === Layer 6 NEW: ヘッダー精度向上スコアリング ===
  const { signals, score: headerScore } = analyzeHeaders(headers);
  const looksLikeProgram = /(python|curl|axios|okhttp|java|go-http|bot)/.test(userAgent);

  const isSafari =
    userAgent.includes('safari') &&
    !userAgent.includes('chrome') &&
    !userAgent.includes('crios') &&
    !userAgent.includes('edg');

  // Safari誤検知を防ぐため除外
  const adjustedScore = isSafari ? 0 : headerScore;

  // しきい値: Sec-Fetch完全なし(3点) + Client Hints完全なし(2点) = 5点以上で疑わしい
  if (adjustedScore >= 5 && (isRapidAccess || looksLikeProgram || signals.noSecFetch)) {
    if (userAgent.includes('python'))      detectedCrawler = 'Unknown AI (Python)';
    else if (userAgent.includes('curl'))   detectedCrawler = 'Unknown AI (curl)';
    else if (userAgent.includes('axios'))  detectedCrawler = 'Unknown AI (axios)';
    else if (userAgent.includes('okhttp')) detectedCrawler = 'Unknown AI (okhttp)';
    else if (userAgent.includes('java'))   detectedCrawler = 'Unknown AI (Java)';
    else if (userAgent.includes('go-http'))detectedCrawler = 'Unknown AI (Go)';
    else if (userAgent.includes('bot'))    detectedCrawler = 'Unknown Bot';
    else                                   detectedCrawler = 'Unknown AI';

    detectionMethod = isRapidAccess ? 'rapid-access' : 'pattern-inference';
    return { crawler: detectedCrawler, method: detectionMethod };
  }

  return null;
}

// ========================================
// 旧バージョン互換（POST用シンプル版）
// ========================================
function detectAICrawler(ua) {
  if (!ua) return null;
  const ua_lower = ua.toLowerCase();
  for (const [, crawler] of Object.entries(AI_CRAWLERS_DB)) {
    for (const pattern of crawler.patterns) {
      if (ua_lower.includes(pattern)) return crawler.name;
    }
  }
  return null;
}

// ========================================
// OPTIONS（CORS Preflight）
// ========================================
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// ========================================
// GET リクエスト
// ========================================
export async function GET(request) {
  await initDB();

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Phase 2: JS実行検出
  if (pathname.includes('/js-active')) {
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
    );
    return new Response(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  // Phase 2: 画像リクエスト検出
  if (pathname.includes('/img-check')) {
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
    );
    return new Response(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  // Phase 1+2+3: 通常トラッキングピクセル
  const siteId = url.searchParams.get('site');
  const path = url.searchParams.get('path') || '/';

  const xff = request.headers.get('x-forwarded-for') || '';
  const ip = xff.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Phase 1+2+3: 高精度AI検出（非同期 = DNS逆引き対応）
  const detection = await detectAICrawlerAdvanced(request.headers, ip, request.method);

  console.log('Detection:', detection);

  if (detection && siteId) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const userAgent = request.headers.get('user-agent') || '';
      const referer   = request.headers.get('referer') || '';
      const accept    = request.headers.get('accept') || '';
      const acceptLang = request.headers.get('accept-language') || '';

      await sql`
        INSERT INTO ai_crawler_visits (
          site_id, user_agent, ip_address, referrer,
          page_url, session_id, crawler_name,
          accept_header, accept_language, detection_method
        ) VALUES (
          ${siteId}, ${userAgent}, ${ip}, ${referer},
          ${path}, ${generateSessionId()}, ${detection.crawler},
          ${accept}, ${acceptLang}, ${detection.method}
        )
      `;
      console.log(`✅ Saved: ${detection.crawler} (${detection.method})`);
    } catch (error) {
      console.error('❌ DB Error:', error);
    }
  }

  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
  );
  return new Response(gif, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

// ========================================
// Phase 3 NEW: HEADメソッド対応
// ========================================
export async function HEAD(request) {
  await initDB();

  const url = new URL(request.url);
  const siteId = url.searchParams.get('site');
  const path = url.searchParams.get('path') || '/';

  const xff = request.headers.get('x-forwarded-for') || '';
  const ip = xff.split(',')[0].trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // HEADメソッドは強いクローラーシグナル → 検出ロジックを通す
  const detection = await detectAICrawlerAdvanced(request.headers, ip, 'HEAD');

  if (detection && siteId) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const userAgent = request.headers.get('user-agent') || '';

      await sql`
        INSERT INTO ai_crawler_visits (
          site_id, user_agent, ip_address, referrer,
          page_url, session_id, crawler_name,
          accept_header, accept_language, detection_method
        ) VALUES (
          ${siteId}, ${userAgent}, ${ip}, ${''},
          ${path}, ${generateSessionId()}, ${detection.crawler},
          ${''}, ${''}, ${'head-method'}
        )
      `;
      console.log(`✅ HEAD Saved: ${detection.crawler}`);
    } catch (error) {
      console.error('❌ DB Error (HEAD):', error);
    }
  }

  // HEADはボディなしで返す
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

// ========================================
// POST リクエスト（既存のJS用）
// ========================================
export async function POST(request) {
  await initDB();

  try {
    const data = await request.json();
    const sql = neon(process.env.DATABASE_URL);
    const crawlerName = detectAICrawler(data.ua);

    if (!crawlerName) {
      return new Response('OK - Not AI', {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    await sql`
      INSERT INTO ai_crawler_visits (
        site_id, user_agent, ip_address, referrer,
        page_url, session_id, crawler_name, detection_method
      ) VALUES (
        ${data.site}, ${data.ua}, ${data.ip || 'unknown'},
        ${data.referrer || ''}, ${data.path || '/'},
        ${data.session || generateSessionId()}, ${crawlerName},
        'user-agent'
      )
    `;

    return new Response('OK - Saved', {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

// ========================================
// セッションID生成
// ========================================
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}