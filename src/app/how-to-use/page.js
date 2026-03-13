'use client';
import Link from 'next/link';

export default function HowToUsePage() {
  const J = "'Plus Jakarta Sans', sans-serif";
  const M = "'DM Mono', monospace";
  const N = "'Noto Sans JP', sans-serif";

  const steps = [
    {
      n: '01',
      title: 'URLを入力',
      desc: '診断したいサイトのURLを入力します',
      content: (
        <div style={{ background: 'var(--bg-sub)', borderRadius: 10, padding: 24, border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)', marginBottom: 12, letterSpacing: '.06em' }}>入力例：</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['https://example.com', 'example.com'].map(ex => (
              <div key={ex} style={{ background: '#fff', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: 6, fontFamily: M, fontSize: 13, color: 'var(--ink-mid)' }}>
                {ex}
              </div>
            ))}
            <p style={{ fontFamily: N, fontSize: 12, color: 'var(--ink-xlight)', marginTop: 4 }}>
              ※ https:// は自動で補完されます
            </p>
          </div>
        </div>
      ),
    },
    {
      n: '02',
      title: '診断を実行',
      desc: '「診断する」ボタンをクリックして待ちます',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontFamily: N, fontSize: 14, color: 'var(--ink-light)' }}>診断には10〜30秒程度かかります。以下の項目をチェックします：</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {[
              '📊 構造化データ', '🤖 robots.txt', '🗺️ sitemap.xml', '📝 llms.txt',
              '🏷️ メタタグ', '🏗️ セマンティックHTML', '📱 モバイル対応', '⚡ パフォーマンス',
            ].map(item => (
              <div key={item} style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: 6, fontFamily: N, fontSize: 13, color: 'var(--ink-mid)' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: '03',
      title: '結果を確認',
      desc: '診断結果ページでスコアと改善点を確認します',
      content: (
        <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
          <p style={{ fontFamily: J, fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 18 }}>結果ページの見方</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: '📊', title: '総合スコア', desc: '8項目の平均点（0〜100点）' },
              { icon: '🎯', title: 'レーダーチャート', desc: '各項目のバランスを可視化' },
              { icon: '⚠️', title: '改善ポイント', desc: '優先度別の改善提案' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                <div>
                  <p style={{ fontFamily: J, fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 3 }}>{title}</p>
                  <p style={{ fontFamily: N, fontSize: 13, color: 'var(--ink-light)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      n: '04',
      title: '改善を実施',
      desc: '改善ガイドを参考に、サイトを最適化します',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontFamily: N, fontSize: 14, color: 'var(--ink-light)' }}>
            「詳しい改善ガイドを見る」ボタンから、各項目の具体的な実装方法を確認できます。
          </p>
          <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(45,91,227,0.2)', borderRadius: 8, padding: '12px 16px' }}>
            <p style={{ fontFamily: N, fontSize: 13, color: 'var(--accent)' }}>
              💡 <strong>ヒント：</strong> 高優先度の項目から順に対応すると効率的です。
            </p>
          </div>
        </div>
      ),
    },
    {
      n: '05',
      title: '再診断して効果を確認',
      desc: '改善後、もう一度診断してスコアの変化を確認します',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontFamily: N, fontSize: 14, color: 'var(--ink-light)' }}>
            トップページの診断履歴から、過去のスコアと比較できます。
          </p>
          <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <p style={{ fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)', marginBottom: 12, letterSpacing: '.06em' }}>スコア比較の例：</p>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: J, fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>example.com</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: J, fontWeight: 700, fontSize: '1.4rem', color: 'var(--green)' }}>75点</span>
                <span style={{ fontFamily: M, fontSize: 12, padding: '3px 9px', borderRadius: 100, background: '#dcfce7', color: 'var(--green)' }}>+12</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const hints = [
    { icon: '📅', title: '定期的に診断しましょう', desc: '月1回程度の定期診断で、サイトの健全性を維持できます' },
    { icon: '🔄', title: '更新後は必ず再診断', desc: 'サイトを更新したら、意図せず設定が変わっていないか確認しましょう' },
    { icon: '👥', title: 'チームで共有', desc: '診断結果をURLで共有し、チーム全体で改善に取り組めます' },
    { icon: '🎯', title: '競合分析にも活用', desc: '競合サイトを診断して、自社サイトとの差を把握しましょう' },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:           #ffffff;
          --bg-sub:       #f7f7f5;
          --bg-dark:      #16161a;
          --accent:       #2d5be3;
          --accent-light: #e8edfb;
          --accent-mid:   #6b8ef0;
          --ink:          #111111;
          --ink-mid:      #444444;
          --ink-light:    #888888;
          --ink-xlight:   #bbbbbb;
          --border:       #e8e8e8;
          --border-dark:  #d0d0d0;
          --green:        #16a34a;
          --yellow:       #ca8a04;
          --red:          #dc2626;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--ink); overflow-x: hidden; line-height: 1.7; }
        .nav-a { font-size: 13px; color: var(--ink-mid); text-decoration: none; transition: color .15s; }
        .nav-a:hover { color: var(--ink); }
        .nav-a.active { color: var(--ink); font-weight: 600; }
        .step-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 32px;
          transition: box-shadow .2s, border-color .2s;
        }
        .step-card:hover {
          box-shadow: 0 4px 24px rgba(0,0,0,.06);
          border-color: var(--border-dark);
        }
        .hint-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 20px;
          transition: box-shadow .15s;
        }
        .hint-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.05); }
        @media (max-width: 640px) {
          .step-card { padding: 20px !important; }
          .page-inner { padding: 48px 20px !important; }
          .hints-grid { grid-template-columns: 1fr !important; }
          .nav-wrap { padding: 0 20px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── NAV ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 60,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
        }} className="nav-wrap">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="12" stroke="#2d5be3" strokeWidth="0.8" opacity="0.3" />
              <circle cx="14" cy="14" r="7" stroke="#2d5be3" strokeWidth="0.8" opacity="0.5" />
              <circle cx="14" cy="14" r="2.5" fill="#2d5be3" />
              <circle cx="14" cy="3.5" r="1.2" fill="#2d5be3" opacity="0.6" />
              <line x1="2" y1="14" x2="26" y2="14" stroke="#2d5be3" strokeWidth="0.5" opacity="0.2" />
              <line x1="14" y1="2" x2="14" y2="26" stroke="#2d5be3" strokeWidth="0.5" opacity="0.2" />
            </svg>
            <span style={{ fontFamily: J, fontWeight: 700, fontSize: 15, color: 'var(--ink)', letterSpacing: '-.02em' }}>
              AI観測<span style={{ color: 'var(--accent)' }}>ラボ</span>
            </span>
          </Link>
          <ul style={{ display: 'flex', alignItems: 'center', gap: 24, listStyle: 'none' }}>
            {[['使い方', '/how-to-use', true], ['改善ガイド', '/guide', false], ['FAQ', '/faq', false], ['ブログ', 'https://blog.ai-kansoku.com', false]].map(([l, h, active]) => (
              <li key={l}>
                <Link href={h} className={`nav-a${active ? ' active' : ''}`} style={{ fontFamily: N }}>
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── CONTENT ── */}
        <div className="page-inner" style={{ maxWidth: 760, margin: '0 auto', padding: '64px 48px 100px' }}>

          {/* ページヘッダー */}
          <div style={{ marginBottom: 56 }}>
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16,
            }}>
              <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
              How to Use
            </p>
            <h1 style={{ fontFamily: J, fontWeight: 700, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-.03em', color: 'var(--ink)', marginBottom: 12 }}>
              使い方ガイド
            </h1>
            <p style={{ fontFamily: N, fontSize: 14, color: 'var(--ink-light)', fontWeight: 300 }}>
              AI観測ラボの基本的な使い方を解説します
            </p>
          </div>

          {/* ステップ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {steps.map((step) => (
              <div key={step.n} className="step-card">
                {/* ステップヘッダー */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 24 }}>
                  <div style={{
                    flexShrink: 0,
                    width: 44, height: 44,
                    background: 'var(--accent-light)',
                    border: '1px solid rgba(45,91,227,0.2)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: M, fontWeight: 500, fontSize: 13, color: 'var(--accent)' }}>{step.n}</span>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: J, fontWeight: 700, fontSize: 18, color: 'var(--ink)', letterSpacing: '-.02em', marginBottom: 4 }}>
                      {step.title}
                    </h2>
                    <p style={{ fontFamily: N, fontSize: 13, color: 'var(--ink-light)', fontWeight: 300 }}>{step.desc}</p>
                  </div>
                </div>
                {/* コンテンツ */}
                {step.content}
              </div>
            ))}
          </div>

          {/* ヒント */}
          <div style={{ marginTop: 48, background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16,
            }}>
              <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
              Tips
            </p>
            <h3 style={{ fontFamily: J, fontWeight: 700, fontSize: 20, color: 'var(--ink)', letterSpacing: '-.02em', marginBottom: 24 }}>
              活用のヒント
            </h3>
            <div className="hints-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {hints.map(({ icon, title, desc }) => (
                <div key={title} className="hint-card">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{icon}</span>
                    <div>
                      <p style={{ fontFamily: J, fontWeight: 600, fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>{title}</p>
                      <p style={{ fontFamily: N, fontSize: 12, color: 'var(--ink-light)', lineHeight: 1.7, fontWeight: 300 }}>{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <Link href="/" style={{
              display: 'inline-block',
              fontFamily: J, fontWeight: 600, fontSize: 14,
              background: 'var(--accent)', color: '#fff',
              padding: '13px 32px', borderRadius: 8,
              textDecoration: 'none',
              transition: 'opacity .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              今すぐ診断を始める →
            </Link>
            <p style={{ fontFamily: N, fontSize: 13, color: 'var(--ink-xlight)', marginTop: 14 }}>
              わからないことがあれば{' '}
              <Link href="/faq" style={{ color: 'var(--accent)', textDecoration: 'none' }}>FAQ</Link>
              {' '}をご覧ください
            </p>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-sub)' }}>
          <div style={{
            maxWidth: 1080, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '24px 48px', flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)' }}>© 2026 AI観測ラボ</span>
            <ul style={{ display: 'flex', gap: 20, listStyle: 'none', flexWrap: 'wrap' }}>
              {[['改善ガイド', '/guide'], ['FAQ', '/faq'], ['使い方', '/how-to-use'], ['ブログ', 'https://blog.ai-kansoku.com']].map(([l, h]) => (
                <li key={l}>
                  <Link href={h} className="nav-a" style={{ fontFamily: N, fontSize: 12 }}>{l}</Link>
                </li>
              ))}
            </ul>
          </div>
        </footer>

      </div>
    </>
  );
}