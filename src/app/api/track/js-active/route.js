// ========================================
// /api/track/js-active
// Phase 2: JavaScript実行検出エンドポイント
// ========================================

export async function GET(request) {
  console.log('=== JS Active Detection ===');
  
  // 1x1透明GIF画像を返す
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