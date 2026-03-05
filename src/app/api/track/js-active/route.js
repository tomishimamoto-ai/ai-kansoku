// ========================================
// /api/track/js-active
// v5.5: ジッピー指摘反映（sessionId/UA/referrer/path/IP修正）
// ========================================

import { neon } from '@neondatabase/serverless';
import { initDB } from '../../../../lib/db-init.js';

// ① DBコネクションをファイル上部に（毎リクエスト生成を避ける）
const sql = neon(process.env.DATABASE_URL);

// AIドメインリスト（Setで高速ルックアップ）
const AI_REFERRER_DOMAINS = new Set([
  'chatgpt.com',
  'chat.openai.com',
  'claude.ai',
  'perplexity.ai',
  'perplexity.com',
  'gemini.google.com',
  'bard.google.com',
  'copilot.microsoft.com',
  'copilot.com',
  'you.com',
  'phind.com',
  'bing.com/chat',
  'poe.com',
]);

function detectAiReferrer(referrer) {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    for (const domain of AI_REFERRER_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return domain;
      }
    }
  } catch {
    // URLパース失敗時は文字列マッチ
    const lower = referrer.toLowerCase();
    for (const domain of AI_REFERRER_DOMAINS) {
      if (lower.includes(domain)) return domain;
    }
  }
  return null;
}

export async function GET(request) {
  await initDB();
  
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return sendGif();
    }

    // ① siteId簡易バリデーション
    if (!/^[a-z0-9]{8,12}$/.test(siteId)) {
      return sendGif();
    }

    // ② UA長さ制限（Bot攻撃対策）
    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);

    // ③ IP取得順序修正（x-real-ipを優先）+ IPv6正規化
    let ip =
      request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';
    ip = ip.replace(/^::ffff:/, '');

    // ④ referrer長さ制限
    const referrer = (
      searchParams.get('referrer') ||
      request.headers.get('referer') ||
      ''
    )
    .slice(0, 500)
    .replace(/[\r\n]/g, '');

    // ⑤ pathサニタイズ（デコード失敗対策）
    const pathRaw = searchParams.get('path') || '/';
    let path;
    try {
      path = decodeURIComponent(pathRaw).slice(0, 200);
    } catch {
      path = '/';
    }
    // 空白正規化
    path = path
      .replace(/[\r\n]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // ⑥ Acceptヘッダ保存（AIクローラー判定シグナル）
    const accept = (request.headers.get('accept') || '').slice(0, 200);

    // ⑦ sessionId: crypto.randomUUID()に変更（IPv6対応）
    const sessionId = crypto.randomUUID();

    // AIシグナル判定
    const aiDomain = detectAiReferrer(referrer);
    const crawlerName = aiDomain
      ? `AI-Referral(${aiDomain})`
      : 'Human (JS Detected)';

    await sql`
      INSERT INTO ai_crawler_visits (
        site_id,
        user_agent,
        ip_address,
        referrer,
        page_url,
        session_id,
        crawler_name,
        detection_method,
        accept_header,
        is_human,
        visited_at
      ) VALUES (
        ${siteId},
        ${userAgent},
        ${ip},
        ${referrer},
        ${path},
        ${sessionId},
        ${crawlerName},
        'javascript',
        ${accept},
        true,
        CURRENT_TIMESTAMP
      )
    `;

  } catch (error) {
    console.error('❌ Error recording human visit:', error);
  }

  return sendGif();
}

function sendGif() {
  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  return new Response(gif, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      // ③ GIFにCORSヘッダは不要（キャッシュ層での無駄を省く）
    }
  });
}