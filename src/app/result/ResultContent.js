// src/app/result/ResultContent.js
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
import { useState } from 'react';

// ─── ローディング ──────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg, #ffffff)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[#2d5be3]/30 border-t-[#2d5be3] animate-spin" />
        <span className="text-sm text-[#888888]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          観測データを読み込み中...
        </span>
      </div>
    </div>
  );
}

// ─── データなしエラー ──────────────────────────────────────
function NoDataError({ url }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#ffffff' }}>
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#e8edfb] flex items-center justify-center text-3xl mx-auto mb-6">
          🔭
        </div>
        <h2 className="text-xl font-bold text-[#111111] mb-3"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          診断データが見つかりません
        </h2>
        <p className="text-sm text-[#888888] mb-8 leading-relaxed">
          診断データの有効期限が切れたか、別のブラウザでアクセスした可能性があります。<br />
          もう一度診断してください。
        </p>
        <Link
          href={url ? `/?url=${encodeURIComponent(url)}` : '/'}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: '#2d5be3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          🔄 再診断する
        </Link>
      </div>
    </div>
  );
}

// ─── メインコンテンツ ──────────────────────────────────────
function ResultContent() {
  const searchParams = useSearchParams();
  const paramUrl = searchParams.get('url');
  const [url] = useState(() => {
  if (paramUrl) return paramUrl;

  if (typeof window === 'undefined') return null;

  try {
    const h = JSON.parse(localStorage.getItem('aiObservatoryHistory') || '[]');
    return h[0]?.url || null;
  } catch {
    return null;
  }
});

  const {
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
  
  if (!url || !dataLoaded) {
  return <LoadingScreen />;
  }

  // ── データなし ──
  if (!analyzedData) return <NoDataError url={url} />;

  // ── 確定後の変数 ──
  const health = getHealthStatus(totalScore);
  const nextTarget = getNextTarget(totalScore);
  const isUnlocked = totalScore >= 70;

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

  const robots = analyzedData?.details?.robotsTxt?.crawlers ?? {};

  const crawlers = [
  { name: 'ChatGPT',    agent: 'GPTBot',         ok: !!robots.chatgpt },
  { name: 'Claude',     agent: 'ClaudeBot',       ok: !!robots.claude },
  { name: 'Gemini',     agent: 'Google-Extended', ok: !!robots.gemini },
  { name: 'Perplexity', agent: 'PerplexityBot',   ok: !!robots.perplexity },
  { name: 'Cohere',     agent: 'cohere-ai',       ok: !!robots.cohere },
  ];

  const totalPotentialGain = [...improvements.urgent, ...improvements.medium]
    .reduce((sum, item) => sum + (item.gain ?? 0), 0);

  const todaysMission = improvements.urgent[0] || improvements.medium[0] || null;
  const urgentRest = improvements.urgent.slice(1);
  const mediumAll = improvements.urgent[0] ? improvements.medium : improvements.medium.slice(1);

  const displayUrl = (url || '').replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  return (
    <div className="min-h-screen" style={{ background: '#f7f7f5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Google Fonts読み込み */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        :root {
          --bg: #ffffff;
          --bg-sub: #f7f7f5;
          --accent: #2d5be3;
          --accent-light: #e8edfb;
          --ink: #111111;
          --ink-mid: #444444;
          --ink-light: #888888;
          --ink-xlight: #bbbbbb;
          --border: #e8e8e8;
          --border-dark: #d0d0d0;
          --green: #16a34a;
          --yellow: #ca8a04;
          --red: #dc2626;
        }

        @keyframes badgePop {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">

        {/* ─── ヘッダー ─── */}
        <div className="flex items-center justify-between py-5 mb-10"
          style={{ borderBottom: '1px solid var(--border)' }}>

          <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity shrink-0">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
              <defs>
                <linearGradient id="logo-g2" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2d5be3"/>
                  <stop offset="100%" stopColor="#6366f1"/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="14" stroke="url(#logo-g2)" strokeWidth="1.5" opacity="0.7"/>
              <circle cx="18" cy="18" r="9" stroke="url(#logo-g2)" strokeWidth="1" strokeDasharray="3 2" opacity="0.4"/>
              <circle cx="18" cy="18" r="2" fill="url(#logo-g2)"/>
              <circle cx="28" cy="18" r="1.5" fill="#2d5be3" opacity="0.9"/>
            </svg>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--ink)', fontWeight: 700 }}>
              AI観測ラボ
            </span>
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            {/* URL pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg min-w-0"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <span className="text-xs shrink-0" style={{ color: 'var(--ink-xlight)', fontFamily: "'DM Mono', monospace" }}>
                ◎
              </span>
              <span className="text-xs font-medium truncate max-w-[200px]"
                style={{ color: 'var(--ink-mid)', fontFamily: "'DM Mono', monospace" }}>
                {displayUrl}
              </span>
            </div>
            {/* ダッシュボードリンク */}
            {isUnlocked ? (
  <Link href={`/dashboard?siteId=${siteId}`}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all hover:opacity-80"
    style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid #c5d3f5' }}>
    <span>📊</span>
    <span className="hidden sm:block">ダッシュボード</span>
  </Link>
) : (
  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
    style={{ background: '#f7f7f5', color: '#bbbbbb', border: '1px solid #e8e8e8', cursor: 'not-allowed' }}>
    <span>🔒</span>
    <span className="hidden sm:block">ダッシュボード</span>
  </div>
)}
          </div>
        </div>

        {/* SP用URL */}
        <div className="sm:hidden mb-6 flex items-center gap-1.5 px-3 py-2 rounded-lg"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <span className="text-xs shrink-0" style={{ color: 'var(--ink-xlight)', fontFamily: "'DM Mono', monospace" }}>◎</span>
          <span className="text-xs truncate" style={{ color: 'var(--ink-mid)', fontFamily: "'DM Mono', monospace" }}>
            {displayUrl}
          </span>
        </div>

        {/* ブランドコピー */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.2em] uppercase font-semibold" style={{ color: 'var(--accent)' }}>
            改善を、観測で証明する。
          </p>
        </div>

        {/* 成果演出バッジ */}
        {achievements.length > 0 && (
          <div className="mb-6 space-y-2">
            {achievements.map((a, i) => (
              <div key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
                <span className="text-base">{a.emoji}</span>
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
          <div className="mb-5">
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
          <div className="mb-5 p-6 rounded-2xl text-center"
            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-bold text-base" style={{ color: '#16a34a' }}>すべての改善が完了しています</p>
            <p className="text-sm mt-1" style={{ color: 'var(--ink-light)' }}>引き続き定期的な観測を続けましょう</p>
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
        <DashboardCTA siteId={siteId} dashPreview={dashPreview} totalScore={totalScore} />

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
        totalScore={totalScore}
        />

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: 'var(--accent)' }}>
            🔄 再診断する
          </Link>
          <ShareDropdown url={url} totalScore={totalScore} />
        </div>

        {/* フッター */}
        <div className="mt-16 pt-6 text-center text-xs"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--ink-xlight)' }}>
          <Link href="/guide" className="hover:underline transition-colors" style={{ color: 'var(--ink-light)' }}>改善ガイド</Link>
          <span className="mx-3" style={{ color: 'var(--border-dark)' }}>·</span>
          <Link href="/faq" className="hover:underline transition-colors" style={{ color: 'var(--ink-light)' }}>FAQ</Link>
          <span className="mx-3" style={{ color: 'var(--border-dark)' }}>·</span>
          <Link href="/how-to-use" className="hover:underline transition-colors" style={{ color: 'var(--ink-light)' }}>使い方</Link>
        </div>

      </div>
    </div>
  );
}

export default ResultContent;