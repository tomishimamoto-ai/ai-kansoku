'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">⚠️ サイトIDが必要です</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">データ読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">❌ データ取得に失敗しました</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    );
  }

  const { ai_stats, top_pages, detection_methods, recent_visits } = data;
  const totalAI = ai_stats.total;
  const change = ai_stats.change_percent;

  return (

<div className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                AI観測ラボ
              </Link>
              <p className="text-sm text-gray-400 mt-1">ダッシュボード</p>
            </div>
            <Link 
              href={`/result?siteId=${siteId}`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
            >
              診断結果に戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-400">AI訪問数（7日間）</h3>
              <span className={`text-sm font-bold ${
                change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {change > 0 ? '📈' : change < 0 ? '📉' : '━'} {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {totalAI.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">先週との比較</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-sm text-gray-400 mb-2">ユニークセッション</h3>
            <p className="text-4xl font-bold text-blue-400">
              {ai_stats.unique_sessions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">重複を除いた訪問数</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-sm text-gray-400 mb-2">ユニークIP</h3>
            <p className="text-4xl font-bold text-purple-400">
              {ai_stats.unique_ips.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">異なるIPアドレス数</p>
          </div>
        </div>

        {/* AI別詳細統計 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI別訪問統計
          </h2>
          
          <div className="space-y-4">
            {ai_stats.by_crawler.length === 0 ? (
              <p className="text-gray-400 text-center py-8">まだAI訪問がありません</p>
            ) : (
              ai_stats.by_crawler.map((crawler, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {crawler.crawler_name.includes('GPT') ? '🤖' :
                         crawler.crawler_name.includes('Claude') ? '🧠' :
                         crawler.crawler_name.includes('Perplexity') ? '🔍' :
                         crawler.crawler_name.includes('Gemini') ? '💎' :
                         '🌐'}
                      </span>
                      <div>
                        <h3 className="font-bold text-lg">{crawler.crawler_name}</h3>
                        <p className="text-sm text-gray-400">
                          {crawler.visit_count.toLocaleString()}回訪問
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        crawler.change_percent > 0 ? 'text-green-400' : 
                        crawler.change_percent < 0 ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {crawler.change_percent > 0 ? '+' : ''}{crawler.change_percent}%
                      </span>
                      <p className="text-xs text-gray-500">先週比</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">セッション数</p>
                      <p className="font-bold">{crawler.unique_sessions}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">ユニークIP</p>
                      <p className="font-bold">{crawler.unique_ips}</p>
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
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">📄</span>
              よく読まれるページ TOP5
            </h2>
            
            {top_pages.length === 0 ? (
              <p className="text-gray-400 text-center py-8">データがありません</p>
            ) : (
              <div className="space-y-3">
                {top_pages.map((page, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono text-blue-400 truncate">
                          {page.url}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {page.crawler_variety}種類のAIが訪問
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{page.visits}</p>
                        <p className="text-xs text-gray-500">回</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 検出方法の内訳 */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              検出方法の内訳
            </h2>
            
            <div className="space-y-3">
              {detection_methods.map((method, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">
                        {method.method === 'user-agent' ? 'User-Agent' :
                         method.method === 'rapid-access' ? '高速アクセス検出' :
                         method.method === 'pattern-inference' ? 'パターン推論' :
                         method.method}
                      </p>
                      <p className="text-xs text-gray-400">
                        {method.method === 'user-agent' ? 'UA文字列から判定' :
                         method.method === 'rapid-access' ? '1秒以内の連続アクセス' :
                         method.method === 'pattern-inference' ? 'ヘッダー情報から推測' :
                         ''}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{method.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 人間訪問データ（手動入力） */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            人間訪問データ（任意入力）
          </h2>
          
          <p className="text-sm text-gray-400 mb-4">
            GA4やGoogle Search Consoleのデータを入力すると、AIとの比較ができます
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">ユーザー数</label>
              <input
                type="number"
                value={manualInput.userCount}
                onChange={(e) => setManualInput({...manualInput, userCount: e.target.value})}
                placeholder="例: 1,234"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">ページビュー</label>
              <input
                type="number"
                value={manualInput.pageViews}
                onChange={(e) => setManualInput({...manualInput, pageViews: e.target.value})}
                placeholder="例: 5,678"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">セッション数</label>
              <input
                type="number"
                value={manualInput.sessions}
                onChange={(e) => setManualInput({...manualInput, sessions: e.target.value})}
                placeholder="例: 2,345"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveManualData}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-bold transition disabled:opacity-50"
          >
            {saving ? '保存中...' : '💾 データを保存'}
          </button>

          {manualInput.userCount && (
            <div className="mt-6 bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="font-bold mb-3">📊 総露出数の比較</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">人間訪問</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {parseInt(manualInput.userCount || '0').toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">AI訪問</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {totalAI.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400">総露出数（人間 + AI）</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {(parseInt(manualInput.userCount || '0') + totalAI).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 最新訪問履歴 */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            最新訪問履歴（20件）
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-gray-400 font-normal">日時</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-normal">AI</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-normal">ページ</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-normal">検出方法</th>
                </tr>
              </thead>
              <tbody>
                {recent_visits.map((visit, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      {new Date(visit.visited_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {visit.crawler_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-blue-400">
                      {visit.page_url || '/'}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {visit.detection_method}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400 text-sm">
          <p>© 2026 AI観測ラボ - AIクローラー可視化ツール</p>
        </div>
      </footer>
    </div>
  );
}

// Suspenseでラップ
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}