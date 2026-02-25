import { neon } from '@neondatabase/serverless';

export const runtime = 'nodejs';

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // session_statsを最新データに更新
    await sql`REFRESH MATERIALIZED VIEW session_stats`;

    // daily_baselineに今日のデータを保存
    await sql`
      INSERT INTO daily_baseline (date, site_id, avg_interval, stddev_interval, avg_coverage, sample_size)
      SELECT
        CURRENT_DATE,
        site_id,
        AVG(interval_avg),
        AVG(interval_stddev),
        AVG(coverage_ratio),
        COUNT(*)
      FROM session_stats
      WHERE is_human = true
      AND total_hits >= 3
      GROUP BY site_id
      ON CONFLICT (date, site_id) DO UPDATE SET
        avg_interval = EXCLUDED.avg_interval,
        stddev_interval = EXCLUDED.stddev_interval,
        avg_coverage = EXCLUDED.avg_coverage,
        sample_size = EXCLUDED.sample_size
    `;

    return Response.json({ 
      success: true, 
      date: new Date().toISOString() 
    });

  } catch (error) {
    console.error('daily-baseline cron error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}