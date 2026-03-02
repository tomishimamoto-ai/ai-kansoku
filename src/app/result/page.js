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

function getActionableImprovements(analyzedData) {
  if (!analyzedData) return { urgent: [], recommended: [], completed: [] };
  const scores = analyzedData.scores || {};
  const details = analyzedData.details || {};
  const urgent = [];
  const recommended = [];
  const completed = [];

  // メタタグ
  if (scores.metaTags < 40) {
    urgent.push({
      id: 'metaTags',
      icon: '🏷️',
      title: 'OGP・メタタグの設定',
      reason: !details.metaTags?.ogp?.hasOgp ? 'OGPが未設定のため、SNSシェア時に画像が表示されません' : 'Twitter Cardが未設定です',
      action: 'og:title, og:image, og:descriptionを<head>に追加してください',
      scoreGain: '+15〜20点見込み',
      difficulty: '⭐ 簡単',
    });
  } else if (scores.metaTags < 70) {
    recommended.push({
      id: 'metaTags',
      icon: '🏷️',
      title: 'メタタグの充実',
      reason: 'OGP・Twitter Cardが一部未設定です',
      action: '不足しているOGPタグを追加してください',
      scoreGain: '+5〜10点見込み',
      difficulty: '⭐ 簡単',
    });
  } else {
    completed.push({ icon: '🏷️', title: 'メタタグ設定済み' });
  }

  // パフォーマンス
  if (scores.performance < 40) {
    urgent.push({
      id: 'performance',
      icon: '⚡',
      title: 'パフォーマンスの改善',
      reason: `画像${details.performance?.images?.totalCount || 0}枚中lazy loadが${details.performance?.images?.lazyLoadCount || 0}枚のみ（${details.performance?.images?.lazyLoadRatio || 0}%）`,
      action: '全画像にloading="lazy"を追加。deferスクリプトの活用も有効です',
      scoreGain: '+10〜20点見込み',
      difficulty: '⭐⭐ 普通',
    });
  } else if (scores.performance < 70) {
    recommended.push({
      id: 'performance',
      icon: '⚡',
      title: 'パフォーマンスの最適化',
      reason: `画像のlazy load率が${details.performance?.images?.lazyLoadRatio || 0}%にとどまっています`,
      action: `残り${(details.performance?.images?.totalCount || 0) - (details.performance?.images?.lazyLoadCount || 0)}枚の画像にloading="lazy"を追加`,
      scoreGain: '+5〜10点見込み',
      difficulty: '⭐ 簡単',
    });
  } else {
    completed.push({ icon: '⚡', title: 'パフォーマンス最適化済み' });
  }

  // サイトマップ
  if (scores.sitemap < 40) {
    urgent.push({
      id: 'sitemap',
      icon: '🗺️',
      title: 'sitemap.xmlの作成',
      reason: 'サイトマップが存在しないため、AIがページ構造を把握できません',
      action: 'sitemap.xmlを作成し、/public/に配置してください',
      scoreGain: '+15点見込み',
      difficulty: '⭐ 簡単',
    });
  } else if (scores.sitemap < 70) {
    const missing = [];
    if (!details.sitemap?.hasLastmod) missing.push('lastmod');
    if (!details.sitemap?.hasPriority) missing.push('priority');
    if (!details.sitemap?.hasChangefreq) missing.push('changefreq');
    if (missing.length > 0) {
      recommended.push({
        id: 'sitemap',
        icon: '🗺️',
        title: 'サイトマップの充実',
        reason: `${missing.join('、')}が未設定のため、AIに更新情報が伝わりにくい状態です`,
        action: `sitemap.xmlの各URLに${missing.join('、')}を追加してください`,
        scoreGain: '+5〜10点見込み',
        difficulty: '⭐ 簡単',
      });
    }
  } else {
    completed.push({ icon: '🗺️', title: 'サイトマップ設定済み' });
  }

  // 構造化データ
  if (scores.structuredData === 0) {
    urgent.push({
      id: 'structuredData',
      icon: '📊',
      title: '構造化データの実装',
      reason: 'JSON-LD形式の構造化データが未設定です',
      action: 'Schema.orgのWebSite・Organizationスキーマを<head>に追加してください',
      scoreGain: '+15〜25点見込み',
      difficulty: '⭐⭐ 普通',
    });
  } else if (scores.structuredData < 70) {
    recommended.push({
      id: 'structuredData',
      icon: '📊',
      title: '構造化データの充実',
      reason: `現在${details.structuredData?.schemaCount || 0}種類のスキーマのみ設定されています`,
      action: 'BreadcrumbList、Article、FAQPageなど用途に合ったスキーマを追加してください',
      scoreGain: '+5〜10点見込み',
      difficulty: '⭐⭐ 普通',
    });
  } else {
    completed.push({ icon: '📊', title: '構造化データ実装済み' });
  }

  // セマンティックHTML
  if (scores.semanticHTML < 40) {
    urgent.push({
      id: 'semanticHTML',
      icon: '🏗️',
      title: 'セマンティックHTMLの改善',
      reason: 'header、main、articleなど意味のあるHTMLタグが不足しています',
      action: 'divをheader、nav、main、article、sectionに置き換えてください',
      scoreGain: '+10〜15点見込み',
      difficulty: '⭐⭐ 普通',
    });
  } else if (scores.semanticHTML < 70) {
    const missing = [];
    if (!details.semanticHTML?.semanticTags?.hasMain) missing.push('main');
    if (!details.semanticHTML?.semanticTags?.hasArticle) missing.push('article');
    if (!details.semanticHTML?.semanticTags?.hasFooter) missing.push('footer');
    if (missing.length > 0) {
      recommended.push({
        id: 'semanticHTML',
        icon: '🏗️',
        title: 'セマンティックタグの追加',
        reason: `${missing.join('、')}タグが未使用です`,
        action: `コンテンツ構造に合わせて${missing.join('、')}タグを追加してください`,
        scoreGain: '+3〜8点見込み',
        difficulty: '⭐ 簡単',
      });
    }
  } else {
    completed.push({ icon: '🏗️', title: 'セマンティックHTML実装済み' });
  }

  // robots.txt
  if (scores.robotsTxt < 70) {
    urgent.push({
      id: 'robotsTxt',
      icon: '🤖',
      title: 'robots.txtの改善',
      reason: details.robotsTxt?.exists ? 'User-Agentの設定が不十分です' : 'robots.txtが存在しません',
      action: 'GPTBot、ClaudeBot、PerplexityBotを明示的に許可してください',
      scoreGain: '+10〜20点見込み',
      difficulty: '⭐ 簡単',
    });
  } else {
    completed.push({ icon: '🤖', title: 'robots.txt設定済み' });
  }

  // llms.txt
  if (scores.llmsTxt === 0) {
    recommended.push({
      id: 'llmsTxt',
      icon: '📝',
      title: 'llms.txtの作成',
      reason: 'AI専用のサイト情報ファイルが未設定です',
      action: '/llms.txtを作成してサイトの概要・主要ページを記述してください',
      scoreGain: '+10〜15点見込み',
      difficulty: '⭐ 簡単',
    });
  } else if (scores.llmsTxt < 70) {
    recommended.push({
      id: 'llmsTxt',
      icon: '📝',
      title: 'llms.txtの品質向上',
      reason: '構造化が不十分です',
      action: 'タイトル、要約、主要ページリンクを整理して追加してください',
      scoreGain: '+3〜8点見込み',
      difficulty: '⭐ 簡単',
    });
  } else {
    completed.push({ icon: '📝', title: 'llms.txt実装済み' });
  }

  // モバイル
  if (scores.mobileOptimization >= 70) {
    completed.push({ icon: '📱', title: 'モバイル対応済み' });
  } else if (scores.mobileOptimization < 40) {
    urgent.push({
      id: 'mobileOptimization',
      icon: '📱',
      title: 'モバイル対応の実装',
      reason: 'viewportメタタグが未設定またはレスポンシブデザインが不十分です',
      action: '<meta name="viewport" content="width=device-width, initial-scale=1">を追加してください',
      scoreGain: '+10〜20点見込み',
      difficulty: '⭐ 簡単',
    });
  }

  return { urgent, recommended, completed };
}

