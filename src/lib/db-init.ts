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
    console.log('🔧 Initializing database...');

    // ========================================
    // ai_crawler_visits テーブル作成（Phase 1+2+3）
    // ========================================
    await sql`
      CREATE TABLE IF NOT EXISTS ai_crawler_visits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id VARCHAR(50) NOT NULL,
        user_agent TEXT,
        ip_address VARCHAR(50),
        referrer TEXT,
        page_url TEXT,
        visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(100),
        crawler_name VARCHAR(100),
        accept_header VARCHAR(200),
        accept_language VARCHAR(100),
        detection_method VARCHAR(50),
        plan_type VARCHAR(20) DEFAULT 'free'
      )
    `;

    // インデックス作成（個別に実行）
    await sql`CREATE INDEX IF NOT EXISTS idx_site_visited ON ai_crawler_visits(site_id, visited_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_crawler_name ON ai_crawler_visits(crawler_name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session ON ai_crawler_visits(session_id)`;
    
    console.log('✅ Table ai_crawler_visits ready');

    // ========================================
    // manual_analytics テーブル作成（Phase 3新規）
    // ========================================
    await sql`
      CREATE TABLE IF NOT EXISTS manual_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id VARCHAR(50) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        user_count INTEGER,
        page_views INTEGER,
        sessions INTEGER,
        source VARCHAR(50) DEFAULT 'manual',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // UNIQUE制約を個別に追加
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_manual_analytics_unique 
      ON manual_analytics(site_id, period_start, period_end, source)
    `;

    console.log('✅ Table manual_analytics ready');

    dbInitialized = true;
    console.log('🎉 Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // エラーでも次回試行できるようにフラグは立てない
  }
}