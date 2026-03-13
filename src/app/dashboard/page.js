'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SearchConsolePanel from '../components/SearchConsolePanel';
import SolarSystemChart from '../components/SolarSystemChart';

// ─── ロジック（無変更）────────────────────────────────────────────

function getAiStatus(pageCount) {
  if (pageCount === 0)  return { label: '未認知',   color: '#6b7280', bg: 'bg-gray-500/10',    border: 'border-gray-500/30',    dot: 'bg-gray-500',    step: 0 };
  if (pageCount <= 3)   return { label: '観測開始', color: '#f59e0b', bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  dot: 'bg-yellow-400',  step: 1 };
  if (pageCount <= 10)  return { label: '認知済',   color: '#4a9eff', bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    dot: 'bg-blue-400',    step: 2 };
  return                       { label: '拡大中',   color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400', step: 3 };
}

// ─── StatusGauge ───────────────────────────────────────────────────
const STATUS_STEPS = [
  { label: '未認知',   color: '#6b7280' },
  { label: '観測開始', color: '#f59e0b' },
  { label: '認知済',   color: '#4a9eff' },
  { label: '拡大中',   color: '#10b981' },
];

function StatusGauge({ step, color }) {
  const pct = (step / (STATUS_STEPS.length - 1)) * 100;
  return (
    <div className="mt-3">
      {/* track */}
      <div className="relative h-1.5 rounded-full bg-[#1a1f35] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, #3a4060, ${color})` }}
        />
      </div>
      {/* step labels */}
      <div className="flex justify-between mt-1.5">
        {STATUS_STEPS.map((s, i) => (
          <span
            key={s.label}
            className="text-[9px] transition-colors"
            style={{ color: i === step ? color : '#2a3050', fontWeight: i === step ? 700 : 400 }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const STARS = [
  { top: '8%',  left: '15%', delay: '0s',   size: 1 },
  { top: '22%', left: '72%', delay: '1.1s', size: 1.5 },
  { top: '45%', left: '88%', delay: '2.2s', size: 1 },
  { top: '68%', left: '33%', delay: '0.7s', size: 1 },
  { top: '15%', left: '92%', delay: '1.8s', size: 1.5 },
  { top: '80%', left: '8%',  delay: '0.3s', size: 1 },
  { top: '55%', left: '4%',  delay: '2.5s', size: 1 },
  { top: '35%', left: '50%', delay: '1.4s', size: 1 },
  { top: '90%', left: '60%', delay: '0.9s', size: 1.5 },
];

const SKELETON_STARS = [
  { top: '10%', left: '20%', delay: '0s',   size: 'w-1 h-1' },
  { top: '30%', left: '60%', delay: '0.5s', size: 'w-1 h-1' },
  { top: '50%', left: '80%', delay: '1s',   size: 'w-0.5 h-0.5' },
  { top: '70%', left: '40%', delay: '1.5s', size: 'w-1 h-1' },
  { top: '20%', left: '90%', delay: '2s',   size: 'w-0.5 h-0.5' },
];

// ─── ProUpsellSection ──────────────────────────────────────────────

function ProUpsellSection({ aiTotal }) {
  const predictions = [
    { action: 'llms.txt を週1更新する',  effect: '+23%', detail: 'GPTBotの訪問頻度が増加する見込み',         icon: '📄' },
    { action: '構造化データを追加する',  effect: '+15%', detail: 'Claude・Perplexityに認識されやすくなる', icon: '🧩' },
    { action: 'robots.txt を最適化する', effect: '+8%',  detail: '未確認シグナルの正体判明率が上がる',     icon: '🤖' },
  ];
  const totalUplift = 46;

  return (
    <div className="relative rounded-2xl border border-violet-500/25 bg-gradient-to-br from-[#0d0f1e] via-[#110d22] to-[#0d0f1e] p-6 overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-blue-600/8 blur-3xl" />

      {/* header */}
      <div className="relative flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🔮</span>
            <h2 className="text-sm font-semibold tracking-wide text-white">改善予測シミュレーター</h2>
          </div>
          <p className="text-[11px] text-[#5a6080]">今の施策を実行したら、AI訪問数はどう変わる？</p>
        </div>
        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25 tracking-wide">
          PRO
        </span>
      </div>

      {/* blurred content */}
      <div className="relative mb-5">
        <div className="space-y-2.5 blur-sm select-none pointer-events-none" aria-hidden="true">
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
            <p className="text-[10px] text-[#5a6080] mb-1">全改善実施時の予測増加率</p>
            <p className="text-3xl font-bold text-violet-400">+{totalUplift}%</p>
            <p className="text-[11px] text-[#5a6080] mt-0.5">
              現在 {(aiTotal ?? 0).toLocaleString()}回 → 予測 {Math.round((aiTotal ?? 0) * (1 + totalUplift / 100)).toLocaleString()}回/週
            </p>
          </div>
          {predictions.map((p) => (
            <div key={p.action} className="flex items-center gap-3 rounded-xl border border-[#1e2240] bg-[#0f1120] px-3 py-2.5">
              <span className="text-lg">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#c8d0e8] truncate">{p.action}</p>
                <p className="text-[10px] text-[#5a6080] truncate">{p.detail}</p>
              </div>
              <span className="text-[#4ade80] font-bold text-sm whitespace-nowrap">{p.effect}</span>
            </div>
          ))}
        </div>

        {/* lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-[#07090f]/70 backdrop-blur-[2px]">
          <div className="text-center px-6">
            <div className="w-10 h-10 rounded-full border border-violet-500/30 bg-violet-500/10 flex items-center justify-center mx-auto mb-2.5">
              <span className="text-xl">🔒</span>
            </div>
            <p className="text-sm font-semibold text-white mb-1">予測データを解除する</p>
            <p className="text-[11px] text-[#5a6080]">あなたのサイトに最適化された改善予測が見えます</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative flex items-center justify-between gap-3">
        <a href="#" className="flex-1 text-center px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-xs font-bold text-white hover:opacity-90 transition-opacity">
          予測を見る →
        </a>
        <div className="text-right">
          <p className="text-xs font-bold text-white">月額 980円</p>
          <p className="text-[10px] text-[#5a6080]">近日公開予定</p>
        </div>
      </div>
    </div>
  );
}

// ─── AccordionSection ──────────────────────────────────────────────

function AccordionSection({ title, children, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border border-[#1a1f35] bg-[#07090f] overflow-hidden ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-semibold text-[#c8d0e8] flex items-center gap-2">{title}</span>
        <svg
          className={`w-4 h-4 text-[#3a4060] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
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
    <div className="min-h-screen bg-[#07090f] text-white flex items-center justify-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {SKELETON_STARS.map((s, i) => (
          <div key={i} className={`absolute ${s.size} bg-white rounded-full animate-twinkle`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }} />
        ))}
      </div>
      <div className="relative flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center">
          <div className="absolute rounded-full border border-[#4a9eff]/10" style={{ width: 180, height: 180, animation: 'pulseRing 2s ease-out infinite' }} />
          <div className="absolute rounded-full border border-[#4a9eff]/20" style={{ width: 140, height: 140, animation: 'pulseRing 2s ease-out infinite 0.3s' }} />
          <div className="absolute rounded-full border border-[#4a9eff]/30" style={{ width: 100, height: 100, animation: 'pulseRing 2s ease-out infinite 0.6s' }} />
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, #4a9eff 0%, #0066cc 60%, #001a4d 100%)', boxShadow: '0 0 30px #4a9eff, 0 0 60px #4a9eff40', animation: 'starPulse 2s ease-in-out infinite' }}>
            <span className="text-2xl">✦</span>
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm font-semibold text-[#c8d0e8]" style={{ animation: 'fadeInOut 2s ease-in-out infinite' }}>
            観測データを受信中...
          </p>
          <p className="text-[11px] text-[#3a4060] tracking-widest uppercase">Deep Space Observatory</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#4a9eff]"
              style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
      <style jsx global>{`
        @keyframes twinkle { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
        @keyframes dotBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-6px);opacity:1} }
        @keyframes pulseRing { 0%{transform:scale(.8);opacity:.8} 100%{transform:scale(1.4);opacity:0} }
        @keyframes starPulse { 0%,100%{box-shadow:0 0 30px #4a9eff,0 0 60px #4a9eff40} 50%{box-shadow:0 0 50px #4a9eff,0 0 100px #4a9eff60} }
        @keyframes fadeInOut { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
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

  const handleRefresh = () => fetchData(siteId);

  // ── empty / error states ──────────────────────────────────────

  if (!siteId) {
    return (
      <div className="min-h-screen bg-[#07090f] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[#3a4060] text-sm">サイトIDが必要です</p>
          <Link href="/" className="text-[#4a9eff] text-sm hover:underline">← トップページに戻る</Link>
        </div>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-[#07090f] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-[#5a6080]">データ取得に失敗しました</p>
          <Link href="/" className="text-[#4a9eff] text-sm hover:underline">← トップページに戻る</Link>
        </div>
      </div>
    );
  }

  const { ai_stats, recent_visits } = data;
  const status = getAiStatus(ai_stats.recognized_pages ?? 0);

  // ── render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#07090f] text-white">

      {/* ── 星屑 ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              top: s.top, left: s.left,
              width: s.size, height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}
        {/* subtle horizon gradient */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0a0520]/60 to-transparent" />
      </div>

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#1a1f35]/80 bg-[#07090f]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo + title */}
          <div className="flex items-center gap-3 min-w-0">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 shrink-0">
              <defs>
                <linearGradient id="hdr-g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4a9eff"/>
                  <stop offset="100%" stopColor="#a855f7"/>
                </linearGradient>
              </defs>
              <circle cx="18" cy="18" r="14" stroke="url(#hdr-g)" strokeWidth="1.5" opacity="0.7"/>
              <circle cx="18" cy="18" r="9"  stroke="url(#hdr-g)" strokeWidth="1" strokeDasharray="3 2" opacity="0.4"/>
              <circle cx="18" cy="18" r="2"  fill="url(#hdr-g)"/>
              <circle cx="28" cy="18" r="1.5" fill="#4a9eff" opacity="0.9"/>
            </svg>
            <div className="min-w-0">
              <Link href="/" className="text-sm font-bold text-white tracking-tight hover:text-[#4a9eff] transition-colors block">
                AI観測ラボ
              </Link>
              <p className="text-[10px] text-[#3a4060] tracking-widest uppercase hidden sm:block">Deep Space Observatory</p>
            </div>
          </div>

          {/* Site ID pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0f1120] border border-[#1a1f35]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4a9eff] animate-pulse" />
            <span className="font-mono text-[11px] text-[#4a9eff] tracking-wider">{siteId}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1f35] bg-[#0f1120] text-[11px] font-medium text-[#8090b0] hover:text-white hover:border-[#2a2f55] transition-all"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/guide"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1f35] bg-[#0f1120] text-[11px] font-medium text-[#8090b0] hover:text-white hover:border-[#2a2f55] transition-all"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Docs
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1f35] bg-[#0f1120] text-[11px] font-medium text-[#8090b0] hover:text-white hover:border-[#2a2f55] transition-all"
            >
              ← <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">

        {/* Page title */}
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#3a4060] mb-2">Observatory Control Panel</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            観測ダッシュボード
          </h1>
        </div>

        {/* ── KPI 2+2レイアウト ────────────────────────────────── */}
        {/* 上段: 主役2枚（大） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* AI crawler visits（主役・大） */}
          <div className="relative rounded-2xl border border-violet-500/25 bg-[#0b0d1a] p-6 overflow-hidden hover:border-violet-500/40 transition-colors">
            <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-[#5a6080] uppercase tracking-widest">AI Crawler Visits</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                ai_stats.trend === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : ai_stats.trend === 'down'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-[#1a1f35] text-[#5a6080] border-[#1a1f35]'
              }`}>
                {ai_stats.trend === 'up' ? '+' : ''}{ai_stats.change_percent ?? 0}%
              </span>
            </div>
            <p className="text-4xl font-bold text-violet-400 tabular-nums">
              {(ai_stats.total ?? 0).toLocaleString()}
              <span className="text-sm text-[#3a4060] font-normal ml-1.5">回 / 7日</span>
            </p>
          </div>

          {/* AI認知ステータス（主役・大） */}
          <div className={`relative rounded-2xl border ${status.border} ${status.bg} p-6 overflow-hidden`}>
            <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ background: status.color }} />
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse shrink-0`} />
              <p className="text-[10px] text-[#5a6080] uppercase tracking-widest">AI認知ステータス</p>
            </div>
            <p className="text-4xl font-bold mb-1" style={{ color: status.color }}>{status.label}</p>
            <StatusGauge step={status.step} color={status.color} />
          </div>

        </div>

        {/* 下段: サブ2枚（小） */}
        <div className="grid grid-cols-2 gap-3">

          {/* AI認知ページ数 */}
          <div className="relative rounded-2xl border border-[#1a1f35] bg-[#0b0d1a] p-5 overflow-hidden hover:border-[#4a9eff]/30 transition-colors">
            <div className="pointer-events-none absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#4a9eff]/8 blur-2xl" />
            <p className="text-[10px] text-[#5a6080] uppercase tracking-widest mb-3">Pages</p>
            <p className="text-2xl font-bold text-[#4a9eff] tabular-nums">
              {(ai_stats.recognized_pages ?? 0).toLocaleString()}
              <span className="text-xs text-[#3a4060] font-normal ml-1">ページ</span>
            </p>
            <p className="text-[10px] text-[#3a4060] mt-2">AI認知ページ数</p>
          </div>

          {/* 人間訪問 */}
          <div className="relative rounded-2xl border border-[#1a1f35] bg-[#0b0d1a] p-5 overflow-hidden hover:border-amber-500/30 transition-colors">
            <div className="pointer-events-none absolute -top-4 -right-4 w-16 h-16 rounded-full bg-amber-500/8 blur-2xl" />
            <p className="text-[10px] text-[#5a6080] uppercase tracking-widest mb-3">Humans</p>
            <p className="text-2xl font-bold text-amber-400 tabular-nums">
              {(ai_stats.human_total ?? 0).toLocaleString()}
              <span className="text-xs text-[#3a4060] font-normal ml-1">人</span>
            </p>
            <p className="text-[10px] text-[#3a4060] mt-2">人間訪問（過去7日間）</p>
          </div>

        </div>

        {/* ── 天体フィールド ──────────────────────────────────── */}
        <SolarSystemChart crawlers={ai_stats.by_crawler} firstVisit={ai_stats.last_visit} />

        {/* ── Search Console（Solar直後：「なんで？」の答え） ── */}
        <div>
          <SearchConsolePanel siteId={siteId} />
        </div>

        {/* ── 観測タイムライン ────────────────────────────────── */}
        <div className="rounded-2xl border border-[#1a1f35] bg-[#07090f] overflow-hidden">
          {/* section header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1f35]">
            <span className="text-base">📡</span>
            <h2 className="text-sm font-semibold text-[#c8d0e8]">観測タイムライン</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#1a1f35]">

            {/* First Contact */}
            <div className="px-5 py-5">
              <p className="text-[9px] tracking-[0.2em] text-[#3a4060] uppercase mb-2">First Contact</p>
              <p className="text-base font-bold text-white">
                {ai_stats.first_visit
                  ? new Date(ai_stats.first_visit).toLocaleDateString('ja-JP')
                  : '—'}
              </p>
              <p className="text-[10px] text-[#3a4060] mt-1">初回観測日</p>
            </div>

            {/* Last Seen */}
            <div className="px-5 py-5">
              <p className="text-[9px] tracking-[0.2em] text-[#3a4060] uppercase mb-2">Last Seen</p>
              <p className="text-base font-bold text-[#4a9eff]">
                {ai_stats.last_visit
                  ? new Date(ai_stats.last_visit).toLocaleString('ja-JP')
                  : '—'}
              </p>
              <p className="text-[10px] text-[#3a4060] mt-1">最終観測日時</p>
            </div>

            {/* Current Status */}
            <div className="px-5 py-5">
              <p className="text-[9px] tracking-[0.2em] text-[#3a4060] uppercase mb-2">Current Status</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
                <p className="text-base font-bold" style={{ color: status.color }}>{status.label}</p>
              </div>
              <p className="text-[10px] text-[#3a4060] mt-1">過去7日間の判定</p>
            </div>

          </div>
        </div>

        {/* ── 最新観測ログ ────────────────────────────────────── */}
        <AccordionSection title="📋 最新観測ログ（10件）" defaultOpen={false}>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1f35]">
                  {['観測日時', 'AI種別', '観測ページ', '検出方法'].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-[10px] text-[#3a4060] font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0f1120]">
                {(recent_visits ?? []).map((visit, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3 px-3 text-[#5a6080] whitespace-nowrap tabular-nums">
                      {new Date(visit.visited_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#4a9eff] whitespace-nowrap">{visit.crawler_name}</td>
                    <td className="py-3 px-3 font-mono text-[#5a7090] max-w-[200px] truncate">{visit.page_url || '/'}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[10px] bg-[#4a9eff]/10 text-[#4a9eff] border border-[#4a9eff]/20 px-2 py-0.5 rounded-full">{visit.detection_method}</span>
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

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="relative z-10 mt-16 border-t border-[#1a1f35]/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#3a4060]">
          <span>© 2026 AI観測ラボ</span>
          <span className="tracking-widest uppercase">Deep Space AI Observatory</span>
        </div>
      </footer>

      {/* ── Global styles ─────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.6); }
        }
        .animate-twinkle { animation: twinkle 4s ease-in-out infinite; }

        /* thin scrollbar */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #07090f; }
        ::-webkit-scrollbar-thumb { background: #1a1f35; border-radius: 9999px; }
      `}</style>
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