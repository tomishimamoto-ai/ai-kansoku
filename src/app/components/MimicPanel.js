'use client';

import { useState, useEffect } from 'react';

export default function MimicPanel({ siteId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [siteId]);

  async function fetchStats() {
    try {
      const res = await fetch(`/api/detect-mimic?siteId=${siteId}`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function runBatch(dryRun = false) {
    setRunning(true);
    try {
      const res = await fetch('/api/detect-mimic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, dryRun }),
      });
      const data = await res.json();
      setLastResult({ ...data, dryRun });
      if (!dryRun) fetchStats();
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#2a2f57] bg-gradient-to-br from-[#0f1229] to-[#1a1e47] p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-8 bg-white/10 rounded w-1/4" />
        </div>
      </div>
    );
  }

  const total = parseInt(stats?.stats?.total_mimic || 0);
  const uniqueIPs = parseInt(stats?.stats?.unique_ips || 0);

  // 周期タイプの日本語ラベル
  const periodTypeLabel = (type) => {
    if (type === 'rapid-periodic') return { label: '高速周期', color: 'text-red-400', icon: '⚡' };
    if (type === 'medium-periodic') return { label: '中速周期', color: 'text-orange-400', icon: '🔄' };
    if (type === 'slow-periodic') return { label: '低速周期', color: 'text-yellow-400', icon: '🕐' };
    return { label: '不明', color: 'text-gray-400', icon: '?' };
  };

  // 秒を人間が読みやすい形式に
  const formatInterval = (sec) => {
    if (sec < 60) return `${Math.round(sec)}秒`;
    if (sec < 3600) return `${Math.round(sec / 60)}分`;
    return `${(sec / 3600).toFixed(1)}時間`;
  };

  return (
    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-[#1a0a0a] to-[#1a1020] p-4 space-y-4 overflow-hidden w-full">
      {/* ヘッダー */}
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-xl">🕵️</span>
        <h3 className="text-white font-bold text-base">擬態クローラー検知</h3>
        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
          BETA
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => runBatch(true)}
            disabled={running}
            className="text-xs px-2.5 py-1 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition disabled:opacity-50 whitespace-nowrap"
          >
            {running ? '...' : 'テスト'}
          </button>
          <button
            onClick={() => runBatch(false)}
            disabled={running}
            className="text-xs px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50 whitespace-nowrap"
          >
            {running ? '...' : '再判定'}
          </button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-black/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{total}</div>
          <div className="text-xs text-gray-400 mt-1">擬態アクセス（7日間）</div>
        </div>
        <div className="bg-black/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{uniqueIPs}</div>
          <div className="text-xs text-gray-400 mt-1">疑わしいIP数</div>
        </div>
        <div className="bg-black/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {stats?.stats?.avg_score ? Math.round(stats.stats.avg_score) : 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">平均擬態スコア</div>
        </div>
      </div>

      {/* バッチ実行結果 */}
      {lastResult && (
        <div className={`rounded-xl p-4 border ${lastResult.dryRun ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
          <div className="text-xs font-bold mb-2 text-gray-300">
            {lastResult.dryRun ? '🔍 テスト実行結果（DBは更新されていません）' : '✅ 判定完了'}
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-gray-400">処理: <span className="text-white">{lastResult.processed}件</span></span>
            <span className="text-gray-400">擬態検知: <span className="text-red-400 font-bold">{lastResult.mimic_detected}件</span></span>
            <span className="text-gray-400">正常: <span className="text-green-400">{lastResult.normal}件</span></span>
          </div>
          {lastResult.dryRun && lastResult.details?.length > 0 && (
            <div className="mt-3 space-y-2">
              {lastResult.details.slice(0, 5).map((d, i) => (
                <div key={i} className="text-xs bg-black/30 rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-400 font-mono">{d.ip_address}</span>
                    <span className="text-orange-400">スコア: {d.score}点</span>
                  </div>
                  <div className="text-gray-400">{d.reasons.join(' / ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 擬態IP詳細テーブル - 折りたたみ */}
      {stats?.byIP?.length > 0 && (
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none py-2 px-3 rounded-lg bg-black/20 hover:bg-black/40 transition">
            <span className="text-xs text-gray-400 font-medium">擬態疑いIP TOP10</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">{stats.byIP.length}件</span>
              <span className="text-gray-500 text-xs group-open:rotate-180 transition-transform duration-200">▼</span>
            </div>
          </summary>
          <div className="mt-2 space-y-2">
            {stats.byIP.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-black/30 rounded-xl px-3 py-2.5">
                <span className="text-xs text-gray-500 w-4 shrink-0">{i + 1}</span>
                <span className="font-mono text-xs text-red-300 flex-1 min-w-0 truncate">{item.ip_address}</span>
                <span className="text-xs text-gray-400 shrink-0">{item.visit_count}件</span>
                <span className="text-xs text-orange-400 shrink-0">スコア{item.max_score}</span>
                <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    style={{ width: `${Math.min(item.max_score, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ━━━ ローテーション異常 ━━━ */}
      {(stats?.rotation?.ua_rotation?.length > 0 || stats?.rotation?.ip_rotation?.length > 0) && (
        <div className="space-y-3">
          <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <span>🔄</span> ローテーション異常
          </div>

          {/* UA分散型 */}
          {stats.rotation.ua_rotation?.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5">同一UAで複数IP（分散型）</div>
              <div className="space-y-1.5">
                {stats.rotation.ua_rotation.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-orange-300 flex-1 truncate">{item.user_agent}</span>
                    <span className="text-xs text-red-400 whitespace-nowrap">{item.unique_ips} IP</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{item.total_visits}件</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IP分散型 */}
          {stats.rotation.ip_rotation?.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-1.5">同一IPで複数UA（偽装型）</div>
              <div className="space-y-1.5">
                {stats.rotation.ip_rotation.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-orange-300 flex-1">{item.ip_address}</span>
                    <span className="text-xs text-red-400 whitespace-nowrap">{item.unique_uas} 種UA</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{item.total_visits}件</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ━━━ 周期的アクセス検出 ━━━ */}
      {stats?.periodic?.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <span>⏱</span> 周期的アクセス検出
          </div>
          <div className="space-y-1.5">
            {[...stats.periodic]
              .sort((a, b) => {
                if (a.is_periodic !== b.is_periodic) return (b.is_periodic ? 1 : 0) - (a.is_periodic ? 1 : 0);
                return a.cv_percent - b.cv_percent; // CV低い順（より規則的なIPが上）
              })
              .map((item, i) => {
              const pt = periodTypeLabel(item.period_type);
              return (
                <div key={i} className={`flex items-center gap-2 rounded-lg px-3 py-2 border overflow-hidden ${
                  item.is_periodic
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}>
                  {/* 強度バッジ */}
                  <span className={`text-xs font-bold whitespace-nowrap shrink-0 ${item.is_periodic ? 'text-red-400' : 'text-yellow-400'}`}>
                    {item.is_periodic ? '🔴強' : '🟡疑'}
                  </span>
                  <span className="font-mono text-xs text-gray-300 flex-1 min-w-0 truncate">{item.ip_address}</span>
                  <span className={`text-xs whitespace-nowrap shrink-0 ${pt.color}`}>
                    {pt.icon}{pt.label}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                    {formatInterval(item.avg_interval_sec)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-600 pl-1">
            CV（変動係数）: 低いほど規則的なアクセス。30%以下=強周期、50%以下=周期疑い
          </div>
        </div>
      )}

      {/* データなし */}
      {total === 0 && !lastResult && !stats?.rotation?.ua_rotation?.length && !stats?.periodic?.length && (
        <div className="text-center py-6 text-gray-500 text-sm">
          <div className="text-2xl mb-2">🟢</div>
          擬態クローラーは検知されていません
          <div className="text-xs mt-1">「今すぐ再判定」を実行してください</div>
        </div>
      )}

      {/* 判定基準の説明 */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer hover:text-gray-300 transition">判定基準を見る</summary>
        <div className="mt-2 space-y-1 pl-3 border-l border-white/10">
          <div>🤖 存在しないiOSバージョン（19以上）: +60点</div>
          <div>🤖 存在しないChromeバージョン（145以上）: +50点</div>
          <div>🔍 Googlebot系偽装UA（Nexus 5X / Moto G / CrOS等）: +55点</div>
          <div>🔴 AdsBot-Google: +90点</div>
          <div>📸 Vercel Screenshot Bot: +99点</div>
          <div>🔄 UA分散型（同一UAで20IP以上）: +40点</div>
          <div>🔄 UA分散疑い（同一UAで10IP以上）: +20点</div>
          <div>🎭 IP偽装型（同一IPで10UA以上）: +35点</div>
          <div>🎭 IP偽装疑い（同一IPで5UA以上）: +15点</div>
          <div className="mt-2 text-orange-400">合計50点以上 → 擬態クローラー判定</div>
        </div>
      </details>
    </div>
  );
}