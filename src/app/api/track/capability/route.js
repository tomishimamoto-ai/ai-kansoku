/**
 * /api/track/capability/route.js
 *
 * ブラウザのJS capability fingerprintを受け取って記録
 * - webdriver: trueならほぼbot確定
 * - plugins: 0ならheadlessブラウザの可能性
 * - screen: 0x0ならheadless確定
 * - languages: 空配列ならbot疑い
 */

import { neon } from '@neondatabase/serverless';
const db = neon(process.env.DATABASE_URL);

export async function POST(req) {
  try {
    const body = await req.json();
    const { siteId, path, fp, t } = body;

    if (!siteId || !fp) {
      return new Response('invalid', { status: 400 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '';
    const ua = (req.headers.get('user-agent') || '').slice(0, 500);

    // fingerprintをJSONBカラムに保存
    // session_idが一致するレコードがあれば更新、なければ新規INSERT
    const sessionKey = `${ip}-${ua}`;

    // 直近5分以内の同セッションのレコードを更新
    const updated = await db`
      UPDATE ai_crawler_visits
      SET fingerprint = ${JSON.stringify(fp)}
      WHERE site_id   = ${siteId}
        AND ip_address = ${ip}
        AND user_agent = ${ua}
        AND visited_at > NOW() - INTERVAL '5 minutes'
        AND fingerprint IS NULL
      RETURNING id
    `;

    // 一致するレコードがなければ単独でINSERT（fallback）
    if (updated.length === 0) {
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
          fingerprint,
          visited_at
        ) VALUES (
          ${siteId},
          ${ip},
          ${ua},
          ${'fp-' + Date.now()},
          ${'Unknown'},
          ${'unknown'},
          ${'unknown'},
          ${true},
          ${'fingerprint'},
          ${50},
          ${50},
          ${false},
          ${false},
          ${false},
          ${path || '/'},
          ${JSON.stringify(fp)},
          NOW()
        )
      `;
    }

    return new Response('ok', { status: 200 });

  } catch (error) {
    console.error('[capability] error:', error);
    return new Response('error', { status: 500 });
  }
}