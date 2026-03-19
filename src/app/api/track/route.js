/**
 * /api/track/route.js (v5.7)
 *
 * v5.6からの変更点:
 * - robotsCacheにメモリリーク対策追加（上限2000件）
 * - robotsKeyの区切り文字追加（衝突防止）
 */

import { detectCrawler } from '../../../lib/crawler-detection';
import { neon } from '@neondatabase/serverless';
const db = neon(process.env.DATABASE_URL);

// ── インメモリレート制限 ──────────────────────────────────────
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

// ── robotsキャッシュ ─────────────────────────────────────────
const _robotsCache = new Map();
const ROBOTS_WINDOW = 5 * 60 * 1000;
const ROBOTS_CACHE_MAX = 2000;
const AI_PREP_PATHS = ['/robots.txt', '/llms.txt', '/sitemap.xml'];

// ── GIFレスポンス共通化 ──────────────────────────────────────
function gifResponse() {
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
}

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

    if (!siteId || siteId.length > 100) {
      return new Response('invalid siteId', { status: 400 });
    }

    let rawPath = url.searchParams.get('path') || '/';
    let path;
    try {
      path = decodeURIComponent(rawPath).slice(0, 200);
    } catch {
      path = '/';
    }

    const ip = (
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      ''
    );

    // ── レート制限 ──────────────────────────────────────────
    if (isRateLimited(ip, path)) {
      return gifResponse();
    }

    const ua = (req.headers.get('user-agent') || '').slice(0, 500);

    // ── robotsキャッシュ保存 & 判定 ──────────────────────────
    const robotsKey = `${ip}|${ua}`;
    if (AI_PREP_PATHS.includes(path)) {
      if (_robotsCache.size >= ROBOTS_CACHE_MAX) {
        const oldest = [..._robotsCache.entries()]
          .sort((a, b) => a[1] - b[1])
          .slice(0, 500);
        oldest.forEach(([k]) => _robotsCache.delete(k));
      }
      _robotsCache.set(robotsKey, Date.now());
    }
    const hadRobotsDb =
      _robotsCache.has(robotsKey) &&
      Date.now() - _robotsCache.get(robotsKey) < ROBOTS_WINDOW;

    // ── クローラー検知 ──────────────────────────────────────
    const detection = detectCrawler(req, { path, hadRobotsDb });

    // 検索エンジンはスキップ
    if (detection.crawlerType === 'search-engine') {
      return new Response('ok', { status: 200 });
    }

    // 人間はDBスキップ
    if (detection.isHuman) {
      return gifResponse();
    }

    if (detection.crawlerType === 'unknown' && detection.totalScore === 0) {
    return gifResponse();
    }

    if (detection.crawlerType === 'spoofed-bot' && detection.confidence < 85) {
    return gifResponse();
    }

    // ── DB INSERT（AIのみ）──────────────────────────────────
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
        accept_header,
        accept_language,
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
        ${req.headers.get('accept') || null},
        ${req.headers.get('accept-language') || null},
        NOW()
      )
    `;

    return gifResponse();

  } catch (error) {
    console.error('[track] error:', error);
    return new Response('error', { status: 500 });
  }
}