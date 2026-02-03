'use client';

import { useState, useEffect } from 'react';

export default function VisitHistory({ siteId }) {
  const [visits, setVisits] = useState([]);
  const [stats, setStats] = useState(null);
  const [crawlerStats, setCrawlerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/visits?siteId=${siteId}`);
      const data = await response.json();

      if (data.success) {
        setVisits(data.visits || []);
        setStats(data.stats);
        setCrawlerStats(data.crawlerStats || []);
        setError(null);
      } else {
        setError(data.error || 'データの取得に失敗しました');
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

  // User-Agentからクローラー名を抽出
  const getCrawlerName = (userAgent) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('GPTBot')) return '🤖 GPTBot (ChatGPT)';
    if (userAgent.includes('Claude-Web')) return '🤖 Claude-Web';
    if (userAgent.includes('PerplexityBot')) return '🤖 PerplexityBot';
    if (userAgent.includes('Googlebot')) return '🔍 Googlebot';
    if (userAgent.includes('Bingbot')) return '🔍 Bingbot';
    if (userAgent.includes('anthropic-ai')) return '🤖 Anthropic AI';
    if (userAgent.includes('bot') || userAgent.includes('Bot')) return '🤖 Bot';
    return '👤 Browser';
  };

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

  if (loading && visits.length === 0) {
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

  return (
    <div className="space-y-6">
      {/* 統計サマリー */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">総訪問数</div>
            <div className="text-3xl font-bold text-white">{stats.total_visits}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">ユニークセッション</div>
            <div className="text-3xl font-bold text-white">{stats.unique_sessions}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">ユニークIP</div>
            <div className="text-3xl font-bold text-white">{stats.unique_ips}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-white/10 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-2">初回訪問</div>
            <div className="text-lg font-bold text-white">
              {stats.first_visit ? formatDate(stats.first_visit) : '-'}
            </div>
          </div>
        </div>
      )}

      {/* クローラー統計 */}
      {crawlerStats.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            クローラー別訪問数
          </h3>
          <div className="space-y-3">
            {crawlerStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-300">{stat.crawler_type}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-full"
                      style={{
                        width: `${(stat.visit_count / stats.total_visits) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-white font-bold w-12 text-right">
                    {stat.visit_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* コントロール */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          最新の訪問履歴
        </h3>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-400">
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
      {visits.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-gray-400">まだ訪問履歴がありません</p>
          <p className="text-sm text-gray-500 mt-2">
            トラッキングコードを設置すると、AIクローラーの訪問が記録されます
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">訪問者</th>
                  <th className="text-left p-4 text-gray-400 font-medium">ページ</th>
                  <th className="text-left p-4 text-gray-400 font-medium">リファラー</th>
                  <th className="text-left p-4 text-gray-400 font-medium">日時</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit, index) => (
                  <tr
                    key={visit.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition ${
                      index === 0 ? 'bg-blue-500/5' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="text-white font-medium">
                        {getCrawlerName(visit.user_agent)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                        {visit.user_agent}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300 text-sm max-w-xs truncate">
                        {visit.page_url || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-400 text-sm max-w-xs truncate">
                        {visit.referrer || 'Direct'}
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

      {/* フッター */}
      <div className="text-center text-sm text-gray-500">
        最大20件の訪問履歴を表示しています
        {autoRefresh && ' • 30秒ごとに自動更新'}
      </div>
    </div>
  );
}