// 改善カード単体コンポーネント（チェック機能付き）
function ImprovementCard({ item, priority, checkedItems, onCheck, prevScores, currentScores }) {
  const isChecked = checkedItems[item.id] || false;

  // 前回チェックして今回スコアが上がったか判定
  const wasImproved = prevScores && currentScores &&
    checkedItems[item.id] &&
    (currentScores[item.id] || 0) > (prevScores[item.id] || 0);

  const borderColor = priority === 'urgent'
    ? 'border-red-500/20 bg-red-500/5'
    : 'border-yellow-500/15 bg-yellow-500/3';

  return (
    <div className={`relative p-4 rounded-xl border transition-all ${isChecked ? 'opacity-60 border-white/10 bg-white/3' : borderColor}`}>
      {wasImproved && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full animate-pulse">
          ✨ 反映済み
        </div>
      )}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="shrink-0">{item.icon}</span>
          <span className={`font-semibold text-sm ${isChecked ? 'line-through text-gray-500' : ''}`}>{item.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">{item.scoreGain}</span>
          <span className="text-xs text-gray-500">{item.difficulty}</span>
        </div>
      </div>
      {!isChecked && (
        <>
          <p className="text-xs text-gray-400 mb-1">
            {priority === 'urgent' ? '⚠️' : '💡'} {item.reason}
          </p>
          <p className="text-xs text-blue-300 mb-3">→ {item.action}</p>
        </>
      )}
      <button
        onClick={() => onCheck(item.id)}
        className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
          isChecked
            ? 'bg-green-500/20 border-green-500/30 text-green-400'
            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
        }`}
      >
        {isChecked ? '✅ 実施済み' : '☐ 実施した'}
      </button>
    </div>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || 'https://example.com';
  const siteId = searchParams.get('siteId') || generateSiteId(url);

  const [displayScore, setDisplayScore] = useState(0);
  const [PDFReport, setPDFReport] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [isTrackingInstalled, setIsTrackingInstalled] = useState(false);
  const [prevScore, setPrevScore] = useState(null);
  const [prevScores, setPrevScores] = useState(null);
  const [crawlOpen, setCrawlOpen] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});
  const [achievements, setAchievements] = useState([]);

  const apiData = searchParams.get('data');
  let analyzedData = null;
  if (apiData) {
    try { analyzedData = JSON.parse(apiData); } catch (e) {}
  }

  const totalScore = analyzedData?.totalScore || 67;
  const currentScores = analyzedData?.scores || {};

  // 次の目標ライン
  const getNextTarget = (score) => {
    if (score < 60) return { target: 60, label: '標準ライン', diff: 60 - score };
    if (score < 80) return { target: 80, label: '優良ライン', diff: 80 - score };
    if (score < 90) return { target: 90, label: '上位ライン', diff: 90 - score };
    return null;
  };
  const nextTarget = getNextTarget(totalScore);

  const saveToHistory = (url, score, data) => {
    if (typeof window === 'undefined') return;
    try {
      const historyStr = localStorage.getItem('aiObservatoryHistory');
      const history = historyStr ? JSON.parse(historyStr) : [];
      const prev = history.find(item => item.url === url);
      if (prev) {
        setPrevScore(prev.score);
        if (prev.data?.scores) setPrevScores(prev.data.scores);
      }
      const newEntry = { url, score, date: new Date().toISOString(), data };
      const filteredHistory = history.filter(item => item.url !== url);
      filteredHistory.unshift(newEntry);
      localStorage.setItem('aiObservatoryHistory', JSON.stringify(filteredHistory.slice(0, 10)));
    } catch (error) {}
  };

  // 成果演出の計算
  const calcAchievements = (prev, current, prevS, currentS, checked) => {
    const results = [];
    if (!prev || !prevS) return results;

    const scoreDiff = current - prev;
    if (scoreDiff > 0) {
      results.push({
        type: 'total',
        emoji: scoreDiff >= 10 ? '🔥' : '✨',
        text: `改善成功！スコアが${scoreDiff}点アップしました`,
      });
    }

    // チェック済み項目で上がったものを検出
    const itemNameMap = {
      metaTags: 'メタタグ',
      performance: 'パフォーマンス',
      sitemap: 'サイトマップ',
      structuredData: '構造化データ',
      semanticHTML: 'セマンティックHTML',
      robotsTxt: 'robots.txt',
      llmsTxt: 'llms.txt',
      mobileOptimization: 'モバイル対応',
    };
    Object.entries(checked).forEach(([id, done]) => {
      if (done && prevS[id] !== undefined && currentS[id] !== undefined) {
        const diff = currentS[id] - prevS[id];
        if (diff > 0) {
          results.push({
            type: 'item',
            emoji: '🟢',
            text: `${itemNameMap[id] || id}の改善が反映されました（+${diff}点）`,
          });
        }
      }
    });

    return results;
  };

  const result = analyzedData ? {
    totalScore,
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
      { icon: '📊', name: '構造化データ', score: currentScores.structuredData || 0, status: (currentScores.structuredData || 0) > 70 ? 'good' : (currentScores.structuredData || 0) > 40 ? 'warning' : 'bad' },
      { icon: '🤖', name: 'robots.txt', score: currentScores.robotsTxt || 0, status: (currentScores.robotsTxt || 0) > 70 ? 'good' : (currentScores.robotsTxt || 0) > 40 ? 'warning' : 'bad' },
      { icon: '🗺️', name: 'サイトマップ', score: currentScores.sitemap || 0, status: (currentScores.sitemap || 0) > 70 ? 'good' : 'bad' },
      { icon: '📝', name: 'llms.txt', score: currentScores.llmsTxt || 0, status: (currentScores.llmsTxt || 0) > 70 ? 'good' : (currentScores.llmsTxt || 0) > 40 ? 'warning' : 'bad' },
      { icon: '🏷️', name: 'メタタグ', score: currentScores.metaTags || 0, status: (currentScores.metaTags || 0) > 70 ? 'good' : (currentScores.metaTags || 0) > 40 ? 'warning' : 'bad' },
      { icon: '🏗️', name: 'セマンティックHTML', score: currentScores.semanticHTML || 0, status: (currentScores.semanticHTML || 0) > 70 ? 'good' : (currentScores.semanticHTML || 0) > 40 ? 'warning' : 'bad' },
      { icon: '📱', name: 'モバイル対応', score: currentScores.mobileOptimization || 0, status: (currentScores.mobileOptimization || 0) > 70 ? 'good' : (currentScores.mobileOptimization || 0) > 40 ? 'warning' : 'bad' },
      { icon: '⚡', name: 'パフォーマンス', score: currentScores.performance || 0, status: (currentScores.performance || 0) > 70 ? 'good' : (currentScores.performance || 0) > 40 ? 'warning' : 'bad' }
    ],
    metaDetails: analyzedData.details?.metaTags || null,
    semanticDetails: analyzedData.details?.semanticHTML || null,
    mobileDetails: analyzedData.details?.mobileOptimization || null,
    performanceDetails: analyzedData.details?.performance || null,
  } : {
    totalScore: 67,
    crawlPermission: { allowed: 3, total: 5, bots: [] },
    scores: [],
    metaDetails: null, semanticDetails: null, mobileDetails: null, performanceDetails: null,
  };

  const improvements = getActionableImprovements(analyzedData);
  const scoreDiff = prevScore !== null ? totalScore - prevScore : null;
  const pdfData = { url, totalScore: result.totalScore, scores: result.scores, improvements: { high: improvements.urgent, medium: improvements.recommended, completed: improvements.completed } };

  const handleCheck = (id) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`checkedItems_${siteId}`, JSON.stringify(next));
    }
  };

  useEffect(() => {
    let start = 0;
    const end = totalScore;
    const duration = 2000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setDisplayScore(end); clearInterval(timer); }
      else { setDisplayScore(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [totalScore]);

  useEffect(() => {
    if (url && totalScore && analyzedData) saveToHistory(url, totalScore, analyzedData);
  }, [url, totalScore]);

  useEffect(() => {
    setIsClient(true);
    import('../components/PDFReport').then((mod) => setPDFReport(() => mod.default));
    const installed = localStorage.getItem(`trackingInstalled_${siteId}`);
    if (installed) setIsTrackingInstalled(true);
    // チェック済みアイテムを復元
    const saved = localStorage.getItem(`checkedItems_${siteId}`);
    if (saved) {
      try { setCheckedItems(JSON.parse(saved)); } catch (e) {}
    }
  }, [siteId]);

  // 成果演出を計算（prevScore・prevScoresが揃ったら）
  useEffect(() => {
    if (prevScore !== null && prevScores) {
      const a = calcAchievements(prevScore, totalScore, prevScores, currentScores, checkedItems);
      setAchievements(a);
    }
  }, [prevScore, prevScores]);

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(
      `<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>\n<a href="https://ai-kansoku.com/api/track/honeypot?siteId=${siteId}" style="display:none;position:absolute;left:-9999px;" aria-hidden="true" tabindex="-1"></a>`
    );
    localStorage.setItem(`trackingInstalled_${siteId}`, 'true');
    setIsTrackingInstalled(true);
    alert('コピーしました！サイトのheadタグに貼り付けてください。');
  };

  const getScoreLabel = (s) => {
    if (s >= 80) return { label: 'ページ構造は非常に健全です', color: 'text-green-400' };
    if (s >= 60) return { label: 'ページ構造は健全です。改善余地があります', color: 'text-blue-400' };
    if (s >= 40) return { label: '改善余地があります', color: 'text-yellow-400' };
    return { label: 'まず基本的な設定から始めましょう', color: 'text-red-400' };
  };
  const scoreLabel = getScoreLabel(totalScore);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

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
          <div className="mb-6">
            <div className="inline-block px-3 md:px-4 py-2 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs md:text-sm text-gray-400">診断URL: </span>
              <span className="text-xs md:text-sm break-words">{url}</span>
            </div>
          </div>

          {/* ① スコア */}
          <div className="mb-8">
            <div className="text-center mb-4">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-400">AI可視性スコア</h2>
              <div className="text-6xl md:text-8xl font-bold mb-3">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {displayScore}
                </span>
                <span className="text-3xl md:text-4xl text-gray-600">/100</span>
              </div>

              {/* スコアメッセージ（健全性寄り） */}
              <p className={`text-sm ${scoreLabel.color} mb-3`}>{scoreLabel.label}</p>

              {/* あと少し感 */}
              {nextTarget && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400">
                  <span>🎯</span>
                  <span>あと<span className="text-white font-bold">{nextTarget.diff}点</span>で{nextTarget.target}点（{nextTarget.label}）</span>
                </div>
              )}
            </div>

            {/* 成果演出バナー */}
            {achievements.length > 0 && (
              <div className="mt-5 space-y-2">
                {achievements.map((a, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium
                    ${a.type === 'total'
                      ? 'bg-green-500/15 border-green-500/30 text-green-300'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
                    <span className="text-lg">{a.emoji}</span>
                    <span>{a.text}</span>
                  </div>
                ))}
                {nextTarget && scoreDiff && scoreDiff > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-purple-500/10 border-purple-500/20 text-purple-300 text-sm">
                    <span className="text-lg">🎉</span>
                    <span>{nextTarget.label}まであと{nextTarget.diff}点</span>
                  </div>
                )}
              </div>
            )}

            {/* ダッシュボードショートカット（設置済みのみ） */}
            {isTrackingInstalled && (
              <div className="mt-5 flex justify-center">
                <Link
                  href={`/dashboard?siteId=${siteId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl text-sm font-medium transition-all hover:scale-105 text-purple-300"
                >
                  📊 ダッシュボードで改善効果を確認 →
                </Link>
              </div>
            )}
          </div>

          {/* ② 次にやること（主役） */}
          <div className="mb-8 rounded-2xl border border-white/10 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold">🎯 次にやること</h3>
                {improvements.urgent.length === 0 && improvements.recommended.length === 0 && (
                  <p className="text-sm text-green-400 mt-1">すべての改善が完了しています 🎉</p>
                )}
              </div>
              <Link href="/guide" className="w-full md:w-auto px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-sm font-semibold transition-all text-center">
                📚 改善ガイドを見る
              </Link>
            </div>

            {/* 優先度高 */}
            {improvements.urgent.length > 0 && (
              <div className="mb-6">
                <div className="text-xs text-red-400 font-bold uppercase tracking-widest mb-3">優先度 高</div>
                <div className="space-y-3">
                  {improvements.urgent.map((item) => (
                    <ImprovementCard
                      key={item.id}
                      item={item}
                      priority="urgent"
                      checkedItems={checkedItems}
                      onCheck={handleCheck}
                      prevScores={prevScores}
                      currentScores={currentScores}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 優先度中 */}
            {improvements.recommended.length > 0 && (
              <div className="mb-6">
                <div className="text-xs text-yellow-400 font-bold uppercase tracking-widest mb-3">優先度 中</div>
                <div className="space-y-3">
                  {improvements.recommended.map((item) => (
                    <ImprovementCard
                      key={item.id}
                      item={item}
                      priority="recommended"
                      checkedItems={checkedItems}
                      onCheck={handleCheck}
                      prevScores={prevScores}
                      currentScores={currentScores}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 対応済み */}
            {improvements.completed.length > 0 && (
              <div>
                <div className="text-xs text-green-400 font-bold uppercase tracking-widest mb-3">対応済み</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {improvements.completed.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/15 text-xs text-gray-400">
                      <span className="text-green-400">{item.icon}</span>
                      <span>{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ③ ダッシュボード導線（感情に訴える新コピー） */}
          <div className="mb-8 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/8 to-blue-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl shrink-0">🔭</div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">改善した内容は、AIクローラーにちゃんと届いています。</h3>
                <p className="text-sm text-gray-400 mb-4">
                  実際にどのAIが訪問しているか、一緒に見てみましょう。
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/8 hover:bg-white/15 border border-white/15 rounded-xl text-sm font-medium transition-all">
                    🔄 改善後に再診断する
                  </Link>
                  <Link
                    href={`/dashboard?siteId=${siteId}`}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                  >
                    📊 観測ダッシュボードへ →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ④ AIクロール許可率（アコーディオン・小さめ） */}
          {result.crawlPermission.bots.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setCrawlOpen(!crawlOpen)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm">🎯</span>
                  <span className="text-sm font-medium text-gray-300">AIクロール許可率</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
                    ${result.crawlPermission.allowed === result.crawlPermission.total
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {result.crawlPermission.allowed}/{result.crawlPermission.total}社許可
                  </span>
                </div>
                <span className={`text-gray-400 text-xs transition-transform duration-200 ${crawlOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {crawlOpen && (
                <div className="mt-1 p-4 rounded-xl bg-white/3 border border-white/10 space-y-2">
                  {result.crawlPermission.bots.map((bot, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${bot.allowed ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-sm">{bot.name}</span>
                        <span className="text-xs text-gray-500">({bot.agent})</span>
                      </div>
                      <span className={`text-xs ${bot.allowed ? 'text-green-400' : 'text-red-400'}`}>
                        {bot.allowed ? '✅ 許可' : '❌ ブロック'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ⑤ 詳細スコア（折りたたみ） */}
          <div className="mb-4">
            <button
              onClick={() => setRadarOpen(!radarOpen)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">📡</span>
                <span className="text-sm font-medium text-gray-300">詳細スコアを見る</span>
                <span className="text-xs text-gray-500">（レーダーチャート）</span>
              </div>
              <span className={`text-gray-400 text-xs transition-transform duration-200 ${radarOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {radarOpen && (
              <div className="mt-1 p-6 rounded-xl bg-white/3 border border-white/10">
                <RadarChart scores={result.scores} />
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  {result.scores.map((item, i) => {
                    const color = item.status === 'good' ? 'from-green-500/20 to-green-500/5 border-green-500/30'
                      : item.status === 'warning' ? 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30'
                      : 'from-red-500/20 to-red-500/5 border-red-500/30';
                    return (
                      <div key={i} className={`p-3 rounded-xl bg-gradient-to-br ${color} border`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="text-xl font-bold">{item.score}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${item.status === 'good' ? 'bg-green-400' : item.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`}
                            style={{ width: `${item.score}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ⑥ 技術的な内訳（折りたたみ） */}
          {(result.metaDetails || result.semanticDetails || result.mobileDetails || result.performanceDetails) && (
            <div className="mb-8">
              <details className="group">
                <summary className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all list-none">
                  <span className="text-sm">🔬</span>
                  <span className="text-sm font-medium text-gray-300">技術的な内訳を見る</span>
                  <span className="text-xs text-gray-500 ml-1">（上級者向け）</span>
                  <span className="ml-auto text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
                </summary>
                <div className="mt-2 space-y-4 px-1">

                  {result.metaDetails?.exists && (
                    <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                      <h4 className="font-bold mb-4">🏷️ メタタグ詳細</h4>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                          📄 基本メタタグ
                          <span className={`text-xs px-2 py-0.5 rounded ${result.metaDetails.basic?.titleOptimal && result.metaDetails.basic?.descriptionOptimal ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {result.metaDetails.basic?.titleOptimal && result.metaDetails.basic?.descriptionOptimal ? '最適' : '要改善'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-300">Title</span>
                              <span className={`text-xs ${result.metaDetails.basic?.titleOptimal ? 'text-green-400' : 'text-yellow-400'}`}>{result.metaDetails.basic?.titleLength}文字</span>
                            </div>
                            <p className="text-xs text-gray-400 break-words">{result.metaDetails.basic?.title}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-gray-300">Description</span>
                              <span className={`text-xs ${result.metaDetails.basic?.descriptionOptimal ? 'text-green-400' : 'text-yellow-400'}`}>{result.metaDetails.basic?.descriptionLength}文字</span>
                            </div>
                            <p className="text-xs text-gray-400 break-words">{result.metaDetails.basic?.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                          🌐 OGP
                          <span className={`text-xs px-2 py-0.5 rounded ${(result.metaDetails.ogp?.completeness || 0) >= 4 ? 'bg-green-500/20 text-green-400' : (result.metaDetails.ogp?.completeness || 0) >= 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{result.metaDetails.ogp?.completeness}/5項目</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          {[['og:title', result.metaDetails.ogp?.ogTitle], ['og:type', result.metaDetails.ogp?.ogType], ['og:url', result.metaDetails.ogp?.ogUrl], ['og:image', result.metaDetails.ogp?.ogImage], ['og:description', result.metaDetails.ogp?.ogDescription]].map(([k, v]) => (
                            <div key={k} className="p-2 rounded-lg bg-white/5 border border-white/10 min-w-0">
                              <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                              <div className="text-xs break-words">{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                          🐦 Twitter Card
                          <span className={`text-xs px-2 py-0.5 rounded ${(result.metaDetails.twitter?.completeness || 0) >= 3 ? 'bg-green-500/20 text-green-400' : (result.metaDetails.twitter?.completeness || 0) >= 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{result.metaDetails.twitter?.completeness}/4項目</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-2">
                          {[['twitter:card', result.metaDetails.twitter?.twitterCard], ['twitter:title', result.metaDetails.twitter?.twitterTitle], ['twitter:image', result.metaDetails.twitter?.twitterImage], ['twitter:description', result.metaDetails.twitter?.twitterDescription]].map(([k, v]) => (
                            <div key={k} className="p-2 rounded-lg bg-white/5 border border-white/10 min-w-0">
                              <div className="text-xs text-gray-500 mb-0.5">{k}</div>
                              <div className="text-xs break-words">{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {result.semanticDetails?.exists && (
                    <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                      <h4 className="font-bold mb-4">🏗️ セマンティックHTML詳細</h4>
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                          セマンティックタグ
                          <span className={`text-xs px-2 py-0.5 rounded ${(result.semanticDetails.semanticTags?.count || 0) >= 5 ? 'bg-green-500/20 text-green-400' : (result.semanticDetails.semanticTags?.count || 0) >= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{result.semanticDetails.semanticTags?.count}/7タグ</span>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                          {[['header', result.semanticDetails.semanticTags?.hasHeader], ['nav', result.semanticDetails.semanticTags?.hasNav], ['main', result.semanticDetails.semanticTags?.hasMain], ['article', result.semanticDetails.semanticTags?.hasArticle], ['section', result.semanticDetails.semanticTags?.hasSection], ['aside', result.semanticDetails.semanticTags?.hasAside], ['footer', result.semanticDetails.semanticTags?.hasFooter]].map(([name, used]) => (
                            <div key={name} className={`p-2 rounded-lg border text-center ${used ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                              <code className="text-xs">{name}</code>
                              <div className={`text-xs mt-0.5 ${used ? 'text-green-400' : 'text-red-400'}`}>{used ? '✓' : '✗'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[['H1', result.semanticDetails.headingStructure?.h1Count], ['H2', result.semanticDetails.headingStructure?.h2Count], ['H3', result.semanticDetails.headingStructure?.h3Count], ['H4', result.semanticDetails.headingStructure?.h4Count]].map(([h, c]) => (
                          <div key={h} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                            <div className="text-xs text-gray-400 mb-1">{h}</div>
                            <div className="text-xl font-bold">{c}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.mobileDetails?.exists && (
                    <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                      <h4 className="font-bold mb-4">📱 モバイル対応詳細</h4>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-3">
                        <code className="text-xs text-gray-400 break-words">{result.mobileDetails.viewport?.content}</code>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs ${result.mobileDetails.viewport?.hasWidthDevice ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{result.mobileDetails.viewport?.hasWidthDevice ? '✓' : '✗'} width=device-width</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${result.mobileDetails.viewport?.hasInitialScale ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{result.mobileDetails.viewport?.hasInitialScale ? '✓' : '✗'} initial-scale=1</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                          <div className="text-xs text-gray-400 mb-1">メディアクエリ</div>
                          <div className="text-xl font-bold">{result.mobileDetails.responsive?.mediaQueryCount}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">レイアウト</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {result.mobileDetails.responsive?.hasFlexbox && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Flexbox</span>}
                            {result.mobileDetails.responsive?.hasGrid && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Grid</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {result.performanceDetails?.exists && (
                    <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                      <h4 className="font-bold mb-4">⚡ パフォーマンス詳細</h4>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                          <div className="text-xs text-gray-400 mb-1">総画像数</div>
                          <div className="text-xl font-bold">{result.performanceDetails.images?.totalCount}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                          <div className="text-xs text-gray-400 mb-1">遅延読込</div>
                          <div className="text-xl font-bold">{result.performanceDetails.images?.lazyLoadRatio}%</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                          <div className="text-xs text-gray-400 mb-1">ALT設定</div>
                          <div className="text-xl font-bold">{result.performanceDetails.images?.altTextRatio}%</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">スクリプト 総数/外部</div>
                          <div className="text-sm">{result.performanceDetails.scripts?.totalCount} / {result.performanceDetails.scripts?.externalCount}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="text-xs text-gray-400 mb-1">非同期読込</div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {result.performanceDetails.scripts?.hasDeferScripts && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">defer</span>}
                            {result.performanceDetails.scripts?.hasAsyncScripts && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">async</span>}
                            {!result.performanceDetails.scripts?.hasDeferScripts && !result.performanceDetails.scripts?.hasAsyncScripts && <span className="text-red-400 text-xs">✗ 未使用</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </details>
            </div>
          )}

          {/* ⑦ トラッキングコード */}
          <div className={`mb-8 rounded-2xl border p-6 md:p-8 ${isTrackingInstalled ? 'border-white/5 bg-white/2' : 'border-blue-500/20'}`}>
            {isTrackingInstalled ? (
              <details>
                <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-500 hover:text-gray-400 transition-colors list-none">
                  <span>📋</span>
                  <span>トラッキングコードを再確認する</span>
                  <span className="ml-auto text-xs">▼</span>
                </summary>
                <div className="mt-4">
                  <pre className="p-4 rounded-lg bg-black/50 border border-white/10 overflow-x-auto text-xs mb-2">
                    <code className="text-green-400 break-all">{`<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>\n<a href="https://ai-kansoku.com/api/track/honeypot?siteId=${siteId}" style="display:none;position:absolute;left:-9999px;" aria-hidden="true" tabindex="-1"></a>`}</code>
                  </pre>
                  <button onClick={handleCopyTracking} className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-all">
                    📋 コードをコピー
                  </button>
                </div>
              </details>
            ) : (
              <>
                <div className="flex items-start gap-4 mb-5">
                  <div className="text-4xl">🤖</div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">AI訪問トラッキング</h3>
                    <p className="text-sm text-gray-400">AIに見つかるだけでなく、AIに訪問された瞬間を観測できます。</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-gray-400 mb-3">
                    以下のコードをサイトの <code className="px-2 py-0.5 bg-black/30 rounded text-blue-400">&lt;head&gt;</code> タグ内に追加してください
                  </p>
                  <pre className="p-4 rounded-lg bg-black/50 border border-white/10 overflow-x-auto text-xs mb-3">
                    <code className="text-green-400 break-all">{`<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>\n<a href="https://ai-kansoku.com/api/track/honeypot?siteId=${siteId}" style="display:none;position:absolute;left:-9999px;" aria-hidden="true" tabindex="-1"></a>`}</code>
                  </pre>
                  <button onClick={handleCopyTracking} className="w-full py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm font-medium transition-all">
                    📋 コードをコピーして設置する
                  </button>
                </div>
              </>
            )}
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