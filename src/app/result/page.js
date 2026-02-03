'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import RadarChart from './RadarChart';
import dynamic from 'next/dynamic';
import { generateSiteId } from '../utils/generateSiteId';
import VisitHistory from '../components/VisitHistory'; // ← 追加

// PDF生成は動的インポート（クライアントサイドのみ）
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

function ResultContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || 'https://example.com';
  const siteId = generateSiteId(url);

  const [displayScore, setDisplayScore] = useState(0);
  const [PDFReport, setPDFReport] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('results'); // ← 追加: タブ状態管理

  const apiData = searchParams.get('data');
  let analyzedData = null;
  
  if (apiData) {
    try {
      analyzedData = JSON.parse(apiData);
    } catch (e) {
      console.error('Failed to parse data:', e);
    }
  }

  // 診断履歴を保存する関数
  const saveToHistory = (url, score, data) => {
    if (typeof window === 'undefined') return;
    
    try {
      // 既存の履歴を取得
      const historyStr = localStorage.getItem('aiObservatoryHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      
      // 新しい診断結果
      const newEntry = {
        url,
        score,
        date: new Date().toISOString(),
        data // 詳細データも保存
      };
      
      // 同じURLがあれば削除（最新のものだけ残す）
      const filteredHistory = history.filter(item => item.url !== url);
      
      // 新しい結果を先頭に追加
      filteredHistory.unshift(newEntry);
      
      // 最大10件まで保存
      const limitedHistory = filteredHistory.slice(0, 10);
      
      // LocalStorageに保存
      localStorage.setItem('aiObservatoryHistory', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('履歴の保存に失敗:', error);
    }
  };

  // リンクをコピー
  const copyLink = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('コピーに失敗:', error);
      alert('リンクのコピーに失敗しました');
    }
  };

  // メールで送信
  const shareByEmail = () => {
    const subject = encodeURIComponent(`AI可視性診断結果 - ${url}`);
    const body = encodeURIComponent(
      `AI観測ラボで診断した結果です。\n\n` +
      `診断URL: ${url}\n` +
      `総合スコア: ${result.totalScore}点\n\n` +
      `詳細はこちら:\n${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Twitterでシェア
  const shareOnTwitter = () => {
    const shareText = `私のサイトのAI可視性スコアは${result.totalScore}点でした！ #AI観測ラボ`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, '_blank');
  };

  const result = analyzedData ? {
    totalScore: analyzedData.totalScore || 67,
    industryAverage: 54,
    crawlPermission: analyzedData.details?.robotsTxt?.crawlers ? {
    allowed: analyzedData.details.robotsTxt.allowedCount,
    total: analyzedData.details.robotsTxt.totalCrawlers,
    bots: [
  { name: 'ChatGPT', agent: 'GPTBot', allowed: analyzedData.details.robotsTxt.crawlers.chatgpt },
  { name: 'Claude', agent: 'ClaudeBot', allowed: analyzedData.details.robotsTxt.crawlers.claude },
  { name: 'Gemini', agent: 'Google-Extended', allowed: analyzedData.details.robotsTxt.crawlers.gemini },
  { name: 'Perplexity', agent: 'PerplexityBot', allowed: analyzedData.details.robotsTxt.crawlers.perplexity },
  { name: 'Cohere', agent: 'cohere-ai', allowed: analyzedData.details.robotsTxt.crawlers.cohere }
]
     } : {
     allowed: 3,
     total: 5,
     bots: []
     },

    scores: [
      { 
        icon: '📊', 
        name: '構造化データ', 
        score: analyzedData.scores?.structuredData || 0, 
        status: analyzedData.scores?.structuredData > 70 ? 'good' : analyzedData.scores?.structuredData > 40 ? 'warning' : 'bad' 
      },
      { 
        icon: '🤖', 
        name: 'robots.txt', 
        score: analyzedData.scores?.robotsTxt || 0, 
        status: analyzedData.scores?.robotsTxt > 70 ? 'good' : analyzedData.scores?.robotsTxt > 40 ? 'warning' : 'bad' 
      },
      { 
        icon: '🗺️', 
        name: 'サイトマップ', 
        score: analyzedData.scores?.sitemap || 0, 
        status: analyzedData.scores?.sitemap > 70 ? 'good' : 'bad' 
      },
      { 
        icon: '📝', 
        name: 'llms.txt', 
        score: analyzedData.scores?.llmsTxt || 0, 
        status: analyzedData.scores?.llmsTxt > 70 ? 'good' : analyzedData.scores?.llmsTxt > 40 ? 'warning' : 'bad' 
      },
      { 
        icon: '🏷️', 
        name: 'メタタグ', 
        score: analyzedData.scores?.metaTags || 0, 
        status: analyzedData.scores?.metaTags > 70 ? 'good' : analyzedData.scores?.metaTags > 40 ? 'warning' : 'bad' 
      },
      { 
        icon: '🏗️', 
        name: 'セマンティックHTML', 
        score: analyzedData.scores?.semanticHTML || 0, 
        status: analyzedData.scores?.semanticHTML > 70 ? 'good' : analyzedData.scores?.semanticHTML > 40 ? 'warning' : 'bad' 
      },
      { 
        icon: '📱', 
        name: 'モバイル対応', 
        score: analyzedData.scores?.mobileOptimization || 0, 
        status: analyzedData.scores?.mobileOptimization > 70 ? 'good' : analyzedData.scores?.mobileOptimization > 40 ? 'warning' : 'bad' 
      },
      { 
        icon: '⚡', 
        name: 'パフォーマンス', 
        score: analyzedData.scores?.performance || 0, 
        status: analyzedData.scores?.performance > 70 ? 'good' : analyzedData.scores?.performance > 40 ? 'warning' : 'bad' 
      }
    ],
    metaDetails: analyzedData.details?.metaTags || null,
    semanticDetails: analyzedData.details?.semanticHTML || null,
    mobileDetails: analyzedData.details?.mobileOptimization || null,
    performanceDetails: analyzedData.details?.performance || null,
    improvements: {
      high: analyzedData.details ? [
        ...(analyzedData.scores?.structuredData === 0 ? [{
          title: '構造化データが未設定',
          detail: 'JSON-LDでSchema.orgの構造化データを追加してください'
        }] : analyzedData.scores?.structuredData < 70 ? [{
          title: '構造化データの充実度を向上',
          detail: '重要なスキーマタイプやプロパティを追加してください'
        }] : []),
        ...(analyzedData.scores?.robotsTxt < 70 ? [{
          title: 'robots.txtの改善が必要',
          detail: analyzedData.details.robotsTxt?.exists ? 'User-Agent、Disallow、Sitemap参照を追加してください' : 'robots.txtファイルを作成してください'
        }] : []),
        ...(analyzedData.scores?.llmsTxt === 0 ? [{
          title: 'llms.txtが未設定',
          detail: 'サイト構造をAIに伝えるファイルを作成してください'
        }] : analyzedData.scores?.llmsTxt < 70 ? [{
          title: 'llms.txtの品質を向上',
          detail: 'タイトル、要約、リンク、構造化を改善してください'
        }] : []),
        ...(analyzedData.scores?.metaTags < 40 ? [{
          title: 'メタタグの設定が必要',
          detail: 'title、description、OGP、Twitter Cardを設定してください'
        }] : []),
        ...(analyzedData.scores?.semanticHTML < 40 ? [{
          title: 'セマンティックHTMLの改善',
          detail: 'header、nav、main、articleなどの要素を使用してください'
        }] : []),
        ...(analyzedData.scores?.mobileOptimization < 40 ? [{
          title: 'モバイル対応が不十分',
          detail: 'viewportメタタグとレスポンシブデザインを実装してください'
        }] : []),
        ...(analyzedData.scores?.performance < 40 ? [{
          title: 'パフォーマンスの最適化が必要',
          detail: '画像の遅延読み込みやスクリプトの最適化を実施してください'
        }] : [])
      ] : [],
      medium: [],
      completed: analyzedData.details ? [
        ...(analyzedData.scores?.structuredData >= 70 ? ['構造化データが適切に実装されています'] : []),
        ...(analyzedData.scores?.robotsTxt >= 70 ? ['robots.txtが適切に設定されています'] : []),
        ...(analyzedData.scores?.sitemap >= 70 ? ['サイトマップが正しく設定されています'] : []),
        ...(analyzedData.scores?.llmsTxt >= 70 ? ['llms.txtが適切に実装されています'] : []),
        ...(analyzedData.scores?.metaTags >= 70 ? ['メタタグが適切に設定されています'] : []),
        ...(analyzedData.scores?.semanticHTML >= 70 ? ['セマンティックHTMLが適切に使用されています'] : []),
        ...(analyzedData.scores?.mobileOptimization >= 70 ? ['モバイル対応が適切に実装されています'] : []),
        ...(analyzedData.scores?.performance >= 70 ? ['パフォーマンスが最適化されています'] : [])
      ] : []
    }
  } : {
    totalScore: 67,
    industryAverage: 54,
    crawlPermission: { allowed: 3, total: 5, bots: [] },
    scores: [],
    metaDetails: null,
    semanticDetails: null,
    mobileDetails: null,
    performanceDetails: null,
    improvements: { high: [], medium: [], completed: [] }
  };

  // スコアのカウントアップアニメーション
  useEffect(() => {
    let start = 0;
    const end = result.totalScore;
    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [result.totalScore]);

  // 診断結果を履歴に保存
  useEffect(() => {
    if (url && result.totalScore && analyzedData) {
      saveToHistory(url, result.totalScore, analyzedData);
    }
  }, [url, result.totalScore, analyzedData]);

  // PDFコンポーネントを動的に読み込む
  useEffect(() => {
    setIsClient(true);
    import('../components/PDFReport').then((mod) => {
      setPDFReport(() => mod.default);
    });
  }, []);

  // PDF用のデータ
  const pdfData = {
    url,
    totalScore: result.totalScore,
    scores: result.scores,
    improvements: result.improvements
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10">
        <div className="border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
              <span className="text-lg md:text-xl font-bold">AI観測ラボ</span>
            </Link>
          </div>
        </div>

        <div className="w-full md:max-w-5xl mx-auto px-4 py-8 md:px-6 md:py-12">
          <div className="mb-6 md:mb-8">
            <div className="inline-block px-3 md:px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-xs md:text-sm text-gray-400">診断URL: </span>
              <span className="text-xs md:text-sm break-words">{url}</span>
            </div>
          </div>

          {/* ========== ここから追加: タブナビゲーション ========== */}
          <div className="mb-8">
            <div className="flex gap-2 border-b border-white/10">
              <button
                onClick={() => setActiveTab('results')}
                className={`px-6 py-3 font-medium transition border-b-2 ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                📊 診断結果
              </button>
              <button
                onClick={() => setActiveTab('visits')}
                className={`px-6 py-3 font-medium transition border-b-2 ${
                  activeTab === 'visits'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                👁️ 訪問履歴
              </button>
            </div>
          </div>
          {/* ========== タブナビゲーションここまで ========== */}

          {/* ========== タブコンテンツの条件分岐 ========== */}
          {activeTab === 'results' ? (
            // 既存の診断結果表示コード（以下すべて）
            <>
              <div className="mb-8 md:mb-12">
                <div className="text-center mb-6 md:mb-8">
                  <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-400">AI可視性スコア</h2>
                  <div className="text-6xl md:text-8xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {displayScore}
                    </span>
                    <span className="text-3xl md:text-4xl text-gray-600">/100</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-400 px-4">
                    同業他社平均: {result.industryAverage}点 • あなたは 
                    <span className="text-green-400 font-bold"> +{result.totalScore - result.industryAverage}点 </span>
                    上回っています
                  </p>
                </div>
              </div>

              {result.crawlPermission.bots.length > 0 && (
                <div className="mb-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                  <h3 className="text-2xl font-bold mb-6">🎯 AIクロール許可率</h3>
                  <p className="text-gray-400 mb-6">
                    主要AI <span className="text-white font-bold">{result.crawlPermission.total}社中 {result.crawlPermission.allowed}社</span> にクロールを許可
                  </p>
                  <div className="space-y-3">
                    {result.crawlPermission.bots.map((bot, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${bot.allowed ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="font-medium">{bot.name}</span>
                          <span className="text-sm text-gray-500">({bot.agent})</span>
                        </div>
                        <span className={bot.allowed ? 'text-green-400' : 'text-red-400'}>
                          {bot.allowed ? '✅ 許可' : '❌ ブロック'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* メタタグ詳細 */}
              {result.metaDetails && result.metaDetails.exists && (
                <div className="mb-8 md:mb-12 bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">🏷️ メタタグ詳細</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2 flex-wrap">
                      📄 基本メタタグ
                      <span className={`text-xs md:text-sm px-2 py-1 rounded ${
                        result.metaDetails.basic.titleOptimal && result.metaDetails.basic.descriptionOptimal 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {result.metaDetails.basic.titleOptimal && result.metaDetails.basic.descriptionOptimal ? '最適' : '要改善'}
                      </span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                          <span className="font-medium text-gray-300 text-sm md:text-base">Title タグ</span>
                          <span className={`text-xs md:text-sm ${
                            result.metaDetails.basic.titleOptimal ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {result.metaDetails.basic.titleLength}文字 
                            {result.metaDetails.basic.titleOptimal ? ' ✓' : ' (推奨: 10-60文字)'}
                          </span>
                        </div>
                        <p className="text-xs md:text-sm text-gray-400 break-words">
                          {result.metaDetails.basic.title}
                        </p>
                      </div>

                      <div className="p-3 md:p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                          <span className="font-medium text-gray-300 text-sm md:text-base">Description タグ</span>
                          <span className={`text-xs md:text-sm ${
                            result.metaDetails.basic.descriptionOptimal ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {result.metaDetails.basic.descriptionLength}文字
                            {result.metaDetails.basic.descriptionOptimal ? ' ✓' : ' (推奨: 50-160文字)'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 break-words">
                          {result.metaDetails.basic.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      🌐 OGP
                      <span className={`text-sm px-2 py-1 rounded ${
                        result.metaDetails.ogp.completeness >= 4 
                          ? 'bg-green-500/20 text-green-400' 
                          : result.metaDetails.ogp.completeness >= 2
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {result.metaDetails.ogp.completeness}/5項目
                      </span>
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-3 overflow-hidden">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">og:title</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.ogp.ogTitle}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">og:type</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.ogp.ogType}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">og:url</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.ogp.ogUrl}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">og:image</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.ogp.ogImage}</div>
                      </div>
                      <div className="md:col-span-2 p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">og:description</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.ogp.ogDescription}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      🐦 Twitter Card
                      <span className={`text-sm px-2 py-1 rounded ${
                        result.metaDetails.twitter.completeness >= 3 
                          ? 'bg-green-500/20 text-green-400' 
                          : result.metaDetails.twitter.completeness >= 2
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {result.metaDetails.twitter.completeness}/4項目
                      </span>
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-3 overflow-hidden">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">twitter:card</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.twitter.twitterCard}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">twitter:title</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.twitter.twitterTitle}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">twitter:image</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.twitter.twitterImage}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">twitter:description</div>
                        <div className="text-sm break-words overflow-hidden">{result.metaDetails.twitter.twitterDescription}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* セマンティックHTML詳細 */}
              {result.semanticDetails && result.semanticDetails.exists && (
                <div className="mb-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                  <h3 className="text-2xl font-bold mb-6">🏗️ セマンティックHTML詳細</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      📐 セマンティックタグ
                      <span className={`text-sm px-2 py-1 rounded ${
                        result.semanticDetails.semanticTags.count >= 5 
                          ? 'bg-green-500/20 text-green-400' 
                          : result.semanticDetails.semanticTags.count >= 3
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {result.semanticDetails.semanticTags.count}/7タグ使用
                      </span>
                    </h4>
                    
                    <div className="grid md:grid-cols-3 gap-3">
                      {[
                        { name: 'header', used: result.semanticDetails.semanticTags.hasHeader },
                        { name: 'nav', used: result.semanticDetails.semanticTags.hasNav },
                        { name: 'main', used: result.semanticDetails.semanticTags.hasMain },
                        { name: 'article', used: result.semanticDetails.semanticTags.hasArticle },
                        { name: 'section', used: result.semanticDetails.semanticTags.hasSection },
                        { name: 'aside', used: result.semanticDetails.semanticTags.hasAside },
                        { name: 'footer', used: result.semanticDetails.semanticTags.hasFooter }
                      ].map((tag, i) => (
                        <div key={i} className={`p-3 rounded-lg border ${
                          tag.used 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-red-500/10 border-red-500/30'
                        }`}>
                          <div className="flex items-center justify-between">
                            <code className="text-sm">&lt;{tag.name}&gt;</code>
                            <span className={tag.used ? 'text-green-400' : 'text-red-400'}>
                              {tag.used ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      📊 見出し階層
                      <span className={`text-sm px-2 py-1 rounded ${
                        result.semanticDetails.headingStructure.isOptimal
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {result.semanticDetails.headingStructure.isOptimal ? '最適' : '要改善'}
                      </span>
                    </h4>
                    
                    <div className="grid md:grid-cols-4 gap-3">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-1">H1</div>
                        <div className="text-2xl font-bold">{result.semanticDetails.headingStructure.h1Count}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {result.semanticDetails.headingStructure.hasProperH1 ? '✓ 理想的' : '要調整'}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-1">H2</div>
                        <div className="text-2xl font-bold">{result.semanticDetails.headingStructure.h2Count}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-1">H3</div>
                        <div className="text-2xl font-bold">{result.semanticDetails.headingStructure.h3Count}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-1">H4</div>
                        <div className="text-2xl font-bold">{result.semanticDetails.headingStructure.h4Count}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* モバイル対応詳細 */}
              {result.mobileDetails && result.mobileDetails.exists && (
                <div className="mb-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                  <h3 className="text-2xl font-bold mb-6">📱 モバイル対応詳細</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      📐 Viewport設定
                      <span className={`text-sm px-2 py-1 rounded ${
                        result.mobileDetails.viewport.isOptimal
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {result.mobileDetails.viewport.isOptimal ? '最適' : '未設定'}
                      </span>
                    </h4>
                    
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <code className="text-sm text-gray-400 break-words">
                        {result.mobileDetails.viewport.content}
                      </code>
                      <div className="mt-3 flex gap-3">
                        <div className={`px-3 py-1 rounded text-sm ${
                          result.mobileDetails.viewport.hasWidthDevice 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {result.mobileDetails.viewport.hasWidthDevice ? '✓' : '✗'} width=device-width
                        </div>
                        <div className={`px-3 py-1 rounded text-sm ${
                          result.mobileDetails.viewport.hasInitialScale 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {result.mobileDetails.viewport.hasInitialScale ? '✓' : '✗'} initial-scale=1
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-4">📱 レスポンシブデザイン</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">メディアクエリ</div>
                        <div className="text-2xl font-bold mb-1">{result.mobileDetails.responsive.mediaQueryCount}</div>
                        <div className="text-xs text-gray-500">
                          {result.mobileDetails.responsive.hasMediaQueries ? '✓ 使用中' : '✗ 未使用'}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">レイアウト技術</div>
                        <div className="flex gap-2 mt-2">
                          {result.mobileDetails.responsive.hasFlexbox && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">Flexbox</span>
                          )}
                          {result.mobileDetails.responsive.hasGrid && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">Grid</span>
                          )}
                          {!result.mobileDetails.responsive.hasFlexbox && !result.mobileDetails.responsive.hasGrid && (
                            <span className="text-gray-500 text-sm">未検出</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* パフォーマンス詳細 */}
              {result.performanceDetails && result.performanceDetails.exists && (
                <div className="mb-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                  <h3 className="text-2xl font-bold mb-6">⚡ パフォーマンス詳細</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-4">🖼️ 画像最適化</h4>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">総画像数</div>
                        <div className="text-2xl font-bold">{result.performanceDetails.images.totalCount}</div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">遅延読み込み</div>
                        <div className="text-2xl font-bold mb-1">{result.performanceDetails.images.lazyLoadRatio}%</div>
                        <div className="text-xs text-gray-500">
                          {result.performanceDetails.images.lazyLoadCount}/{result.performanceDetails.images.totalCount}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">ALTテキスト</div>
                        <div className="text-2xl font-bold mb-1">{result.performanceDetails.images.altTextRatio}%</div>
                        <div className="text-xs text-gray-500">
                          {result.performanceDetails.images.altTextCount}/{result.performanceDetails.images.totalCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold mb-4">📜 スクリプト最適化</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">スクリプト数</div>
                        <div className="text-2xl font-bold mb-1">{result.performanceDetails.scripts.totalCount}</div>
                        <div className="text-xs text-gray-500">
                          外部: {result.performanceDetails.scripts.externalCount}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">非同期読み込み</div>
                        <div className="flex gap-2 mt-2">
                          {result.performanceDetails.scripts.hasDeferScripts && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">defer</span>
                          )}
                          {result.performanceDetails.scripts.hasAsyncScripts && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">async</span>
                          )}
                          {!result.performanceDetails.scripts.hasDeferScripts && !result.performanceDetails.scripts.hasAsyncScripts && (
                            <span className="text-red-400 text-sm">✗ 未使用</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 詳細スコア */}
              <div className="mb-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
                <h3 className="text-2xl font-bold mb-6">詳細スコア</h3>
                <div className="mb-8">
                  <RadarChart scores={result.scores} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {result.scores.map((item, i) => {
                    const getColor = () => {
                      if (item.status === 'good') return 'from-green-500/20 to-green-500/5 border-green-500/30';
                      if (item.status === 'warning') return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
                      return 'from-red-500/20 to-red-500/5 border-red-500/30';
                    };
                    
                    return (
                      <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${getColor()} border backdrop-blur-sm`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-2xl font-bold">{item.score}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.status === 'good' ? 'bg-green-400' : 
                              item.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 改善ポイント */}
              <div className="mb-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <h3 className="text-xl md:text-2xl font-bold">⚠️ 改善ポイント</h3>
                  <Link 
                    href="/guide"
                    className="w-full md:w-auto px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-base font-semibold transition-all hover:scale-105 active:scale-95 text-center"
                  >
                    📚 詳しい改善ガイドを見る
                  </Link>
                </div>
                
                {result.improvements.high.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-4 text-red-400">🔴 高優先度</h4>
                    <div className="space-y-3">
                      {result.improvements.high.map((item, i) => (
                        <div key={i} className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                          <div className="font-medium mb-1">{item.title}</div>
                          <div className="text-sm text-gray-400">→ {item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.improvements.medium.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold mb-4 text-yellow-400">🟡 中優先度</h4>
                    <div className="space-y-3">
                      {result.improvements.medium.map((item, i) => (
                        <div key={i} className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <div className="font-medium mb-1">{item.title}</div>
                          <div className="text-sm text-gray-400">→ {item.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.improvements.completed.length > 0 && (
                  <div>
                    <h4 className="text-lg font-bold mb-4 text-green-400">🟢 対応済み</h4>
                    <div className="space-y-2">
                      {result.improvements.completed.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-400">
                          <span className="text-green-400">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI訪問トラッキング */}
              <div className="mb-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-blue-500/30 p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="text-4xl">🤖</div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">AI訪問トラッキング</h3>
                    <p className="text-sm md:text-base text-gray-400">
                      実際にどのAIがサイトを訪問したか記録できます
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <span>📊</span>
                      <span>トラッキングコードを設置</span>
                    </h4>
                    <p className="text-sm text-gray-400 mb-4">
                      以下のコードをサイトの <code className="px-2 py-1 bg-black/30 rounded text-blue-400">&lt;head&gt;</code> タグ内に追加してください
                    </p>
                    
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-black/50 border border-white/10 overflow-x-auto text-xs md:text-sm">
                        <code className="text-green-400">{`<script src="https://ai-kansoku.com/tracker.js" data-site-id="${siteId}"></script>`}</code>
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`<script src="https://ai-kansoku.com/tracker.js" data-site-id="${siteId}"></script>`);
                          alert('コピーしました！');
                        }}
                        className="absolute top-2 right-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-xs font-medium transition-all"
                      >
                        📋 コピー
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span>✨</span>
                      <span>トラッキング開始後</span>
                    </h4>
                    <p className="text-sm text-gray-400">
                      AIクローラーがサイトを訪問すると自動的に記録されます。<br />
                      「👁️ 訪問履歴」タブで確認できます。
                    </p>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-col gap-4 justify-center px-4">
                {/* 上段: メインアクション */}
                <div className="flex flex-col md:flex-row gap-4">
                  <Link 
                    href="/"
                    className="w-full md:flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold transition-all hover:scale-105 text-center"
                  >
                    🔄 再診断する
                  </Link>
                  
                  {/* PDF出力ボタン */}
                  {isClient && PDFReport && (
                    <PDFDownloadLink
                      document={<PDFReport data={pdfData} />}
                      fileName={`AI可視性診断レポート_${url.replace(/https?:\/\//, '')}_${new Date().toISOString().split('T')[0]}.pdf`}
                      className="w-full md:flex-1 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 text-center"
                    >
                      {({ loading }) => (loading ? '📄 PDF生成中...' : '📄 PDF出力')}
                    </PDFDownloadLink>
                  )}
                </div>

                {/* 下段: 共有オプション */}
                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={shareOnTwitter}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-sm flex items-center justify-center gap-2"
                  >
                    <span>🐦</span>
                    <span>Twitterで共有</span>
                  </button>
                  
                  <button
                    onClick={copyLink}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-sm flex items-center justify-center gap-2"
                  >
                    <span>{copySuccess ? '✅' : '📋'}</span>
                    <span>{copySuccess ? 'コピーしました！' : 'リンクをコピー'}</span>
                  </button>
                  
                  <button
                    onClick={shareByEmail}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 text-sm flex items-center justify-center gap-2"
                  >
                    <span>📧</span>
                    <span>メールで送信</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            // ========== 訪問履歴タブ ========== 
            <div>
              <VisitHistory siteId={siteId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">読み込み中...</div>}>
      <ResultContent />
    </Suspense>
  );
}