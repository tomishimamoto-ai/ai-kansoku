// ========================================
// /api/track/js-active
// Phase 3.5: JavaScript実行検出 + 人間訪問記録
// ========================================

import { neon } from '@neondatabase/serverless';
import { initDB } from '../../../../lib/db-init.js';

export async function GET(request) {
  await initDB();
  
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    const path = searchParams.get('path') || '/';

    if (!siteId) {
      console.log('⚠️ JS-Active: siteId missing');
      return sendGif();
    }

    const sql = neon(process.env.DATABASE_URL);

    // リクエスト情報を取得
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const referrer = request.headers.get('referer') || '';

    // セッションID生成（簡易版: IP + UA のハッシュ）
    const sessionId = `${ip.split('.')[0]}_${Date.now()}`;

    // 人間訪問として記録
    await sql`
      INSERT INTO ai_crawler_visits (
        site_id,
        user_agent,
        ip_address,
        referrer,
        page_url,
        session_id,
        crawler_name,
        detection_method,
        is_human,
        visited_at
      ) VALUES (
        ${siteId},
        ${userAgent},
        ${ip},
        ${referrer},
        ${path},
        ${sessionId},
        'Human (JS Detected)',
        'javascript',
        true,
        CURRENT_TIMESTAMP
      )
    `;

    console.log(`✅ Human visit recorded: ${siteId} ${path}`);

  } catch (error) {
    console.error('❌ Error recording human visit:', error);
  }

  // 常に1x1透明GIFを返す
  return sendGif();
}

// 1x1透明GIF画像を返すヘルパー関数
function sendGif() {
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