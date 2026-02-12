import { neon } from '@neondatabase/serverless';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return Response.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    // ========================================
    // データ削除ロジック: 無料ユーザーの7日以上古いデータを削除
    // ========================================
    try {
      await sql`
        DELETE FROM ai_crawler_visits 
        WHERE plan_type = 'free' 
        AND visited_at < NOW() - INTERVAL '7 days'
      `;
      console.log('Old free plan data cleaned up');
    } catch (deleteError) {
      console.error('Error deleting old data:', deleteError);
      // 削除エラーは無視して処理を続行
    }

    // 7日前の日時を計算
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 訪問履歴を取得（最新20件、過去7日間、日時降順）
    const visits = await sql`
      SELECT 
        id,
        site_id,
        user_agent,
        ip_address,
        referrer,
        page_url,
        visited_at,
        session_id
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
      ORDER BY visited_at DESC
      LIMIT 20
    `;

    // 統計情報も取得（過去7日間）
    const stats = await sql`
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT ip_address) as unique_ips,
        MIN(visited_at) as first_visit,
        MAX(visited_at) as last_visit
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
    `;

    // AIクローラーの訪問数を集計（過去7日間）
    const crawlerStats = await sql`
      SELECT 
        CASE
          WHEN user_agent LIKE '%GPTBot%' THEN 'GPTBot (ChatGPT)'
          WHEN user_agent LIKE '%Claude-Web%' THEN 'Claude-Web'
          WHEN user_agent LIKE '%PerplexityBot%' THEN 'PerplexityBot'
          WHEN user_agent LIKE '%Googlebot%' THEN 'Googlebot'
          WHEN user_agent LIKE '%Bingbot%' THEN 'Bingbot'
          WHEN user_agent LIKE '%anthropic-ai%' THEN 'Anthropic AI'
          ELSE 'Other'
        END as crawler_type,
        COUNT(*) as visit_count
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
      GROUP BY crawler_type
      ORDER BY visit_count DESC
    `;

    return Response.json({
      success: true,
      visits: visits,
      stats: stats[0] || {
        total_visits: 0,
        unique_sessions: 0,
        unique_ips: 0,
        first_visit: null,
        last_visit: null
      },
      crawlerStats: crawlerStats,
      period: '7days',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching visits:', error);
    return Response.json(
      { error: 'Failed to fetch visits', details: error.message },
      { status: 500 }
    );
  }
}