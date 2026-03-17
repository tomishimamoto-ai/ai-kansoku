import { randomUUID } from 'crypto';
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const AI_REFERRER_DOMAINS = new Set([
  'chatgpt.com', 'chat.openai.com', 'claude.ai',
  'perplexity.ai', 'perplexity.com', 'gemini.google.com',
  'bard.google.com', 'copilot.microsoft.com', 'copilot.com',
  'you.com', 'phind.com', 'poe.com',
  // bing.com削除（通常検索流入が混入するため）
]);

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

function detectAiReferrer(referrer) {
  if (!referrer) return null;
  try {
    const hostname = new URL(referrer).hostname.toLowerCase();
    for (const domain of AI_REFERRER_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return domain;
    }
  } catch {
    const lower = referrer.toLowerCase();
    for (const domain of AI_REFERRER_DOMAINS) {
      if (lower.includes(domain)) return domain;
    }
  }
  return null;
}

function sendGif() {
  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  return new Response(gif, {
    status: 200,
    headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');
    if (!siteId || !/^[a-z0-9]{8,12}$/.test(siteId)) return sendGif();

    let ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    ip = ip.replace(/^::ffff:/, '');

    const pathRaw = searchParams.get('path') || '/';
    let path;
    try { path = decodeURIComponent(pathRaw).slice(0, 200); }
    catch { path = '/'; }

    // レート制限
    if (isRateLimited(ip, path)) return sendGif();

    const referrer = (
      searchParams.get('referrer') ||
      request.headers.get('referer') ||
      ''
    ).slice(0, 500).replace(/[\r\n]/g, '');

    // AI経由でなければスキップ
    const aiDomain = detectAiReferrer(referrer);
    if (!aiDomain) return sendGif();

    const ua = (request.headers.get('user-agent') || '').slice(0, 500);
    const accept = (request.headers.get('accept') || '').slice(0, 200);

    // awaitなし（バックグラウンド書き込み）
    sql`
      INSERT INTO ai_crawler_visits (
        site_id, user_agent, ip_address, referrer, page_url,
        session_id, crawler_name, detection_method, accept_header,
        is_human, visited_at
      ) VALUES (
        ${siteId}, ${ua}, ${ip}, ${referrer}, ${path},
        ${randomUUID()}, ${'AI-Referral(' + aiDomain + ')'},
        'javascript', ${accept}, false, CURRENT_TIMESTAMP
      )
    `.catch(e => console.error('js-active insert fail', e));

  } catch (error) {
    console.error('❌ js-active error:', error);
  }

  return sendGif();
}