import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

let dbInitialized = false;

/**
 * データベース初期化（起動時1回のみ実行）
 */
export async function initDB() {
  // すでに初期化済みなら何もしない
  if (dbInitialized) return;

  try {
    // テーブル作成（初回のみ実行される）
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
        crawler_name VARCHAR(100),
        accept_header VARCHAR(200),
        accept_language VARCHAR(100),
        detection_method VARCHAR(50),
        INDEX idx_site_date (site_id, visited_at)
      )
    `;

    dbInitialized = true;
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // エラーでも次回試行できるようにフラグは立てない
  }
}