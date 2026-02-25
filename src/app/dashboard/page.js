'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Line, Bar } from 'react-chartjs-2';
import MimicPanel from '../components/MimicPanel';
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 時間帯ラベル生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// 時間帯カラーグラデーション（深夜=暗い青、朝=水色、昼=明るい青、夕=紫、夜=濃い青）
function getHourColor(hour) {
  if (hour >= 0 && hour < 6) return 'rgba(30, 60, 120, 0.9)';   // 深夜
  if (hour >= 6 && hour < 9) return 'rgba(56, 130, 220, 0.9)';  // 早朝
  if (hour >= 9 && hour < 12) return 'rgba(74, 158, 255, 0.9)'; // 午前
  if (hour >= 12 && hour < 15) return 'rgba(96, 175, 255, 0.9)';// 昼
  if (hour >= 15 && hour < 18) return 'rgba(74, 130, 220, 0.9)';// 午後
  if (hour >= 18 && hour < 21) return 'rgba(100, 80, 200, 0.9)';// 夕方
  return 'rgba(50, 40, 140, 0.9)';                               // 夜
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DashboardContent
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DashboardContent() {
  const searchParams = useSearchParams();
  const siteId = searchParams.get('siteId');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState({
    userCount: '',
    pageViews: '',
    sessions: ''
  });
  const [saving, setSaving] = useState(false);
  const [manualSaved, setManualSaved] = useState(false);

  // データ取得
  useEffect(() => {
    if (!siteId) { setLoading(false); return; }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/visits?siteId=${siteId}`);
        const json = await res.json();
        if (json.success) {
          setData(json);
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

    fetchData();
  }, [siteId]);

  // 手動データ保存
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

  // ────────── ローディング / エラー画面 ──────────
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

  if (loading) {
  return <DashboardSkeleton />;
}

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

  const { ai_stats, top_pages, detection_methods, recent_visits, daily_trend, hourly_distribution } = data;
  const totalAI = ai_stats.total;
  const change = ai_stats.change_percent;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7日間推移グラフ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const lineChartData = {
    labels: daily_trend?.map(d => {
      const date = new Date(d.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }) || [],
    datasets: [
      {
        label: 'AI訪問 (彗星)',
        data: daily_trend?.map(d => d.ai_visits) || [],
        borderColor: '#4a9eff',
        backgroundColor: 'rgba(74, 158, 255, 0.1)',
        pointBackgroundColor: '#4a9eff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true
      },
      {
        label: '人間訪問 (恒星)',
        data: daily_trend?.map(d => d.human_visits || 0) || [],
        borderColor: '#ffd700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        pointBackgroundColor: '#ffd700',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: true
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
          font: { size: 12 },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 14, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: '#4a9eff',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}回`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(74, 158, 255, 0.1)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11 } }
      },
      x: {
        grid: { color: 'rgba(74, 158, 255, 0.05)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11 } }
      }
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 時間帯分布グラフ（Bar）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // hourly_distribution が配列 [{hour: 0, count: 12}, ...] を想定
  // フォールバック: 24要素の0配列
  const hourCounts = Array(24).fill(0);
  if (hourly_distribution && Array.isArray(hourly_distribution)) {
    hourly_distribution.forEach(item => {
      const h = item.hour ?? item.h;
      if (h >= 0 && h < 24) hourCounts[h] = item.count ?? item.visits ?? 0;
    });
  }

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const totalHourVisits = hourCounts.reduce((a, b) => a + b, 0);

  // ピーク帯の説明
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
    datasets: [
      {
        label: 'AI訪問回数',
        data: hourCounts,
        backgroundColor: hourCounts.map((_, i) => getHourColor(i)),
        borderColor: hourCounts.map((_, i) =>
          i === peakHour ? '#ffffff' : 'transparent'
        ),
        borderWidth: hourCounts.map((_, i) => (i === peakHour ? 2 : 0)),
        borderRadius: 4,
        borderSkipped: false,
        hoverBackgroundColor: '#6eb5ff'
      }
    ]
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
            const pct = totalHourVisits > 0
              ? ((ctx.parsed.y / totalHourVisits) * 100).toFixed(1)
              : '0.0';
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
          // 4時間おきにラベル表示
          callback: (val, idx) => (idx % 4 === 0 ? HOUR_LABELS[idx] : '')
        }
      }
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const hasManualData = manualInput.userCount !== '';
  const manualUserCount = hasManualData ? parseInt(manualInput.userCount || '0') : 0;

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
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          />
        ))}
      </div>

      {/* ヘッダー */}
      <header className="border-b border-[#1a1e47] bg-[#0f1229]/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-[#4a9eff]/5">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4a9eff] to-[#0066cc] flex items-center justify-center shadow-lg shadow-[#4a9eff]/50">
              <span className="text-xl">🔭</span>
            </div>
            <div>
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-[#4a9eff] to-[#6eb5ff] bg-clip-text text-transparent">
                AI観測ラボ
              </Link>
              <p className="text-xs text-gray-400">Deep Space Observatory</p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-[#1a1e47] hover:bg-[#252a54] border border-[#2a2f57] rounded-lg transition-all duration-200 text-sm font-medium"
          >
            ← 戻る
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
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

       {/* ─── サマリーカード ─── */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  {/* AI訪問数 */}
  <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl shadow-[#4a9eff]/10 hover:shadow-[#4a9eff]/20 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-3xl">✦</span>
        <h3 className="text-sm text-gray-400">AI訪問（彗星）</h3>
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
        change > 0 ? 'bg-green-500/20 text-green-400' :
        change < 0 ? 'bg-red-500/20 text-red-400' :
        'bg-gray-500/20 text-gray-400'
      }`}>
        {change > 0 ? '↗ +' : change < 0 ? '↘ ' : '→ '}{change}%
      </span>
    </div>
    <p className="text-5xl font-bold bg-gradient-to-r from-[#4a9eff] to-[#6eb5ff] bg-clip-text text-transparent mb-2">
      {ai_stats.unique_ips.toLocaleString()}
    </p>
    <p className="text-xs text-gray-500">ユニークAIクローラーIP</p>
  </div>

  {/* AIページビュー数 */}
  <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-3xl">📄</span>
      <h3 className="text-sm text-gray-400">AIページビュー</h3>
    </div>
    <p className="text-5xl font-bold text-[#4a9eff] mb-2">
      {ai_stats.total.toLocaleString()}
    </p>
    <p className="text-xs text-gray-500">7日間のAIクローラー訪問数</p>
  </div>

  {/* 人間訪問数 */}
  <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-3xl">●</span>
      <h3 className="text-sm text-gray-400">人間訪問（恒星）</h3>
    </div>
    <p className="text-5xl font-bold text-[#ffd700] mb-2">
      {(ai_stats.human_total ?? 0).toLocaleString()}
    </p>
    <p className="text-xs text-gray-500">7日間の人間訪問数</p>
  </div>
</div>

        {/* ─── 7日間推移グラフ ─── */}
        {daily_trend && daily_trend.length > 0 && (
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              7日間の観測推移
            </h2>
            <div className="h-80">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#4a9eff]" />
                <span className="text-gray-400">AI訪問（彗星 ✦）</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ffd700]" />
                <span className="text-gray-400">人間訪問（恒星 ●）</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── 訪問時間帯グラフ（NEW） ─── */}
        <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🕐</span>
              AIクローラー 訪問時間帯分布
            </h2>

            {/* ピーク帯インサイト */}
            {totalHourVisits > 0 && (
              <div className="flex items-center gap-3 bg-[#4a9eff]/10 border border-[#4a9eff]/30 rounded-xl px-4 py-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs text-gray-400">ピーク観測時刻</p>
                  <p className="font-bold text-[#4a9eff]">
                    {HOUR_LABELS[peakHour]}
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      ({getPeakLabel(peakHour)})
                    </span>
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

              {/* 時間帯インサイト */}
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

              {/* AIの活動パターンのインサイトメッセージ */}
              <div className="mt-4 bg-[#1a1e47]/30 border border-[#4a9eff]/20 rounded-xl p-4">
                <p className="text-sm text-gray-300">
                  <span className="text-[#4a9eff] font-bold">💡 インサイト: </span>
                  {(() => {
                    const nightPct = hourCounts.slice(0, 6).reduce((a, b) => a + b, 0) / totalHourVisits * 100;
                    const dayPct = hourCounts.slice(9, 18).reduce((a, b) => a + b, 0) / totalHourVisits * 100;
                    if (nightPct > 40) {
                      return 'このサイトのAIクローラーは深夜帯に集中しています。サーバー負荷の低い時間帯に活発なクロールが行われています。';
                    } else if (dayPct > 50) {
                      return 'AIクローラーの活動は日中に集中しています。コンテンツの更新タイミングを午前中に合わせると検出率が上がる可能性があります。';
                    } else {
                      return `最もAIクローラーが活発な時間帯は ${HOUR_LABELS[peakHour]} (${getPeakLabel(peakHour)}) です。この時間帯のサーバーパフォーマンスを最適化しましょう。`;
                    }
                  })()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* ─── AI別詳細統計 ─── */}
        <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI別観測レポート
          </h2>

          <div className="space-y-4">
            {ai_stats.by_crawler.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">🔭</span>
                <p className="text-gray-400">まだAI訪問が観測されていません</p>
                <p className="text-sm text-gray-500 mt-2">トラッキングコードを設置してお待ちください</p>
              </div>
            ) : (
              ai_stats.by_crawler.map((crawler, idx) => (
                <div key={idx} className="bg-[#1a1e47]/50 rounded-xl p-5 border border-[#2a2f57] hover:border-[#4a9eff]/50 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a9eff]/20 to-[#6eb5ff]/20 flex items-center justify-center border border-[#4a9eff]/30">
                        <span className="text-2xl">
                          {crawler.crawler_name.includes('GPT') ? '🤖' :
                           crawler.crawler_name.includes('Claude') ? '🧠' :
                           crawler.crawler_name.includes('Perplexity') ? '🔍' :
                           crawler.crawler_name.includes('Gemini') ? '💎' : '🌐'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#4a9eff]">{crawler.crawler_name}</h3>
                        <p className="text-sm text-gray-400">{crawler.visit_count.toLocaleString()}回の観測記録</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      crawler.change_percent > 0 ? 'bg-green-500/20 text-green-400' :
                      crawler.change_percent < 0 ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {crawler.change_percent > 0 ? '+' : ''}{crawler.change_percent}%
                      <span className="ml-1 text-xs font-normal">先週比</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm bg-[#0a0e27]/50 rounded-lg p-3">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">セッション数</p>
                      <p className="font-bold text-[#4a9eff]">{crawler.unique_sessions}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs mb-1">観測座標</p>
                      <p className="font-bold text-[#6eb5ff]">{crawler.unique_ips}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── 2カラム: ページ / 検出方法 ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* よく読まれるページ */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📄</span>
              高頻度観測ページ TOP5
            </h2>
            {top_pages.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">📡</span>
                <p className="text-gray-400">観測データがありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {top_pages.map((page, idx) => (
                  <div key={idx} className="bg-[#1a1e47]/50 rounded-lg p-4 border border-[#2a2f57] hover:border-[#4a9eff]/50 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-[#4a9eff] bg-[#4a9eff]/20 px-2 py-1 rounded">
                            #{idx + 1}
                          </span>
                          <p className="text-sm font-mono text-[#6eb5ff] truncate">{page.url}</p>
                        </div>
                        <p className="text-xs text-gray-500">{page.crawler_variety}種類のAIが観測</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-2xl text-[#4a9eff]">{page.visits}</p>
                        <p className="text-xs text-gray-500">回</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 検出方法 */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              観測方法の内訳
            </h2>
            <div className="space-y-3">
              {detection_methods.map((method, idx) => (
                <div key={idx} className="bg-[#1a1e47]/50 rounded-lg p-4 border border-[#2a2f57]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-[#4a9eff]">
                        {method.method === 'user-agent'      ? '🎯 User-Agent分析' :
                         method.method === 'rapid-access'    ? '⚡ 高速アクセス検出' :
                         method.method === 'pattern-inference' ? '🧩 パターン推論' :
                         method.method === 'ip-range'        ? '🌐 IPレンジ照合' :
                         method.method === 'dns-reverse'     ? '🔎 DNS逆引き検証' :
                         method.method === 'head-method'     ? '📡 HEADメソッド検出' :
                         method.method === 'javascript'      ? '⚙️ JavaScript検出' :
                         method.method === 'image-request'   ? '🖼️ 画像リクエスト検出' :
                         `🔬 ${method.method}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {method.method === 'user-agent'      ? 'UA文字列から判定' :
                         method.method === 'rapid-access'    ? '1秒以内の連続アクセス' :
                         method.method === 'pattern-inference' ? 'ヘッダー情報から推測' :
                         method.method === 'ip-range'        ? '公式公開CIDRリストと照合' :
                         method.method === 'dns-reverse'     ? 'IPから逆引きしたホスト名で確認' :
                         method.method === 'head-method'     ? 'HEADリクエストを送信するクローラー' :
                         method.method === 'javascript'      ? 'JSトラッキングコードで検出' :
                         method.method === 'image-request'   ? '画像リクエストパターンで検出' :
                         ''}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-3xl font-bold text-[#4a9eff]">{method.count}</p>
                      <p className="text-xs text-gray-500">件</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 人間訪問データセクション（手動入力のみ）─── */}
        <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <span className="text-2xl">●</span>
            人間訪問データ（恒星）
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            GA4の数値を入力すると、AI訪問（彗星 ✦）と合わせた総観測数を正確に確認できます
          </p>

          {/* 入力フォーム */}
          <div className="bg-[#4a9eff]/10 border border-[#4a9eff]/30 rounded-xl p-4 mb-5 flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <p className="text-sm text-gray-300">
              GA4 › レポート › 集客 › 概要 から数値をコピーして入力してください。
              <span className="text-gray-500 ml-1">（入力は任意です）</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {[
              { key: 'userCount', label: 'ユーザー数', placeholder: '例: 5,453' },
              { key: 'pageViews', label: 'ページビュー', placeholder: '例: 12,345' },
              { key: 'sessions', label: 'セッション数', placeholder: '例: 7,069' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-2 font-medium">{label}</label>
                <input
                  type="number"
                  value={manualInput[key]}
                  onChange={(e) => setManualInput({ ...manualInput, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full bg-[#1a1e47] border border-[#2a2f57] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#4a9eff] focus:border-transparent transition-all"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleSaveManualData}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-[#4a9eff] to-[#0066cc] hover:from-[#5aa9ff] hover:to-[#1a76dd] rounded-lg font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#4a9eff]/30"
            >
              {saving ? '保存中...' : manualSaved ? '✅ 保存しました！' : '💾 データを保存'}
            </button>

            {/* 有料版への導線 */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>🔒</span>
              <span>
                <span className="text-[#ffd700] font-medium">プロプラン</span>
                {' '}でGA4自動連携に対応予定
              </span>
            </div>
          </div>

          {/* 入力後の比較表示 */}
          {hasManualData && (
            <div className="mt-6 bg-gradient-to-br from-[#1a1e47] to-[#252a54] rounded-xl p-6 border border-[#4a9eff]/30 shadow-lg shadow-[#4a9eff]/10">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span>📊</span> 総観測数の比較
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#0a0e27]/50 rounded-lg p-4 border border-[#2a2f57]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">●</span>
                    <p className="text-sm text-gray-400">人間訪問（恒星）</p>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">GA4実測値</span>
                  </div>
                  <p className="text-4xl font-bold text-[#ffd700]">
                    {manualUserCount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#0a0e27]/50 rounded-lg p-4 border border-[#2a2f57]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✦</span>
                    <p className="text-sm text-gray-400">AI訪問（彗星）</p>
                    <span className="text-xs bg-[#4a9eff]/20 text-[#4a9eff] px-2 py-0.5 rounded">観測実測値</span>
                  </div>
                  <p className="text-4xl font-bold text-[#4a9eff]">
                    {totalAI.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-[#2a2f57]">
                <p className="text-sm text-gray-400 mb-2">🌌 総観測数（人間 + AI）</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-[#ffd700] to-[#4a9eff] bg-clip-text text-transparent">
                  {(manualUserCount + totalAI).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">7日間の全観測データ</p>

                {/* AI比率バー */}
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-2">AI訪問の比率</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-[#4a9eff] to-[#6eb5ff]"
                      style={{
                        width: `${Math.max(Math.round((totalAI / (manualUserCount + totalAI)) * 100), 1)}%`,
                        minWidth: '4px'
                      }}
                    />
                    <span className="text-sm font-bold text-[#4a9eff]">
                      {Math.round((totalAI / (manualUserCount + totalAI)) * 100)}% がAI訪問
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>✦ AI: {totalAI}回</span>
                    <span>● 人間: {manualUserCount.toLocaleString()}人</span>
                  </div>
                </div>

                {/* GA4比較メッセージ */}
                {manualUserCount > 0 && (
                  <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <p className="text-sm text-green-400 font-bold mb-1">
                      ✅ GA4では見えていない露出が存在します
                    </p>
                    <p className="text-xs text-gray-400">
                      GA4のユーザー数は {manualUserCount.toLocaleString()} 人ですが、
                      AIクローラーによる露出が別途 {totalAI.toLocaleString()} 回発生しています。
                      施策の効果はGA4の数値だけでは正確に測れません。
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

<MimicPanel siteId={siteId} />

        {/* ─── 最新訪問ログ ─── */}
        <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            最新観測ログ（20件）
          </h2>
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
                    <td className="py-3 px-4 font-bold text-[#4a9eff] whitespace-nowrap">
                      {visit.crawler_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#6eb5ff] max-w-xs truncate">
                      {visit.page_url || '/'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs bg-[#4a9eff]/20 text-[#4a9eff] px-2 py-1 rounded">
                        {visit.detection_method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* フッター */}
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
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// スケルトンコンポーネント（DashboardPageの直前に追加）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
      {/* 星屑背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[
          { top: '10%', left: '20%', delay: '0s', size: 'w-1 h-1' },
          { top: '30%', left: '60%', delay: '0.5s', size: 'w-1 h-1' },
          { top: '50%', left: '80%', delay: '1s', size: 'w-0.5 h-0.5' },
          { top: '70%', left: '40%', delay: '1.5s', size: 'w-1 h-1' },
          { top: '20%', left: '90%', delay: '2s', size: 'w-0.5 h-0.5' },
          { top: '85%', left: '15%', delay: '0.8s', size: 'w-1 h-1' },
          { top: '60%', left: '5%', delay: '2.3s', size: 'w-0.5 h-0.5' },
          { top: '40%', left: '35%', delay: '1.2s', size: 'w-0.5 h-0.5' },
          { top: '15%', left: '55%', delay: '0.3s', size: 'w-1 h-1' },
          { top: '75%', left: '70%', delay: '1.8s', size: 'w-0.5 h-0.5' },
        ].map((s, i) => (
          <div
            key={i}
            className={`absolute ${s.size} bg-white rounded-full animate-twinkle`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          />
        ))}
      </div>

      {/* メイン: パルス星 */}
      <div className="relative flex flex-col items-center gap-8">
        {/* 外側のリング（ゆっくり広がる）*/}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute rounded-full border border-[#4a9eff]/10"
            style={{ width: 180, height: 180, animation: 'pulseRing 2s ease-out infinite' }}
          />
          <div
            className="absolute rounded-full border border-[#4a9eff]/20"
            style={{ width: 140, height: 140, animation: 'pulseRing 2s ease-out infinite 0.3s' }}
          />
          <div
            className="absolute rounded-full border border-[#4a9eff]/30"
            style={{ width: 100, height: 100, animation: 'pulseRing 2s ease-out infinite 0.6s' }}
          />

          {/* 中央の星 */}
          <div
            className="relative w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, #4a9eff 0%, #0066cc 60%, #001a4d 100%)',
              boxShadow: '0 0 30px #4a9eff, 0 0 60px #4a9eff40, 0 0 100px #4a9eff20',
              animation: 'starPulse 2s ease-in-out infinite',
            }}
          >
            <span className="text-2xl">✦</span>
          </div>
        </div>

        {/* テキスト */}
        <div className="text-center space-y-2">
          <p
            className="text-lg font-bold bg-gradient-to-r from-white via-[#4a9eff] to-[#c084fc] bg-clip-text text-transparent"
            style={{ animation: 'fadeInOut 2s ease-in-out infinite' }}
          >
            観測データを受信中...
          </p>
          <p className="text-xs text-gray-500">Deep Space Observatory</p>
        </div>

        {/* ドット3つ */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#4a9eff]"
              style={{ animation: `dotBounce 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulseRing {
          0%   { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes starPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 30px #4a9eff, 0 0 60px #4a9eff40; }
          50%       { transform: scale(1.15); box-shadow: 0 0 50px #4a9eff, 0 0 100px #4a9eff60; }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.5); }
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
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
