import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// 擬態スコア計算ロジック
function calcMimicScore(visit, ipStats) {
  let score = 0;
  const reasons = [];

  // 1. 超高速巡回（5分以内に5件以上）→ is_rapidが甘いので独自判定
  if (ipStats.visit_count >= 5 && ipStats.span_minutes <= 5) {
    score += 40;
    reasons.push(`超高速巡回(${ipStats.visit_count}件/${ipStats.span_minutes.toFixed(1)}分)`);
  } else if (ipStats.visit_count >= 10 && ipStats.span_minutes <= 30) {
    score += 25;
    reasons.push(`高速巡回(${ipStats.visit_count}件/${ipStats.span_minutes.toFixed(1)}分)`);
  }

  // 2. 深夜アクセス（0〜5時 JST = 15〜20時 UTC）
  const hour = new Date(visit.visited_at).getUTCHours();
  if (hour >= 15 && hour <= 20) {
    score += 20;
    reasons.push('深夜帯アクセス(JST 0-5時)');
  }

  // 3. ブラウザ偽装UA（Chrome/Safariっぽいのに is_human=false）
  const ua = (visit.user_agent || '').toLowerCase();
  const isBrowserUA = ua.includes('mozilla') && (ua.includes('chrome') || ua.includes('safari') || ua.includes('firefox'));
  if (isBrowserUA && !visit.is_human) {
    score += 25;
    reasons.push('ブラウザ偽装UA');
  }

  // 4. Cookieなし（accept_headerが空 or is_html_only）
  if (visit.is_html_only) {
    score += 10;
    reasons.push('HTMLのみリクエスト');
  }

  // 5. referrerなし + UAブラウザ偽装の組み合わせ
  if (!visit.referrer && isBrowserUA) {
    score += 10;
    reasons.push('referrerなし+偽装UA');
  }

  return { score, reasons };
}

// GET: 擬態クローラーの統計取得（ダッシュボード用）
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');

  if (!siteId) {
    return Response.json({ error: 'siteId required' }, { status: 400 });
  }

  try {
    // 擬態クローラーの集計
    const mimicStats = await sql`
      SELECT 
        COUNT(*) as total_mimic,
        COUNT(DISTINCT ip_address) as unique_ips,
        MAX(visited_at) as last_detected,
        AVG(mimic_score) as avg_score
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND is_mimic = true
        AND visited_at > NOW() - INTERVAL '7 days'
    `;

    // 擬態IP別の詳細
    const mimicByIP = await sql`
      SELECT 
        ip_address,
        COUNT(*) as visit_count,
        MAX(mimic_score) as max_score,
        MIN(visited_at) as first_visit,
        MAX(visited_at) as last_visit,
        array_agg(DISTINCT page_url ORDER BY page_url) FILTER (WHERE page_url IS NOT NULL) as pages
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND is_mimic = true
        AND visited_at > NOW() - INTERVAL '7 days'
      GROUP BY ip_address
      ORDER BY visit_count DESC
      LIMIT 10
    `;

    // 推移（7日間、日別）
    const mimicTrend = await sql`
      SELECT 
        DATE(visited_at) as date,
        COUNT(*) as count
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND is_mimic = true
        AND visited_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `;

    return Response.json({
      stats: mimicStats[0],
      byIP: mimicByIP,
      trend: mimicTrend,
    });
  } catch (error) {
    console.error('Mimic stats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST: バッチ判定実行
export async function POST(request) {
  try {
    const body = await request.json();
    const siteId = body.siteId;
    const dryRun = body.dryRun ?? false; // trueなら更新せず結果だけ返す

    // 過去7日分の未判定 or 再判定対象を取得
    const visits = await sql`
      SELECT 
        v.id,
        v.ip_address,
        v.user_agent,
        v.visited_at,
        v.is_human,
        v.is_rapid,
        v.is_html_only,
        v.referrer,
        v.page_url,
        v.crawler_type
      FROM ai_crawler_visits v
      WHERE v.site_id = ${siteId}
        AND v.visited_at > NOW() - INTERVAL '7 days'
        AND v.is_human = false
      ORDER BY v.ip_address, v.visited_at
    `;

    if (visits.length === 0) {
      return Response.json({ updated: 0, message: 'No visits to process' });
    }

    // IP別の統計を事前計算
    const ipStatsMap = {};
    for (const v of visits) {
      const ip = v.ip_address;
      if (!ipStatsMap[ip]) {
        ipStatsMap[ip] = { visits: [], visit_count: 0, span_minutes: 0 };
      }
      ipStatsMap[ip].visits.push(new Date(v.visited_at));
      ipStatsMap[ip].visit_count++;
    }

    // span_minutes を計算
    for (const ip in ipStatsMap) {
      const times = ipStatsMap[ip].visits.sort((a, b) => a - b);
      const spanMs = times[times.length - 1] - times[0];
      ipStatsMap[ip].span_minutes = spanMs / 1000 / 60;
    }

    // 各visitのスコアを計算
    const results = [];
    const updates = [];

    for (const visit of visits) {
      const ipStats = ipStatsMap[visit.ip_address] || { visit_count: 1, span_minutes: 999 };
      const { score, reasons } = calcMimicScore(visit, ipStats);
      const isMimic = score >= 50;

      results.push({
        id: visit.id,
        ip_address: visit.ip_address,
        score,
        isMimic,
        reasons,
      });

      if (!dryRun) {
        updates.push({ id: visit.id, score, isMimic });
      }
    }

    // バルクアップデート（シンプルに1件ずつ、件数少ないので問題なし）
    if (!dryRun && updates.length > 0) {
      for (const u of updates) {
        await sql`
          UPDATE ai_crawler_visits
          SET is_mimic = ${u.isMimic},
              mimic_score = ${u.score}
          WHERE id = ${u.id}
        `;
      }
    }

    const mimicCount = results.filter(r => r.isMimic).length;

    return Response.json({
      processed: results.length,
      mimic_detected: mimicCount,
      normal: results.length - mimicCount,
      dryRun,
      // dryRunの場合は詳細も返す
      ...(dryRun && { details: results.filter(r => r.isMimic).slice(0, 20) }),
    });

  } catch (error) {
    console.error('Mimic detection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}