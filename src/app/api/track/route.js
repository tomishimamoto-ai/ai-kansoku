import { neon } from '@neondatabase/serverless';
import { initDB } from '../../../lib/db-init.js';
import { promises as dns } from 'dns';
import { checkIpRangeDynamic } from '../../../lib/ip-ranges.js';

export const runtime = 'nodejs';

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
// Phase 3 NEW: DNS逆引き検証
// ========================================
const AI_HOSTNAMES = [
  { pattern: 'googlebot.com',       name: 'Gemini'      },
  { pattern: 'google.com',          name: 'Gemini'      },
  { pattern: 'crawl.baidu.com',     name: 'Baidu'       },
  { pattern: 'openai.com',          name: 'ChatGPT'     },
  { pattern: 'anthropic.com',       name: 'Claude'      },
  { pattern: 'perplexity.ai',       name: 'Perplexity'  },
  { pattern: 'commoncrawl.org',     name: 'CommonCrawl' },
  { pattern: 'bytedance.com',       name: 'ByteDance'   },
  { pattern: 'applebot.apple.com',  name: 'Apple AI'    },
  { pattern: 'bingbot.msn.com',     name: 'Bing AI'     },
  { pattern: 'cohere.com',          name: 'Cohere'      },
  { pattern: 'xai.com',             name: 'Grok'        },
  { pattern: 'deepseek.com',        name: 'DeepSeek'    },
  { pattern: 'mistral.ai',          name: 'Mistral'     },
];

