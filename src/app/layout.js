import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  // 基本メタデータ
  title: {
    default: "AI観測ラボ | AIクロール診断ツール",
    template: "%s | AI観測ラボ"
  },
  description: "あなたのサイトはAIに好かれていますか？ChatGPT、Claude、Perplexityなど主要AIのクロール状況を30秒で診断。robots.txt、sitemap.xml、構造化データなど8項目を無料で分析します。",
  keywords: ["AI", "SEO", "クロール", "診断", "robots.txt", "sitemap", "構造化データ", "ChatGPT", "Claude", "Perplexity", "AI可視性"],
  authors: [{ name: "AI観測ラボ" }],
  creator: "AI観測ラボ",
  publisher: "AI観測ラボ",
  
  // OGP (Open Graph Protocol)
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://ai-kansoku.com",
    siteName: "AI観測ラボ",
    title: "AI観測ラボ | AIクロール診断ツール",
    description: "あなたのサイトはAIに好かれていますか？ChatGPT、Claude、Perplexityなど主要AIのクロール状況を30秒で診断",
    images: [
      {
        url: "/ogp-image.png",
        width: 1200,
        height: 630,
        alt: "AI観測ラボ - AIクロール診断ツール",
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: "AI観測ラボ | AIクロール診断ツール",
    description: "あなたのサイトはAIに好かれていますか？ChatGPT、Claude、Perplexityなど主要AIのクロール状況を30秒で診断",
    images: ["/ogp-image.png"],
  },
  
  // Favicon
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔍</text></svg>',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔍</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
  
  // モバイル最適化
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  
  // その他のメタデータ
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Canonical URL
  alternates: {
    canonical: "https://ai-kansoku.com",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        {/* Google Search Console 所有権確認 */}
        <meta name="google-site-verification" content="ziqmb14N0-99w0COc_sqVhQNeStU1qdGrv5COcNmD_s" />

        {/* Google Analytics (GA4) - G-CEXFWC8K8K */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-CEXFWC8K8K"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-CEXFWC8K8K');
            `,
          }}
        />

        {/* JSON-LD構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "AI観測ラボ",
              "alternateName": "AI Observatory",
              "url": "https://ai-kansoku.com",
              "description": "あなたのサイトはAIに好かれていますか？ChatGPT、Claude、Perplexityなど主要AIのクロール状況を30秒で診断",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "JPY"
              },
              "creator": {
                "@type": "Organization",
                "name": "AI観測ラボ",
                "url": "https://ai-kansoku.com"
              },
              "featureList": [
                "構造化データ診断",
                "robots.txt診断",
                "サイトマップ診断",
                "llms.txt診断",
                "メタタグ診断",
                "セマンティックHTML診断",
                "モバイル対応診断",
                "パフォーマンス診断"
              ]
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}