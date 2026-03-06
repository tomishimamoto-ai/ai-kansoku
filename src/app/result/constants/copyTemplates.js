// src/app/result/constants/copyTemplates.js

export const COPY_TEMPLATES = {
  robotsTxt: {
    label: 'robots.txt',
    lang: 'text',
    code: `User-agent: *
Allow: /

# AI クローラーを明示的に許可
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`,
    note: 'your-domain.com を実際のドメインに変更してください',
  },
  llmsTxt: {
    label: 'llms.txt',
    lang: 'markdown',
    code: `# サイト名

> ひとこと説明（例：フローリング専門のECサイトです）

## サービス概要
- 提供するサービスや商品の簡単な説明
- ターゲットユーザー
- 主な特徴

## 主要ページ
- [トップページ](https://your-domain.com/)
- [商品一覧](https://your-domain.com/products/)
- [会社概要](https://your-domain.com/about/)
- [お問い合わせ](https://your-domain.com/contact/)

## 更新情報
最終更新: 2025年XX月XX日`,
    note: '/llms.txt としてサイトルートに配置してください',
  },
  structuredData: {
    label: 'JSON-LD（構造化データ）',
    lang: 'html',
    code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://your-domain.com/#website",
      "url": "https://your-domain.com/",
      "name": "サイト名",
      "description": "サイトの説明",
      "inLanguage": "ja"
    },
    {
      "@type": "Organization",
      "@id": "https://your-domain.com/#organization",
      "name": "会社名 / サービス名",
      "url": "https://your-domain.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://your-domain.com/logo.png"
      }
    }
  ]
}
</script>`,
    note: '<head> タグ内に貼り付けてください',
  },
  metaTags: {
    label: 'OGP メタタグ',
    lang: 'html',
    code: `<!-- 基本メタ -->
<meta name="description" content="ページの説明（120文字以内）">

<!-- OGP -->
<meta property="og:title" content="ページタイトル">
<meta property="og:description" content="ページの説明（120文字以内）">
<meta property="og:type" content="website">
<meta property="og:url" content="https://your-domain.com/">
<meta property="og:image" content="https://your-domain.com/ogp.png">
<meta property="og:site_name" content="サイト名">
<meta property="og:locale" content="ja_JP">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ページタイトル">
<meta name="twitter:description" content="ページの説明">
<meta name="twitter:image" content="https://your-domain.com/ogp.png">`,
    note: '<head> タグ内に貼り付けてください',
  },
  mobileOptimization: {
    label: 'viewport メタタグ',
    lang: 'html',
    code: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    note: '<head> タグの先頭付近に追加してください',
  },
};