/**
 * /api/track/honeypot/route.js
 *
 * 人間には見えない隠しリンクを踏んだら即AI確定
 * - display:none のリンクを辿るのはHTMLを解析するクローラーのみ
 * - 踏んだら confidence=99 で記録
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

    const ip = (
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
    );
    const ua        = req.headers.get('user-agent') || '';
    const sessionId = makeSessionId(ip, ua);

    // Honeypotを踏んだ → AI確定（confidence=99）
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
        ${'Unknown AI'},
        ${'ai'},
        ${'unknown'},
        ${false},
        ${'honeypot'},
        ${99},
        ${99},
        ${false},
        ${false},
        ${false},
        ${'/honeypot'},
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