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
      if (!dryRun) fetchStats(); // 実行後に統計更新
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

  return (
    <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-[#1a0a0a] to-[#1a1020] p-6 space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕵️</span>
          <h3 className="text-white font-bold text-lg">擬態クローラー検知</h3>
          <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
            BETA
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => runBatch(true)}
            disabled={running}
            className="text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition disabled:opacity-50"
          >
            {running ? '実行中...' : 'テスト実行'}
          </button>
          <button
            onClick={() => runBatch(false)}
            disabled={running}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
          >
            {running ? '実行中...' : '今すぐ再判定'}
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

          {/* dryRun時の詳細 */}
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

      {/* 擬態IP詳細テーブル */}
      {stats?.byIP?.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-2 font-medium">擬態疑いIP TOP10</div>
          <div className="space-y-2">
            {stats.byIP.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
                <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                <span className="font-mono text-sm text-red-300 flex-1">{item.ip_address}</span>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{item.visit_count}件</span>
                  <span className="text-orange-400">スコア{item.max_score}</span>
                </div>
                {/* スコアバー */}
                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    style={{ width: `${Math.min(item.max_score, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* データなし */}
      {total === 0 && !lastResult && (
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
          <div>🔴 超高速巡回（5分以内に5件以上）: +40点</div>
          <div>🟠 高速巡回（30分以内に10件以上）: +25点</div>
          <div>🌙 深夜帯アクセス（JST 0〜5時）: +20点</div>
          <div>🎭 ブラウザ偽装UA（is_human=falseなのにChrome等）: +25点</div>
          <div>📄 HTMLのみリクエスト: +10点</div>
          <div>🔗 referrerなし＋偽装UA: +10点</div>
          <div className="mt-2 text-orange-400">合計50点以上 → 擬態クローラー判定</div>
        </div>
      </details>
    </div>
  );
}