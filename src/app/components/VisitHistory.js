'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VisitHistory({ siteId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchVisits = async () => {
    try {
      const response = await fetch(`/api/visits?siteId=${siteId}`);
      const json = await response.json();

      if (json.success) {
        setData(json);
        setError(null);
      } else {
        setError(json.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('訪問履歴の取得に失敗しました');
      console.error('Error fetching visits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (siteId) {
      fetchVisits();
    }
  }, [siteId]);

  // 自動更新（30秒ごと）
  useEffect(() => {
    if (!autoRefresh || !siteId) return;

    const interval = setInterval(() => {
      fetchVisits();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, siteId]);

  // 日時フォーマット
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
    
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!siteId) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <p className="text-gray-400">サイトIDが見つかりません</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">訪問履歴を読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
        <p className="text-red-400 mb-4">⚠️ {error}</p>
        <button
          onClick={fetchVisits}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { ai_stats, recent_visits } = data;
  const totalAI = ai_stats?.total || 0;
  const change = ai_stats?.change_percent || 0;

  return (
    <div className="space-y-6">
      {/* AI訪問サマリー */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        
        {/* ヘッダー: タイトル + ボタン（SP対応） */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold">AI訪問サマリー（過去7日間）</h2>
          <Link
            href={`/dashboard?siteId=${siteId}`}
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-sm font-bold transition whitespace-nowrap"
          >
            詳細ダッシュボード →
          </Link>
        </div>

        {/* 総訪問数 */}
        <div className="mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white mb-1">AI訪問総数</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                {totalAI.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${
                change > 0 ? 'text-green-400' :
                change < 0 ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {change > 0 ? '📈 +' : change < 0 ? '📉 ' : '━ '}
                {change}%
              </span>
              <p className="text-xs text-white mt-1">先週比</p>
            </div>
          </div>
        </div>

        {/* AI別詳細 */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg mb-3">AI別内訳</h3>
          {!ai_stats?.by_crawler || ai_stats.by_crawler.length === 0 ? (
            <p className="text-gray-400 text-center py-8">まだAI訪問がありません</p>
          ) : (
            ai_stats.by_crawler.map((crawler, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {crawler.crawler_name.includes('GPT') ? '🤖' :
                       crawler.crawler_name.includes('Claude') ? '🧠' :
                       crawler.crawler_name.includes('Perplexity') ? '🔍' :
                       crawler.crawler_name.includes('Gemini') ? '💎' :
                       '🌐'}
                    </span>
                    <div>
                      <h4 className="font-bold text-lg">{crawler.crawler_name}</h4>
                      <p className="text-sm text-white">
                        {crawler.visit_count.toLocaleString()}回訪問
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${
                      crawler.change_percent > 0 ? 'text-green-400' :
                      crawler.change_percent < 0 ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {crawler.change_percent > 0 ? '+' : ''}{crawler.change_percent}%
                    </span>
                    <p className="text-xs text-white">先週比</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* コントロール */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          最新の訪問履歴
        </h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            自動更新
          </label>
          <button
            onClick={fetchVisits}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-lg text-white text-sm transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                更新中...
              </>
            ) : (
              <>
                🔄 更新
              </>
            )}
          </button>
        </div>
      </div>

      {/* 訪問履歴リスト */}
      {!recent_visits || recent_visits.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-gray-400">まだ訪問履歴がありません</p>
          <p className="text-sm text-white mt-2">
            トラッキングコードを設置すると、AIクローラーの訪問が記録されます
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-white font-medium">AI</th>
                  <th className="text-left p-4 text-white font-medium">ページ</th>
                  <th className="text-left p-4 text-white font-medium">検出方法</th>
                  <th className="text-left p-4 text-white font-medium">日時</th>
                </tr>
              </thead>
              <tbody>
                {recent_visits.map((visit, index) => (
                  <tr
                    key={visit.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition ${
                      index === 0 ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="text-white font-medium">
                        {visit.crawler_name}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300 text-sm max-w-xs truncate font-mono">
                        {visit.page_url || '/'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300 text-sm">
                        {visit.detection_method}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300 text-sm whitespace-nowrap">
                        {formatDate(visit.visited_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ダッシュボードへの誘導 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm text-center">
        <h3 className="text-xl font-bold mb-3">📊 もっと詳しく分析したい？</h3>
        <p className="text-white mb-6">
          ダッシュボードでは、時間帯別分析・よく読まれるページ・検出方法の内訳などを確認できます
        </p>
        <Link
          href={`/dashboard?siteId=${siteId}`}
          className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg font-bold text-lg transition shadow-lg hover:shadow-xl"
        >
          ダッシュボードを開く →
        </Link>
      </div>

      {/* フッター */}
      <div className="text-center text-sm text-white">
        最大20件の訪問履歴を表示しています（過去7日間）
        {autoRefresh && ' • 30秒ごとに自動更新'}
      </div>
    </div>
  );
}