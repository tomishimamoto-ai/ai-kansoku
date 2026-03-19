'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SearchConsolePanel from '../components/SearchConsolePanel';
import SolarSystemChart from '../components/SolarSystemChart';

// ─── ロジック（無変更）────────────────────────────────────────────

function getAiStatus(pageCount) {
  if (pageCount === 0)  return { label: '未認知',   color: '#6b7280', step: 0 };
  if (pageCount <= 3)   return { label: '観測開始', color: '#ca8a04', step: 1 };
  if (pageCount <= 10)  return { label: '認知済',   color: '#2d5be3', step: 2 };
  return                       { label: '拡大中',   color: '#16a34a', step: 3 };
}

const SKELETON_STARS = [
  { top: '10%', left: '20%', delay: '0s',   size: 'w-1 h-1' },
  { top: '30%', left: '60%', delay: '0.5s', size: 'w-1 h-1' },
  { top: '50%', left: '80%', delay: '1s',   size: 'w-0.5 h-0.5' },
  { top: '70%', left: '40%', delay: '1.5s', size: 'w-1 h-1' },
  { top: '20%', left: '90%', delay: '2s',   size: 'w-0.5 h-0.5' },
];

// ─── StatusGauge ───────────────────────────────────────────────────
const STATUS_STEPS = [
  { label: '未認知' },
  { label: '観測開始' },
  { label: '認知済' },
  { label: '拡大中' },
];

