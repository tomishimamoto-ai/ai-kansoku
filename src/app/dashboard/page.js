'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
import MimicPanel from '../components/MimicPanel';
import SearchConsolePanel from '../components/SearchConsolePanel';
import PageRanking from '../components/PageRanking';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// ⑤ BarElement削除（Line only）
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function getAiStatus(pageCount) {
  if (pageCount === 0)  return { label: '未認知',   color: '#6b7280', bg: 'bg-gray-500/10',    border: 'border-gray-500/30',    dot: 'bg-gray-500'    };
  if (pageCount <= 3)   return { label: '観測開始', color: '#f59e0b', bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  dot: 'bg-yellow-400'  };
  if (pageCount <= 10)  return { label: '認知済',   color: '#4a9eff', bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    dot: 'bg-blue-400'    };
  return                       { label: '拡大中',   color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' };
}

// ⑤ 星空データをコンポーネント外に移動（レンダー毎に再生成しない）
const STARS = [
  { top: '10%', left: '20%', delay: '0s' },
  { top: '30%', left: '60%', delay: '1s' },
  { top: '50%', left: '80%', delay: '2s' },
  { top: '70%', left: '40%', delay: '1.5s' },
  { top: '20%', left: '90%', delay: '0.5s' },
  { top: '85%', left: '15%', delay: '0.8s' },
  { top: '60%', left: '5%', delay: '2.3s' },
];

const SKELETON_STARS = [
  { top: '10%', left: '20%', delay: '0s', size: 'w-1 h-1' },
  { top: '30%', left: '60%', delay: '0.5s', size: 'w-1 h-1' },
  { top: '50%', left: '80%', delay: '1s', size: 'w-0.5 h-0.5' },
  { top: '70%', left: '40%', delay: '1.5s', size: 'w-1 h-1' },
  { top: '20%', left: '90%', delay: '2s', size: 'w-0.5 h-0.5' },
];

// ========================================
// 課金セクション（予測ロック型）
// ========================================
function ProUpsellSection({ aiTotal }) {
  const predictions = [
    { action: 'llms.txt を週1更新する', effect: '+23%', detail: 'GPTBotの訪問頻度が増加する見込み', icon: '📄' },
    { action: '構造化データを追加する', effect: '+15%', detail: 'Claude・Perplexityに認識されやすくなる', icon: '🧩' },
    { action: 'robots.txt を最適化する', effect: '+8%', detail: '未確認シグナルの正体判明率が上がる', icon: '🤖' },
  ];

  const totalUplift = 46;

  return (
    <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#c084fc]/30 rounded-2xl p-6 shadow-xl mb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#c084fc]/5 to-[#4a9eff]/5 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#c084fc]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔮</span>
            <h2 className="text-lg font-bold">改善予測シミュレーター</h2>
          </div>
          <p className="text-xs text-gray-400">今の施策を実行したら、AI訪問数はどう変わる？</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-[#c084fc]/20 text-[#c084fc] border border-[#c084fc]/30 whitespace-nowrap">
          Pro限定
        </span>
      </div>

      <div className="relative mb-5">
        <div className="space-y-3 blur-sm select-none pointer-events-none" aria-hidden="true">
          <div className="bg-gradient-to-r from-[#c084fc]/10 to-[#4a9eff]/10 border border-[#c084fc]/20 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">改善を全て実施した場合の予測増加率</p>
            <p className="text-4xl font-bold text-[#c084fc]">+{totalUplift}%</p>
            <p className="text-xs text-gray-400 mt-1">
              現在 {(aiTotal ?? 0).toLocaleString()}回 → 予測 {Math.round((aiTotal ?? 0) * (1 + totalUplift / 100)).toLocaleString()}回/週
            </p>
          </div>
          {predictions.map((p) => (
            <div key={p.action} className="bg-[#1a1e47]/50 rounded-xl p-3 border border-[#2a2f57] flex items-center gap-3">
              <span className="text-xl">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.action}</p>
                <p className="text-xs text-gray-500 truncate">{p.detail}</p>
              </div>
              <span className="text-[#4ade80] font-bold text-sm whitespace-nowrap">{p.effect}</span>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e27]/70 backdrop-blur-[2px] rounded-xl">
          <div className="text-center px-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#c084fc]/20 to-[#4a9eff]/20 border border-[#c084fc]/40 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🔒</span>
            </div>
            <p className="text-white font-bold mb-1">予測データを解除する</p>
            <p className="text-xs text-gray-400">あなたのサイトに最適化された改善予測が見えます</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <a
          href="#"
          className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-[#c084fc] to-[#4a9eff] rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          予測を見る →
        </a>
        <div className="text-right">
          <p className="text-white font-bold text-sm">月額 980円</p>
          <p className="text-xs text-gray-500">近日公開予定</p>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState({ userCount: '', pageViews: '', sessions: '' });
  const [saving, setSaving] = useState(false);
  const [manualSaved, setManualSaved] = useState(false);
  const [scData, setScData] = useState(null);

  // ② AbortController でメモリリーク防止
  const fetchData = async (siteId, signal) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/visits?siteId=${siteId}&t=${Date.now()}`, { signal });
      const json = await res.json();
      if (json.success) {
        setData(json);
        try {
          const scRes = await fetch(`/api/search-console/fetch?siteId=${siteId}`, { signal });
          const scJson = await scRes.json();
          if (scJson.connected) setScData(scJson);
        } catch {}
        if (json.manual_data) {
          setManualInput({
            userCount: json.manual_data.user_count || '',
            pageViews: json.manual_data.page_views || '',
            sessions: json.manual_data.sessions || ''
          });
        }
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

  // 手動更新ボタン用（AbortControllerなしでOK）
  const handleRefresh = () => fetchData(siteId);

  const handleSaveManualData = async () => {
    if (!siteId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          userCount: manualInput.userCount ? parseInt(manualInput.userCount) : null,
          pageViews: manualInput.pageViews ? parseInt(manualInput.pageViews) : null,
          sessions: manualInput.sessions ? parseInt(manualInput.sessions) : null,
          source: 'manual'
        })
      });
      if (res.ok) {
        setManualSaved(true);
        setTimeout(() => setManualSaved(false), 3000);
        // ① window.location.reload() → fetchData() に変更
        await fetchData(siteId);
      }
    } catch (error) {
      console.error('Error saving manual data:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!siteId) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">⚠️ サイトIDが必要です</h1>
          <Link href="/" className="text-[#4a9eff] hover:underline">トップページに戻る</Link>
        </div>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">❌ データ取得に失敗しました</h1>
          <Link href="/" className="text-[#4a9eff] hover:underline">トップページに戻る</Link>
        </div>
      </div>
    );
  }

  const { ai_stats, spoofed_stats, top_pages, detection_methods, recent_visits, daily_trend, hourly_distribution, diagnoses_history } = data;
  const unknownSignal = ai_stats.unknown_signal ?? 0;
  const spoofedSignal = spoofed_stats?.high_confidence_total ?? 0;
  const humanTotal = ai_stats.human_total ?? 0;

  const latestDiagnosis = diagnoses_history?.[0] ?? null;
  const latestScore = latestDiagnosis?.total_score ?? null;
  const prevDiagnosis = diagnoses_history?.[1] ?? null;
  const prevScore = prevDiagnosis?.total_score ?? null;
  const scoreDiff = latestScore !== null && prevScore !== null ? latestScore - prevScore : null;
  const diagnosedAt = latestDiagnosis?.diagnosed_at
    ? new Date(latestDiagnosis.diagnosed_at).toLocaleDateString('ja-JP')
    : null;

  function getScoreColor(score) {
    if (score >= 90) return '#00ffc8';
    if (score >= 70) return '#4a9eff';
    if (score >= 40) return '#f59e0b';
    return '#ff5555';
  }
  function getScoreLabel(score) {
    if (score >= 90) return 'OPTIMAL';
    if (score >= 70) return 'STABLE';
    if (score >= 40) return 'CAUTION';
    return 'CRITICAL';
  }

  const lineChartData = {
    labels: daily_trend?.map(d => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }) || [],
    datasets: [
      {
        label: 'AI確定訪問 ✦',
        data: daily_trend?.map(d => d.ai_visits) || [],
        borderColor: '#4a9eff',
        backgroundColor: 'rgba(74, 158, 255, 0.08)',
        pointBackgroundColor: '#4a9eff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      },
      {
        label: '未確認AIシグナル 🛸',
        data: daily_trend?.map(d => d.unknown_visits || 0) || [],
        borderColor: '#c084fc',
        backgroundColor: 'rgba(192, 132, 252, 0.08)',
        pointBackgroundColor: '#c084fc',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        borderDash: [4, 3],
      },
      {
        label: '人間訪問 ●',
        data: daily_trend?.map(d => d.human_visits || 0) || [],
        borderColor: '#ffd700',
        backgroundColor: 'rgba(255, 215, 0, 0.06)',
        pointBackgroundColor: '#ffd700',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
        borderWidth: 2,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { size: 11 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#4a9eff',
        borderWidth: 1,
        padding: 12,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}回` }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(74, 158, 255, 0.08)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      x: {
        grid: { color: 'rgba(74, 158, 255, 0.04)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11 } }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* 星空背景（⑤ STARS定数を使用） */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {STARS.map((s, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{ top: s.top, left: s.left, animationDelay: s.delay }} />
        ))}
      </div>

      {/* ヘッダー */}
      <header className="border-b border-[#1a1e47] bg-[#0f1229]/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-[#4a9eff]/5">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#0066cc] flex items-center justify-center shadow-lg shadow-[#4a9eff]/50">
              <span className="text-base">🔭</span>
            </div>
            <div className="min-w-0">
              <Link href="/" className="text-base font-bold bg-gradient-to-r from-[#4a9eff] to-[#6eb5ff] bg-clip-text text-transparent block truncate">
                AI観測ラボ
              </Link>
              <p className="text-xs text-gray-400 hidden sm:block">Deep Space Observatory</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 bg-[#1a1e47] hover:bg-[#252a54] border border-[#2a2f57] rounded-lg transition-all duration-200 text-xs font-medium whitespace-nowrap"
            >
              🔄 更新
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-3 py-1.5 bg-[#1a1e47] hover:bg-[#252a54] border border-[#2a2f57] rounded-lg transition-all duration-200 text-xs font-medium whitespace-nowrap"
            >
              ← 戻る
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10 overflow-x-hidden">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-white via-[#4a9eff] to-[#c084fc] bg-clip-text text-transparent">
              観測ダッシュボード
            </span>
          </h1>
          <p className="text-gray-400 text-sm">
            Site ID: <span className="font-mono text-[#4a9eff]">{siteId}</span>
          </p>
        </div>

       {/* KPI 4カード */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

  {/* ① AI認知ステータス */}
  {(() => {
    const pages = ai_stats.recognized_pages ?? 0;
    const status = getAiStatus(pages);
    return (
      <div className={`${status.bg} border ${status.border} rounded-2xl p-5 relative overflow-hidden`}>
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20"
          style={{ background: status.color }} />
        <p className="text-xs text-gray-400 mb-3">AI認知ステータス</p>
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
          <span className="text-xl font-bold" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">過去7日間の判定</p>
      </div>
    );
  })()}

  {/* ② AI認知ページ数 */}
  <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-5 relative overflow-hidden hover:border-[#4a9eff]/40 transition-all">
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#4a9eff]/10 blur-2xl" />
    <p className="text-xs text-gray-400 mb-3">AI認知ページ数</p>
    <p className="text-3xl font-bold text-[#4a9eff]">
      {(ai_stats.recognized_pages ?? 0).toLocaleString()}
      <span className="text-sm text-gray-500 ml-1">ページ</span>
    </p>
    <p className="text-xs text-gray-500 mt-2">過去7日間</p>
  </div>

  {/* ③ AI crawler visits */}
  <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-5 relative overflow-hidden hover:border-[#c084fc]/40 transition-all">
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#c084fc]/10 blur-2xl" />
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs text-gray-400">AI crawler visits</p>
      <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
        ai_stats.trend === 'up'
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : ai_stats.trend === 'down'
          ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      }`}>
        {ai_stats.trend === 'up' ? '+' : ''}{ai_stats.change_percent ?? 0}%
      </span>
    </div>
    <p className="text-3xl font-bold text-[#c084fc]">
      {(ai_stats.total ?? 0).toLocaleString()}
      <span className="text-sm text-gray-500 ml-1">回</span>
    </p>
    <p className="text-xs text-gray-500 mt-2">過去7日間</p>
  </div>

  {/* ④ 人間訪問 */}
  <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-5 relative overflow-hidden hover:border-yellow-500/40 transition-all">
    <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-yellow-500/10 blur-2xl" />
    <p className="text-xs text-gray-400 mb-3">人間訪問</p>
    <p className="text-3xl font-bold text-[#ffd700]">
      {(ai_stats.human_total ?? 0).toLocaleString()}
      <span className="text-sm text-gray-500 ml-1">人</span>
    </p>
    <p className="text-xs text-gray-500 mt-2">過去7日間</p>
  </div>

</div>

        {/* 7日間推移グラフ（④ daily_trend.length チェック追加） */}
        {daily_trend && daily_trend.length > 0 && (
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-2xl">📈</span>7日間の観測推移
            </h2>
            <p className="text-xs text-gray-500 mb-6">AI確定訪問・未確認AIシグナル・人間訪問の推移</p>
            <div className="h-80">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        )}

        {/* よく見られたページ */}
        <div className="mb-8">
          <PageRanking topPages={top_pages} scData={scData} />
        </div>

        {/* Search Console分析パネル */}
        <div className="mb-8">
          <SearchConsolePanel siteId={siteId} />
        </div>

        {/* 課金セクション（予測ロック） */}
        <ProUpsellSection aiTotal={ai_stats.total} />

        {/* ミミック検知（アコーディオン） */}
        <AccordionSection title="🛸 周期的アクセス検出（ミミッククローラー）" defaultOpen={false}>
          <MimicPanel siteId={siteId} spoofedStats={data?.spoofed_stats} />
        </AccordionSection>

        {/* 最新観測ログ（10件） */}
        <AccordionSection title="📋 最新観測ログ（10件）" defaultOpen={false} className="mt-8">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2f57]">
                  {['観測日時', 'AI種別', '観測ページ', '検出方法'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-400 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recent_visits ?? []).map((visit, idx) => (
                  <tr key={idx} className="border-b border-[#1a1e47] hover:bg-[#1a1e47]/50 transition-colors">
                    <td className="py-3 px-4 text-gray-300 whitespace-nowrap text-xs">
                      {new Date(visit.visited_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#4a9eff] whitespace-nowrap">{visit.crawler_name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-[#6eb5ff] max-w-xs truncate">{visit.page_url || '/'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs bg-[#4a9eff]/20 text-[#4a9eff] px-2 py-1 rounded">{visit.detection_method}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AccordionSection>
      </main>

      <footer className="border-t border-[#1a1e47] bg-[#0f1229]/80 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400 text-sm">
          <p>© 2026 AI観測ラボ - Deep Space AI Observatory</p>
          <p className="text-xs text-gray-500 mt-2">AIクローラー観測・分析プラットフォーム</p>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function AccordionSection({ title, children, defaultOpen = false, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl shadow-xl mb-8 ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">{title}</h2>
        <span className={`text-gray-400 text-xl transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
      {/* ⑤ SKELETON_STARS定数を使用 */}
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
        <div className="text-center space-y-2">
          <p className="text-lg font-bold bg-gradient-to-r from-white via-[#4a9eff] to-[#c084fc] bg-clip-text text-transparent"
            style={{ animation: 'fadeInOut 2s ease-in-out infinite' }}>
            観測データを受信中...
          </p>
          <p className="text-xs text-gray-500">Deep Space Observatory</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#4a9eff]"
              style={{ animation: 'dotBounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
      <style jsx global>{`
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes starPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes fadeInOut { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes dotBounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-6px); opacity: 1; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } }
        .animate-twinkle { animation: twinkle 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}