'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const J = "'Plus Jakarta Sans', sans-serif";
const M = "'DM Mono', monospace";
const N = "'Noto Sans JP', sans-serif";

// ジッピー推奨：改善インパクト順
const guides = [
  {
    id: 'robots-txt',
    icon: '🤖',
    title: 'robots.txt の設定',
    description: 'AIクローラーを許可するrobots.txtの書き方',
    level: 'high',
    quick: `\`\`\`
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://example.com/sitemap.xml
\`\`\``,
    detail: `## 特定ページだけ拒否する場合

\`\`\`
User-agent: GPTBot
Allow: /
Disallow: /admin/
Disallow: /private/
\`\`\`

## 確認方法

ブラウザで \`https://yourdomain.com/robots.txt\` にアクセスして内容を確認してください。

## よくある間違い

\`\`\`
# ❌ 間違い：全クローラーを拒否してから個別許可は効果なし
User-agent: *
Disallow: /

User-agent: GPTBot
Allow: /

# ✅ 正しい：個別に設定する
User-agent: GPTBot
Allow: /
\`\`\``,
  },
  {
    id: 'structured-data',
    icon: '📊',
    title: '構造化データの実装',
    description: 'JSON-LDでAIに情報を正確に伝える',
    level: 'high',
    quick: `\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "あなたのサイト名",
  "url": "https://example.com",
  "description": "サイトの説明文"
}
</script>
\`\`\``,
    detail: `## よく使われるスキーマタイプ

### Article（記事ページ）
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "記事のタイトル",
  "author": { "@type": "Person", "name": "著者名" },
  "datePublished": "2026-01-15",
  "image": "https://example.com/image.jpg"
}
\`\`\`

### Organization（会社・組織）
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "会社名",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}
\`\`\`

### Product（製品・サービス）
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "製品名",
  "offers": { "@type": "Offer", "price": "9800", "priceCurrency": "JPY" }
}
\`\`\`

## 検証ツール
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)`,
  },
  {
    id: 'sitemap',
    icon: '🗺️',
    title: 'sitemap.xml の作成',
    description: 'クローラーにページ構造を伝える',
    level: 'high',
    quick: `\`\`\`xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-01-23</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/blog</loc>
    <lastmod>2026-01-20</lastmod>
    <priority>0.8</priority>
  </url>
</urlset>
\`\`\``,
    detail: `## robots.txt にも追記する

\`\`\`
Sitemap: https://example.com/sitemap.xml
\`\`\`

## WordPress の場合

Yoast SEO または Rank Math を導入すると自動生成されます。

## Next.js の場合

\`\`\`js
// app/sitemap.js
export default function sitemap() {
  return [
    { url: 'https://example.com', lastModified: new Date() },
    { url: 'https://example.com/blog', lastModified: new Date() },
  ]
}
\`\`\``,
  },
  {
    id: 'llms-txt',
    icon: '📝',
    title: 'llms.txt の作成',
    description: 'AI専用のサイトマップを作る',
    level: 'high',
    quick: `\`\`\`markdown
# あなたのサイト名

> サイトの簡潔な説明（1〜2文）

## Main Sections

- [ホーム](https://example.com/): トップページ
- [ブログ](https://example.com/blog/): 記事一覧
- [サービス](https://example.com/services/): サービス紹介

## Contact

- Email: info@example.com
\`\`\``,
    detail: `## llms.txt とは

AIがサイトを効率的に理解するための新しいファイル形式です。サイトのルート（example.com/llms.txt）に配置します。

## 詳細な例

\`\`\`markdown
# AI観測ラボ

> AIクローラーの訪問を可視化・分析するツール

## About

このサイトはChatGPT、Claude、PerplexityなどのAIが
あなたのサイトをどう見ているかを診断します。

## Key Content

### 人気記事
- [robots.txtの書き方](https://example.com/blog/robots-txt)
- [llms.txtとは](https://example.com/blog/llms-txt)
\`\`\`

## ポイント

- Markdown形式で書く
- 重要なページへのリンクを含める
- 定期的に更新する（月1回推奨）`,
  },
  {
    id: 'meta-tags',
    icon: '🏷️',
    title: 'メタタグの最適化',
    description: 'title・description・OGPの設定',
    level: 'high',
    quick: `\`\`\`html
<head>
  <title>ページタイトル（30〜60文字）</title>
  <meta name="description" content="説明文（50〜160文字）" />
  <meta property="og:title" content="ページタイトル" />
  <meta property="og:description" content="説明文" />
  <meta property="og:image" content="https://example.com/ogp.png" />
  <meta property="og:url" content="https://example.com" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
\`\`\``,
    detail: `## OGP画像のサイズ

- 推奨：**1200 × 630px**
- 最小：600 × 315px
- 形式：PNG または JPG

## 確認ツール

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [OGP確認](https://www.opengraph.xyz/)

## Next.js の場合

\`\`\`js
// app/layout.js
export const metadata = {
  title: 'サイト名',
  description: '説明文',
  openGraph: {
    images: ['/ogp.png'],
  },
}
\`\`\``,
  },
  {
    id: 'semantic-html',
    icon: '🏗️',
    title: 'セマンティックHTMLの実装',
    description: '正しいHTML要素でコンテンツを構造化',
    level: 'high',
    quick: `\`\`\`html
<body>
  <header>
    <nav>ナビゲーション</nav>
  </header>

  <main>
    <article>
      <h1>ページタイトル</h1>
      <section>
        <h2>セクション見出し</h2>
        <p>本文...</p>
      </section>
    </article>
  </main>

  <footer>フッター</footer>
</body>
\`\`\``,
    detail: `## 見出し階層のルール

\`\`\`html
<!-- ✅ 正しい -->
<h1>ページタイトル</h1>
  <h2>大見出し</h2>
    <h3>中見出し</h3>

<!-- ❌ 間違い（h2を飛ばしている） -->
<h1>ページタイトル</h1>
  <h3>いきなりh3</h3>
\`\`\`

## 主要なセマンティックタグ

| タグ | 用途 |
|------|------|
| \`<header>\` | ヘッダー |
| \`<nav>\` | ナビゲーション |
| \`<main>\` | メインコンテンツ（1ページ1つ） |
| \`<article>\` | 独立したコンテンツ（記事など） |
| \`<section>\` | テーマごとのグループ |
| \`<aside>\` | 補足情報・サイドバー |
| \`<footer>\` | フッター |`,
  },
  {
    id: 'mobile',
    icon: '📱',
    title: 'モバイル対応',
    description: 'viewport設定とレスポンシブデザイン',
    level: 'high',
    quick: `\`\`\`html
<!-- 必須：viewportメタタグ -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

\`\`\`css
/* レスポンシブ対応の基本 */
img { max-width: 100%; height: auto; }

@media (max-width: 768px) {
  .container { padding: 16px; }
  h1 { font-size: 1.8rem; }
}
\`\`\``,
    detail: `## テスト方法

1. Chrome DevTools（F12）を開く
2. デバイスツールバー（Ctrl+Shift+M）をクリック
3. iPhone / Android など各サイズで確認

## Flexboxで簡単レスポンシブ

\`\`\`css
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.item {
  flex: 1 1 300px; /* 最小幅300px、自動折り返し */
}
\`\`\`

## タップ領域の確保

\`\`\`css
/* ボタンは最低44×44px */
button {
  min-height: 44px;
  padding: 12px 24px;
}
\`\`\`

## 確認ツール
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)`,
  },
  {
    id: 'performance',
    icon: '⚡',
    title: 'パフォーマンスの最適化',
    description: '画像最適化とリソース読み込みの改善',
    level: 'medium',
    quick: `\`\`\`html
<!-- 画像の遅延読み込み -->
<img src="image.jpg" alt="説明" loading="lazy" width="800" height="600">

<!-- スクリプトの非同期読み込み -->
<script src="script.js" defer></script>

<!-- 外部リソースへの事前接続 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
\`\`\``,
    detail: `## 画像フォーマット

\`\`\`html
<!-- WebP を優先、非対応ブラウザは JPG -->
<picture>
  <source type="image/webp" srcset="image.webp">
  <img src="image.jpg" alt="説明">
</picture>
\`\`\`

変換ツール：[Squoosh](https://squoosh.app/)（WebPに変換できる無料ツール）

## フォントの最適化

\`\`\`css
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/font.woff2') format('woff2');
  font-display: swap; /* フォールバックを先に表示 */
}
\`\`\`

## 目標スコア（PageSpeed Insights）

| 指標 | 目標値 |
|------|--------|
| Performance | 90点以上 |
| LCP | 2.5秒以内 |
| CLS | 0.1以下 |

計測：[PageSpeed Insights](https://pagespeed.web.dev/)`,
  },
  {
    id: 'canonical',
    icon: '🔗',
    title: 'Canonical URLの設定',
    description: '重複コンテンツ対策',
    level: 'medium',
    quick: `\`\`\`html
<!-- 各ページの<head>内に追加 -->
<link rel="canonical" href="https://example.com/page" />
\`\`\``,
    detail: `## なぜ必要か

同じコンテンツが複数のURLで表示される場合（URLパラメータなど）、正規URLをAI・検索エンジンに伝えます。

\`\`\`
# 同じページの複数URL
https://example.com/blog/article         ← 正規URL
https://example.com/blog/article?utm_source=twitter
https://example.com/blog/article?page=1
\`\`\`

## Next.js の場合

\`\`\`js
export const metadata = {
  alternates: {
    canonical: 'https://example.com/page',
  },
}
\`\`\``,
  },
];

