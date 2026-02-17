import { neon } from '@neondatabase/serverless';
import { initDB } from '../../../lib/db-init.js';

export async function GET(request) {
  await initDB();
  
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
    // Phase 3で有効化（現在は無料版のみなのでコメントアウト）
    // ========================================
    // try {
    //   await sql`
    //     DELETE FROM ai_crawler_visits 
    //     WHERE plan_type = 'free' 
    //     AND visited_at < NOW() - INTERVAL '7 days'
    //   `;
    //   console.log('✅ Old free plan data cleaned up');
    // } catch (deleteError) {
    //   console.error('⚠️ Error deleting old data:', deleteError);
    // }

    // ========================================
    // 期間設定（過去7日間）
    // ========================================
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // ========================================
    // AI訪問の詳細統計（今週 vs 先週）
    // ========================================
    
    // 今週のAI訪問統計
    const thisWeekStats = await sql`
      SELECT 
        crawler_name,
        COUNT(*) as visit_count,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
      GROUP BY crawler_name
      ORDER BY visit_count DESC
    `;

    // 先週のAI訪問統計（比較用）
    const lastWeekStats = await sql`
      SELECT 
        crawler_name,
        COUNT(*) as visit_count
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${fourteenDaysAgo.toISOString()}
        AND visited_at < ${sevenDaysAgo.toISOString()}
      GROUP BY crawler_name
    `;

    // 先週との比較を計算
    const lastWeekMap = new Map(
      lastWeekStats.map(row => [row.crawler_name, parseInt(row.visit_count)])
    );

    const aiStats = thisWeekStats.map(row => {
      const thisWeek = parseInt(row.visit_count);
      const lastWeek = lastWeekMap.get(row.crawler_name) || 0;
      const change = lastWeek > 0 
        ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
        : (thisWeek > 0 ? 100 : 0);

      return {
        crawler_name: row.crawler_name,
        visit_count: thisWeek,
        unique_sessions: parseInt(row.unique_sessions),
        unique_ips: parseInt(row.unique_ips),
        change_percent: change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
      };
    });

    // ========================================
    // 総訪問数の統計
    // ========================================
    const totalStats = await sql`
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

// 人間訪問数（is_human = true）
const humanTotal = await sql`
  SELECT COUNT(*) as total_visits
  FROM ai_crawler_visits
  WHERE site_id = ${siteId}
    AND visited_at >= ${sevenDaysAgo.toISOString()}
    AND is_human = true
`;
const humanTotalCount = parseInt(humanTotal[0]?.total_visits || '0');

    // 先週の総訪問数
    const lastWeekTotal = await sql`
      SELECT COUNT(*) as total_visits
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${fourteenDaysAgo.toISOString()}
        AND visited_at < ${sevenDaysAgo.toISOString()}
    `;

    const thisWeekTotal = parseInt(totalStats[0]?.total_visits || '0');
    const lastWeekTotalCount = parseInt(lastWeekTotal[0]?.total_visits || '0');
    const totalChange = lastWeekTotalCount > 0 
      ? Math.round(((thisWeekTotal - lastWeekTotalCount) / lastWeekTotalCount) * 100)
      : (thisWeekTotal > 0 ? 100 : 0);

    // ========================================
    // よく読まれるページ TOP5
    // ========================================
    const topPages = await sql`
      SELECT 
        page_url,
        COUNT(*) as visit_count,
        COUNT(DISTINCT crawler_name) as crawler_variety
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
        AND page_url IS NOT NULL
        AND page_url != ''
      GROUP BY page_url
      ORDER BY visit_count DESC
      LIMIT 5
    `;

    // ========================================
    // 訪問時間帯分析（24時間）
    // ========================================
    const hourlyStats = await sql`
      SELECT 
        EXTRACT(HOUR FROM visited_at) as hour,
        COUNT(*) as visit_count
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
      GROUP BY hour
      ORDER BY hour
    `;

    // ========================================
    // 検出方法の内訳
    // ========================================
    const detectionMethods = await sql`
      SELECT 
        detection_method,
        COUNT(*) as count
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
      GROUP BY detection_method
      ORDER BY count DESC
    `;

    // ========================================
    // 手動入力データの取得
    // ========================================
    const manualData = await sql`
      SELECT 
        period_start,
        period_end,
        user_count,
        page_views,
        sessions,
        source,
        created_at
      FROM manual_analytics
      WHERE site_id = ${siteId}
      ORDER BY period_start DESC
      LIMIT 1
    `;

    // ========================================
    // 7日間の日別推移データ（グラフ用）
    // ========================================

    // AI訪問（is_human = false）
    const dailyAI = await sql`
      SELECT 
        TO_CHAR(visited_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD') as date,
        COUNT(*) as ai_visits
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
        AND is_human = false
      GROUP BY TO_CHAR(visited_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    // 人間訪問（is_human = true）
    const dailyHuman = await sql`
      SELECT 
        TO_CHAR(visited_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD') as date,
        COUNT(*) as human_visits
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
        AND is_human = true
      GROUP BY TO_CHAR(visited_at AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD')
      ORDER BY date ASC
    `;

    // 7日間すべての日付を生成（データがない日も0で表示）
    const dailyTrendFull = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const foundAI = dailyAI.find(d => d.date === dateStr);
      const foundHuman = dailyHuman.find(d => d.date === dateStr);

      dailyTrendFull.push({
        date: dateStr,
        ai_visits: foundAI ? parseInt(foundAI.ai_visits) : 0,
        human_visits: foundHuman ? parseInt(foundHuman.human_visits) : 0
      });
    }

    // ========================================
    // 最新20件の訪問履歴（詳細表示用）
    // ========================================
    const recentVisits = await sql`
      SELECT 
        id,
        crawler_name,
        page_url,
        ip_address,
        visited_at,
        detection_method
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at >= ${sevenDaysAgo.toISOString()}
      ORDER BY visited_at DESC
      LIMIT 20
    `;

    // ========================================
    // レスポンス
    // ========================================
    return Response.json({
      success: true,
      
      // AI訪問統計
      ai_stats: {
        total: thisWeekTotal,
        human_total: humanTotalCount,
        change_percent: totalChange,
        trend: totalChange > 0 ? 'up' : totalChange < 0 ? 'down' : 'stable',
        by_crawler: aiStats,
        unique_sessions: parseInt(totalStats[0]?.unique_sessions || '0'),
        unique_ips: parseInt(totalStats[0]?.unique_ips || '0'),
        first_visit: totalStats[0]?.first_visit || null,
        last_visit: totalStats[0]?.last_visit || null
      },
      
      // ページ別統計
      top_pages: topPages.map(p => ({
        url: p.page_url,
        visits: parseInt(p.visit_count),
        crawler_variety: parseInt(p.crawler_variety)
      })),
      
      // 時間帯分析
      hourly_distribution: hourlyStats.map(h => ({
        hour: parseInt(h.hour),
        visits: parseInt(h.visit_count)
      })),
      
      // 検出方法
      detection_methods: detectionMethods.map(d => ({
        method: d.detection_method,
        count: parseInt(d.count)
      })),
      
      // 手動入力データ
      manual_data: manualData[0] || null,
      
      // 7日間推移データ（★ 追加）
      daily_trend: dailyTrendFull,
      
      // 最新訪問履歴
      recent_visits: recentVisits,
      
      // メタ情報
      period: '7days',
      period_start: sevenDaysAgo.toISOString(),
      period_end: new Date().toISOString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error fetching visits:', error);
    return Response.json(
      { error: 'Failed to fetch visits', details: error.message },
      { status: 500 }
    );
  }
}

// ========================================
// POST: 手動入力データの保存
// ========================================
export async function POST(request) {
  await initDB();
  
  try {
    const data = await request.json();
    const { siteId, userCount, pageViews, sessions, source = 'manual' } = data;

    if (!siteId) {
      return Response.json(
        { error: 'siteId is required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    // 今週の期間を計算
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // データをUPSERT（更新 or 挿入）
    await sql`
      INSERT INTO manual_analytics (
        site_id,
        period_start,
        period_end,
        user_count,
        page_views,
        sessions,
        source,
        updated_at
      )
      VALUES (
        ${siteId},
        ${sevenDaysAgo.toISOString().split('T')[0]},
        ${now.toISOString().split('T')[0]},
        ${userCount || null},
        ${pageViews || null},
        ${sessions || null},
        ${source},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (site_id, period_start, period_end, source)
      DO UPDATE SET
        user_count = ${userCount || null},
        page_views = ${pageViews || null},
        sessions = ${sessions || null},
        updated_at = CURRENT_TIMESTAMP
    `;

    return Response.json({
      success: true,
      message: 'Manual data saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving manual data:', error);
    return Response.json(
      { error: 'Failed to save manual data', details: error.message },
      { status: 500 }
    );
  }
}