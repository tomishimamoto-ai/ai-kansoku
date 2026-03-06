// src/app/result/ResultContent.js
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

import { useResultData } from './hooks/useResultData';
import { useCountUp } from './hooks/useCountUp';
import { useAchievements } from './hooks/useAchievements';
import { getHealthStatus, getNextTarget } from './constants/healthStatus';

import HealthScore from './components/HealthScore';
import TodayProgress from './components/TodayProgress';
import TodaysMission from './components/TodaysMission';
import OtherImprovements from './components/OtherImprovements';
import DashboardCTA from './components/DashboardCTA';
import CrawlerStatus from './components/CrawlerStatus';
import RadarSection from './components/RadarSection';
import TechDetails from './components/TechDetails';
import TrackingCode from './components/TrackingCode';
import ShareDropdown from '../components/ShareDropdown';
import { useState, useEffect } from 'react';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

// ─── ローディング ──────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080c1a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
        <span className="text-base text-gray-500">観測データを読み込み中...</span>
      </div>
    </div>
  );
}

// ─── データなしエラー ──────────────────────────────────────
function NoDataError({ url }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#080c1a' }}>
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔭</div>
        <h2 className="text-xl font-bold text-white mb-3">診断データが見つかりません</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          診断データの有効期限が切れたか、別のブラウザでアクセスした可能性があります。<br />
          もう一度診断してください。
        </p>
        <Link
          href={url ? `/?url=${encodeURIComponent(url)}` : '/'}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)' }}>
          🔄 再診断する
        </Link>
      </div>
    </div>
  );
}

