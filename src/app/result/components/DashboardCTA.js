// src/app/result/components/DashboardCTA.js
'use client';

import Link from 'next/link';

export default function DashboardCTA({ siteId, dashPreview, totalScore }) {
  const isUnlocked = totalScore >= 70;

  return (
    <div className="mb-5 rounded-2xl overflow-hidden"
      style={{ background: 'var(--accent-light)', border: '1px solid #c5d3f5' }}>
      <div className="p-5 md:p-6">

        {/* ヘッダー */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl shrink-0">🔭</span>
          <div className="flex-1">
            <h3 className="text-base font-bold mb-1" style={{ color: 'var(--ink)' }}>
              AIは、本当に来ていますか？
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-mid)' }}>
              スコアが上がっても、AIが増えたかは別問題です。効果の証明はダッシュボードで。
            </p>
          </div>
        </div>

        {/* AI訪問プレビュー */}
        <div className="mb-4 p-3.5 rounded-xl" style={{ background: '#ffffff', border: '1px solid #c5d3f5' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
              style={{ background: 'var(--accent-light)' }}>
              🛸
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs mb-0.5" style={{ color: 'var(--ink-light)' }}>直近7日間のAI訪問</div>
              {dashPreview === null || dashPreview === 0 ? (
                <p className="text-sm leading-snug" style={{ color: 'var(--ink-mid)' }}>
                  まだ観測されていません。
                  <span style={{ color: 'var(--ink-light)' }}>改善後に増えるか確認しましょう。</span>
                </p>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black" style={{ color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>
                    {dashPreview}件
                  </span>
                  <span className="text-xs" style={{ color: 'var(--ink-mid)' }}>のAI訪問を観測中</span>
                </div>
              )}
            </div>
            {isUnlocked ? (
              <Link href={`/dashboard?siteId=${siteId}`}
                className="text-xs font-semibold shrink-0 whitespace-nowrap transition-opacity hover:opacity-70"
                style={{ color: 'var(--accent)' }}>
                詳細 →
              </Link>
            ) : (
              <span className="text-xs font-semibold shrink-0 whitespace-nowrap"
                style={{ color: '#bbbbbb' }}>
                🔒 ロック中
              </span>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: '#ffffff', border: '1px solid #c5d3f5', color: 'var(--ink-mid)' }}>
            🔄 改善後に再診断
          </Link>
          {isUnlocked ? (
            <Link href={`/dashboard?siteId=${siteId}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)' }}>
              📊 観測ダッシュボードへ →
            </Link>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: '#f7f7f5', border: '1px solid #e8e8e8', color: '#bbbbbb', cursor: 'not-allowed' }}>
              <span>🔒 ダッシュボードはスコア70点以上で開放</span>
              <span className="text-xs" style={{ color: 'var(--accent)' }}>あと{70 - totalScore}点</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}