function StatusGauge({ step, color }) {
  const pct = (step / (STATUS_STEPS.length - 1)) * 100;
  return (
    <div className="mt-3">
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: '#e8e8e8' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        {STATUS_STEPS.map((s, i) => (
          <span
            key={s.label}
            className="text-[9px]"
            style={{
              color: i === step ? color : '#bbbbbb',
              fontWeight: i === step ? 700 : 400,
            }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── ProUpsellSection ──────────────────────────────────────────────

function ProUpsellSection({ aiTotal }) {
  const predictions = [
    { action: 'llms.txt を週1更新する',  effect: '+23%', detail: 'GPTBotの訪問頻度が増加する見込み',         icon: '📄' },
    { action: '構造化データを追加する',  effect: '+15%', detail: 'Claude・Perplexityに認識されやすくなる', icon: '🧩' },
    { action: 'robots.txt を最適化する', effect: '+8%',  detail: '未確認シグナルの正体判明率が上がる',     icon: '🤖' },
  ];
  const totalUplift = 46;

  return (
    <div className="relative rounded-2xl overflow-hidden p-6"
      style={{ background: '#f7f7f5', border: '1px solid #e8e8e8' }}>

      {/* header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🔮</span>
            <h2 className="text-sm font-bold" style={{ color: '#111111', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              改善予測シミュレーター
            </h2>
          </div>
          <p className="text-xs" style={{ color: '#888888' }}>今の施策を実行したら、AI訪問数はどう変わる？</p>
        </div>
        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide"
          style={{ background: '#e8edfb', color: '#2d5be3', border: '1px solid #c5d3f5' }}>
          PRO
        </span>
      </div>

      {/* blurred content */}
      <div className="relative mb-5">
        <div className="space-y-2.5 blur-sm select-none pointer-events-none" aria-hidden="true">
          <div className="rounded-xl px-4 py-3" style={{ background: '#e8edfb', border: '1px solid #c5d3f5' }}>
            <p className="text-[10px] mb-1" style={{ color: '#888888' }}>全改善実施時の予測増加率</p>
            <p className="text-3xl font-bold" style={{ color: '#2d5be3' }}>+{totalUplift}%</p>
            <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
              現在 {(aiTotal ?? 0).toLocaleString()}回 → 予測 {Math.round((aiTotal ?? 0) * (1 + totalUplift / 100)).toLocaleString()}回/週
            </p>
          </div>
          {predictions.map((p) => (
            <div key={p.action} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
              <span className="text-lg">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#111111' }}>{p.action}</p>
                <p className="text-[10px] truncate" style={{ color: '#888888' }}>{p.detail}</p>
              </div>
              <span className="font-bold text-sm whitespace-nowrap" style={{ color: '#16a34a' }}>{p.effect}</span>
            </div>
          ))}
        </div>

        {/* lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
          style={{ background: 'rgba(247,247,245,0.85)', backdropFilter: 'blur(2px)' }}>
          <div className="text-center px-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5"
              style={{ background: '#e8edfb', border: '1px solid #c5d3f5' }}>
              <span className="text-xl">🔒</span>
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: '#111111' }}>予測データを解除する</p>
            <p className="text-xs" style={{ color: '#888888' }}>あなたのサイトに最適化された改善予測が見えます</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between gap-3">
        <a href="#"
          className="flex-1 text-center px-4 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: '#2d5be3' }}>
          予測を見る →
        </a>
        <div className="text-right">
          <p className="text-xs font-bold" style={{ color: '#111111' }}>月額 980円</p>
          <p className="text-[10px]" style={{ color: '#888888' }}>近日公開予定</p>
        </div>
      </div>
    </div>
  );
}

// ─── AccordionSection ──────────────────────────────────────────────

function AccordionSection({ title, children, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#f7f7f5]"
      >
        <span className="text-sm font-semibold" style={{ color: '#111111', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: '#bbbbbb' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ─── DashboardSkeleton ─────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7f5' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: '#e8edfb', borderTopColor: '#2d5be3' }} />
        <span className="text-sm" style={{ color: '#888888', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          観測データを受信中...
        </span>
      </div>
    </div>
  );
}

// ─── DashboardContent ──────────────────────────────────────────────

function DashboardContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [scData, setScData]   = useState(null);

  const fetchData = async (siteId, signal) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/visits?siteId=${siteId}&t=${Date.now()}`, { signal });
      const json = await res.json();
      if (json.success) {
        setData(json);
        try {
          const scRes  = await fetch(`/api/search-console/fetch?siteId=${siteId}`, { signal });
          const scJson = await scRes.json();
          if (scJson.connected) setScData(scJson);
        } catch {}
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!siteId) { setLoading(false); return; }
    const controller = new AbortController();
    fetchData(siteId, controller.signal);
    return () => controller.abort();
  }, [siteId]);

  const handleRefresh = () => {
    const controller = new AbortController();
    fetchData(siteId, controller.signal);
  };

  // ── empty / error states ──────────────────────────────────────

  if (!siteId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7f5' }}>
        <div className="text-center space-y-3">
          <p className="text-sm" style={{ color: '#888888' }}>サイトIDが必要です</p>
          <Link href="/" className="text-sm hover:underline" style={{ color: '#2d5be3' }}>← トップページに戻る</Link>
        </div>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  if (!data || !data.success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7f5' }}>
        <div className="text-center space-y-3">
          <p className="text-sm" style={{ color: '#888888' }}>データ取得に失敗しました</p>
          <Link href="/" className="text-sm hover:underline" style={{ color: '#2d5be3' }}>← トップページに戻る</Link>
        </div>
      </div>
    );
  }

  const { ai_stats, recent_visits } = data;
  const status = getAiStatus(ai_stats.recognized_pages ?? 0);

  // ── AI影響度スコア計算 ────────────────────────────────────────
  const interactions     = ai_stats.total ?? 0;
  const spoofCount       = data.spoofed_stats?.high_confidence_total ?? 0;
  const dailyInteractions  = interactions / 7;
  const MAX_DAILY          = 20;
  const interactionScore   = Math.min(1, Math.log10(dailyInteractions + 1) / Math.log10(MAX_DAILY + 1));
  const statusScore        = status.step / 3;
  const aiScore            = interactions === 0
    ? 0
    : Math.round(100 * (0.5 * interactionScore + 0.5 * statusScore));
  const scoreLabel         = aiScore >= 70 ? '高' : aiScore >= 40 ? '中' : '低';

  // ── render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#f7f7f5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Google Fonts */}
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
        @keyframes twinkle {
          0%,100%{opacity:.2;transform:scale(1)}
          50%{opacity:.8;transform:scale(1.6)}
        }
        .star-twinkle { animation: twinkle 4s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f7f7f5; }
        ::-webkit-scrollbar-thumb { background: #e8e8e8; border-radius: 9999px; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid #e8e8e8', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity shrink-0">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
              <defs>
                <linearGradient id="dash-logo-g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#2d5be3"/>
                  <stop offset="100%" stopColor="#6366f1"/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="14" stroke="url(#dash-logo-g)" strokeWidth="1.5" opacity="0.7"/>
              <circle cx="18" cy="18" r="9"  stroke="url(#dash-logo-g)" strokeWidth="1" strokeDasharray="3 2" opacity="0.4"/>
              <circle cx="18" cy="18" r="2"  fill="url(#dash-logo-g)"/>
              <circle cx="28" cy="18" r="1.5" fill="#2d5be3" opacity="0.9"/>
            </svg>
            <span className="font-bold text-sm tracking-tight" style={{ color: '#111111' }}>AI観測ラボ</span>
          </Link>

          {/* Site ID pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: '#f7f7f5', border: '1px solid #e8e8e8' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d5be3] animate-pulse shrink-0" />
            <span className="font-mono text-xs tracking-wider" style={{ color: '#2d5be3', fontFamily: "'DM Mono', monospace" }}>
              {siteId}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: '#f7f7f5', border: '1px solid #e8e8e8', color: '#444444' }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/guide"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: '#f7f7f5', border: '1px solid #e8e8e8', color: '#444444' }}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Docs
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
              style={{ background: '#f7f7f5', border: '1px solid #e8e8e8', color: '#444444' }}
            >
              ← <span className="hidden sm:inline ml-0.5">Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-4">

        {/* Page title */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.2em] uppercase font-semibold mb-2" style={{ color: '#2d5be3' }}>
            観測ステーション
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: '#111111' }}>
            観測ダッシュボード
          </h1>
        </div>

        {/* ── KPI 上段：主役2枚（大） ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* ① AI影響度スコア */}
          <div className="relative rounded-2xl p-6 overflow-hidden transition-all hover:border-[#d0d0d0]"
            style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: '#888888' }}>
              AI影響度スコア
            </p>
            <div className="flex items-end gap-2 mb-4">
              <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: '#2d5be3' }}>
                {aiScore}
              </p>
              <p className="text-sm font-normal mb-0.5" style={{ color: '#888888' }}>/100</p>
              <span className="mb-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{
                background: aiScore >= 70 ? '#f0fdf4' : aiScore >= 40 ? '#e8edfb' : '#fefce8',
                color:      aiScore >= 70 ? '#16a34a' : aiScore >= 40 ? '#2d5be3' : '#ca8a04',
              }}>
                {scoreLabel}
              </span>
            </div>
            {/* スコアバー */}
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: '#e8e8e8' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{
                  width: `${aiScore}%`,
                  background: aiScore >= 70 ? '#16a34a' : aiScore >= 40 ? '#2d5be3' : '#ca8a04',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px]" style={{ color: '#bbbbbb' }}>
                接触密度 {(dailyInteractions).toFixed(1)}回/日
              </p>
              <p className="text-[10px]" style={{ color: '#bbbbbb' }}>
                累計 {interactions}回
              </p>
            </div>
            <p className="text-[10px] mt-2" style={{ color: '#bbbbbb' }}>
              接触量 × 認知状態から算出
            </p>
          </div>

          {/* ② AI認知ステータス */}
          <div className="relative rounded-2xl p-6 overflow-hidden transition-all hover:border-[#d0d0d0]"
            style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full animate-pulse shrink-0"
                style={{ background: status.color }} />
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#888888' }}>
                AI認知ステータス
              </p>
            </div>
            <p className="text-4xl font-bold mb-1" style={{ color: status.color }}>
              {status.label}
            </p>
            <StatusGauge step={status.step} color={status.color} />
          </div>

        </div>

        {/* ── KPI 下段：サブ2枚（小） ─────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">

          {/* ③ AIインタラクション数 */}
          <div className="rounded-2xl p-5 transition-all hover:border-[#d0d0d0]"
            style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#888888' }}>
              AIインタラクション数
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#111111' }}>
              {(interactions).toLocaleString()}
              <span className="text-xs font-normal ml-1" style={{ color: '#888888' }}>回</span>
            </p>
            <p className="text-xs mt-2" style={{ color: '#bbbbbb' }}>過去7日間（is_human=false 全合算）</p>
          </div>

          {/* ④ なりすまし検知 */}
          <div className="rounded-2xl p-5 transition-all hover:border-[#d0d0d0]"
            style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#888888' }}>
              なりすまし検知
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{
              color: spoofCount > 0 ? '#ca8a04' : '#16a34a',
            }}>
              {spoofCount.toLocaleString()}
              <span className="text-xs font-normal ml-1" style={{ color: '#888888' }}>件</span>
            </p>
            <p className="text-xs mt-2" style={{ color: '#bbbbbb' }}>spoofed-bot 7日間累計</p>
          </div>

        </div>

        {/* ── 天体フィールド（ここだけダーク） ───────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e8e8' }}>
          <div className="bg-[#07090f]">
            <SolarSystemChart crawlers={ai_stats.by_crawler} firstVisit={ai_stats.last_visit} />
          </div>
        </div>

        {/* ── Search Console ──────────────────────────────────── */}
        <SearchConsolePanel siteId={siteId} />

        {/* ── 観測タイムライン ────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
          <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid #e8e8e8' }}>
            <span className="text-base">📡</span>
            <h2 className="text-sm font-semibold" style={{ color: '#111111' }}>観測タイムライン</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ '--tw-divide-opacity': 1 }}>

            {/* First Contact */}
            <div className="px-5 py-5" style={{ borderColor: '#e8e8e8' }}>
              <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: '#bbbbbb' }}>初回観測</p>
              <p className="text-base font-bold" style={{ color: '#111111' }}>
                {ai_stats.first_visit
                  ? new Date(ai_stats.first_visit).toLocaleDateString('ja-JP')
                  : '—'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#bbbbbb' }}>初回観測日</p>
            </div>

            {/* Last Seen */}
            <div className="px-5 py-5" style={{ borderColor: '#e8e8e8' }}>
              <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: '#bbbbbb' }}>最終観測</p>
              <p className="text-base font-bold" style={{ color: '#2d5be3' }}>
                {ai_stats.last_visit
                  ? new Date(ai_stats.last_visit).toLocaleString('ja-JP')
                  : '—'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#bbbbbb' }}>最終観測日時</p>
            </div>

            {/* Current Status */}
            <div className="px-5 py-5" style={{ borderColor: '#e8e8e8' }}>
              <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: '#bbbbbb' }}>観測状態</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: status.color }} />
                <p className="text-base font-bold" style={{ color: status.color }}>{status.label}</p>
              </div>
              <p className="text-xs mt-1" style={{ color: '#bbbbbb' }}>過去7日間の判定</p>
            </div>

          </div>
        </div>

        {/* ── 最新観測ログ ────────────────────────────────────── */}
        <AccordionSection title="📋 最新観測ログ（10件）" defaultOpen={false}>
          <div className="overflow-x-auto -mx-1 mt-1">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e8e8' }}>
                  {['観測日時', 'AI種別', '観測ページ', '検出方法'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 font-medium uppercase tracking-wider whitespace-nowrap"
                      style={{ color: '#bbbbbb', fontSize: '10px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recent_visits ?? []).map((visit, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-[#f7f7f5]"
                    style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td className="py-3 px-3 whitespace-nowrap tabular-nums" style={{ color: '#888888' }}>
                      {new Date(visit.visited_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="py-3 px-3 font-semibold whitespace-nowrap" style={{ color: '#2d5be3' }}>
                      {visit.crawler_name}
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate" style={{ color: '#888888', fontFamily: "'DM Mono', monospace" }}>
                      {visit.page_url || '/'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: '#e8edfb', color: '#2d5be3', border: '1px solid #c5d3f5' }}>
                        {visit.detection_method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionSection>

        {/* ── Pro Upsell ──────────────────────────────────────── */}
        <ProUpsellSection aiTotal={ai_stats.total} />

      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="mt-16" style={{ borderTop: '1px solid #e8e8e8' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs" style={{ color: '#bbbbbb' }}>© 2026 AI観測ラボ</span>
          <div className="flex items-center gap-4 text-xs" style={{ color: '#bbbbbb' }}>
            <Link href="/guide" className="hover:underline transition-colors" style={{ color: '#888888' }}>改善ガイド</Link>
            <span style={{ color: '#e8e8e8' }}>·</span>
            <Link href="/faq" className="hover:underline transition-colors" style={{ color: '#888888' }}>FAQ</Link>
            <span style={{ color: '#e8e8e8' }}>·</span>
            <Link href="/how-to-use" className="hover:underline transition-colors" style={{ color: '#888888' }}>使い方</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

// ─── Page export ───────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}