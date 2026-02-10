import { neon } from '@neondatabase/serverless';

// ========================================
// GET リクエスト対応（画像ピクセル用）
// ========================================
export async function GET(request) {
  const url = new URL(request.url);
  const siteId = url.searchParams.get('site');
  const path = url.searchParams.get('path') || '/';
  
  // ヘッダー情報を取得
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const referer = request.headers.get('referer') || '';
  const accept = request.headers.get('accept') || '';
  const acceptLang = request.headers.get('accept-language') || '';
  
  console.log('=== GET Beacon ===');
  console.log('Site:', siteId);
  console.log('UA:', userAgent);
  console.log('IP:', ip);
  console.log('Path:', path);
  console.log('Referer:', referer);
  
  // AI判定
  const crawlerName = detectAICrawler(userAgent);
  
  // AIクローラーかつsite_idがある場合のみ保存
  if (crawlerName && siteId) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      
      // テーブル作成
      await sql`
        CREATE TABLE IF NOT EXISTS ai_crawler_visits (
          id SERIAL PRIMARY KEY,
          site_id VARCHAR(50) NOT NULL,
          user_agent VARCHAR(500),
          ip_address VARCHAR(50),
          referrer VARCHAR(500),
          page_url VARCHAR(500),
          visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          session_id VARCHAR(100),
          crawler_name VARCHAR(50),
          accept_header VARCHAR(200),
          accept_language VARCHAR(100)
        )
      `;
      
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
          accept_language
        )
        VALUES (
          ${siteId}, 
          ${userAgent},
          ${ip},
          ${referer},
          ${path},
          ${generateSessionId()},
          ${crawlerName},
          ${accept},
          ${acceptLang}
        )
      `;
      
      console.log('✅ Saved:', crawlerName);
      
    } catch (error) {
      console.error('❌ DB Error:', error);
    }
  } else {
    console.log('⚠️ Not AI or No Site ID:', { crawlerName, siteId });
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
      'Expires': '0'
    }
  });
}

// ========================================
// POST リクエスト対応（既存のJS用）
// ========================================
export async function POST(request) {
  console.log('=== POST API Called ===');
  
  try {
    const data = await request.json();
    console.log('Received:', data);
    
    const sql = neon(process.env.DATABASE_URL);
    
    // テーブル作成
    await sql`
      CREATE TABLE IF NOT EXISTS ai_crawler_visits (
        id SERIAL PRIMARY KEY,
        site_id VARCHAR(50) NOT NULL,
        user_agent VARCHAR(500),
        ip_address VARCHAR(50),
        referrer VARCHAR(500),
        page_url VARCHAR(500),
        visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(100),
        crawler_name VARCHAR(50),
        accept_header VARCHAR(200),
        accept_language VARCHAR(100)
      )
    `;
    
    console.log('Table ready');
    
    // AIクローラー判定
    const crawlerName = detectAICrawler(data.ua);
    
    if (!crawlerName) {
      console.log('Not AI crawler');
      return new Response('OK - Not AI', { status: 200 });
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
        crawler_name
      )
      VALUES (
        ${data.site}, 
        ${data.ua},
        ${data.ip || 'unknown'},
        ${data.referrer || ''},
        ${data.path || '/'},
        ${data.session || generateSessionId()},
        ${crawlerName}
      )
    `;
    
    console.log('Data saved:', crawlerName);
    
    return new Response('OK - Saved', { status: 200 });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ========================================
// AI判定ロジック（強化版）
// ========================================
function detectAICrawler(ua) {
  if (!ua) return null;
  
  const ua_lower = ua.toLowerCase();
  
  // ChatGPT系（複数パターン対応）
  if (ua_lower.includes('chatgpt') || 
      ua_lower.includes('gptbot') || 
      ua_lower.includes('oai-searchbot')) {
    return 'ChatGPT';
  }
  
  // Claude系
  if (ua_lower.includes('claude') || 
      ua_lower.includes('anthropic')) {
    return 'Claude';
  }
  
  // Perplexity系
  if (ua_lower.includes('perplexity')) {
    return 'Perplexity';
  }
  
  // Google AI
  if (ua_lower.includes('google-extended')) {
    return 'Google AI';
  }
  
  // Gemini (別パターン)
  if (ua_lower.includes('gemini')) {
    return 'Gemini';
  }
  
  // CommonCrawl
  if (ua_lower.includes('ccbot')) {
    return 'CommonCrawl';
  }
  
  // その他のAIクローラー
  if (ua_lower.includes('bytespider')) return 'ByteDance';
  if (ua_lower.includes('applebot-extended')) return 'Apple AI';
  if (ua_lower.includes('facebookbot')) return 'Meta AI';
  if (ua_lower.includes('bingbot')) return 'Bing';
  
  return null;
}

// ========================================
// セッションID生成
// ========================================
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}