const levelConfig = {
  high:   { label: '高優先度', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  medium: { label: '中優先度', color: '#ca8a04', bg: '#fefce8', border: '#fde68a' },
  low:    { label: '低優先度', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

// マークダウン用コードブロック（コピーボタン付き）
function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{ position: 'relative', margin: '12px 0' }}>
      <button
        onClick={copy}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 1,
          fontFamily: M, fontSize: 11, fontWeight: 500,
          background: copied ? '#dcfce7' : '#fff',
          color: copied ? 'var(--green)' : 'var(--ink-light)',
          border: `1px solid ${copied ? '#bbf7d0' : 'var(--border-dark)'}`,
          padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
          transition: 'all .2s',
        }}
      >
        {copied ? '✓ コピー済み' : '📋 コピー'}
      </button>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneLight}
        customStyle={{
          borderRadius: 8,
          fontSize: 13,
          border: '1px solid var(--border)',
          paddingTop: 36,
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
    ) : (
      <code style={{
        fontFamily: M, fontSize: 12,
        background: 'var(--bg-sub)', border: '1px solid var(--border)',
        padding: '1px 6px', borderRadius: 4, color: 'var(--accent)',
      }} {...props}>{children}</code>
    );
  },
  h2({ children }) {
    return <h2 style={{ fontFamily: J, fontWeight: 700, fontSize: 16, color: 'var(--ink)', margin: '24px 0 12px', letterSpacing: '-.02em' }}>{children}</h2>;
  },
  h3({ children }) {
    return <h3 style={{ fontFamily: J, fontWeight: 600, fontSize: 14, color: 'var(--ink-mid)', margin: '16px 0 8px' }}>{children}</h3>;
  },
  p({ children }) {
    return <p style={{ fontFamily: N, fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.85, margin: '8px 0', fontWeight: 300 }}>{children}</p>;
  },
  ul({ children }) {
    return <ul style={{ paddingLeft: 20, margin: '8px 0' }}>{children}</ul>;
  },
  li({ children }) {
    return <li style={{ fontFamily: N, fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.85, fontWeight: 300 }}>{children}</li>;
  },
  a({ href, children }) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{children}</a>;
  },
  table({ children }) {
    return (
      <div style={{ overflowX: 'auto', margin: '12px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: N }}>{children}</table>
      </div>
    );
  },
  th({ children }) {
    return <th style={{ padding: '8px 12px', background: 'var(--bg-sub)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--ink)', textAlign: 'left' }}>{children}</th>;
  },
  td({ children }) {
    return <td style={{ padding: '8px 12px', border: '1px solid var(--border)', color: 'var(--ink-light)' }}>{children}</td>;
  },
};

// ガイドカード
function GuideCard({ guide, openGuide, setOpenGuide }) {
  const open = openGuide === guide.id;
  const [showDetail, setShowDetail] = useState(false);
  const lv = levelConfig[guide.level] || levelConfig.medium;

  return (
    <div
      id={guide.id}
      style={{
        background: '#fff',
        border: `1px solid ${open ? 'var(--border-dark)' : 'var(--border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'box-shadow .2s, border-color .2s',
        boxShadow: open ? '0 4px 24px rgba(0,0,0,.07)' : 'none',
        scrollMarginTop: 80,
      }}
    >
      {/* ヘッダー */}
      <button
        onClick={() => setOpenGuide(open ? null : guide.id)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 16,
          padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{guide.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: J, fontWeight: 700, fontSize: 15, color: 'var(--ink)', letterSpacing: '-.02em' }}>
              {guide.title}
            </span>
            <span style={{
              fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.08em',
              padding: '2px 8px', borderRadius: 100,
              background: lv.bg, color: lv.color, border: `1px solid ${lv.border}`,
              flexShrink: 0,
            }}>{lv.label}</span>
          </div>
          <p style={{ fontFamily: N, fontSize: 12, color: 'var(--ink-xlight)', fontWeight: 300 }}>{guide.description}</p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none" style={{
            flexShrink: 0, transition: 'transform .25s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M3 6l5 5 5-5" stroke="var(--ink-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* コンテンツ */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '24px 24px 20px' }}>
          {/* 最短実装 */}
          <div style={{ marginBottom: 20 }}>
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.15em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10,
            }}>
              <span style={{ width: 14, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
              最短実装
            </p>
            <ReactMarkdown components={mdComponents}>{guide.quick}</ReactMarkdown>
          </div>

          {/* 詳細解説 */}
          <div>
            <button
              onClick={() => setShowDetail(!showDetail)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: J, fontWeight: 600, fontSize: 12, color: 'var(--ink-light)',
                background: 'var(--bg-sub)', border: '1px solid var(--border)',
                padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
                transition: 'color .15s',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transition: 'transform .2s', transform: showDetail ? 'rotate(90deg)' : 'rotate(0)' }}>
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {showDetail ? '詳細を閉じる' : '詳細解説を見る'}
            </button>

            {showDetail && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <ReactMarkdown components={mdComponents}>{guide.detail}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuidePage() {
  const router = useRouter();
  const [openGuide, setOpenGuide] = useState(null);

  const handleTocClick = (id) => {
    setOpenGuide(id);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <>
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
        body { background: var(--bg); color: var(--ink); overflow-x: hidden; }
        .nav-a { font-size: 13px; color: var(--ink-mid); text-decoration: none; transition: color .15s; font-family: ${N}; }
        .nav-a:hover { color: var(--ink); }
        .toc-link { display: flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 6px; text-decoration: none; font-family: ${N}; font-size: 13px; color: var(--ink-mid); transition: background .15s, color .15s; }
        .toc-link:hover { background: var(--bg-sub); color: var(--ink); }
        @media (max-width: 640px) {
          .page-inner { padding: 40px 20px 80px !important; }
          .nav-wrap { padding: 0 20px !important; }
          .toc-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        <div className="page-inner" style={{ maxWidth: 760, margin: '0 auto', padding: '64px 48px 100px' }}>

          {/* ページヘッダー */}
          <div style={{ marginBottom: 40 }}>
            <p style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em',
              color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16,
            }}>
              <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
              Improvement Guide
            </p>
            <h1 style={{ fontFamily: J, fontWeight: 700, fontSize: 'clamp(26px,4vw,40px)', letterSpacing: '-.03em', color: 'var(--ink)', marginBottom: 10 }}>
              改善ガイド
            </h1>
            <p style={{ fontFamily: N, fontSize: 14, color: 'var(--ink-light)', fontWeight: 300 }}>
              各項目の具体的な改善方法を解説します。カードをクリックして開いてください。
            </p>
          </div>

          {/* 目次 */}
          <div style={{
            background: 'var(--bg-sub)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 20, marginBottom: 40,overflow: 'hidden'
          }}>
            <p style={{ fontFamily: M, fontSize: 10, color: 'var(--ink-xlight)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14 }}>目次</p>
            <div className="toc-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', overflow: 'hidden', gap: 4 }}>
              {guides.map(g => {
                const lv = levelConfig[g.level] || levelConfig.medium;
                return (
                  <button
                    key={g.id}
                    onClick={() => handleTocClick(g.id)}
                    className="toc-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: '1rem' }}>{g.icon}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: lv.color, flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ガイド一覧 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {guides.map(g => <GuideCard key={g.id} guide={g} openGuide={openGuide} setOpenGuide={setOpenGuide} />)}
          </div>

          {/* 戻るボタン */}
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <button
              onClick={() => router.back()}
              style={{
                fontFamily: J, fontWeight: 600, fontSize: 14,
                background: 'var(--accent)', color: '#fff',
                padding: '13px 32px', borderRadius: 8,
                border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ← 診断結果に戻る
            </button>
          </div>
        </div>

        {/* FOOTER */}
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