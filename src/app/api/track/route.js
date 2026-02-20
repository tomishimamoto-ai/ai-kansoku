/**
 * /api/track/route.js  (v5対応)
 *
 * 変更点:
 * - detectCrawler に path を渡す（robots.txt先行/HTML only検知のため）
 * - sessionId をDBに保存
 * - totalScore / robots / htmlOnly をDBに保存
 * - HEAD メソッドも同じロジックで処理
 */

import {
  detectCrawler,
  markRobotsAccess,
  trackHtmlOnly,
} from '@/lib/crawler-detection';
import { db } from '@/lib/db';

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

    // ── robots.txt へのアクセスを記録 ──────────────────────
    const ip = (
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
    );
    if (path === '/robots.txt') markRobotsAccess(ip);
    trackHtmlOnly(ip, path);

    // ── クローラー検知 ──────────────────────────────────────
    const detection = detectCrawler(req, { path });

    // 検索エンジンはスキップ
    if (detection.crawlerType === 'search-engine') {
      return new Response('ok', { status: 200 });
    }

    const ua = req.headers.get('user-agent') || '';

    // ── DB に記録 ───────────────────────────────────────────
    await db.query(`
      INSERT INTO ai_crawler_visits (
        site_id,
        ip,
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
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
    `, [
      siteId,
      ip,
      ua,
      detection.sessionId,
      detection.crawlerName,
      detection.crawlerType,
      detection.purpose,
      detection.isHuman,
      detection.detectionMethod,
      detection.confidence,
      detection.totalScore,
      detection.rapid    ?? false,
      detection.robots   ?? false,
      detection.htmlOnly ?? false,
      path,
    ]);

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