// ─── メインコンテンツ ──────────────────────────────────────
function ResultContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || 'https://example.com';

  const {
    isClient,
    dataLoaded,
    analyzedData,
    siteId,
    totalScore,
    currentScores,
    improvements,
    prevScore,
    prevScores,
    checkedItems,
    isTrackingInstalled,
    dashPreview,
    handleCheck,
    handleCopyTracking,
    wasImproved,
  } = useResultData(url);

  const displayScore = useCountUp(totalScore);

  const achievements = useAchievements({
    totalScore,
    prevScore,
    prevScores,
    currentScores,
    checkedItems,
  });

  const [PDFReport, setPDFReport] = useState(null);

  useEffect(() => {
  import('../components/PDFReport').then((mod) => setPDFReport(() => mod.default));
}, []);

  // ── ローディング ──
  if (!dataLoaded) return <LoadingScreen />;

  // ── データなし ──
  if (!analyzedData) return <NoDataError url={url} />;

  // ── 確定後の変数 ──
  const health = getHealthStatus(totalScore);
  const nextTarget = getNextTarget(totalScore);

  const scoreCards = [
    { icon: '📊', name: '構造化データ', key: 'structuredData' },
    { icon: '🤖', name: 'robots.txt',   key: 'robotsTxt' },
    { icon: '🗺️', name: 'サイトマップ', key: 'sitemap' },
    { icon: '📝', name: 'llms.txt',     key: 'llmsTxt' },
    { icon: '🏷️', name: 'メタタグ',     key: 'metaTags' },
    { icon: '🏗️', name: 'HTML構造',     key: 'semanticHTML' },
    { icon: '📱', name: 'モバイル',      key: 'mobileOptimization' },
    { icon: '⚡', name: 'パフォーマンス', key: 'performance' },
  ].map((item) => {
    const score = currentScores[item.key] || 0;
    return {
      ...item,
      score,
      status: score >= 70 ? 'good' : score >= 40 ? 'warning' : 'bad',
    };
  });

  const crawlers = analyzedData?.details?.robotsTxt?.crawlers ? [
    { name: 'ChatGPT',   agent: 'GPTBot',          ok: analyzedData.details.robotsTxt.crawlers.chatgpt },
    { name: 'Claude',    agent: 'ClaudeBot',        ok: analyzedData.details.robotsTxt.crawlers.claude },
    { name: 'Gemini',    agent: 'Google-Extended',  ok: analyzedData.details.robotsTxt.crawlers.gemini },
    { name: 'Perplexity',agent: 'PerplexityBot',    ok: analyzedData.details.robotsTxt.crawlers.perplexity },
    { name: 'Cohere',    agent: 'cohere-ai',        ok: analyzedData.details.robotsTxt.crawlers.cohere },
  ] : [];

  const totalPotentialGain = [...improvements.urgent, ...improvements.medium]
    .reduce((sum, item) => sum + (item.gain ?? 0), 0);

  const todaysMission = improvements.urgent[0] || improvements.medium[0] || null;
  const urgentRest = improvements.urgent.slice(1);
  const mediumAll = improvements.urgent[0] ? improvements.medium : improvements.medium.slice(1);

  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const pdfData = {
    url,
    totalScore,
    scores: scoreCards,
    improvements: {
      high: improvements.urgent,
      medium: improvements.medium,
      completed: improvements.completed,
    },
  };

  return (
    <div className="min-h-screen text-white" style={{ background: '#080c1a' }}>

      {/* 背景 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[55vw] h-[55vw] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${health.color}44, transparent 70%)` }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #4a9eff22, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* ヘッダー */}
        <div className="flex items-center justify-between py-5 border-b border-white/8 mb-8 gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="font-bold text-base tracking-wide">AI観測ラボ</span>
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/12 bg-white/5 min-w-0">
              <span className="text-xs text-gray-500 shrink-0">診断中</span>
              <span className="text-xs text-gray-200 font-mono truncate max-w-[180px]">{displayUrl}</span>
            </div>
            <Link href={`/dashboard?siteId=${siteId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all shrink-0">
              <span className="text-sm">📊</span>
              <span className="text-xs text-purple-300 hidden md:block">ダッシュボード</span>
            </Link>
          </div>
        </div>

        {/* SP用URL */}
        <div className="sm:hidden mb-4 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/4">
          <span className="text-xs text-gray-500 shrink-0">診断中</span>
          <span className="text-xs text-gray-200 font-mono truncate">{displayUrl}</span>
        </div>

        {/* ブランドコピー */}
        <div className="mb-7 text-center">
          <p className="text-xs tracking-[0.25em] uppercase font-medium"
            style={{ color: health.color, opacity: 0.7 }}>
            改善を、観測で証明する。
          </p>
        </div>

        <style>{`
          @keyframes badgePop {
            0% { transform: scale(0.7); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* 成果演出 */}
        {achievements.length > 0 && (
          <div className="mb-6 space-y-2">
            {achievements.map((a, i) => (
              <div key={i}
                className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-base font-medium"
                style={{ background: 'rgba(0,255,136,0.07)', borderColor: 'rgba(0,255,136,0.2)', color: '#4ade80' }}>
                <span className="text-xl">{a.emoji}</span>
                <span>{a.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* ① HealthScore */}
        <HealthScore
          health={health}
          displayScore={displayScore}
          totalScore={totalScore}
          prevScore={prevScore}
          nextTarget={nextTarget}
        />

        {/* ② TodayProgress */}
        <TodayProgress
          improvements={improvements}
          checkedItems={checkedItems}
          totalPotentialGain={totalPotentialGain}
        />

        {/* ③ TodaysMission */}
        {todaysMission ? (
          <div className="mb-6">
            <TodaysMission
              item={todaysMission}
              isChecked={!!checkedItems[todaysMission.id]}
              onCheck={handleCheck}
              wasImproved={wasImproved(todaysMission.id)}
              currentScore={totalScore}
              nextTarget={nextTarget}
            />
          </div>
        ) : (
          <div className="mb-6 p-7 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-emerald-300 font-bold text-lg">すべての改善が完了しています</p>
            <p className="text-sm text-gray-500 mt-1.5">引き続き定期的な観測を続けましょう</p>
          </div>
        )}

        {/* ④ OtherImprovements */}
        <OtherImprovements
          urgentRest={urgentRest}
          mediumAll={mediumAll}
          completed={improvements.completed}
          checkedItems={checkedItems}
          onCheck={handleCheck}
          wasImproved={wasImproved}
          totalPotentialGain={totalPotentialGain}
        />

        {/* ⑤ DashboardCTA */}
        <DashboardCTA siteId={siteId} dashPreview={dashPreview} />

        {/* ⑥ CrawlerStatus */}
        <CrawlerStatus crawlers={crawlers} />

        {/* ⑦ RadarSection */}
        <RadarSection scoreCards={scoreCards} />

        {/* ⑧ TechDetails */}
        <TechDetails analyzedData={analyzedData} />

        {/* ⑨ TrackingCode */}
        <TrackingCode
          siteId={siteId}
          isInstalled={isTrackingInstalled}
          onCopy={handleCopyTracking}
        />

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/"
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)', boxShadow: '0 4px 24px rgba(74,158,255,0.25)' }}>
            🔄 再診断する
          </Link>
          <ShareDropdown
            url={url}
            totalScore={totalScore}
            PDFDownloadLink={PDFDownloadLink}
            PDFReport={null}
            pdfData={pdfData}
            isClient={isClient}
          />
        </div>

        {/* フッター */}
        <div className="mt-12 text-center text-sm text-gray-700">
          <Link href="/guide" className="hover:text-gray-500 transition-colors">改善ガイド</Link>
          <span className="mx-3">·</span>
          <Link href="/faq" className="hover:text-gray-500 transition-colors">FAQ</Link>
          <span className="mx-3">·</span>
          <Link href="/how-to-use" className="hover:text-gray-500 transition-colors">使い方</Link>
        </div>
      </div>
    </div>
  );
}

export default ResultContent;