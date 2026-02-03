import { neon } from '@neondatabase/serverless';

export async function POST(request) {
  console.log('=== API Called ===');
  
  try {
    const data = await request.json();
    console.log('Received:', data);
    
    // Neon接続
    const sql = neon(process.env.DATABASE_URL);
    
    // テーブルが存在するか確認（初回のみ作成）
    await sql`
      CREATE TABLE IF NOT EXISTS ai_visits (
        id SERIAL PRIMARY KEY,
        site_id VARCHAR(50) NOT NULL,
        crawler VARCHAR(50) NOT NULL,
        path VARCHAR(255),
        user_agent VARCHAR(500),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Table ready');
    
    // AIクローラー判定
    const crawler = detectAICrawler(data.ua);
    
    if (!crawler) {
      return new Response('OK - Not AI', { status: 200 });
    }
    
    // データ保存
    await sql`
      INSERT INTO ai_visits (site_id, crawler, path, user_agent)
      VALUES (${data.site}, ${crawler}, ${data.path}, ${data.ua})
    `;
    
    console.log('Data saved:', crawler);
    
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