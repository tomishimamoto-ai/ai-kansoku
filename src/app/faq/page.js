'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';

const J = "'Plus Jakarta Sans', sans-serif";
const M = "'DM Mono', monospace";
const N = "'Noto Sans JP', sans-serif";

const faqs = [
  {
    category: "基本的な使い方",
    questions: [
      { q: "AI観測ラボとは何ですか？", a: "AI観測ラボは、あなたのウェブサイトがChatGPT、Claude、Perplexityなど主要AIにどう見えているかを診断するツールです。robots.txt、sitemap.xml、構造化データなど8項目を無料で分析し、改善点を提案します。" },
      { q: "利用料金はかかりますか？", a: "基本的な診断機能は完全無料です。登録も不要で、URLを入力するだけですぐに診断できます。将来的には、より詳細な分析やモニタリング機能を含む有料プランを提供予定です。" },
      { q: "診断にどのくらい時間がかかりますか？", a: "通常10〜30秒程度で診断が完了します。サイトの規模やサーバーの応答速度によって多少前後する場合があります。" },
      { q: "診断結果のデータは保存されますか？", a: "診断結果はあなたのブラウザ（LocalStorage）にのみ保存され、サーバーには送信されません。プライバシーを重視した設計になっています。ブラウザのキャッシュをクリアすると履歴も削除されます。" },
    ],
  },
  {
    category: "診断内容について",
    questions: [
      { q: "どのような項目を診断しますか？", a: "以下の8項目を診断します：\n\n1. 構造化データ（JSON-LD）\n2. robots.txt\n3. sitemap.xml\n4. llms.txt\n5. メタタグ（title、description、OGP）\n6. セマンティックHTML\n7. モバイル対応\n8. パフォーマンス" },
      { q: "スコアはどのように計算されますか？", a: "各項目を0〜100点で評価し、その平均値が総合スコアとなります。80点以上は優秀、60〜79点は良好、59点以下は改善が必要と判断されます。" },
      { q: "llms.txtとは何ですか？", a: "llms.txtは、AI専用のサイトマップファイルです。AIがあなたのサイトを効率的にクロールできるよう、重要なページや情報を構造化して提供します。まだ新しい規格ですが、今後重要性が増すと予想されています。" },
      { q: "診断結果が低いとどうなりますか？", a: "スコアが低い場合、AIがあなたのサイトを正確に理解できず、検索結果や要約に表示されにくくなる可能性があります。改善ガイドを参考に、各項目を最適化することをおすすめします。" },
    ],
  },
  {
    category: "トラブルシューティング",
    questions: [
      { q: "「サイトが見つかりませんでした」と表示されます", a: "以下を確認してください：\n\n• URLが正しいか（https://を含む完全なURL）\n• サイトが実際に公開されているか\n• ファイアウォールでブロックされていないか\n• サーバーが応答しているか" },
      { q: "診断が途中で止まってしまいます", a: "以下を試してください：\n\n• ページをリロードして再度診断\n• 別のブラウザで試す\n• 時間を置いてから再度試す\n• サイトのサーバーが重い場合、タイムアウトする可能性があります" },
      { q: "自分のサイトで実装したはずの機能が検出されません", a: "以下を確認してください：\n\n• HTMLが正しく出力されているか\n• JavaScriptで動的に生成される内容は検出されない場合があります\n• robots.txtで診断ツールがブロックされていないか\n• キャッシュをクリアしてから再度診断" },
      { q: "スマホで診断できますか？", a: "はい、スマホやタブレットでも診断可能です。レスポンシブデザインに対応しているため、あらゆるデバイスで快適にご利用いただけます。" },
    ],
  },
  {
    category: "改善について",
    questions: [
      { q: "改善ガイドに従えば本当にスコアが上がりますか？", a: "はい。改善ガイドは実際にAIクローラーが評価する項目に基づいています。指示に従って実装すれば、確実にスコアが向上します。" },
      { q: "どの項目から改善すべきですか？", a: "診断結果の「改善ポイント」に表示される高優先度の項目から取り組むことをおすすめします。特にrobots.txtとsitemap.xmlは基本中の基本なので、最優先で対応しましょう。" },
      { q: "改善後、どのくらいで効果が出ますか？", a: "改善内容によりますが、robots.txtやsitemap.xmlの設定は数日〜1週間程度でAIクローラーに反映されます。構造化データは即座に効果が現れる場合もあります。定期的に再診断して変化を確認しましょう。" },
      { q: "技術的な知識がなくても改善できますか？", a: "はい。改善ガイドでは、コピー＆ペーストで使えるコード例を多数掲載しています。HTMLの基礎知識があれば、ほとんどの改善を自分で実装できます。" },
    ],
  },
  {
    category: "その他",
    questions: [
      { q: "競合サイトを診断できますか？", a: "はい、公開されているサイトであれば、どのサイトでも診断可能です。競合分析にもご活用ください。" },
      { q: "診断結果をチームで共有できますか？", a: "診断結果ページのURLを共有することで、チームメンバーと結果を共有できます。" },
      { q: "定期的に診断すべきですか？", a: "はい。サイトを更新したタイミングや、月1回程度の定期診断をおすすめします。診断履歴機能でスコアの推移を確認できます。" },
      { q: "フィードバックや要望を送りたいです", a: "Twitter（@your_twitter）までお気軽にご連絡ください。皆様のご意見をもとに、サービスを改善していきます。" },
    ],
  },
];

