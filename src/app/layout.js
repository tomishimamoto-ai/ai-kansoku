import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ① viewport は metadata から分離（Next.js App Router推奨）
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  // ② metadataBase でURL解決を安定させる
  metadataBase: new URL("https://ai-kansoku.com"),

  title: {
    default: "AI観測ラボ | AIクロール診断ツール",
    template: "%s | AI観測ラボ"
  },
  description: "あなたのサイトはAIに好かれていますか？ChatGPT、Claude、Perplexityなど主要AIのクロール状況を30秒で診断。robots.txt、sitemap.xml、構造化データなど8項目を無料で分析します。",
  keywords: ["AI", "SEO", "クロール", "診断", "robots.txt", "sitemap", "構造化データ", "ChatGPT", "Claude", "Perplexity", "AI可視性"],
  authors: [{ name: "AI観測ラボ" }],
  creator: "AI観測ラボ",
  publisher: "AI観測ラボ",

  // OGP
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://ai-kansoku.com",
    siteName: "AI観測ラボ",
    title: "AI観測ラボ | AIクロール診断ツール",
    description: "あなたのサイトはAIに好かれていますか？ChatGPT、Claude、Perplexityなど主要AIのクロール状況を30秒で診断",
    images: [
      {
        url: "https://ai-kansoku.com/ogp-image.png", // ⑤ 絶対URL
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
    images: ["https://ai-kansoku.com/ogp-image.png"], // ⑤ 絶対URL
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

  // ③ canonical はページごとに設定するのが理想
  // TODO: /dashboard, /result など各page.jsで個別に設定する
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
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}

        {/* ① JSON-LD構造化データ - beforeInteractiveでHTMLロード直後に出力 */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "@id": "https://ai-kansoku.com/#app", // ② エンティティ認識を安定させる
                "name": "AI観測ラボ",
                "alternateName": "AI Observatory",
                "url": "https://ai-kansoku.com",
                "description": "あなたのサイトはAIに好かれていますか？ChatGPT、Claude、Perplexityなど主要AIのクロール状況を30秒で診断",
                "applicationCategory": "UtilitiesApplication",
                "applicationSubCategory": "SEO Tool",
                "operatingSystem": "Web Browser",
                "isAccessibleForFree": true,
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "JPY",
                  "availability": "https://schema.org/InStock"
                },
                "creator": {
                  "@type": "Organization",
                  "@id": "https://ai-kansoku.com/#org",
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
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "@id": "https://ai-kansoku.com/#software", // ② エンティティ認識を安定させる
                "name": "AI観測ラボ",
                "url": "https://ai-kansoku.com",
                "applicationCategory": "UtilitiesApplication",
                "applicationSubCategory": "SEO Tool",
                "operatingSystem": "Web Browser",
                "isAccessibleForFree": true,
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "JPY",
                  "availability": "https://schema.org/InStock"
                }
              },
              {
                // ③ Organization単独schema - Google推奨構造
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": "https://ai-kansoku.com/#org",
                "name": "AI観測ラボ",
                "url": "https://ai-kansoku.com"
              }
            ])
          }}
        />

        {/* ② GA4 - next/script で最適化（afterInteractive） */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CEXFWC8K8K"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CEXFWC8K8K');
          `}
        </Script>
      </body>
    </html>
  );
}