// ========================================
// /api/track/img-check
// Phase 2: 画像リクエスト検出エンドポイント
// v2: console.log削除、Access-Control-Allow-Origin削除
// ========================================

export async function GET() {
  const gif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new Response(gif, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  });
}

// AIクローラーはHEADで画像確認することがある
export async function HEAD() {
  return GET();
}