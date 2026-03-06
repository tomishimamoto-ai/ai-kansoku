// src/app/result/components/DashboardCTA.js
'use client';

import Link from 'next/link';

export default function DashboardCTA({ siteId, dashPreview }) {
  return (
    <div className="mb-6 rounded-2xl border overflow-hidden"
      style={{
        borderColor: 'rgba(99,102,241,0.25)',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.09), rgba(59,130,246,0.05))',
      }}>
      <div className="p-5 md:p-7">
        {/* ヘッダー */}
        <div className="flex items-start gap-4">
          <span className="text-4xl shrink-0">🔭</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1.5">AIは、本当に来ていますか？</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              スコアが上がっても、AIが増えたかは別問題です。<br />
              効果の証明はダッシュボードで。
            </p>
          </div>
        </div>

        {/* AI訪問プレビュー */}
        <div className="mb-4 p-3.5 rounded-xl border border-white/8 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-base shrink-0">
              🛸
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-0.5">直近7日間のAI訪問</div>
              {dashPreview === null ? (
                <p className="text-sm text-gray-400 leading-snug">
                  まだ観測されていません。<br />
                  <span className="text-gray-500">改善後に増えるか、一緒に確認しましょう。</span>
                </p>
              ) : dashPreview === 0 ? (
                <p className="text-sm text-gray-400 leading-snug">
                  まだAI訪問は観測されていません。<br />
                  <span className="text-gray-500">改善後に増えるか確認しましょう。</span>
                </p>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-white">{dashPreview}件</span>
                  <span className="text-xs text-purple-300">のAI訪問を観測中</span>
                </div>
              )}
            </div>
            <Link
              href={`/dashboard?siteId=${siteId}`}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors shrink-0 whitespace-nowrap">
              詳細 →
            </Link>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all">
            🔄 改善後に再診断
          </Link>
          <Link
            href={`/dashboard?siteId=${siteId}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
            📊 観測ダッシュボードへ →
          </Link>
        </div>
      </div>
    </div>
  );
}