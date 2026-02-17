'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Line } from 'react-chartjs-2';
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

// DashboardContent に名前変更
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

  // データ取得
  useEffect(() => {
    if (!siteId) {
      setLoading(false);
      return;
    }

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

  // 手動入力データの保存
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
        alert('✅ データを保存しました！');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving manual data:', error);
      alert('❌ 保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (!siteId) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">⚠️ サイトIDが必要です</h1>
          <Link href="/" className="text-[#4a9eff] hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#1a1e47] border-t-[#4a9eff] rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#4a9eff]/30 rounded-full animate-ping mx-auto"></div>
          </div>
          <p className="text-gray-400">観測データ読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">❌ データ取得に失敗しました</h1>
          <Link href="/" className="text-[#4a9eff] hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    );
  }

  const { ai_stats, top_pages, detection_methods, recent_visits, daily_trend } = data;
  const totalAI = ai_stats.total;
  const change = ai_stats.change_percent;

  // 7日間推移グラフデータ
  const chartData = {
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

  const chartOptions = {
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
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}回`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(74, 158, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 }
        }
      },
      x: {
        grid: {
          color: 'rgba(74, 158, 255, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* 星空背景エフェクト */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ top: '10%', left: '20%', animationDelay: '0s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ top: '30%', left: '60%', animationDelay: '1s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ top: '50%', left: '80%', animationDelay: '2s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ top: '70%', left: '40%', animationDelay: '1.5s' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-twinkle" style={{ top: '20%', left: '90%', animationDelay: '0.5s' }}></div>
      </div>

      {/* ヘッダー */}
      <header className="border-b border-[#1a1e47] bg-[#0f1229]/80 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-[#4a9eff]/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
              className="px-4 py-2 bg-[#1a1e47] hover:bg-[#252a54] border border-[#2a2f57] rounded-lg transition-all duration-200 text-sm font-medium shadow-lg"
            >
              ← 戻る
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* 観測所ヘッダー */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-[#4a9eff] to-[#6eb5ff] bg-clip-text text-transparent">
            観測ダッシュボード
          </h1>
          <p className="text-gray-400 text-sm">Site ID: <span className="font-mono text-[#4a9eff]">{siteId}</span></p>
        </div>

        {/* サマリーカード - 天体観測風 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* AI訪問数（彗星） */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl shadow-[#4a9eff]/10 hover:shadow-[#4a9eff]/20 transition-all duration-300">
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
                {change > 0 ? '↗' : change < 0 ? '↘' : '→'} {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
            <p className="text-5xl font-bold bg-gradient-to-r from-[#4a9eff] to-[#6eb5ff] bg-clip-text text-transparent mb-2">
              {totalAI.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">7日間の観測データ</p>
          </div>

          {/* ユニークセッション */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🌟</span>
              <h3 className="text-sm text-gray-400">ユニークセッション</h3>
            </div>
            <p className="text-5xl font-bold text-[#4a9eff] mb-2">
              {ai_stats.unique_sessions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">重複を除いた訪問数</p>
          </div>

          {/* ユニークIP */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🌌</span>
              <h3 className="text-sm text-gray-400">観測座標（IP）</h3>
            </div>
            <p className="text-5xl font-bold text-[#6eb5ff] mb-2">
              {ai_stats.unique_ips.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">異なる発信源の数</p>
          </div>
        </div>

        {/* 7日間推移グラフ */}
        {daily_trend && daily_trend.length > 0 && (
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              7日間の観測推移
            </h2>
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#4a9eff]"></span>
                <span className="text-gray-400">AI訪問（彗星 ✦）</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ffd700]"></span>
                <span className="text-gray-400">人間訪問（恒星 ●）</span>
              </div>
            </div>
          </div>
        )}

        {/* AI別詳細統計 */}
        <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl mb-8">
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
                <div key={idx} className="bg-[#1a1e47]/50 rounded-xl p-5 border border-[#2a2f57] hover:border-[#4a9eff]/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4a9eff]/20 to-[#6eb5ff]/20 flex items-center justify-center border border-[#4a9eff]/30">
                        <span className="text-2xl">
                          {crawler.crawler_name.includes('GPT') ? '🤖' :
                           crawler.crawler_name.includes('Claude') ? '🧠' :
                           crawler.crawler_name.includes('Perplexity') ? '🔍' :
                           crawler.crawler_name.includes('Gemini') ? '💎' :
                           '🌐'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#4a9eff]">{crawler.crawler_name}</h3>
                        <p className="text-sm text-gray-400">
                          {crawler.visit_count.toLocaleString()}回の観測記録
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        crawler.change_percent > 0 ? 'bg-green-500/20 text-green-400' : 
                        crawler.change_percent < 0 ? 'bg-red-500/20 text-red-400' : 
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {crawler.change_percent > 0 ? '+' : ''}{crawler.change_percent}%
                      </span>
                      <p className="text-xs text-gray-500 mt-1">先週比</p>
                    </div>
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

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* よく読まれるページ */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl">
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
                          <p className="text-sm font-mono text-[#6eb5ff] truncate">
                            {page.url}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {page.crawler_variety}種類のAIが観測
                        </p>
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

          {/* 検出方法の内訳 */}
          <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl">
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
                        {method.method === 'user-agent' ? '🎯 User-Agent分析' :
                         method.method === 'rapid-access' ? '⚡ 高速アクセス検出' :
                         method.method === 'pattern-inference' ? '🧩 パターン推論' :
                         method.method}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {method.method === 'user-agent' ? 'UA文字列から判定' :
                         method.method === 'rapid-access' ? '1秒以内の連続アクセス' :
                         method.method === 'pattern-inference' ? 'ヘッダー情報から推測' :
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

        {/* 人間訪問データ（手動入力） - 恒星モチーフ */}
        <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">●</span>
            人間訪問データ（恒星）
          </h2>
          
          <p className="text-sm text-gray-400 mb-6 bg-[#1a1e47]/50 rounded-lg p-3 border border-[#2a2f57]">
            💡 GA4やGoogle Search Consoleのデータを入力すると、AI訪問（彗星 ✦）との比較ができます
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">ユーザー数</label>
              <input
                type="number"
                value={manualInput.userCount}
                onChange={(e) => setManualInput({...manualInput, userCount: e.target.value})}
                placeholder="例: 1,234"
                className="w-full bg-[#1a1e47] border border-[#2a2f57] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#4a9eff] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">ページビュー</label>
              <input
                type="number"
                value={manualInput.pageViews}
                onChange={(e) => setManualInput({...manualInput, pageViews: e.target.value})}
                placeholder="例: 5,678"
                className="w-full bg-[#1a1e47] border border-[#2a2f57] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#4a9eff] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">セッション数</label>
              <input
                type="number"
                value={manualInput.sessions}
                onChange={(e) => setManualInput({...manualInput, sessions: e.target.value})}
                placeholder="例: 2,345"
                className="w-full bg-[#1a1e47] border border-[#2a2f57] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#4a9eff] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSaveManualData}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[#4a9eff] to-[#0066cc] hover:from-[#5aa9ff] hover:to-[#1a76dd] rounded-lg font-bold transition-all duration-200 disabled:opacity-50 shadow-lg shadow-[#4a9eff]/30"
          >
            {saving ? '保存中...' : '💾 データを保存'}
          </button>

          {manualInput.userCount && (
            <div className="mt-6 bg-gradient-to-br from-[#1a1e47] to-[#252a54] rounded-xl p-6 border border-[#4a9eff]/30 shadow-lg shadow-[#4a9eff]/10">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                <span>📊</span> 総観測数の比較
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#0a0e27]/50 rounded-lg p-4 border border-[#2a2f57]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">●</span>
                    <p className="text-sm text-gray-400">人間訪問（恒星）</p>
                  </div>
                  <p className="text-4xl font-bold text-[#ffd700]">
                    {parseInt(manualInput.userCount || '0').toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#0a0e27]/50 rounded-lg p-4 border border-[#2a2f57]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✦</span>
                    <p className="text-sm text-gray-400">AI訪問（彗星）</p>
                  </div>
                  <p className="text-4xl font-bold text-[#4a9eff]">
                    {totalAI.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-[#2a2f57]">
                <p className="text-sm text-gray-400 mb-2">🌌 総観測数（人間 + AI）</p>
                <p className="text-5xl font-bold bg-gradient-to-r from-[#ffd700] to-[#4a9eff] bg-clip-text text-transparent">
                  {(parseInt(manualInput.userCount || '0') + totalAI).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-2">7日間の全観測データ</p>
              </div>
            </div>
          )}
        </div>

        {/* 最新訪問履歴 */}
        <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            最新観測ログ（20件）
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2f57]">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">観測日時</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">AI種別</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">観測ページ</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">検出方法</th>
                </tr>
              </thead>
              <tbody>
                {recent_visits.map((visit, idx) => (
                  <tr key={idx} className="border-b border-[#1a1e47] hover:bg-[#1a1e47]/50 transition-colors">
                    <td className="py-3 px-4 text-gray-300">
                      {new Date(visit.visited_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#4a9eff]">
                        {visit.crawler_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#6eb5ff]">
                      {visit.page_url || '/'}
                    </td>
                    <td className="py-3 px-4">
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

      {/* カスタムアニメーション用CSS */}
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

// Suspenseでラップ
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e27] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#1a1e47] border-t-[#4a9eff] rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-[#4a9eff]/30 rounded-full animate-ping mx-auto"></div>
          </div>
          <p>観測データ読み込み中...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}