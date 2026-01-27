'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GuidePage() {
  const router = useRouter();
  const guides = [
    {
      id: 'structured-data',
      icon: '📊',
      title: '構造化データの実装',
      description: 'JSON-LDでAIに情報を正確に伝える',
      content: `
# 構造化データ（JSON-LD）の実装

構造化データは、AIや検索エンジンがあなたのサイトを正確に理解するための重要な要素です。

## 基本的な実装

HTMLの<head>タグ内に以下のようなJSON-LDを追加します。

\`\`\`html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "AI観測ラボ",
  "url": "https://example.com",
  "description": "AIクロールを可視化するツール",
  "author": {
    "@type": "Organization",
    "name": "あなたの会社名"
  }
}
</script>
\`\`\`

## よく使われるスキーマタイプ

### 1. WebSite（サイト全体）
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "サイト名",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://example.com/search?q={search_term}",
    "query-input": "required name=search_term"
  }
}
\`\`\`

### 2. Article（記事）
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "記事のタイトル",
  "author": {
    "@type": "Person",
    "name": "著者名"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-20",
  "image": "https://example.com/image.jpg"
}
\`\`\`

### 3. Organization（組織）
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "会社名",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+81-3-1234-5678",
    "contactType": "customer service"
  }
}
\`\`\`

### 4. Product（製品）
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "製品名",
  "image": "https://example.com/product.jpg",
  "description": "製品の説明",
  "brand": {
    "@type": "Brand",
    "name": "ブランド名"
  },
  "offers": {
    "@type": "Offer",
    "price": "9800",
    "priceCurrency": "JPY"
  }
}
\`\`\`

## 重要なポイント

✅ **複数のスキーマを組み合わせる**: WebSite + Organization など
✅ **必須プロパティを含める**: 各タイプに応じた必須項目
✅ **正確な情報**: 実際のコンテンツと一致させる
✅ **テストする**: Google Rich Results Testで検証

## 検証ツール

- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/
      `,
      level: 'high'
    },
    {
      id: 'robots-txt',
      icon: '🤖',
      title: 'robots.txt の設定方法',
      description: 'AIクローラーを許可するrobots.txtの書き方',
      content: `
# AIクローラーを許可する robots.txt の設定

サイトのルートディレクトリ（example.com/robots.txt）に以下を追加してください。

\`\`\`
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: cohere-ai
Allow: /
\`\`\`

これで主要なAIクローラーがあなたのサイトをクロールできるようになります。
      `,
      level: 'high'
    },
    {
      id: 'llms-txt',
      icon: '📝',
      title: 'llms.txt の作成方法',
      description: 'AI専用のサイトマップを作る',
      content: `
# llms.txt の作成方法

llms.txtは、AIにサイト構造を伝える新しい標準です。

サイトのルートディレクトリ（example.com/llms.txt）に以下のような形式で作成してください。

\`\`\`
# AI観測ラボ
https://example.com

## 主要ページ
- ホーム: https://example.com/
- 診断ツール: https://example.com/diagnose
- ブログ: https://example.com/blog

## サイト概要
AI観測ラボは、AIクロールを可視化するツールです。
\`\`\`

Markdown形式で書くことで、AIが理解しやすくなります。

## 詳細な例

\`\`\`markdown
# あなたのサイト名

> サイトの簡潔な説明（1-2文）

## About

このサイトについての詳しい説明。
主なターゲット層や提供している価値を記述します。

## Main Sections

- [ホーム](https://example.com/): トップページ
- [ブログ](https://example.com/blog/): 記事一覧
- [プロダクト](https://example.com/products/): 製品情報
- [お問い合わせ](https://example.com/contact/): 連絡先

## Key Content

### 人気記事
- [記事タイトル1](https://example.com/article-1)
- [記事タイトル2](https://example.com/article-2)

### 重要ページ
- [会社概要](https://example.com/about)
- [サービス](https://example.com/services)

## Contact

- Email: info@example.com
- Twitter: @example
- GitHub: github.com/example
\`\`\`

## 重要なポイント

✅ **簡潔に書く**: AIは要点を素早く理解します
✅ **構造化する**: 見出し(#, ##)やリストで整理
✅ **リンクを含める**: 主要ページへの直接リンク
✅ **Markdown形式**: 読みやすく構造化された形式
      `,
      level: 'high'
    },
    {
      id: 'meta-tags',
      icon: '🏷️',
      title: 'メタタグの最適化',
      description: 'title、description、OGP、Twitter Cardの設定',
      content: `
# メタタグの最適化

メタタグは、検索エンジンやSNSでの表示、AIの理解に重要な役割を果たします。

## 基本メタタグ

\`\`\`html
<head>
  <!-- タイトルタグ（10-60文字推奨） -->
  <title>AI観測ラボ - AIクロールを可視化するツール</title>
  
  <!-- 説明文（50-160文字推奨） -->
  <meta name="description" content="あなたのサイトがAIにどう見えているかを診断。robots.txt、sitemap.xml、構造化データなど8項目を分析します。" />
  
  <!-- 文字コード -->
  <meta charset="UTF-8" />
  
  <!-- ビューポート -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
\`\`\`

## OGP (Open Graph Protocol)

SNSでシェアされた時の表示を制御します。

\`\`\`html
<!-- 基本的なOGPタグ -->
<meta property="og:title" content="AI観測ラボ" />
<meta property="og:description" content="AIクロールを可視化するツール" />
<meta property="og:image" content="https://example.com/ogp-image.png" />
<meta property="og:url" content="https://example.com" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="AI観測ラボ" />
\`\`\`

### OGP画像の推奨サイズ
- **1200 x 630 px** (推奨)
- **最小: 600 x 315 px**
- ファイル形式: PNG, JPG
- ファイルサイズ: 8MB以下（1MB以下推奨）

## Twitter Card

Twitterでの表示を最適化します。

\`\`\`html
<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="AI観測ラボ" />
<meta name="twitter:description" content="AIクロールを可視化するツール" />
<meta name="twitter:image" content="https://example.com/twitter-image.png" />
<meta name="twitter:site" content="@your_twitter" />
<meta name="twitter:creator" content="@your_twitter" />
\`\`\`

### Twitter Cardの種類
- **summary**: 小さい画像（推奨サイズ: 120x120px）
- **summary_large_image**: 大きい画像（推奨サイズ: 800x418px）

## 重要なポイント

✅ **titleタグ**: 10-60文字（短すぎず長すぎず）
✅ **description**: 50-160文字（検索結果で省略されない長さ）
✅ **OGP画像**: 必ず設定（SNSシェア時の第一印象）
✅ **絶対URL**: 画像パスは必ず絶対URL（https://...）
✅ **各ページで個別設定**: ページごとに適切な内容に

## 検証ツール

- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Open Graph Check: https://www.opengraph.xyz/
      `,
      level: 'high'
    },
    {
      id: 'semantic-html',
      icon: '🏗️',
      title: 'セマンティックHTMLの実装',
      description: '正しいHTML要素でコンテンツを構造化',
      content: `
# セマンティックHTMLの実装

セマンティックHTML（意味のあるHTML）を使うことで、AIや検索エンジンがコンテンツを正確に理解できます。

## 基本的なページ構造

\`\`\`html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>ページタイトル</title>
</head>
<body>
  <!-- ヘッダー -->
  <header>
    <nav>
      <ul>
        <li><a href="/">ホーム</a></li>
        <li><a href="/about">概要</a></li>
      </ul>
    </nav>
  </header>

  <!-- メインコンテンツ -->
  <main>
    <article>
      <h1>記事タイトル</h1>
      <section>
        <h2>セクション1</h2>
        <p>本文...</p>
      </section>
      <section>
        <h2>セクション2</h2>
        <p>本文...</p>
      </section>
    </article>
    
    <aside>
      <h3>関連記事</h3>
      <ul>
        <li><a href="/related-1">関連記事1</a></li>
      </ul>
    </aside>
  </main>

  <!-- フッター -->
  <footer>
    <p>&copy; 2026 あなたのサイト名</p>
  </footer>
</body>
</html>
\`\`\`

## 主要なセマンティックタグ

### header
ページやセクションのヘッダー
\`\`\`html
<header>
  <h1>サイト名</h1>
  <nav>ナビゲーション</nav>
</header>
\`\`\`

### nav
ナビゲーションリンクのグループ
\`\`\`html
<nav>
  <ul>
    <li><a href="/">ホーム</a></li>
    <li><a href="/blog">ブログ</a></li>
  </ul>
</nav>
\`\`\`

### main
ページのメインコンテンツ（1ページに1つのみ）
\`\`\`html
<main>
  <!-- メインコンテンツ -->
</main>
\`\`\`

### article
独立したコンテンツ（記事、ブログ投稿など）
\`\`\`html
<article>
  <h1>記事タイトル</h1>
  <p>本文...</p>
</article>
\`\`\`

### section
テーマごとのコンテンツグループ
\`\`\`html
<section>
  <h2>セクションタイトル</h2>
  <p>内容...</p>
</section>
\`\`\`

### aside
補足的なコンテンツ（サイドバー、関連情報など）
\`\`\`html
<aside>
  <h3>関連記事</h3>
  <ul>...</ul>
</aside>
\`\`\`

### footer
ページやセクションのフッター
\`\`\`html
<footer>
  <p>著作権情報、連絡先など</p>
</footer>
\`\`\`

## 見出し階層の重要性

見出しは必ず階層構造を守りましょう。

✅ **正しい例**
\`\`\`html
<h1>ページタイトル</h1>
  <h2>大見出し1</h2>
    <h3>中見出し1-1</h3>
    <h3>中見出し1-2</h3>
  <h2>大見出し2</h2>
    <h3>中見出し2-1</h3>
\`\`\`

❌ **間違った例**
\`\`\`html
<h1>ページタイトル</h1>
<h3>いきなりh3</h3>  <!-- h2を飛ばしている -->
<h2>後からh2</h2>
\`\`\`

## 重要なポイント

✅ **h1は1ページに1つ**: ページの主題を示す
✅ **見出しレベルを飛ばさない**: h1→h2→h3 の順に
✅ **適切なタグを使う**: divではなくarticle、sectionなど
✅ **ランドマークロール**: header、nav、main、footerを使う

## アクセシビリティ向上

\`\`\`html
<!-- ARIAラベル -->
<nav aria-label="メインナビゲーション">
  <ul>...</ul>
</nav>

<!-- ランドマークロール -->
<div role="navigation">
  <!-- ナビゲーション -->
</div>
\`\`\`
      `,
      level: 'high'
    },
    {
      id: 'mobile-optimization',
      icon: '📱',
      title: 'モバイル対応の実装',
      description: 'viewport設定とレスポンシブデザイン',
      content: `
# モバイル対応の実装

モバイルフレンドリーなサイトは、ユーザーとAIの両方に評価されます。

## viewportメタタグ（必須）

\`\`\`html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
\`\`\`

このタグがないと、モバイルで正しく表示されません。

## レスポンシブデザインの基本

### CSSメディアクエリ

\`\`\`css
/* スマートフォン（〜767px） */
@media (max-width: 767px) {
  .container {
    width: 100%;
    padding: 16px;
  }
  
  .text {
    font-size: 14px;
  }
}

/* タブレット（768px〜1023px） */
@media (min-width: 768px) and (max-width: 1023px) {
  .container {
    width: 750px;
    padding: 24px;
  }
}

/* デスクトップ（1024px〜） */
@media (min-width: 1024px) {
  .container {
    width: 1200px;
    padding: 32px;
  }
}
\`\`\`

### Flexboxレイアウト

\`\`\`css
.container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.item {
  flex: 1 1 300px; /* 最小幅300px */
}

/* スマホでは縦並び */
@media (max-width: 767px) {
  .container {
    flex-direction: column;
  }
}
\`\`\`

### CSS Grid

\`\`\`css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* 自動的にレスポンシブ対応 */
\`\`\`

## フォントサイズの最適化

\`\`\`css
/* 相対単位を使う */
body {
  font-size: 16px; /* ベースサイズ */
}

h1 {
  font-size: 2rem; /* 32px */
}

h2 {
  font-size: 1.5rem; /* 24px */
}

p {
  font-size: 1rem; /* 16px */
}

/* ビューポート単位 */
.hero-title {
  font-size: clamp(24px, 5vw, 48px);
  /* 最小24px、最大48px、通常5vw */
}
\`\`\`

## タッチ操作の最適化

\`\`\`css
/* タップ領域を十分に確保（最低44x44px推奨） */
.button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}

/* タップ時のハイライトを調整 */
button {
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
}

/* スクロールを滑らかに */
html {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}
\`\`\`

## 画像のレスポンシブ対応

\`\`\`html
<!-- 画像を自動リサイズ -->
<img src="image.jpg" alt="説明" style="max-width: 100%; height: auto;">

<!-- picture要素で画面サイズ別に画像を切り替え -->
<picture>
  <source media="(max-width: 767px)" srcset="image-mobile.jpg">
  <source media="(min-width: 768px)" srcset="image-desktop.jpg">
  <img src="image-desktop.jpg" alt="説明">
</picture>
\`\`\`

## 重要なポイント

✅ **viewport必須**: 必ずviewportメタタグを設定
✅ **相対単位を使う**: px より rem、em、% を優先
✅ **タッチ領域**: ボタンは最低44x44px
✅ **テストする**: 実機やChrome DevToolsで確認
✅ **横スクロール禁止**: max-width: 100% で画像を制御

## テスト方法

1. Chrome DevTools（F12）
2. デバイスツールバー（Ctrl+Shift+M）
3. 各デバイスサイズで確認
4. Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
      `,
      level: 'high'
    },
    {
      id: 'performance',
      icon: '⚡',
      title: 'パフォーマンスの最適化',
      description: '画像最適化とリソース読み込みの改善',
      content: `
# パフォーマンスの最適化

ページ速度が速いほど、ユーザー体験とSEOが向上します。

## 画像の最適化

### 遅延読み込み（Lazy Loading）

\`\`\`html
<!-- loading="lazy"を追加するだけ -->
<img src="image.jpg" alt="説明" loading="lazy">
\`\`\`

### 適切なサイズと形式

\`\`\`html
<!-- width/heightを指定してレイアウトシフトを防ぐ -->
<img src="image.jpg" alt="説明" width="800" height="600" loading="lazy">

<!-- WebP形式を優先 -->
<picture>
  <source type="image/webp" srcset="image.webp">
  <img src="image.jpg" alt="説明">
</picture>
\`\`\`

### 次世代フォーマット

- **WebP**: JPGより30%小さい
- **AVIF**: WebPよりさらに小さい
- **ツール**: Squoosh (https://squoosh.app/)

## JavaScriptの最適化

### defer/asyncの使用

\`\`\`html
<!-- defer: DOMの読み込み後に実行 -->
<script src="script.js" defer></script>

<!-- async: 非同期で読み込み、完了次第実行 -->
<script src="analytics.js" async></script>
\`\`\`

### 使い分け

- **defer**: 実行順序が重要な場合（jQuery→プラグイン）
- **async**: 独立したスクリプト（アナリティクス、広告）

## CSSの最適化

### クリティカルCSSのインライン化

\`\`\`html
<head>
  <!-- ファーストビューのCSSをインライン -->
  <style>
    body { margin: 0; font-family: sans-serif; }
    .header { background: #000; padding: 20px; }
  </style>
  
  <!-- その他のCSSは非同期読み込み -->
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
</head>
\`\`\`

## リソースヒント

### Preconnect（事前接続）

\`\`\`html
<!-- 外部ドメインへの接続を事前に確立 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://cdn.example.com">
\`\`\`

### DNS Prefetch（DNS先読み）

\`\`\`html
<!-- DNSルックアップを事前に実行 -->
<link rel="dns-prefetch" href="https://analytics.google.com">
\`\`\`

### Preload（事前読み込み）

\`\`\`html
<!-- 重要なリソースを優先的に読み込み -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero-image.jpg" as="image">
\`\`\`

## フォントの最適化

\`\`\`css
/* フォント表示の最適化 */
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont.woff2') format('woff2');
  font-display: swap; /* フォールバックフォントを先に表示 */
}
\`\`\`

### font-displayの値

- **swap**: すぐにフォールバックを表示（推奨）
- **optional**: ネットワークが遅い場合はフォールバックのみ
- **fallback**: 短時間待ってからフォールバック

## 圧縮とキャッシュ

### Gzip/Brotli圧縮（サーバー設定）

\`\`\`
# .htaccess (Apache)
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript
</IfModule>
\`\`\`

### キャッシュ制御

\`\`\`
# ブラウザキャッシュ
<IfModule mod_expires.c>
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>
\`\`\`

## 重要なポイント

✅ **画像**: lazy loading + WebP形式 + サイズ指定
✅ **スクリプト**: defer/asyncで非同期読み込み
✅ **リソースヒント**: preconnect/dns-prefetchを活用
✅ **フォント**: font-display: swap を設定
✅ **測定する**: PageSpeed Insightsで定期的にチェック

## パフォーマンス測定ツール

- Google PageSpeed Insights: https://pagespeed.web.dev/
- WebPageTest: https://www.webpagetest.org/
- Lighthouse（Chrome DevTools内蔵）
- GTmetrix: https://gtmetrix.com/

## 目標スコア

- **Lighthouse Performance**: 90点以上
- **Largest Contentful Paint (LCP)**: 2.5秒以内
- **First Input Delay (FID)**: 100ms以内
- **Cumulative Layout Shift (CLS)**: 0.1以下
      `,
      level: 'high'
    },
    {
      id: 'canonical',
      icon: '🔗',
      title: 'Canonical URLの設定',
      description: '重複コンテンツ対策',
      content: `
# Canonical URL の設定方法

各ページの<head>タグ内に以下を追加します。

\`\`\`html
<link rel="canonical" href="https://example.com/page" />
\`\`\`

これにより、AIが「正しいページ」を判断できます。

## 例
- https://example.com/blog/article ← 正規URL
- https://example.com/blog/article?utm_source=twitter ← パラメータ付き

どちらも同じコンテンツなら、canonicalで正規URLを指定しましょう。
      `,
      level: 'medium'
    },
    {
      id: 'sitemap',
      icon: '🗺️',
      title: 'サイトマップの最適化',
      description: 'sitemap.xmlの作り方',
      content: `
# サイトマップ（sitemap.xml）の作成

サイトのルートディレクトリに sitemap.xml を配置します。

\`\`\`xml
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
\`\`\`

robots.txt に以下も追加：
\`\`\`
Sitemap: https://example.com/sitemap.xml
\`\`\`
      `,
      level: 'medium'
    }
  ];

  const getLevelColor = (level) => {
    if (level === 'high') return 'from-red-500/20 to-red-500/5 border-red-500/30 text-red-400';
    if (level === 'medium') return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-400';
    return 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400';
  };

  const getLevelText = (level) => {
    if (level === 'high') return '🔴 高優先度';
    if (level === 'medium') return '🟡 中優先度';
    return '🟢 低優先度';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
              <span className="text-lg md:text-xl font-bold">AI観測ラボ</span>
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">改善ガイド</h1>
            <p className="text-sm md:text-base text-gray-400">各項目の具体的な改善方法を解説します</p>
          </div>

          <div className="space-y-4 md:space-y-6">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className={`bg-gradient-to-br ${getLevelColor(guide.level)} border backdrop-blur-sm rounded-xl md:rounded-2xl p-6 md:p-8`}
              >
                <div className="flex items-start gap-3 md:gap-4 mb-4">
                  <div className="text-3xl md:text-4xl">{guide.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                      <h2 className="text-xl md:text-2xl font-bold break-words">{guide.title}</h2>
                      <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full bg-white/10 ${guide.level === 'high' ? 'text-red-400' : guide.level === 'medium' ? 'text-yellow-400' : 'text-green-400'} w-fit`}>
                        {getLevelText(guide.level)}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-gray-400">{guide.description}</p>
                  </div>
                </div>
                <div className="prose prose-invert max-w-none prose-sm md:prose-base">
                  <pre className="bg-black/30 p-3 md:p-4 rounded-lg overflow-x-auto text-xs md:text-sm whitespace-pre-wrap break-words">
                    <code className="break-words">{guide.content.trim()}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 md:mt-12 text-center px-4">
            <button
              onClick={() => router.back()}
              className="w-full md:w-auto inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
            >
              ← 診断結果に戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}