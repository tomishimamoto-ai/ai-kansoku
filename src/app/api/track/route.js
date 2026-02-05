import { neon } from '@neondatabase/serverless';

export async function POST(request) {
  console.log('=== API Called ===');
  
  try {
    const data = await request.json();
    console.log('Received:', data);
    
    const sql = neon(process.env.DATABASE_URL);
    
    // テーブル作成（ai_crawler_visits に統一）
    await sql`
      CREATE TABLE IF NOT EXISTS ai_crawler_visits (
        id SERIAL PRIMARY KEY,
        site_id VARCHAR(50) NOT NULL,
        user_agent VARCHAR(500),
        ip_address VARCHAR(50),
        referrer VARCHAR(500),
        page_url VARCHAR(500),
        visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(100)
      )
    `;
    
    console.log('Table ready');
    
    // AIクローラー判定
    const crawlerName = detectAICrawler(data.ua);
    
    if (!crawlerName) {
      return new Response('OK - Not AI', { status: 200 });
    }
    
    // データ保存（カラム名を統一）
    await sql`
      INSERT INTO ai_crawler_visits (
        site_id, 
        user_agent, 
        ip_address,
        referrer,
        page_url,
        session_id
      )
      VALUES (
        ${data.site}, 
        ${data.ua},
        ${data.ip || 'unknown'},
        ${data.referrer || ''},
        ${data.path || '/'},
        ${data.session || generateSessionId()}
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

function detectAICrawler(ua) {
  if (!ua) return null;
  if (/ChatGPT-User|GPTBot/i.test(ua)) return 'ChatGPT';
  if (/Claude-Web|ClaudeBot/i.test(ua)) return 'Claude';
  if (/PerplexityBot/i.test(ua)) return 'Perplexity';
  if (/anthropic-ai/i.test(ua)) return 'Anthropic';
  if (/Google-Extended/i.test(ua)) return 'Google AI';
  if (/CCBot/i.test(ua)) return 'CommonCrawl';
  return null;
}

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}