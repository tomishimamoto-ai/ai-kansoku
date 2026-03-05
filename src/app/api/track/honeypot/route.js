/**
 * /api/track/honeypot/route.js
 *
 * 人間には見えない隠しリンクを踏んだらbot確定
 * - aria-hidden + tabindex=-1 + position:absolute で人間からは完全に隠す
 * - ただしSEOクローラー・セキュリティスキャナーも踏む可能性あり
 * - → crawler_type: 'bot'（AI確定ではなくbot確定）confidence: 85
 *
 * track.jsでの埋め込み方（標準）:
 * <a href="/api/track/honeypot?siteId=xxx"
 *    style="position:absolute;left:-9999px"
 *    tabindex="-1"
 *    aria-hidden="true">.</a>
 */

import { neon } from '@neondatabase/serverless';
import { makeSessionId } from '../../../../lib/crawler-detection';
const db = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const url    = new URL(req.url);
    const siteId = url.searchParams.get('siteId');

    if (!siteId) {
      return new Response('not found', { status: 404 });
    }

    // IP取得強化（Vercel/CDN環境で安定）
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '';

    const ua = req.headers.get('user-agent') || '';

    // ② UA空はノイズなので記録しない
    if (!ua) {
      return new Response('ok', { status: 200 });
    }

    // ③ 監視ツール・uptimeチェッカーは記録しない（DB節約）
    const NOISE_UA = ['monitor', 'uptime', 'pingdom', 'statuspage', 'healthcheck'];
    if (NOISE_UA.some(kw => ua.toLowerCase().includes(kw))) {
      return new Response('ok', { status: 200 });
    }

    const sessionId = makeSessionId(ip, ua);

    // refererを保存（page_urlとして活用）
    const referer = req.headers.get('referer') || '/honeypot';

    // Honeypotを踏んだ → bot確定（AI確定ではない）
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
        ${sessionId},
        ${'Unknown Bot'},
        ${'bot'},
        ${'unknown'},
        ${false},
        ${'honeypot'},
        ${85},
        ${85},
        ${false},
        ${false},
        ${false},
        ${referer},
        NOW()
      )
    `;

    // 1x1透明GIF（不審に思われないよう正常レスポンス）
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
    console.error('[honeypot] error:', error);
    return new Response('not found', { status: 404 });
  }
}