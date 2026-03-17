import { neon } from '@neondatabase/serverless';
const db = neon(process.env.DATABASE_URL);

// レート制限
const _rateCache = new Map();
const RATE_LIMIT_MS = 60 * 1000;
const RATE_CACHE_MAX = 5000;

function isRateLimited(ip, path) {
  if (!ip) return false;
  const key = `${ip}:${path}`;
  const now = Date.now();
  if (_rateCache.has(key) && now - _rateCache.get(key) < RATE_LIMIT_MS) {
    return true;
  }
  if (_rateCache.size >= RATE_CACHE_MAX) {
    const oldest = [..._rateCache.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, 1000);
    oldest.forEach(([k]) => _rateCache.delete(k));
  }
  _rateCache.set(key, now);
  return false;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { siteId, fp } = body;
    if (!siteId || !fp) return new Response('invalid', { status: 400 });

    // pathサニタイズ
    const safePath =
      typeof body.path === 'string'
        ? (() => { try { return decodeURIComponent(body.path).slice(0, 200); } catch { return '/'; } })()
        : '/';

    const ip =
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '';
    const ua = (req.headers.get('user-agent') || '').slice(0, 500);

    // レート制限
    if (isRateLimited(ip, safePath)) {
      return new Response('ok', { status: 200 });
    }

    // 人間スキップ（webdriver=falseかつplugins>0）
    if (!fp.webdriver && fp.plugins > 0) {
      return new Response('ok', { status: 200 });
    }

    // fingerprintサイズ制限
    const fpJson = JSON.stringify(fp).slice(0, 2000);

    // UPDATEのみ（INSERT削除）、1行だけ更新
    db`
      UPDATE ai_crawler_visits
      SET fingerprint = ${fpJson}
      WHERE id = (
        SELECT id FROM ai_crawler_visits
        WHERE site_id   = ${siteId}
          AND ip_address = ${ip}
          AND user_agent = ${ua}
          AND visited_at > NOW() - INTERVAL '5 minutes'
          AND fingerprint IS NULL
        ORDER BY visited_at DESC
        LIMIT 1
      )
    `.catch(e => console.error('capability update fail', e));

    return new Response('ok', { status: 200 });

  } catch (error) {
    console.error('[capability] error:', error);
    return new Response('error', { status: 500 });
  }
}