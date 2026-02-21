/**
 * /api/track/route.js  (v5.3対応)
 *
 * v5.2からの変更点:
 * - ua を ip の直後に移動（DB参照より前に定義）
 * - robots.txt判定SQLに crawler_type != 'human' を追加
 */

import { detectCrawler } from '../../../lib/crawler-detection';
import { neon } from '@neondatabase/serverless';
const db = neon(process.env.DATABASE_URL);

export async function GET(req) {
  return handleTrack(req);
}

export async function HEAD(req) {
  return handleTrack(req);
}

async function handleTrack(req) {
  try {
    const url    = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    const path   = url.searchParams.get('path') || '/';

    if (!siteId) {
      return new Response('missing siteId', { status: 400 });
    }

    const ip = (
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
    );

    // ✅ ua を DB参照より前に定義
    const ua = req.headers.get('user-agent') || '';

    // ── DB参照型セミセッション ──────────────────────────────
    // 同IP+UAで直近5分以内にrobots.txtアクセスがあるか確認
    // Serverlessではメモリが共有されないためDBで代替
    let hadRobotsDb = false;
    if (ip && path !== '/robots.txt') {
      try {
        const robotsCheck = await db`
          SELECT 1 FROM ai_crawler_visits
          WHERE ip_address = ${ip}
            AND user_agent = ${ua}
            AND crawler_type != 'human'
            AND page_url = '/robots.txt'
            AND visited_at > NOW() - INTERVAL '5 minutes'
          LIMIT 1
        `;
        hadRobotsDb = robotsCheck.length > 0;
      } catch {
        // DBエラー時はスキップ（検知精度より安定性優先）
        hadRobotsDb = false;
      }
    }

    // ── クローラー検知 ──────────────────────────────────────
    const detection = detectCrawler(req, { path, hadRobotsDb });

    // 検索エンジンはスキップ
    if (detection.crawlerType === 'search-engine') {
      return new Response('ok', { status: 200 });
    }

    // ── DB に記録 ───────────────────────────────────────────
    await db`
      INSERT INTO ai_crawler_visits (
        site_id,
        ip_address,
        user_agent,
        session_id,
        crawler_name,
        crawler_type,
        purpose,
        is_human,
        detection_method,
        confidence,
        total_score,
        is_rapid,
        had_robots_access,
        is_html_only,
        page_url,
        visited_at
      ) VALUES (
        ${siteId},
        ${ip},
        ${ua},
        ${detection.sessionId},
        ${detection.crawlerName},
        ${detection.crawlerType},
        ${detection.purpose},
        ${detection.isHuman},
        ${detection.detectionMethod},
        ${detection.confidence},
        ${detection.totalScore},
        ${detection.rapid    ?? false},
        ${detection.robots   ?? false},
        ${detection.htmlOnly ?? false},
        ${path},
        NOW()
      )
    `;

    // ── 1x1 透明GIFを返す ──────────────────────────────────
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return new Response(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache',
      },
    });

  } catch (error) {
    console.error('[track] error:', error);
    return new Response('error', { status: 500 });
  }
}