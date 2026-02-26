'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import RadarChart from './RadarChart';
import dynamic from 'next/dynamic';
import { generateSiteId } from '../utils/generateSiteId';
import ShareDropdown from '../components/ShareDropdown';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

function ResultContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || 'https://example.com';
  const siteId = searchParams.get('siteId') || generateSiteId(url);

  const [displayScore, setDisplayScore] = useState(0);
  const [PDFReport, setPDFReport] = useState(null);
  const [isClient, setIsClient] = useState(false);

  const apiData = searchParams.get('data');
  let analyzedData = null;
  if (apiData) {
    try { analyzedData = JSON.parse(apiData); } catch (e) {}
  }

  const saveToHistory = (url, score, data) => {
    if (typeof window === 'undefined') return;
    try {
      const historyStr = localStorage.getItem('aiObservatoryHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      const newEntry = { url, score, date: new Date().toISOString(), data };
      const filteredHistory = history.filter(item => item.url !== url);
      filteredHistory.unshift(newEntry);
      localStorage.setItem('aiObservatoryHistory', JSON.stringify(filteredHistory.slice(0, 10)));
    } catch (error) {}
  };

  const result = analyzedData ? {
    totalScore: analyzedData.totalScore || 67,
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
    } : { allowed: 3, total: 5, bots: [] },
    scores: [
      { icon: '📊', name: '構造化データ', score: analyzedData.scores?.structuredData || 0, status: analyzedData.scores?.structuredData > 70 ? 'good' : analyzedData.scores?.structuredData > 40 ? 'warning' : 'bad' },
      { icon: '🤖', name: 'robots.txt', score: analyzedData.scores?.robotsTxt || 0, status: analyzedData.scores?.robotsTxt > 70 ? 'good' : analyzedData.scores?.robotsTxt > 40 ? 'warning' : 'bad' },
      { icon: '🗺️', name: 'サイトマップ', score: analyzedData.scores?.sitemap || 0, status: analyzedData.scores?.sitemap > 70 ? 'good' : 'bad' },
      { icon: '📝', name: 'llms.txt', score: analyzedData.scores?.llmsTxt || 0, status: analyzedData.scores?.llmsTxt > 70 ? 'good' : analyzedData.scores?.llmsTxt > 40 ? 'warning' : 'bad' },
      { icon: '🏷️', name: 'メタタグ', score: analyzedData.scores?.metaTags || 0, status: analyzedData.scores?.metaTags > 70 ? 'good' : analyzedData.scores?.metaTags > 40 ? 'warning' : 'bad' },
      { icon: '🏗️', name: 'セマンティックHTML', score: analyzedData.scores?.semanticHTML || 0, status: analyzedData.scores?.semanticHTML > 70 ? 'good' : analyzedData.scores?.semanticHTML > 40 ? 'warning' : 'bad' },
      { icon: '📱', name: 'モバイル対応', score: analyzedData.scores?.mobileOptimization || 0, status: analyzedData.scores?.mobileOptimization > 70 ? 'good' : analyzedData.scores?.mobileOptimization > 40 ? 'warning' : 'bad' },
      { icon: '⚡', name: 'パフォーマンス', score: analyzedData.scores?.performance || 0, status: analyzedData.scores?.performance > 70 ? 'good' : analyzedData.scores?.performance > 40 ? 'warning' : 'bad' }
    ],
    metaDetails: analyzedData.details?.metaTags || null,
    semanticDetails: analyzedData.details?.semanticHTML || null,
    mobileDetails: analyzedData.details?.mobileOptimization || null,
    performanceDetails: analyzedData.details?.performance || null,
    improvements: {
      high: analyzedData.details ? [
        ...(analyzedData.scores?.structuredData === 0 ? [{ title: '構造化データが未設定', detail: 'JSON-LDでSchema.orgの構造化データを追加してください' }] : analyzedData.scores?.structuredData < 70 ? [{ title: '構造化データの充実度を向上', detail: '重要なスキーマタイプやプロパティを追加してください' }] : []),
        ...(analyzedData.scores?.robotsTxt < 70 ? [{ title: 'robots.txtの改善が必要', detail: analyzedData.details.robotsTxt?.exists ? 'User-Agent、Disallow、Sitemap参照を追加してください' : 'robots.txtファイルを作成してください' }] : []),
        ...(analyzedData.scores?.llmsTxt === 0 ? [{ title: 'llms.txtが未設定', detail: 'サイト構造をAIに伝えるファイルを作成してください' }] : analyzedData.scores?.llmsTxt < 70 ? [{ title: 'llms.txtの品質を向上', detail: 'タイトル、要約、リンク、構造化を改善してください' }] : []),
        ...(analyzedData.scores?.metaTags < 40 ? [{ title: 'メタタグの設定が必要', detail: 'title、description、OGP、Twitter Cardを設定してください' }] : []),
        ...(analyzedData.scores?.semanticHTML < 40 ? [{ title: 'セマンティックHTMLの改善', detail: 'header、nav、main、articleなどの要素を使用してください' }] : []),
        ...(analyzedData.scores?.mobileOptimization < 40 ? [{ title: 'モバイル対応が不十分', detail: 'viewportメタタグとレスポンシブデザインを実装してください' }] : []),
        ...(analyzedData.scores?.performance < 40 ? [{ title: 'パフォーマンスの最適化が必要', detail: '画像の遅延読み込みやスクリプトの最適化を実施してください' }] : [])
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
    crawlPermission: { allowed: 3, total: 5, bots: [] },
    scores: [],
    metaDetails: null, semanticDetails: null, mobileDetails: null, performanceDetails: null,
    improvements: { high: [], medium: [], completed: [] }
  };

  useEffect(() => {
    let start = 0;
    const end = result.totalScore;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplayScore(end); clearInterval(timer); }
      else { setDisplayScore(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [result.totalScore]);

  useEffect(() => {
    if (url && result.totalScore && analyzedData) saveToHistory(url, result.totalScore, analyzedData);
  }, [url, result.totalScore]);

  useEffect(() => {
    setIsClient(true);
    import('../components/PDFReport').then((mod) => setPDFReport(() => mod.default));
  }, []);

  const pdfData = { url, totalScore: result.totalScore, scores: result.scores, improvements: result.improvements };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10">
        <div className="border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
              <span className="text-lg md:text-xl font-bold">AI観測ラボ</span>
            </Link>
          </div>
        </div>

        <div className="w-full md:max-w-5xl mx-auto px-4 py-8 md:px-6 md:py-12">

          {/* 診断URL */}
          <div className="mb-6 md:mb-8">
            <div className="inline-block px-3 md:px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-xs md:text-sm text-gray-400">診断URL: </span>
              <span className="text-xs md:text-sm break-words">{url}</span>
            </div>
          </div>

          {/* ① スコア */}
          <div className="mb-12 md:mb-20">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-400">AI可視性スコア</h2>
              <div className="text-6xl md:text-8xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {displayScore}
                </span>
                <span className="text-3xl md:text-4xl text-gray-600">/100</span>
              </div>
              {(() => {
                const s = result.totalScore;
                const msg = s >= 80
                  ? { text: 'AIに非常に認識されやすい状態です。', color: 'text-green-400' }
                  : s >= 60
                  ? { text: 'AIに認識されやすい状態です。改善でさらに上を目指せます。', color: 'text-blue-400' }
                  : s >= 40
                  ? { text: 'AIに認識されにくい状態です。改善の余地があります。', color: 'text-yellow-400' }
                  : { text: 'AIにほとんど認識されていない状態です。優先して改善しましょう。', color: 'text-red-400' };
                return <p className={`text-sm ${msg.color} mt-2`}>{msg.text}</p>;
              })()}
            </div>
          </div>

          {/* ② AIクロール許可率 */}
          {result.crawlPermission.bots.length > 0 && (
            <div className="mb-16 rounded-2xl border border-white/10 p-8">
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

          {/* ③ 詳細スコア */}
          <div className="mb-16 rounded-2xl border border-white/10 p-8">
            <h3 className="text-2xl font-bold mb-6">詳細スコア</h3>
            <div className="mb-6">
              <RadarChart scores={result.scores} />
            </div>

            {/* Radarの下に一言まとめ */}
            {result.scores.length > 0 && (() => {
              const worst = [...result.scores].sort((a, b) => a.score - b.score)[0];
              const best = [...result.scores].sort((a, b) => b.score - a.score)[0];
              const scoreVal = result.totalScore;
              const level = scoreVal >= 80 ? '非常に高い' : scoreVal >= 60 ? 'まずまず' : '改善の余地がある';
              return (
                <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 leading-relaxed">
                  あなたのサイトのAI可視性は<span className="text-white font-semibold">{level}</span>水準です。
                  <span className="text-green-400 font-medium">「{best.name}」</span>が強みである一方、
                  <span className="text-red-400 font-medium">「{worst.name}」</span>がボトルネックになっています。
                  まずここを改善すると、スコアが大きく伸びる可能性があります。
                </div>
              );
            })()}

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
                      <div className={`h-2 rounded-full ${item.status === 'good' ? 'bg-green-400' : item.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ④ 今やるべき1つ */}
          {result.improvements.high.length > 0 && (
            <div className="mb-10 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-orange-500/15 to-red-500/10 border border-orange-500/30">
              <div className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-3">今すぐやるべき1つ</div>
              <div className="text-lg font-bold mb-2">{result.improvements.high[0].title}</div>
              <div className="text-sm text-gray-400 mb-5">→ {result.improvements.high[0].detail}</div>
              <Link
                href="/guide"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              >
                📚 改善ガイドを見る →
              </Link>
            </div>
          )}

          {/* ④ 改善ポイント全体 */}
          <div className="mb-16 rounded-2xl border border-white/10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h3 className="text-xl md:text-2xl font-bold">⚠️ 改善ポイント一覧</h3>
              <Link href="/guide" className="w-full md:w-auto px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-base font-semibold transition-all hover:scale-105 active:scale-95 text-center">
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

          {/* ⑤ 技術的な内訳（折りたたみ） */}
          {(result.metaDetails || result.semanticDetails || result.mobileDetails || result.performanceDetails) && (
            <div className="mb-12">
              <details className="group">
                <summary className="flex items-center gap-3 cursor-pointer p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all list-none">
                  <span className="text-lg">🔬</span>
                  <span className="font-semibold text-gray-300">技術的な内訳を見る</span>
                  <span className="text-xs text-gray-500 ml-1">（上級者向け）</span>
                  <span className="ml-auto text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                </summary>

                <div className="mt-4 space-y-6 px-1">
                  {/* メタタグ詳細 */}
                  {result.metaDetails?.exists && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                      <h4 className="text-lg font-bold mb-4">🏷️ メタタグ詳細</h4>
                      <div className="mb-5">
                        <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                          📄 基本メタタグ
                          <span className={`text-xs px-2 py-0.5 rounded ${result.metaDetails.basic.titleOptimal && result.metaDetails.basic.descriptionOptimal ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {result.metaDetails.basic.titleOptimal && result.metaDetails.basic.descriptionOptimal ? '最適' : '要改善'}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-300">Title</span>
                              <span className={`text-xs ${result.metaDetails.basic.titleOptimal ? 'text-green-400' : 'text-yellow-400'}`}>{result.metaDetails.basic.titleLength}文字{result.metaDetails.basic.titleOptimal ? ' ✓' : ''}</span>
                            </div>
                            <p className="text-xs text-gray-400 break-words">{result.metaDetails.basic.title}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-300">Description</span>
                              <span className={`text-xs ${result.metaDetails.basic.descriptionOptimal ? 'text-green-400' : 'text-yellow-400'}`}>{result.metaDetails.basic.descriptionLength}文字{result.metaDetails.basic.descriptionOptimal ? ' ✓' : ''}</span>
                            </div>
                            <p className="text-xs text-gray-400 break-words">{result.metaDetails.basic.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-5">
                        <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                          🌐 OGP
                          <span className={`text-xs px-2 py-0.5 rounded ${result.metaDetails.ogp.completeness >= 4 ? 'bg-green-500/20 text-green-400' : result.metaDetails.ogp.completeness >= 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{result.metaDetails.ogp.completeness}/5項目</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          {[['og:title', result.metaDetails.ogp.ogTitle], ['og:type', result.metaDetails.ogp.ogType], ['og:url', result.metaDetails.ogp.ogUrl], ['og:image', result.metaDetails.ogp.ogImage]].map(([k, v]) => (
                            <div key={k} className="p-2 rounded-lg bg-white/5 border border-white/10 min-w-0">
                              <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                              <div className="text-xs break-words overflow-hidden">{v}</div>
                            </div>
                          ))}
                          <div className="md:col-span-2 p-2 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-xs text-gray-500 mb-0.5">og:description</div>
                            <div className="text-xs break-words">{result.metaDetails.ogp.ogDescription}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                          🐦 Twitter Card
                          <span className={`text-xs px-2 py-0.5 rounded ${result.metaDetails.twitter.completeness >= 3 ? 'bg-green-500/20 text-green-400' : result.metaDetails.twitter.completeness >= 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{result.metaDetails.twitter.completeness}/4項目</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          {[['twitter:card', result.metaDetails.twitter.twitterCard], ['twitter:title', result.metaDetails.twitter.twitterTitle], ['twitter:image', result.metaDetails.twitter.twitterImage], ['twitter:description', result.metaDetails.twitter.twitterDescription]].map(([k, v]) => (
                            <div key={k} className="p-2 rounded-lg bg-white/5 border border-white/10 min-w-0">
                              <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                              <div className="text-xs break-words overflow-hidden">{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* セマンティックHTML詳細 */}
                  {result.semanticDetails?.exists && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                      <h4 className="text-lg font-bold mb-4">🏗️ セマンティックHTML詳細</h4>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                          📐 セマンティックタグ
                          <span className={`text-xs px-2 py-0.5 rounded ${result.semanticDetails.semanticTags.count >= 5 ? 'bg-green-500/20 text-green-400' : result.semanticDetails.semanticTags.count >= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{result.semanticDetails.semanticTags.count}/7タグ</span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                          {[['header', result.semanticDetails.semanticTags.hasHeader], ['nav', result.semanticDetails.semanticTags.hasNav], ['main', result.semanticDetails.semanticTags.hasMain], ['article', result.semanticDetails.semanticTags.hasArticle], ['section', result.semanticDetails.semanticTags.hasSection], ['aside', result.semanticDetails.semanticTags.hasAside], ['footer', result.semanticDetails.semanticTags.hasFooter]].map(([name, used]) => (
                            <div key={name} className={`p-2 rounded-lg border text-center ${used ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                              <code className="text-xs">{name}</code>
                              <div className={`text-xs mt-0.5 ${used ? 'text-green-400' : 'text-red-400'}`}>{used ? '✓' : '✗'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-3">📊 見出し階層</div>
                        <div className="grid grid-cols-4 gap-2">
                          {[['H1', result.semanticDetails.headingStructure.h1Count], ['H2', result.semanticDetails.headingStructure.h2Count], ['H3', result.semanticDetails.headingStructure.h3Count], ['H4', result.semanticDetails.headingStructure.h4Count]].map(([h, c]) => (
                            <div key={h} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                              <div className="text-xs text-gray-400 mb-1">{h}</div>
                              <div className="text-xl font-bold">{c}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* モバイル対応詳細 */}
                  {result.mobileDetails?.exists && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                      <h4 className="text-lg font-bold mb-4">📱 モバイル対応詳細</h4>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Viewport</div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <code className="text-xs text-gray-400 break-words">{result.mobileDetails.viewport.content}</code>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs ${result.mobileDetails.viewport.hasWidthDevice ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{result.mobileDetails.viewport.hasWidthDevice ? '✓' : '✗'} width=device-width</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${result.mobileDetails.viewport.hasInitialScale ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{result.mobileDetails.viewport.hasInitialScale ? '✓' : '✗'} initial-scale=1</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">メディアクエリ</div>
                          <div className="text-xl font-bold">{result.mobileDetails.responsive.mediaQueryCount}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">レイアウト</div>
                          <div className="flex gap-2 mt-1">
                            {result.mobileDetails.responsive.hasFlexbox && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Flexbox</span>}
                            {result.mobileDetails.responsive.hasGrid && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Grid</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* パフォーマンス詳細 */}
                  {result.performanceDetails?.exists && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                      <h4 className="text-lg font-bold mb-4">⚡ パフォーマンス詳細</h4>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-3">🖼️ 画像最適化</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                            <div className="text-xs text-gray-400 mb-1">総画像数</div>
                            <div className="text-xl font-bold">{result.performanceDetails.images.totalCount}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                            <div className="text-xs text-gray-400 mb-1">遅延読込</div>
                            <div className="text-xl font-bold">{result.performanceDetails.images.lazyLoadRatio}%</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                            <div className="text-xs text-gray-400 mb-1">ALT設定</div>
                            <div className="text-xl font-bold">{result.performanceDetails.images.altTextRatio}%</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-3">📜 スクリプト</div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-xs text-gray-400 mb-1">総数 / 外部</div>
                            <div className="text-sm">{result.performanceDetails.scripts.totalCount} / {result.performanceDetails.scripts.externalCount}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="text-xs text-gray-400 mb-1">非同期読込</div>
                            <div className="flex gap-1 mt-1">
                              {result.performanceDetails.scripts.hasDeferScripts && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">defer</span>}
                              {result.performanceDetails.scripts.hasAsyncScripts && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">async</span>}
                              {!result.performanceDetails.scripts.hasDeferScripts && !result.performanceDetails.scripts.hasAsyncScripts && <span className="text-red-400 text-xs">✗ 未使用</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* ⑥ トラッキングコード */}
          <div className="mb-16 rounded-2xl border border-blue-500/20 p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="text-4xl">🤖</div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl font-bold mb-2">AI訪問トラッキング</h3>
                <p className="text-sm md:text-base text-gray-400">AIに見つかるだけでなく、AIに訪問された瞬間を観測できます。</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <span>📊</span><span>トラッキングコードを設置</span>
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  以下のコードをサイトの <code className="px-2 py-1 bg-black/30 rounded text-blue-400">&lt;head&gt;</code> タグ内に追加してください
                </p>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-black/50 border border-white/10 overflow-x-auto text-xs md:text-sm">
                    <code className="text-green-400 text-xs break-all">
                      {`<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>\n<a href="https://ai-kansoku.com/api/track/honeypot?siteId=${siteId}" style="display:none;position:absolute;left:-9999px;" aria-hidden="true" tabindex="-1"></a>`}
                    </code>
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>\n<a href="https://ai-kansoku.com/api/track/honeypot?siteId=${siteId}" style="display:none;position:absolute;left:-9999px;" aria-hidden="true" tabindex="-1"></a>`);
                      alert('コピーしました！');
                    }}
                    className="absolute top-2 right-2 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-xs font-medium transition-all"
                  >
                    📋 コピー
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ⑦ 継続観測への導線（課金フェーズの土台） */}
          <div className="mb-12 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔭</span>
              <h3 className="text-xl font-bold">継続観測で、AIの行動を追跡する</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              1回の診断だけでなく、AIクローラーが実際にいつ・どのページを訪れたか。<br />
              観測ダッシュボードでリアルタイムに追跡できます。
            </p>
            <Link
              href={`/dashboard?siteId=${siteId}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl font-semibold transition-all hover:scale-105 text-white"
            >
              観測ダッシュボードへ →
            </Link>
          </div>

          {/* ⑧ アクションボタン */}
          <div className="flex flex-col md:flex-row gap-4 justify-center px-4">
            <Link href="/" className="w-full md:flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold transition-all hover:scale-105 text-center">
              🔄 再診断する
            </Link>
            <ShareDropdown
              url={url}
              totalScore={result.totalScore}
              PDFDownloadLink={PDFDownloadLink}
              PDFReport={PDFReport}
              pdfData={pdfData}
              isClient={isClient}
            />
          </div>

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