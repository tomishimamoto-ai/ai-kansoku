'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Line, Bar } from 'react-chartjs-2';
import MimicPanel from '../components/MimicPanel';
import SearchConsolePanel from '../components/SearchConsolePanel';
import PageRanking from '../components/PageRanking';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function getHourColor(hour) {
  if (hour >= 0 && hour < 6) return 'rgba(30, 60, 120, 0.9)';
  if (hour >= 6 && hour < 9) return 'rgba(56, 130, 220, 0.9)';
  if (hour >= 9 && hour < 12) return 'rgba(74, 158, 255, 0.9)';
  if (hour >= 12 && hour < 15) return 'rgba(96, 175, 255, 0.9)';
  if (hour >= 15 && hour < 18) return 'rgba(74, 130, 220, 0.9)';
  if (hour >= 18 && hour < 21) return 'rgba(100, 80, 200, 0.9)';
  return 'rgba(50, 40, 140, 0.9)';
}

// ========================================
// 課金セクション（予測ロック型）
// ========================================
function ProUpsellSection({ aiTotal }) {
  // ダミーの予測値（将来はAIスコアから計算）
  const predictions = [
    { action: 'llms.txt を週1更新する', effect: '+23%', detail: 'GPTBotの訪問頻度が増加する見込み', icon: '📄' },
    { action: '構造化データを追加する', effect: '+15%', detail: 'Claude・Perplexityに認識されやすくなる', icon: '🧩' },
    { action: 'robots.txt を最適化する', effect: '+8%', detail: '未確認シグナルの正体判明率が上がる', icon: '🤖' },
  ];

  const totalUplift = 46; // ダミー

  return (
    <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#c084fc]/30 rounded-2xl p-6 shadow-xl mb-8 relative overflow-hidden">
      {/* 背景グロー */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#c084fc]/5 to-[#4a9eff]/5 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#c084fc]/10 blur-3xl pointer-events-none" />

      {/* ヘッダー */}
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

      {/* ぼかしダミー予測データ */}
      <div className="relative mb-5">
        <div className="space-y-3 blur-sm select-none pointer-events-none" aria-hidden="true">
          {/* 総合予測 */}
          <div className="bg-gradient-to-r from-[#c084fc]/10 to-[#4a9eff]/10 border border-[#c084fc]/20 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">改善を全て実施した場合の予測増加率</p>
            <p className="text-4xl font-bold text-[#c084fc]">+{totalUplift}%</p>
            <p className="text-xs text-gray-400 mt-1">
              現在 {(aiTotal ?? 0).toLocaleString()}回 → 予測 {Math.round((aiTotal ?? 0) * (1 + totalUplift / 100)).toLocaleString()}回/週
            </p>
          </div>
          {/* 施策別 */}
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

        {/* ロックオーバーレイ */}
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

      {/* CTA */}
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/visits?siteId=${siteId}&t=${Date.now()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        try {
          const scRes = await fetch(`/api/search-console/fetch?siteId=${siteId}`);
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
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!siteId) { setLoading(false); return; }
    fetchData();
  }, [siteId]);

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
        window.location.reload();
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

  // 診断スコア関連
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

  // ========================================
  // グラフ: 3本線（AI確定 / 未確認AIシグナル / 人間）
  // ========================================
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

  const hourCounts = Array(24).fill(0);
  if (hourly_distribution && Array.isArray(hourly_distribution)) {
    hourly_distribution.forEach(item => {
      const h = item.hour ?? item.h;
      if (h >= 0 && h < 24) hourCounts[h] = item.count ?? item.visits ?? 0;
    });
  }

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const totalHourVisits = hourCounts.reduce((a, b) => a + b, 0);

  const getPeakLabel = (hour) => {
    if (hour >= 0 && hour < 6) return '深夜帯';
    if (hour >= 6 && hour < 9) return '早朝帯';
    if (hour >= 9 && hour < 12) return '午前帯';
    if (hour >= 12 && hour < 15) return '昼帯';
    if (hour >= 15 && hour < 18) return '午後帯';
    if (hour >= 18 && hour < 21) return '夕方帯';
    return '夜間帯';
  };

  const barChartData = {
    labels: HOUR_LABELS,
    datasets: [{
      label: 'AI訪問回数',
      data: hourCounts,
      backgroundColor: hourCounts.map((_, i) => getHourColor(i)),
      borderColor: hourCounts.map((_, i) => i === peakHour ? '#ffffff' : 'transparent'),
      borderWidth: hourCounts.map((_, i) => (i === peakHour ? 2 : 0)),
      borderRadius: 4,
      borderSkipped: false,
      hoverBackgroundColor: '#6eb5ff'
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#4a9eff',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => `${items[0].label} の観測`,
          label: (ctx) => {
            const pct = totalHourVisits > 0 ? ((ctx.parsed.y / totalHourVisits) * 100).toFixed(1) : '0.0';
            return ` ${ctx.parsed.y}回 (${pct}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(74, 158, 255, 0.08)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#64748b',
          font: { size: 9 },
          maxRotation: 45,
          minRotation: 45,
          callback: (val, idx) => (idx % 4 === 0 ? HOUR_LABELS[idx] : '')
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* 星空背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[
          { top: '10%', left: '20%', delay: '0s' },
          { top: '30%', left: '60%', delay: '1s' },
          { top: '50%', left: '80%', delay: '2s' },
          { top: '70%', left: '40%', delay: '1.5s' },
          { top: '20%', left: '90%', delay: '0.5s' },
          { top: '85%', left: '15%', delay: '0.8s' },
          { top: '60%', left: '5%', delay: '2.3s' },
        ].map((s, i) => (
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
              onClick={fetchData}
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
        {/* タイトル */}
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

        {/* ① ヒーローカード：AI最適化スコア */}
        <div className="bg-gradient-to-br from-[#0f1229] via-[#0d1535] to-[#1a1e47] border border-[#4a9eff]/40 rounded-2xl p-8 shadow-2xl shadow-[#4a9eff]/10 mb-6 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#4a9eff]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-[#c084fc]/8 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎯</span>
                <span className="text-sm text-[#4a9eff] font-medium">AI最適化スコア</span>
              </div>

              {latestScore !== null ? (
                <>
                  <p className="text-7xl font-bold mb-2 leading-none"
                    style={{ color: getScoreColor(latestScore) }}>
                    {latestScore}
                    <span className="text-3xl text-gray-400 ml-1">/100</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold px-3 py-1 rounded-full border"
                      style={{
                        color: getScoreColor(latestScore),
                        borderColor: `${getScoreColor(latestScore)}40`,
                        background: `${getScoreColor(latestScore)}15`,
                      }}>
                      {getScoreLabel(latestScore)}
                    </span>
                    {scoreDiff !== null && (
                      <span className={`text-sm font-semibold ${scoreDiff > 0 ? 'text-emerald-400' : scoreDiff < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {scoreDiff > 0 ? `▲ +${scoreDiff}点` : scoreDiff < 0 ? `▼ ${scoreDiff}点` : '→ 前回と同点'}
                      </span>
                    )}
                  </div>
                  {diagnosedAt && (
                    <p className="text-xs text-gray-500 mt-2">最終診断: {diagnosedAt}</p>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-4xl font-bold text-gray-500 mb-2">未診断</p>
                  <p className="text-sm text-gray-400">診断を実行するとスコアが表示されます</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              {latestScore !== null && (
                <div className="w-full md:w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${latestScore}%`,
                      background: `linear-gradient(90deg, ${getScoreColor(latestScore)}, #4a9eff)`,
                    }} />
                </div>
              )}
              <Link href={`/?siteId=${siteId}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)' }}>
                🔄 再診断する
              </Link>
              {diagnoses_history && diagnoses_history.length > 1 && (
                <p className="text-xs text-gray-500">過去{diagnoses_history.length}回の診断履歴あり</p>
              )}
            </div>
          </div>
        </div>

        {/* ② サブカード：AI訪問・人間訪問 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* ✦ AI訪問（今週） */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-5 shadow-xl hover:border-[#4a9eff]/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✦</span>
                <h3 className="text-xs text-gray-400">AI訪問（今週）</h3>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                ai_stats.trend === 'up'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : ai_stats.trend === 'down'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}>
                {ai_stats.trend === 'up' ? '+' : ''}{ai_stats.change_percent ?? 0}% 先週比
              </span>
            </div>
            <p className="text-4xl font-bold text-[#4a9eff] mb-1">
              {(ai_stats.total ?? 0).toLocaleString()}
              <span className="text-lg text-gray-500 ml-1">回</span>
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {(ai_stats.by_crawler ?? []).slice(0, 3).map((c) => (
                <div key={c.crawler_name} className="text-center px-2.5 py-1 bg-[#1a1e47]/60 rounded-lg border border-[#2a2f57]">
                  <p className="text-xs text-gray-400 truncate max-w-[60px]">{c.crawler_name}</p>
                  <p className="text-xs font-bold text-[#4a9eff]">{c.visit_count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ● 人間訪問 */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-5 shadow-xl hover:border-yellow-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">●</span>
                <h3 className="text-xs text-gray-400">人間訪問（恒星）</h3>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">確定</span>
            </div>
            <p className="text-4xl font-bold text-[#ffd700] mb-1">
              {humanTotal.toLocaleString()}
              <span className="text-lg text-gray-500 ml-1">人</span>
            </p>
            <p className="text-xs text-gray-500 mt-3">7日間の人間訪問数</p>
          </div>
        </div>

        {/* ② 7日間推移グラフ（3本線） */}
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

        {/* ④ よく見られたページ */}
        <div className="mb-8">
          <PageRanking topPages={top_pages} scData={scData} />
        </div>

        {/* ⑤ Search Console分析パネル */}
        <div className="mb-8">
          <SearchConsolePanel siteId={siteId} />
        </div>

        {/* ⑥ 訪問時間帯グラフ */}
        <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🕐</span>AIクローラー 訪問時間帯分布
            </h2>
            {totalHourVisits > 0 && (
              <div className="flex items-center gap-3 bg-[#4a9eff]/10 border border-[#4a9eff]/30 rounded-xl px-4 py-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs text-gray-400">ピーク観測時刻</p>
                  <p className="font-bold text-[#4a9eff]">
                    {HOUR_LABELS[peakHour]}
                    <span className="ml-2 text-xs text-gray-400 font-normal">({getPeakLabel(peakHour)})</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {totalHourVisits === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl mb-3 block">📡</span>
              <p className="text-gray-400">時間帯データがまだありません</p>
              <p className="text-xs text-gray-500 mt-1">AIクローラーの訪問が増えると表示されます</p>
            </div>
          ) : (
            <>
              <div className="h-56 md:h-64">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '深夜 (0-6時)', range: [0, 6], icon: '🌙' },
                  { label: '午前 (6-12時)', range: [6, 12], icon: '🌅' },
                  { label: '昼間 (12-18時)', range: [12, 18], icon: '☀️' },
                  { label: '夜間 (18-24時)', range: [18, 24], icon: '🌆' },
                ].map(({ label, range, icon }) => {
                  const sum = hourCounts.slice(range[0], range[1]).reduce((a, b) => a + b, 0);
                  const pct = totalHourVisits > 0 ? Math.round((sum / totalHourVisits) * 100) : 0;
                  return (
                    <div key={label} className="bg-[#1a1e47]/50 rounded-xl p-3 border border-[#2a2f57] text-center">
                      <span className="text-xl">{icon}</span>
                      <p className="text-xs text-gray-400 mt-1 mb-2">{label}</p>
                      <p className="text-2xl font-bold text-[#4a9eff]">{pct}%</p>
                      <p className="text-xs text-gray-500">{sum}回</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 bg-[#1a1e47]/30 border border-[#4a9eff]/20 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  <span className="text-[#4a9eff] font-bold">💡 インサイト: </span>
                  {(() => {
                    const nightPct = hourCounts.slice(0, 6).reduce((a, b) => a + b, 0) / totalHourVisits * 100;
                    const dayPct = hourCounts.slice(9, 18).reduce((a, b) => a + b, 0) / totalHourVisits * 100;
                    if (nightPct > 40) return 'このサイトのAIクローラーは深夜帯に集中しています。サーバー負荷の低い時間帯に活発なクロールが行われています。';
                    if (dayPct > 50) return 'AIクローラーの活動は日中に集中しています。コンテンツの更新タイミングを午前中に合わせると検出率が上がる可能性があります。';
                    return `最もAIクローラーが活発な時間帯は ${HOUR_LABELS[peakHour]} (${getPeakLabel(peakHour)}) です。この時間帯のサーバーパフォーマンスを最適化しましょう。`;
                  })()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ⑦ 課金セクション（予測ロック） */}
        <ProUpsellSection aiTotal={ai_stats.total} />

        {/* ⑧ ミミック検知（アコーディオン） */}
        <AccordionSection title="🛸 周期的アクセス検出（ミミッククローラー）" defaultOpen={false}>
          <MimicPanel siteId={siteId} spoofedStats={data?.spoofed_stats} />
        </AccordionSection>

        {/* ⑧ 最新観測ログ（10件） */}
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
                {recent_visits.map((visit, idx) => (
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[
          { top: '10%', left: '20%', delay: '0s', size: 'w-1 h-1' },
          { top: '30%', left: '60%', delay: '0.5s', size: 'w-1 h-1' },
          { top: '50%', left: '80%', delay: '1s', size: 'w-0.5 h-0.5' },
          { top: '70%', left: '40%', delay: '1.5s', size: 'w-1 h-1' },
          { top: '20%', left: '90%', delay: '2s', size: 'w-0.5 h-0.5' },
        ].map((s, i) => (
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