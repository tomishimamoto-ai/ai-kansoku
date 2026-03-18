import { neon } from '@neondatabase/serverless';
import { makeSessionId, detectCrawler } from '../../../../lib/crawler-detection';
const db = neon(process.env.DATABASE_URL);

export async function GET(req) {
  try {
    const url    = new URL(req.url);
    const siteId = url.searchParams.get('siteId');
    if (!siteId) return new Response('not found', { status: 404 });

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || '';

    const ua = req.headers.get('user-agent') || '';
    if (!ua) return new Response('ok', { status: 200 });

    const NOISE_UA = ['monitor', 'uptime', 'pingdom', 'statuspage', 'healthcheck'];
    if (NOISE_UA.some(kw => ua.toLowerCase().includes(kw))) {
      return new Response('ok', { status: 200 });
    }

    const detection = detectCrawler(req, { path: '/honeypot' });
    const crawlerType = detection.crawlerType === 'ai' ? 'ai' : 'bot';
    const referer = req.headers.get('referer') || '/honeypot';

    await db`
      INSERT INTO ai_crawler_visits (
        site_id, ip_address, user_agent, session_id,
        crawler_name, crawler_type, purpose, is_human,
        detection_method, confidence, total_score,
        is_rapid, had_robots_access, is_html_only,
        page_url, visited_at
      ) VALUES (
        ${siteId}, ${ip}, ${ua}, ${detection.sessionId},
        ${detection.crawlerName},
        ${crawlerType},
        ${detection.purpose},
        ${false},
        ${'honeypot'},
        ${90},
        ${90},
        ${false}, ${false}, ${false},
        ${referer}, NOW()
      )
    `;

    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return new Response(gif, {
      status: 200,
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache' },
    });

  } catch (error) {
    console.error('[honeypot] error:', error);
    return new Response('not found', { status: 404 });
  }
}