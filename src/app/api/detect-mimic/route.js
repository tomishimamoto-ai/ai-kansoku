import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ========================================
// GET: 擬態クローラーの統計取得（ダッシュボード用）
// ========================================
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');

  if (!siteId) {
    return Response.json({ error: 'siteId required' }, { status: 400 });
  }

  try {
    // 擬態クローラーの集計（7日間）
    // search-engineは正規Botなので除外、spoofed-botとother-botのみ
    const mimicStats = await sql`
      SELECT
        COUNT(*) as total_mimic,
        COUNT(DISTINCT ip_address) as unique_ips,
        MAX(visited_at) as last_detected,
        AVG(total_score) as avg_score
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND crawler_type IN ('spoofed-bot', 'other-bot')
        AND visited_at > NOW() - INTERVAL '7 days'
    `;

    // IP別の詳細 TOP10
    const mimicByIP = await sql`
      SELECT
        ip_address,
        COUNT(*) as visit_count,
        MAX(total_score) as max_score,
        MIN(visited_at) as first_visit,
        MAX(visited_at) as last_visit
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND crawler_type IN ('spoofed-bot', 'other-bot')
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
        AND crawler_type IN ('spoofed-bot', 'other-bot')
        AND visited_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `;

    // 種別内訳
    const byType = await sql`
      SELECT
        crawler_type,
        crawler_name,
        COUNT(*) as visit_count
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND crawler_type IN ('spoofed-bot', 'other-bot')
        AND visited_at > NOW() - INTERVAL '7 days'
      GROUP BY crawler_type, crawler_name
      ORDER BY visit_count DESC
    `;

    // ========================================
    // UA/IPローテーション異常検出
    // 同一UAで多数のIPを使い回してるケース（分散型擬態）
    // ========================================
    const uaRotation = await sql`
      SELECT
        user_agent,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(*) as total_visits
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at > NOW() - INTERVAL '7 days'
        AND is_human = false
        AND user_agent IS NOT NULL
        AND user_agent != ''
      GROUP BY user_agent
      HAVING COUNT(DISTINCT ip_address) > 5
      ORDER BY unique_ips DESC
      LIMIT 10
    `;

    // 同一IPで多数のUAを使い回してるケース（UA偽装型）
    const ipRotation = await sql`
      SELECT
        ip_address,
        COUNT(DISTINCT user_agent) as unique_uas,
        COUNT(*) as total_visits
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at > NOW() - INTERVAL '7 days'
        AND is_human = false
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING COUNT(DISTINCT user_agent) > 5
      ORDER BY unique_uas DESC
      LIMIT 10
    `;

    // ========================================
    // 周期検出
    // CV（変動係数）= 標準偏差 / 平均 × 100
    // CV低い = 間隔が揃ってる = Bot的、CV高い = バラバラ = 人間的
    // ========================================
    const periodicIPs = await sql`
      SELECT
        ip_address,
        COUNT(*) as visit_count,
        ROUND(AVG(interval_seconds)::numeric, 1) as avg_interval_sec,
        ROUND(STDDEV_POP(interval_seconds)::numeric, 1) as stddev_sec,
        ROUND(
          CASE
            WHEN AVG(interval_seconds) > 0
            THEN (STDDEV_POP(interval_seconds) / AVG(interval_seconds)) * 100
            ELSE 999
          END::numeric
        , 1) as cv_percent
      FROM (
        SELECT
          ip_address,
          EXTRACT(EPOCH FROM (
            visited_at - LAG(visited_at) OVER (PARTITION BY ip_address ORDER BY visited_at)
          )) as interval_seconds
        FROM ai_crawler_visits
        WHERE site_id = ${siteId}
          AND visited_at > NOW() - INTERVAL '7 days'
          AND is_human = false
      ) intervals
      WHERE interval_seconds IS NOT NULL
        AND interval_seconds > 0
      GROUP BY ip_address
      HAVING COUNT(*) >= 4
      ORDER BY cv_percent ASC
      LIMIT 10
    `;

    return Response.json({
      stats: {
        total_mimic: parseInt(mimicStats[0]?.total_mimic || 0),
        unique_ips: parseInt(mimicStats[0]?.unique_ips || 0),
        last_detected: mimicStats[0]?.last_detected || null,
        avg_score: parseFloat(mimicStats[0]?.avg_score || 0),
      },
      byIP: mimicByIP.map(row => ({
        ip_address: row.ip_address,
        visit_count: parseInt(row.visit_count),
        max_score: parseInt(row.max_score || 0),
        first_visit: row.first_visit,
        last_visit: row.last_visit,
      })),
      trend: mimicTrend.map(row => ({
        date: row.date,
        count: parseInt(row.count),
      })),
      byType: byType.map(row => ({
        type: row.crawler_type,
        name: row.crawler_name,
        visits: parseInt(row.visit_count),
      })),
      // ローテーション異常
      rotation: {
        ua_rotation: uaRotation.map(row => ({
          user_agent: row.user_agent?.substring(0, 80),
          unique_ips: parseInt(row.unique_ips),
          total_visits: parseInt(row.total_visits),
        })),
        ip_rotation: ipRotation.map(row => ({
          ip_address: row.ip_address,
          unique_uas: parseInt(row.unique_uas),
          total_visits: parseInt(row.total_visits),
        })),
      },
      // 周期検出
      // is_periodic: CV 30%以下 = 強周期（確定Bot的）
      // is_periodic_weak: CV 50%以下 = 周期疑い（要観察）
      // period_type: 間隔の長さで分類
      periodic: periodicIPs.map(row => {
        const cv = parseFloat(row.cv_percent || 999);
        const avgSec = parseFloat(row.avg_interval_sec || 0);

        // 周期タイプ分類
        let period_type = 'unknown';
        if (avgSec > 0) {
          if (avgSec < 60) period_type = 'rapid-periodic';        // 1分未満
          else if (avgSec < 3600) period_type = 'medium-periodic'; // 1分〜1時間
          else period_type = 'slow-periodic';                      // 1時間以上
        }

        return {
          ip_address: row.ip_address,
          visit_count: parseInt(row.visit_count),
          avg_interval_sec: avgSec,
          stddev_sec: parseFloat(row.stddev_sec || 0),
          cv_percent: cv,
          is_periodic: cv <= 30,       // 強周期（確定）
          is_periodic_weak: cv <= 50,  // 周期疑い
          period_type,
        };
      }),
    });

  } catch (error) {
    console.error('Mimic stats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ========================================
// POST: バッチ再判定（dryRun対応）
// ========================================
export async function POST(request) {
  try {
    const body = await request.json();
    const siteId = body.siteId;
    const dryRun = body.dryRun ?? false;

    if (!siteId) {
      return Response.json({ error: 'siteId required' }, { status: 400 });
    }

    // is_human=true のレコードを再判定対象として取得
    const visits = await sql`
      SELECT
        id,
        ip_address,
        user_agent,
        visited_at,
        total_score
      FROM ai_crawler_visits
      WHERE site_id = ${siteId}
        AND visited_at > NOW() - INTERVAL '7 days'
        AND is_human = true
      ORDER BY visited_at DESC
      LIMIT 500
    `;

    if (visits.length === 0) {
      return Response.json({ processed: 0, mimic_detected: 0, normal: 0, dryRun });
    }

    // ========================================
    // ローテーション異常スコア（事前計算）
    // 同一UAで多数IPを使い回す分散型擬態を検出
    // ========================================
    const uaRotationMap = {};
    const ipRotationMap = {};
    for (const row of visits) {
      const ua = row.user_agent || '';
      const ip = row.ip_address || '';
      if (!uaRotationMap[ua]) uaRotationMap[ua] = new Set();
      if (!ipRotationMap[ip]) ipRotationMap[ip] = new Set();
      uaRotationMap[ua].add(ip);
      ipRotationMap[ip].add(ua);
    }

    let mimicDetected = 0;
    let normal = 0;
    const details = [];

    for (const row of visits) {
      const ua = (row.user_agent || '').toLowerCase();
      const reasons = [];
      let score = 0;

      // ローテーション異常スコア
      const uaUniqueIPs = uaRotationMap[row.user_agent || '']?.size || 0;
      const ipUniqueUAs = ipRotationMap[row.ip_address || '']?.size || 0;

      if (uaUniqueIPs >= 20) {
        score += 40;
        reasons.push(`UA分散型（同一UAで${uaUniqueIPs}IP）`);
      } else if (uaUniqueIPs >= 10) {
        score += 20;
        reasons.push(`UA分散疑い（同一UAで${uaUniqueIPs}IP）`);
      }

      if (ipUniqueUAs >= 10) {
        score += 35;
        reasons.push(`UA偽装型（同一IPで${ipUniqueUAs}種UA）`);
      } else if (ipUniqueUAs >= 5) {
        score += 15;
        reasons.push(`UA偽装疑い（同一IPで${ipUniqueUAs}種UA）`);
      }

      // 存在しないiOSバージョン（19以上）
      const iosMatch = ua.match(/iphone os (\d+)_/);
      if (iosMatch && parseInt(iosMatch[1]) >= 19) {
        score += 60;
        reasons.push(`iOS ${iosMatch[1]}（存在しないバージョン）`);
      }

      // 存在しないiPadOSバージョン（19以上）
      const ipadMatch = ua.match(/cpu os (\d+)_/);
      if (ipadMatch && parseInt(ipadMatch[1]) >= 19) {
        score += 60;
        reasons.push(`iPadOS ${ipadMatch[1]}（存在しないバージョン）`);
      }

      // 存在しないChromeバージョン（145以上）
      const chromeMatch = ua.match(/chrome\/(\d+)\./);
      if (chromeMatch && parseInt(chromeMatch[1]) >= 145) {
        score += 50;
        reasons.push(`Chrome/${chromeMatch[1]}（存在しないバージョン）`);
      }

      // Android 10; K（Googlebot系）
      if (ua.includes('android 10; k)')) {
        score += 55;
        reasons.push('Android 10; K（Googlebot系UA）');
      }

      // Googlebot系デバイス
      if (ua.includes('nexus 5x build/mmb29p')) {
        score += 55;
        reasons.push('Nexus 5X（Googlebot UA）');
      }
      if (ua.includes('moto g (4)')) {
        score += 55;
        reasons.push('Moto G (4)（Lighthouse UA）');
      }
      if (ua.includes('cros x86_64 14541')) {
        score += 55;
        reasons.push('ChromeOS 14541（Googlebot UA）');
      }

      // Vercel Screenshot
      if (ua.includes('vercel-screenshot')) {
        score += 99;
        reasons.push('Vercel Screenshot Bot');
      }

      // AdsBot-Google
      if (ua.includes('adsbot-google')) {
        score += 90;
        reasons.push('AdsBot-Google');
      }

      if (score >= 50) {
        mimicDetected++;
        details.push({
          ip_address: row.ip_address,
          score,
          reasons,
          user_agent: row.user_agent?.substring(0, 80),
        });

        if (!dryRun) {
          const isSearchEngine =
            ua.includes('android 10; k)') ||
            ua.includes('nexus 5x') ||
            ua.includes('moto g (4)') ||
            ua.includes('cros x86_64') ||
            ua.includes('adsbot-google');

          const isOtherBot = ua.includes('vercel-screenshot');

          const crawlerType = isSearchEngine
            ? 'search-engine'
            : isOtherBot
            ? 'other-bot'
            : 'spoofed-bot';

          const crawlerName = ua.includes('android 10; k)') ? 'Googlebot-family'
            : ua.includes('nexus 5x') ? 'Googlebot-family'
            : ua.includes('moto g (4)') ? 'Googlebot-family'
            : ua.includes('cros x86_64') ? 'Googlebot-family'
            : ua.includes('adsbot-google') ? 'AdsBot-Google'
            : ua.includes('vercel-screenshot') ? 'Vercel-Screenshot'
            : iosMatch ? 'Spoofed-iOS'
            : ipadMatch ? 'Spoofed-iPadOS'
            : chromeMatch ? 'Spoofed-Chrome'
            : 'Spoofed-Bot';

          await sql`
            UPDATE ai_crawler_visits
            SET
              is_human = false,
              crawler_type = ${crawlerType},
              crawler_name = ${crawlerName},
              detection_method = 'ua-normalization'
            WHERE id = ${row.id}
          `;
        }
      } else {
        normal++;
      }
    }

    return Response.json({
      success: true,
      processed: visits.length,
      mimic_detected: mimicDetected,
      normal,
      dryRun,
      ...(dryRun && { details: details.slice(0, 10) }),
    });

  } catch (error) {
    console.error('Mimic detection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}