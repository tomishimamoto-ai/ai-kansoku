import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          backgroundImage: 'linear-gradient(to bottom right, #000, #1a1a2e)',
        }}
      >
        {/* メインコンテンツ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px',
          }}
        >
          {/* アイコン */}
          <div style={{ fontSize: 120, marginBottom: 30 }}>🔍</div>
          
          {/* タイトル */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: 20,
            }}
          >
            AI観測ラボ
          </div>
          
          {/* サブタイトル */}
          <div
            style={{
              fontSize: 36,
              color: '#fff',
              marginBottom: 40,
            }}
          >
            AIクロール診断ツール
          </div>
          
          {/* 説明文 */}
          <div
            style={{
              fontSize: 28,
              color: '#9ca3af',
              textAlign: 'center',
              marginBottom: 50,
              maxWidth: 800,
            }}
          >
            あなたのサイトはAIに好かれていますか？<br />
            8項目を30秒で無料診断
          </div>
          
          {/* 特徴 */}
          <div
            style={{
              display: 'flex',
              gap: 40,
              fontSize: 24,
              color: '#10b981',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              ✓ 無料・登録不要
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              ✓ 30秒で診断
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              ✓ PDF出力可能
            </div>
          </div>
          
          {/* URL */}
          <div
            style={{
              fontSize: 24,
              color: '#6b7280',
              marginTop: 60,
            }}
          >
            ai-kansoku.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}