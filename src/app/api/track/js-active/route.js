// ========================================
// /api/track/js-active
// v5.4: referrerをクエリパラメータから取得（no-cors対応）
// ========================================

import { neon } from '@neondatabase/serverless';
import { initDB } from '../../../../lib/db-init.js';

// AIドメインリスト（referrerと照合してAIシグナルを判定）
const AI_REFERRER_DOMAINS = [
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
];

function detectAiReferrer(referrer) {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    const full = referrer.toLowerCase();
    for (const domain of AI_REFERRER_DOMAINS) {
      if (hostname.includes(domain) || full.includes(domain)) {
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
    const path = searchParams.get('path') || '/';

    if (!siteId) {
      return sendGif();
    }

    const sql = neon(process.env.DATABASE_URL);

    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // クエリパラメータのreferrerを優先（no-corsではheaderが届かないため）
    const referrer = searchParams.get('referrer') || 
                     request.headers.get('referer') || 
                     '';

    // AIシグナル判定
    const aiDomain = detectAiReferrer(referrer);
    const crawlerName = aiDomain
      ? `AI-Referral(${aiDomain})`
      : 'Human (JS Detected)';

    const sessionId = `${ip.split('.')[0]}_${Date.now()}`;

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
      'Access-Control-Allow-Origin': '*',
    }
  });
}