// FAQ構造化データ（全質問）
const schemaData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.flatMap(sec =>
    sec.questions.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a.replace(/\n/g, ' ') },
    }))
  ),
};

// 人気質問（固定）
const popular = [
  { q: "AI観測ラボとは何ですか？", a: "AI観測ラボは、あなたのウェブサイトがChatGPT、Claude、Perplexityなど主要AIにどう見えているかを診断するツールです。robots.txt、sitemap.xml、構造化データなど8項目を無料で分析し、改善点を提案します。" },
  { q: "利用料金はかかりますか？", a: "基本的な診断機能は完全無料です。登録も不要で、URLを入力するだけですぐに診断できます。" },
  { q: "llms.txtとは何ですか？", a: "llms.txtは、AI専用のサイトマップファイルです。AIがあなたのサイトを効率的にクロールできるよう、重要なページや情報を構造化して提供します。" },
];

// ---- 単体アコーディオン ----
function QItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0', gap: 16, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontFamily: J, fontWeight: 600, fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{q}</span>
        <span style={{
          flexShrink: 0, width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', border: '1.5px solid var(--border-dark)',
          fontFamily: M, fontSize: 16, color: 'var(--ink-mid)',
          transition: 'transform .2s, background .2s',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          background: open ? 'var(--accent-light)' : '#fff',
        }}>+</span>
      </button>
      {open && (
        <div style={{
          paddingBottom: 18,
          fontFamily: N, fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.85, whiteSpace: 'pre-line',
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ---- カテゴリアコーディオン ----
function CategoryBlock({ category, questions, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.12em',
            color: 'var(--accent)', background: 'var(--accent-light)',
            padding: '3px 8px', borderRadius: 4,
          }}>{String(questions.length).padStart(2, '0')}</span>
          <span style={{ fontFamily: J, fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{category}</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transition: 'transform .25s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <path d="M3 6l5 5 5-5" stroke="var(--ink-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 24px 8px', borderTop: '1px solid var(--border)' }}>
          {questions.map((item, i) => <QItem key={i} {...item} />)}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const kw = search.toLowerCase();
    const results = [];
    faqs.forEach(sec => {
      sec.questions.forEach(item => {
        if (item.q.toLowerCase().includes(kw) || item.a.toLowerCase().includes(kw)) {
          results.push(item);
        }
      });
    });
    return results;
  }, [search]);

  return (
    <>
      {/* FAQPage構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #ffffff; --bg-sub: #f7f7f5; --bg-dark: #16161a;
          --accent: #2d5be3; --accent-light: #e8edfb; --accent-mid: #6b8ef0;
          --ink: #111111; --ink-mid: #444444; --ink-light: #888888; --ink-xlight: #bbbbbb;
          --border: #e8e8e8; --border-dark: #d0d0d0;
          --green: #16a34a; --yellow: #ca8a04; --red: #dc2626;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--ink); overflow-x: hidden; line-height: 1.7; }
        .nav-a { font-size: 13px; color: var(--ink-mid); text-decoration: none; transition: color .15s; font-family: ${N}; }
        .nav-a:hover { color: var(--ink); }
        .nav-a.active { color: var(--ink); font-weight: 600; }
        .search-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        .popular-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 20px 24px; transition: box-shadow .15s, border-color .15s; }
        .popular-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); border-color: var(--border-dark); }
        @media (max-width: 640px) {
          .page-inner { padding: 40px 20px 80px !important; }
          .nav-wrap { padding: 0 20px !important; }
          .popular-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* ── NAV ── */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 48px', height: 60,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
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
            {[['使い方', '/how-to-use', false], ['改善ガイド', '/guide', false], ['FAQ', '/faq', false], ['ブログ', 'https://blog.ai-kansoku.com', false]].map(([l, h, active]) => (
              <li key={l}><Link href={h} className={`nav-a${active ? ' active' : ''}`}>{l}</Link></li>
            ))}
          </ul>
        </nav>

        {/* ── CONTENT ── */}
        <div className="page-inner" style={{ maxWidth: 760, margin: '0 auto', padding: '64px 48px 100px' }}>

          {/* ページヘッダー */}
          <div style={{ marginBottom: 40 }}>
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16,
            }}>
              <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
              FAQ
            </p>
            <h1 style={{ fontFamily: J, fontWeight: 700, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-.03em', color: 'var(--ink)', marginBottom: 10 }}>
              よくある質問
            </h1>
            <p style={{ fontFamily: N, fontSize: 14, color: 'var(--ink-light)', fontWeight: 300 }}>
              AI観測ラボに関する疑問を解決します
            </p>
          </div>

          {/* 検索 */}
          <div style={{ position: 'relative', marginBottom: 48 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="var(--ink-xlight)" strokeWidth="1.5" />
              <path d="M10.5 10.5l2.5 2.5" stroke="var(--ink-xlight)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="質問を検索… (例: robots.txt)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '13px 16px 13px 42px',
                fontFamily: N, fontSize: 14, color: 'var(--ink)',
                background: '#fff', border: '1.5px solid var(--border)',
                borderRadius: 8, transition: 'border-color .2s, box-shadow .2s',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: M, fontSize: 18, color: 'var(--ink-xlight)', lineHeight: 1,
              }}>×</button>
            )}
          </div>

          {/* 検索結果 */}
          {filtered !== null ? (
            <div style={{ marginBottom: 48 }}>
              <p style={{ fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)', marginBottom: 16, letterSpacing: '.08em' }}>
                {filtered.length} 件の結果
              </p>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-xlight)', fontFamily: N, fontSize: 14 }}>
                  該当する質問が見つかりませんでした
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '0 24px 8px' }}>
                  {filtered.map((item, i) => <QItem key={i} {...item} />)}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 人気の質問 */}
              <div style={{ marginBottom: 48 }}>
                <p style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em',
                  color: 'var(--ink-xlight)', textTransform: 'uppercase', marginBottom: 16,
                }}>
                  <span style={{ width: 16, height: 1, background: 'var(--ink-xlight)', display: 'inline-block' }} />
                  よく見られている質問
                </p>
                <div className="popular-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {popular.map((item, i) => (
                    <PopularCard key={i} {...item} />
                  ))}
                </div>
              </div>

              {/* カテゴリ別アコーディオン */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {faqs.map((sec, i) => (
                  <CategoryBlock key={i} {...sec} defaultOpen={i === 0} />
                ))}
              </div>
            </>
          )}

          {/* CTA */}
          <div style={{
            marginTop: 48, background: 'var(--bg-sub)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 32, textAlign: 'center',
          }}>
            <p style={{ fontFamily: J, fontWeight: 700, fontSize: 18, color: 'var(--ink)', marginBottom: 8 }}>
              まだ疑問が解決しませんか？
            </p>
            <p style={{ fontFamily: N, fontSize: 13, color: 'var(--ink-light)', marginBottom: 24 }}>
              まずは実際に診断してみましょう
            </p>
            <Link href="/" style={{
              display: 'inline-block', fontFamily: J, fontWeight: 600, fontSize: 14,
              background: 'var(--accent)', color: '#fff', padding: '13px 32px',
              borderRadius: 8, textDecoration: 'none',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              今すぐ無料で診断する →
            </Link>
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
                <li key={l}><Link href={h} className="nav-a" style={{ fontSize: 12 }}>{l}</Link></li>
              ))}
            </ul>
          </div>
        </footer>

      </div>
    </>
  );
}

// 人気カード（アコーディオン）
function PopularCard({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="popular-card" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
      <p style={{ fontFamily: J, fontWeight: 600, fontSize: 13, color: 'var(--ink)', marginBottom: open ? 10 : 0, lineHeight: 1.5 }}>{q}</p>
      {open && <p style={{ fontFamily: N, fontSize: 12, color: 'var(--ink-light)', lineHeight: 1.8 }}>{a}</p>}
      <p style={{ fontFamily: M, fontSize: 11, color: 'var(--accent)', marginTop: 8 }}>{open ? '閉じる' : '見る →'}</p>
    </div>
  );
}