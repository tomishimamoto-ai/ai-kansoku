/**
 * /api/track/route.js  (v5.4対応)
 *
 * v5.3からの変更点:
 * - IP取得にx-real-ipを追加
 * - pathサニタイズ（try-catch + 最大200文字）
 * - UAに長さ制限（500文字）
 * - siteId検証追加
 * - robots判定SQLに /llms.txt /sitemap.xml を追加
 * - Cache-Control強化
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
    console.log('ASN test:', req.headers.get?.('x-vercel-ip-as-number'));

    // ✅ siteId検証
    if (!siteId || siteId.length > 100) {
      return new Response('invalid siteId', { status: 400 });
    }

    // ✅ pathサニタイズ（壊れたURLでクラッシュしない）
    let rawPath = url.searchParams.get('path') || '/';
    let path;
    try {
      path = decodeURIComponent(rawPath).slice(0, 200);
    } catch {
      path = '/';
    }

    // ✅ IP取得順序修正
    const ip = (
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      ''
    );

    // ✅ UA長さ制限
    const ua = (req.headers.get('user-agent') || '').slice(0, 500);

    // ── DB参照型セミセッション ──────────────────────────────
    // ✅ robots判定をAI準備アクセス3種に拡張
    let hadRobotsDb = false;
    const AI_PREP_PATHS = ['/robots.txt', '/llms.txt', '/sitemap.xml'];
    if (ip && !AI_PREP_PATHS.includes(path)) {
      try {
        const robotsCheck = await db`
          SELECT 1 FROM ai_crawler_visits
          WHERE ip_address = ${ip}
            AND user_agent = ${ua}
            AND crawler_type != 'human'
            AND page_url IN ('/robots.txt', '/llms.txt', '/sitemap.xml')
            AND visited_at > NOW() - INTERVAL '5 minutes'
          LIMIT 1
        `;
        hadRobotsDb = robotsCheck.length > 0;
      } catch {
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
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });

  } catch (error) {
    console.error('[track] error:', error);
    return new Response('error', { status: 500 });
  }
}