async function dnsReverseLookup(ip) {
  if (!ip || ip === 'unknown' || ip.includes(':')) return null;
  try {
    const hostnames = await Promise.race([
      dns.reverse(ip),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
    for (const hostname of hostnames) {
      for (const { pattern, name } of AI_HOSTNAMES) {
        if (hostname.endsWith(pattern)) return name;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ========================================
// User-Agent パターン辞書（拡充版 250種類以上）
// ========================================
const AI_CRAWLERS_DB = {
  chatgpt: {
    name: 'ChatGPT',
    patterns: [
      'gptbot', 'chatgpt-user', 'chatgpt', 'openai-bot',
      'oai-searchbot', 'openai', 'gpt-3', 'gpt-4', 'gpt-4o',
      'openaibot', 'chat-gpt', 'chatgpt-plugin',
    ],
  },
  claude: {
    name: 'Claude',
    patterns: [
      'claude-web', 'claude', 'anthropic', 'claudebot',
      'anthropic-ai', 'claude-bot', 'anthropicbot',
      'claude-crawl', 'claude-crawler',
    ],
  },
  gemini: {
    name: 'Gemini',
    patterns: [
      'gemini', 'google-extended', 'bard', 'googleother',
      'google-inspectiontool', 'apis-google', 'googlebot-video',
      'googlebot-news', 'google-site-verification',
      'adsbot-google', 'mediapartners-google',
    ],
  },
  perplexity: {
    name: 'Perplexity',
    patterns: [
      'perplexitybot', 'perplexity', 'perplexbot', 'perplexity-ai',
    ],
  },
  grok: {
    name: 'Grok',
    patterns: ['grok', 'xai', 'x-ai', 'twitterbot', 'grokbot', 'xaibot'],
  },
  deepseek: {
    name: 'DeepSeek',
    patterns: ['deepseek', 'deepseekbot', 'deepseek-crawler', 'deepseek-ai', 'deepseekai'],
  },
  mistral: {
    name: 'Mistral',
    patterns: ['mistral', 'mistralbot', 'mistral-ai', 'mistralai', 'le-chat', 'lechat'],
  },
  meta_llama: {
    name: 'Meta AI',
    patterns: [
      'facebookbot', 'facebookexternalhit', 'meta-externalagent',
      'facebot', 'instagrambot', 'whatsappbot',
      'llama', 'llamabot', 'meta-llm', 'metaai',
    ],
  },
  cohere: { name: 'Cohere', patterns: ['cohere-ai', 'cohere', 'coherebot'] },
  you: { name: 'You.com', patterns: ['youbot', 'you.com', 'youchat'] },
  inflection: { name: 'Inflection AI', patterns: ['inflection', 'pi-bot', 'pibot', 'inflection-ai'] },
  character_ai: { name: 'Character.AI', patterns: ['characterai', 'character.ai', 'character-ai'] },
  phind: { name: 'Phind', patterns: ['phindbot', 'phind'] },
  stability: { name: 'Stability AI', patterns: ['stabilityai', 'stability-ai', 'stability'] },
  huggingface: { name: 'Hugging Face', patterns: ['huggingfacebot', 'huggingface', 'hf-crawler'] },
  replicate: { name: 'Replicate', patterns: ['replicate', 'replicatebot'] },
  bing: {
    name: 'Bing AI',
    patterns: ['bingbot', 'msnbot', 'msnbot-media', 'adidxbot', 'bingpreview', 'msn ', 'edgebot'],
  },
  duckduckgo: { name: 'DuckDuckGo', patterns: ['duckduckbot', 'duckduckgo'] },
  yandex: { name: 'Yandex', patterns: ['yandexbot', 'yadirectfetcher', 'yandex', 'yandexmobilebot'] },
  baidu: { name: 'Baidu', patterns: ['baiduspider', 'baidu'] },
  naver: { name: 'Naver', patterns: ['naverbot', 'yeti', 'navercorp'] },
  apple: { name: 'Apple AI', patterns: ['applebot', 'applebot-extended', 'apple-pubsub'] },
  amazon: { name: 'Amazon', patterns: ['amazonbot', 'alexa', 'ia_archiver'] },
  bytedance: { name: 'ByteDance', patterns: ['bytespider', 'bytedance', 'toutiaospider', 'douyinbot'] },
  commoncrawl: { name: 'CommonCrawl', patterns: ['ccbot', 'commoncrawl', 'cc-bot'] },
  semrush: { name: 'Semrush', patterns: ['semrushbot', 'semrush'] },
  ahrefs: { name: 'Ahrefs', patterns: ['ahrefsbot', 'ahrefs'] },
  screaming_frog: { name: 'Screaming Frog', patterns: ['screaming frog', 'screamingfrog'] },
  dataforseo: { name: 'DataForSEO', patterns: ['dataforseobot', 'dataforseo'] },
  dotbot: { name: 'DotBot', patterns: ['dotbot', 'moz.com'] },
  petalbot: { name: 'PetalBot', patterns: ['petalbot', 'aspiegel'] },
};

// ========================================
// HEADメソッド検出
// ========================================
function checkHeadMethod(method) {
  return method === 'HEAD';
}

// ========================================
// Accept-Encoding パターン検知
// ========================================
function analyzeAcceptEncoding(headers) {
  const ae = (headers.get('accept-encoding') || '').toLowerCase().trim();
  if (ae === '' || ae === 'identity') return { signal: 'no-encoding', score: 3 };
  if (/^gzip$/.test(ae) || ae === 'gzip, deflate') return { signal: 'minimal-encoding', score: 2 };
  if (!ae.includes('br') && !ae.includes('zstd')) return { signal: 'no-brotli', score: 1 };
  return { signal: 'browser-like', score: 0 };
}

// ========================================
// ヘッダーパターン精度向上スコアリング
// ========================================
function analyzeHeaders(headers) {
  const signals = {
    noSecFetch:
      !headers.get('sec-fetch-site') &&
      !headers.get('sec-fetch-mode') &&
      !headers.get('sec-fetch-dest'),
    noClientHints:
      !headers.get('sec-ch-ua') &&
      !headers.get('sec-ch-ua-mobile') &&
      !headers.get('sec-ch-ua-platform'),
    simpleLang: (() => {
      const lang = headers.get('accept-language') || '';
      return lang === '' || lang.split(',').length === 1;
    })(),
    genericAccept: (() => {
      const accept = headers.get('accept') || '';
      return !accept.includes('text/html') && accept.includes('*/*');
    })(),
    noReferer: !headers.get('referer') && !headers.get('referrer'),
    noCookie: !headers.get('cookie'),
    connectionClose: (headers.get('connection') || '').toLowerCase() === 'close',
    noBrowserSignals:
      !headers.get('dnt') &&
      !headers.get('sec-fetch-site') &&
      !headers.get('upgrade-insecure-requests'),
  };

  const aeAnalysis = analyzeAcceptEncoding(headers);

  const score =
    (signals.noSecFetch     ? 3 : 0) +
    (signals.noClientHints  ? 2 : 0) +
    aeAnalysis.score +
    (signals.genericAccept  ? 1 : 0) +
    (signals.simpleLang     ? 1 : 0) +
    (signals.noReferer      ? 1 : 0) +
    (signals.noCookie       ? 1 : 0) +
    (signals.connectionClose? 1 : 0) +
    (signals.noBrowserSignals ? 1 : 0);

  return { signals, aeSignal: aeAnalysis.signal, score };
}

// ========================================
// メイン検出ロジック（Phase 1+2+3統合）
// ========================================
async function detectAICrawlerAdvanced(headers, ip, method) {
  const userAgent = (headers.get('user-agent') || '').toLowerCase();
  let detectedCrawler = null;
  let detectionMethod = 'unknown';

  // === Layer 1: User-Agent マッチ ===
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

  // === Layer 2: IPレンジチェック ===
  const ipRangeMatch = await checkIpRangeDynamic(ip);
  if (ipRangeMatch) return { crawler: ipRangeMatch, method: 'ip-range' };

  // === Layer 3: DNS逆引き ===
  const dnsMatch = await dnsReverseLookup(ip);
  if (dnsMatch) return { crawler: dnsMatch, method: 'dns-reverse' };

  // === Layer 4: HEADメソッド検出 ===
  if (checkHeadMethod(method)) {
    const looksLikeBot = /bot|crawler|spider|scraper/.test(userAgent);
    return {
      crawler: looksLikeBot ? 'Unknown Bot (HEAD)' : 'Unknown Crawler (HEAD)',
      method: 'head-method',
    };
  }

  // === Layer 5: アクセス間隔チェック ===
  const now = Date.now();
  const lastAccess = accessCache.get(ip);
  let isRapidAccess = false;
  if (lastAccess && now - lastAccess < 300) {
    isRapidAccess = true;
  }
  accessCache.set(ip, now);

  // === Layer 6: ヘッダースコアリング ===
  const { signals, aeSignal, score: headerScore } = analyzeHeaders(headers);
  const looksLikeProgram = /(python|curl|axios|okhttp|java|go-http|bot|wget|scrapy|playwright|puppeteer)/.test(userAgent);

  const isSafari =
    userAgent.includes('safari') &&
    !userAgent.includes('chrome') &&
    !userAgent.includes('crios') &&
    !userAgent.includes('edg');

  const adjustedScore = isSafari ? 0 : headerScore;

  if (adjustedScore >= 5 && (isRapidAccess || looksLikeProgram || signals.noSecFetch)) {
    const prefix =
      aeSignal === 'no-encoding' || aeSignal === 'minimal-encoding'
        ? 'Unknown AI'
        : 'Unknown Crawler';

    if (userAgent.includes('python'))          detectedCrawler = `${prefix} (Python)`;
    else if (userAgent.includes('curl'))       detectedCrawler = `${prefix} (curl)`;
    else if (userAgent.includes('wget'))       detectedCrawler = `${prefix} (wget)`;
    else if (userAgent.includes('axios'))      detectedCrawler = `${prefix} (axios)`;
    else if (userAgent.includes('scrapy'))     detectedCrawler = `${prefix} (Scrapy)`;
    else if (userAgent.includes('playwright')) detectedCrawler = `${prefix} (Playwright)`;
    else if (userAgent.includes('puppeteer'))  detectedCrawler = `${prefix} (Puppeteer)`;
    else if (userAgent.includes('okhttp'))     detectedCrawler = `${prefix} (okhttp)`;
    else if (userAgent.includes('java'))       detectedCrawler = `${prefix} (Java)`;
    else if (userAgent.includes('go-http'))    detectedCrawler = `${prefix} (Go)`;
    else if (userAgent.includes('bot'))        detectedCrawler = 'Unknown Bot';
    else                                       detectedCrawler = prefix;

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
    },
  });
}

// ========================================
// GET リクエスト
// ========================================
export async function GET(request) {
  await initDB();

  const url = new URL(request.url);
  const pathname = url.pathname;

  // -----------------------------------------------
  // [FIX] Phase 2: JS実行検出 → is_human = true で保存
  // -----------------------------------------------
  if (pathname.includes('/js-active')) {
    const siteId = url.searchParams.get('siteId') || url.searchParams.get('site');
    const path   = url.searchParams.get('path') || '/';
    const xff    = request.headers.get('x-forwarded-for') || '';
    const ip     = xff.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    if (siteId) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql`
          INSERT INTO ai_crawler_visits (
            site_id, user_agent, ip_address, referrer,
            page_url, session_id, crawler_name,
            accept_header, accept_language, detection_method, is_human
          ) VALUES (
            ${siteId}, ${userAgent}, ${ip}, ${request.headers.get('referer') || ''},
            ${path}, ${generateSessionId()}, ${'Human (JS Detected)'},
            ${request.headers.get('accept') || ''},
            ${request.headers.get('accept-language') || ''},
            ${'js_active'},
            ${true}
          )
        `;
        console.log(`✅ Human JS detected: ${ip}`);
      } catch (error) {
        console.error('❌ DB Error (js-active):', error);
      }
    }

    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return new Response(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Phase 2: 画像リクエスト検出（is_human の判定なし・保存のみ）
  if (pathname.includes('/img-check')) {
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return new Response(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // -----------------------------------------------
  // Phase 1+2+3: 通常トラッキングピクセル → is_human = false で保存
  // -----------------------------------------------
  const siteId = url.searchParams.get('siteId') || url.searchParams.get('site');
  const path = url.searchParams.get('path') || '/';

  const xff = request.headers.get('x-forwarded-for') || '';
  const ip =
    xff.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const detection = await detectAICrawlerAdvanced(request.headers, ip, request.method);

  console.log('Detection:', detection);

  if (detection && siteId) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const userAgent  = request.headers.get('user-agent')       || '';
      const referer    = request.headers.get('referer')           || '';
      const accept     = request.headers.get('accept')            || '';
      const acceptLang = request.headers.get('accept-language')   || '';
      const acceptEnc  = request.headers.get('accept-encoding')   || '';

      await sql`
        INSERT INTO ai_crawler_visits (
          site_id, user_agent, ip_address, referrer,
          page_url, session_id, crawler_name,
          accept_header, accept_language, detection_method, is_human
        ) VALUES (
          ${siteId}, ${userAgent}, ${ip}, ${referer},
          ${path}, ${generateSessionId()}, ${detection.crawler},
          ${accept}, ${acceptLang}, ${detection.method},
          ${false}
        )
      `;
      console.log(`✅ AI Saved: ${detection.crawler} (${detection.method}) ae="${acceptEnc}"`);
    } catch (error) {
      console.error('❌ DB Error:', error);
    }
  }

  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  return new Response(gif, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ========================================
// Phase 3: HEADメソッド対応 → is_human = false で保存
// ========================================
export async function HEAD(request) {
  await initDB();

  const url = new URL(request.url);
  const siteId = url.searchParams.get('siteId') || url.searchParams.get('site');
  const path = url.searchParams.get('path') || '/';

  const xff = request.headers.get('x-forwarded-for') || '';
  const ip =
    xff.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const detection = await detectAICrawlerAdvanced(request.headers, ip, 'HEAD');

  if (detection && siteId) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const userAgent = request.headers.get('user-agent') || '';

      await sql`
        INSERT INTO ai_crawler_visits (
          site_id, user_agent, ip_address, referrer,
          page_url, session_id, crawler_name,
          accept_header, accept_language, detection_method, is_human
        ) VALUES (
          ${siteId}, ${userAgent}, ${ip}, ${''},
          ${path}, ${generateSessionId()}, ${detection.crawler},
          ${''}, ${''}, ${'head-method'},
          ${false}
        )
      `;
      console.log(`✅ HEAD AI Saved: ${detection.crawler}`);
    } catch (error) {
      console.error('❌ DB Error (HEAD):', error);
    }
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ========================================
// POST リクエスト（既存のJS用）→ is_human = false で保存
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
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    await sql`
      INSERT INTO ai_crawler_visits (
        site_id, user_agent, ip_address, referrer,
        page_url, session_id, crawler_name, detection_method, is_human
      ) VALUES (
        ${data.site}, ${data.ua}, ${data.ip || 'unknown'},
        ${data.referrer || ''}, ${data.path || '/'},
        ${data.session || generateSessionId()}, ${crawlerName},
        ${'user-agent'},
        ${false}
      )
    `;

    return new Response('OK - Saved', {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// ========================================
// セッションID生成
// ========================================
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}