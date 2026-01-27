This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# 🔍 AI観測ラボ (AI Observatory)

あなたのウェブサイトがAI（ChatGPT、Claude、Perplexityなど）にどう見えているかを診断するツール。

![AI Observatory](https://via.placeholder.com/1200x630/000000/FFFFFF?text=AI+Observatory)

## ✨ 特徴

- **8項目の詳細診断**: 構造化データ、robots.txt、サイトマップ、llms.txt、メタタグ、セマンティックHTML、モバイル対応、パフォーマンス
- **レーダーチャート可視化**: スコアを視覚的に表示
- **改善ガイド**: 各項目の具体的な改善方法を提示
- **PDF出力**: 診断結果をPDFでダウンロード可能
- **完全無料**: 登録不要、データ保存なし

## 🚀 デモ

[デモサイトを見る](https://ai-observatory.vercel.app) ← デプロイ後に更新

## 📸 スクリーンショット

### トップページ
![トップページ](https://via.placeholder.com/800x500/000000/FFFFFF?text=Top+Page)

### 診断結果ページ
![診断結果](https://via.placeholder.com/800x500/000000/FFFFFF?text=Result+Page)

### 改善ガイド
![改善ガイド](https://via.placeholder.com/800x500/000000/FFFFFF?text=Guide+Page)

## 🛠️ 技術スタック

- **フレームワーク**: [Next.js 15](https://nextjs.org/) (App Router)
- **言語**: JavaScript / React
- **スタイリング**: [Tailwind CSS](https://tailwindcss.com/)
- **チャート**: [Chart.js](https://www.chartjs.org/)
- **PDF生成**: [@react-pdf/renderer](https://react-pdf.org/)

## 📦 インストール

### 前提条件

- Node.js 18.x 以上
- npm または yarn

### セットアップ手順

1. **リポジトリをクローン**

```bash
git clone https://github.com/yourusername/ai-observatory.git
cd ai-observatory
```

2. **依存関係をインストール**

```bash
npm install
```

3. **開発サーバーを起動**

```bash
npm run dev
```

4. **ブラウザでアクセス**

[http://localhost:3000](http://localhost:3000) を開く

## 📁 プロジェクト構造

```
ai-observatory/
├── src/
│   └── app/
│       ├── api/
│       │   └── analyze/
│       │       └── route.js          # 診断API
│       ├── components/
│       │   ├── PDFReport.js          # PDF生成コンポーネント
│       │   └── RadarChart.js         # レーダーチャート
│       ├── result/
│       │   └── page.js               # 診断結果ページ
│       ├── guide/
│       │   └── page.js               # 改善ガイドページ
│       ├── page.js                   # トップページ
│       └── layout.js                 # レイアウト
├── public/
│   ├── robots.txt                    # SEO設定
│   └── sitemap.xml                   # サイトマップ
├── package.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## 🔍 診断項目

### 1. 📊 構造化データ (JSON-LD)
Schema.orgの構造化データが適切に実装されているかをチェック。

- WebSite、Organization、Article、Product などのスキーマタイプ
- 必須プロパティの存在確認
- 複数スキーマの適切な組み合わせ

### 2. 🤖 robots.txt
主要AIクローラー（GPTBot、ClaudeBot、Google-Extended、PerplexityBot、cohere-ai）の許可設定を確認。

- ファイルの存在確認
- User-Agent ディレクティブ
- Allow / Disallow ルール
- Sitemap 参照

### 3. 🗺️ サイトマップ (sitemap.xml)
XMLサイトマップの品質を評価。

- ファイルの存在確認
- URL数
- lastmod、priority の設定
- robots.txt からの参照

### 4. 📝 llms.txt
AI専用のサイトマップファイルの有無と品質をチェック。

- ファイルの存在
- タイトル、要約の記載
- リンクの構造化
- Markdown形式の適切性

### 5. 🏷️ メタタグ
SEOとSNSシェアに重要なメタタグを診断。

- title、description の最適化（文字数チェック）
- OGP（Open Graph Protocol）5項目
- Twitter Card 4項目

### 6. 🏗️ セマンティックHTML
HTMLの構造化と意味付けを評価。

- セマンティックタグ（header、nav、main、article、section、aside、footer）
- 見出し階層（h1は1つ、h1-h4の適切な構造）
- アクセシビリティ（aria-label、role属性）

### 7. 📱 モバイル対応
レスポンシブデザインの実装状況。

- viewport メタタグの設定
- メディアクエリの使用
- Flexbox / Grid の活用
- タッチ操作の最適化

### 8. ⚡ パフォーマンス
ページ速度とリソース最適化。

- 画像の遅延読み込み（lazy loading）
- ALTテキストの設定
- スクリプトの defer/async 使用
- リソースヒント（preconnect、dns-prefetch）

## 📊 スコアリング

各項目は **0-100点** で評価され、総合スコアは全項目の平均として算出されます。

- **80-100点**: 優秀 🟢
- **60-79点**: 良好 🟡
- **0-59点**: 要改善 🔴

## 🎯 使い方

1. **URLを入力**: トップページでウェブサイトのURLを入力
2. **診断実行**: 「診断する」ボタンをクリック（約10-30秒）
3. **結果確認**: 8項目のスコアとレーダーチャートを表示
4. **改善実施**: 「改善ガイド」で具体的な実装方法を確認
5. **PDF出力**: 必要に応じてレポートをダウンロード

## 🚀 デプロイ

### Vercelにデプロイ

1. **Vercelアカウント作成**

[Vercel](https://vercel.com/) にサインアップ

2. **プロジェクトをインポート**

```bash
npm install -g vercel
vercel
```

3. **自動デプロイ**

GitHubと連携すると、pushするたびに自動デプロイされます。

### 環境変数

現在、環境変数は不要です。将来的に以下を追加予定：

```env
# .env.local (未実装)
NEXT_PUBLIC_API_URL=https://api.example.com
ANALYTICS_ID=your-analytics-id
```

## 🤝 コントリビューション

プルリクエスト大歓迎です！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 👤 作者

**あなたの名前** ([@your_twitter](https://twitter.com/your_twitter))

- Website: [your-website.com](https://your-website.com)
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [Chart.js](https://www.chartjs.org/) - チャートライブラリ
- [react-pdf](https://react-pdf.org/) - PDF生成ライブラリ

## 📮 お問い合わせ

質問やフィードバックは [Issues](https://github.com/yourusername/ai-observatory/issues) または [Twitter](https://twitter.com/your_twitter) までお願いします。

---

**⭐ このプロジェクトが役立ったら、スターをお願いします！**
