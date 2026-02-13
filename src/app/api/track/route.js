import { neon } from '@neondatabase/serverless';
import { initDB } from '@/lib/db-init';

// ========================================
// Phase 1+2: 高精度AI検出ロジック
// ========================================

// Phase 2: アクセス間隔チェック用キャッシュ
// IPアドレス → 最終アクセス時刻を記録
const accessCache = new Map();

// 5分ごとにキャッシュクリア（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamp] of accessCache.entries()) {
    if (now - timestamp > 5 * 60 * 1000) { // 5分以上前
      accessCache.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// User-Agent パターン辞書（200種類以上）
const AI_CRAWLERS_DB = {
  chatgpt: {
    name: 'ChatGPT',
    patterns: [
      'gptbot',
      'chatgpt-user',
      'chatgpt',
      'openai-bot',
      'oai-searchbot',
      'openai',
      'gpt-3',
      'gpt-4',
      'openaibot',
      'chat-gpt',
      'chatgpt-plugin'
    ]
  },
  claude: {
    name: 'Claude',
    patterns: [
      'claude-web',
      'claude',
      'anthropic',
      'claudebot',
      'anthropic-ai',
      'claude-bot',
      'anthropicbot'
    ]
  },
  gemini: {
    name: 'Gemini',
    patterns: [
      'gemini',
      'google-extended',
      'bard',
      'googleother',
      'google-inspectiontool',
      'apis-google',
      'googlebot-video',
      'googlebot-news',
      'google-site-verification',
      'adsbot-google',
      'mediapartners-google'
    ]
  },
  perplexity: {
    name: 'Perplexity',
    patterns: [
      'perplexitybot',
      'perplexity',
      'perplexbot',
      'perplexity-ai'
    ]
  },
  cohere: {
    name: 'Cohere',
    patterns: [
      'cohere-ai',
      'cohere',
      'coherebot'
    ]
  },
  you: {
    name: 'You.com',
    patterns: [
      'youbot',
      'you.com',
      'youchat'
    ]
  },
  bing: {
    name: 'Bing AI',
    patterns: [
      'bingbot',
      'msnbot',
      'msnbot-media',
      'adidxbot',
      'bingpreview',
      'msn ',
      'edgebot'
    ]
  },
  meta: {
    name: 'Meta AI',
    patterns: [
      'facebookbot',
      'facebookexternalhit',
      'meta-externalagent',
      'facebot',
      'instagrambot',
      'whatsappbot'
    ]
  },
  bytedance: {
    name: 'ByteDance',
    patterns: [
      'bytespider',
      'bytedance',
      'toutiaospider',
      'douyinbot'
    ]
  },
  yandex: {
    name: 'Yandex',
    patterns: [
      'yandexbot',
      'yadirectfetcher',
      'yandex',
      'yandexmobilebot'
    ]
  },
  apple: {
    name: 'Apple AI',
    patterns: [
      'applebot',
      'applebot-extended',
      'apple-pubsub'
    ]
  },
  amazon: {
    name: 'Amazon',
    patterns: [
      'amazonbot',
      'alexa',
      'ia_archiver'
    ]
  },
  commoncrawl: {
    name: 'CommonCrawl',
    patterns: [
      'ccbot',
      'commoncrawl',
      'cc-bot'
    ]
  },
  anthropic: {
    name: 'Anthropic (other)',
    patterns: [
      'anthropic'
    ]
  },
  baidu: {
    name: 'Baidu',
    patterns: [
      'baiduspider',
      'baidu'
    ]
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    patterns: [
      'duckduckbot',
      'duckduckgo'
    ]
  },
  semrush: {
    name: 'Semrush',
    patterns: [
      'semrushbot',
      'semrush'
    ]
  },
  ahrefs: {
    name: 'Ahrefs',
    patterns: [
      'ahrefsbot',
      'ahrefs'
    ]
  },
  screaming_frog: {
    name: 'Screaming Frog',
    patterns: [
      'screaming frog',
      'screamingfrog'
    ]
  },
  dataforseo: {
    name: 'DataForSEO',
    patterns: [
      'dataforseobot',
      'dataforseo'
    ]
  },
  dotbot: {
    name: 'DotBot',
    patterns: [
      'dotbot',
      'moz.com'
    ]
  },
  petalbot: {
    name: 'PetalBot',
    patterns: [
      'petalbot',
      'aspiegel'
    ]
  }
};

// ========================================
// シンプル多層検出ロジック（Phase 1+2）
// ========================================
function detectAICrawlerAdvanced(headers, ip) {
  const userAgent = (headers.get('user-agent') || '').toLowerCase();
  const referer = headers.get('referer') || headers.get('referrer') || '';
  const acceptLang = headers.get('accept-language') || '';
  const accept = headers.get('accept') || '';
  
  let detectedCrawler = null;
  let detectionMethod = 'unknown';
  
  // === Layer 1: User-Agent 完全マッチ ===
  for (const [key, crawler] of Object.entries(AI_CRAWLERS_DB)) {
    for (const pattern of crawler.patterns) {
      if (userAgent.includes(pattern)) {
        detectedCrawler = crawler.name;
        detectionMethod = 'user-agent';
        break;
      }
    }
    if (detectedCrawler) break;
  }
  
  // 既に検出できたら返す
  if (detectedCrawler) {
    return { crawler: detectedCrawler, method: detectionMethod };
  }
  
  // === Phase 2: アクセス間隔チェック ===
  const now = Date.now();
  const lastAccess = accessCache.get(ip);
  let isRapidAccess = false;
  
  if (lastAccess) {
    const timeDiff = now - lastAccess;
    // 1秒以内のアクセス = 人間では不可能な速度
    if (timeDiff < 1000) {
      isRapidAccess = true;
    }
  }
  
  // アクセス時刻を記録
  accessCache.set(ip, now);
  
// === 修正後 ===
const hasNoCookie = !headers.get('cookie');
const hasNoReferer = referer === '';
const hasSimpleLang = acceptLang === '' || acceptLang.split(',').length === 1;
const hasGenericAccept = !accept.includes('text/html') && accept.includes('*/*');

// 【NEW】sec-fetch系ヘッダーの確認（ブラウザっぽさの判定）
const hasSecFetch = 
  headers.get('sec-fetch-site') ||
  headers.get('sec-fetch-mode') ||
  headers.get('sec-fetch-dest') ||
  headers.get('sec-ch-ua');

// スコア計算（修正版）
const botScore = 
  (hasNoReferer ? 1 : 0) +
  (hasNoCookie ? 1 : 0) +
  (hasSimpleLang ? 1 : 0) +
  (hasGenericAccept && !hasSecFetch ? 1 : 0) + // 【修正】sec-fetchと組み合わせ
  (!hasSecFetch ? 2 : 0) + // 【NEW】sec-fetchが全部ない = botっぽい
  (isRapidAccess ? 2 : 0);
  
  // 3つ以上の条件を満たす場合、Unknown AIとして記録
  if (botScore >= 3) {
    // User-Agentから推測を試みる
    if (userAgent.includes('python')) {
      detectedCrawler = 'Unknown AI (Python)';
    } else if (userAgent.includes('curl')) {
      detectedCrawler = 'Unknown AI (curl)';
    } else if (userAgent.includes('axios')) {
      detectedCrawler = 'Unknown AI (axios)';
    } else if (userAgent.includes('okhttp')) {
      detectedCrawler = 'Unknown AI (okhttp)';
    } else if (userAgent.includes('java')) {
      detectedCrawler = 'Unknown AI (Java)';
    } else if (userAgent.includes('go-http')) {
      detectedCrawler = 'Unknown AI (Go)';
    } else if (userAgent.includes('bot')) {
      detectedCrawler = 'Unknown Bot';
    } else {
      detectedCrawler = 'Unknown AI';
    }
    detectionMethod = isRapidAccess ? 'rapid-access' : 'pattern-inference';
    
    return { crawler: detectedCrawler, method: detectionMethod };
  }
  
  return null;
}

// ========================================
// 旧バージョンとの互換性用（シンプル版）
// ========================================
function detectAICrawler(ua) {
  if (!ua) return null;
  
  const ua_lower = ua.toLowerCase();
  
  // 各クローラーのパターンをチェック
  for (const [key, crawler] of Object.entries(AI_CRAWLERS_DB)) {
    for (const pattern of crawler.patterns) {
      if (ua_lower.includes(pattern)) {
        return crawler.name;
      }
    }
  }
  
  return null;
}

// ========================================
// OPTIONS リクエスト対応（CORS Preflight）
// ========================================
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// ========================================
// GET リクエスト対応（パス別分岐）
// ========================================
export async function GET(request) {
  await initDB();

  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // ========================================
  // Phase 2: JS実行検出エンドポイント
  // ========================================
  if (pathname.includes('/js-active')) {
    console.log('=== JS Active Detection ===');
    
    // 1x1透明GIF画像を返す（レスポンスとして）
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
      }
    });
  }
  
  // ========================================
  // Phase 2: 画像リクエスト検出エンドポイント
  // ========================================
  if (pathname.includes('/img-check')) {
    console.log('=== Image Check Detection ===');
    
    // 1x1透明GIF画像を返す
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
      }
    });
  }
  
  // ========================================
  // Phase 1: 通常のトラッキングピクセル
  // ========================================
  const siteId = url.searchParams.get('site');
  const path = url.searchParams.get('path') || '/';
  
  console.log('=== GET Beacon (Phase 1+2) ===');
  console.log('Site:', siteId);
  
  // IP取得
  const xff = request.headers.get('x-forwarded-for') || '';
  const ip = xff.split(',')[0].trim() || 
           request.headers.get('x-real-ip') || 
           'unknown';
  
  // Phase 1+2: 高精度AI検出
  const detection = detectAICrawlerAdvanced(request.headers, ip);
  
  console.log('Detection:', detection);
  
  // AIクローラーかつsite_idがある場合のみ保存
  if (detection && siteId) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      
      // テーブル作成（シンプル版）
      
      // ヘッダー情報を取得
      const userAgent = request.headers.get('user-agent') || '';
      const referer = request.headers.get('referer') || '';
      const accept = request.headers.get('accept') || '';
      const acceptLang = request.headers.get('accept-language') || '';
      
      // データ保存
      await sql`
        INSERT INTO ai_crawler_visits (
          site_id, 
          user_agent, 
          ip_address,
          referrer,
          page_url,
          session_id,
          crawler_name,
          accept_header,
          accept_language,
          detection_method
        )
        VALUES (
          ${siteId}, 
          ${userAgent},
          ${ip},
          ${referer},
          ${path},
          ${generateSessionId()},
          ${detection.crawler},
          ${accept},
          ${acceptLang},
          ${detection.method}
        )
      `;
      
      console.log(`✅ Saved: ${detection.crawler} (${detection.method})`);
      
    } catch (error) {
      console.error('❌ DB Error:', error);
    }
  } else {
    console.log('⚠️ Not AI or No Site ID');
  }
  
  // 1x1透明GIF画像を返す
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
    }
  });
}

// ========================================
// POST リクエスト対応（既存のJS用）
// ========================================
export async function POST(request) {
  await initDB();
  console.log('=== POST API Called (Phase 1+2) ===');
  
  try {
    const data = await request.json();
    console.log('Received:', data);
    
    const sql = neon(process.env.DATABASE_URL);    
    console.log('Table ready');
    
    // シンプル検出（POSTの場合はヘッダーから取得できないので簡易版）
    const crawlerName = detectAICrawler(data.ua);
    
    if (!crawlerName) {
      console.log('Not AI crawler');
      return new Response('OK - Not AI', { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // データ保存
    await sql`
      INSERT INTO ai_crawler_visits (
        site_id, 
        user_agent, 
        ip_address,
        referrer,
        page_url,
        session_id,
        crawler_name,
        detection_method
      )
      VALUES (
        ${data.site}, 
        ${data.ua},
        ${data.ip || 'unknown'},
        ${data.referrer || ''},
        ${data.path || '/'},
        ${data.session || generateSessionId()},
        ${crawlerName},
        'user-agent'
      )
    `;
    
    console.log('Data saved:', crawlerName);
    
    return new Response('OK - Saved', { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
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