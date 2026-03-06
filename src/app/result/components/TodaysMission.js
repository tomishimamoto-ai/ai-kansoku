// src/app/result/components/TodaysMission.js
'use client';

import Link from 'next/link';
import MissionDetail from './MissionDetail';

export default function TodaysMission({ item, isChecked, onCheck, wasImproved, currentScore, nextTarget }) {
  const predictedScore = Math.min(100, currentScore + (item.gain ?? 0));

  return (
    <div className={`relative rounded-2xl border transition-all duration-300
      ${isChecked
        ? 'border-emerald-500/25 bg-emerald-500/8'
        : 'border-amber-400/35 bg-gradient-to-br from-amber-500/10 to-orange-500/6'}`}
      style={{ boxShadow: isChecked ? '0 0 24px rgba(52,211,153,0.08)' : '0 0 24px rgba(245,158,11,0.08)' }}>

      {wasImproved && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full shadow-lg">
          ✨ スコアに反映されました
        </div>
      )}

      <div className="p-5 md:p-7">
        {/* ヘッダー */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${isChecked ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
            {isChecked ? '✅' : item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-bold tracking-widest uppercase
                ${isChecked ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isChecked ? '✔ ミッション完了' : 'AIに発見されるためのミッション'}
              </span>
            </div>
            {!isChecked && (
              <div className="text-xs text-gray-500 mb-1.5">
                あなたのサイトで最も影響が大きい改善ポイント：
                <span className="text-amber-300 font-semibold">{item.title}</span>
                <span className="text-gray-600 ml-1">（現在 {item.score}点）</span>
              </div>
            )}
            <h4 className={`font-bold text-xl leading-snug ${isChecked ? 'text-emerald-300' : 'text-white'}`}>
              {item.title}
            </h4>
          </div>
        </div>

        {/* スコア予測 */}
        {!isChecked && (
          <div className="mb-4 p-4 rounded-xl bg-black/25 border border-white/8">
            <div className="text-xs text-gray-500 mb-2.5">この改善を実施すると</div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-center">
                <div className="text-2xl font-black text-gray-400">{currentScore}</div>
                <div className="text-xs text-gray-600">現在</div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-amber-400 font-semibold">{item.gainLabel}</div>
                <div className="w-full h-0.5 bg-gradient-to-r from-amber-400/50 to-emerald-400/50 rounded-full relative">
                  <div className="absolute right-0 -top-1 w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">{predictedScore}</div>
                <div className="text-xs text-emerald-600">予測スコア</div>
              </div>
            </div>
            {nextTarget && predictedScore >= nextTarget.target && (
              <div className="text-xs text-center text-emerald-400 bg-emerald-500/10 rounded-lg py-1.5 px-3">
                🎯 この改善で <strong>{nextTarget.label}</strong> に到達できます！
              </div>
            )}
            {nextTarget && predictedScore < nextTarget.target && (
              <div className="text-xs text-center text-gray-500 bg-white/4 rounded-lg py-1.5 px-3">
                {nextTarget.label}まであと <strong className="text-gray-300">{nextTarget.target - predictedScore}点</strong>
              </div>
            )}
          </div>
        )}

        {/* ミッション詳細 */}
        {!isChecked && <MissionDetail item={item} />}

        {/* 完了後メッセージ */}
        {isChecked && (
          <div className="mb-5 flex flex-col items-center gap-3 py-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25"
              style={{ animation: 'badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <span className="text-lg">🧪</span>
              <span className="text-sm font-bold text-emerald-400">実験完了</span>
            </div>
            <p className="text-sm text-emerald-300/70 text-center">再診断でスコアへの反映を確認しましょう。</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => onCheck(item.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm transition-all
              ${isChecked
                ? 'bg-white/8 border border-white/12 text-gray-400 hover:bg-white/12'
                : 'text-black hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'}`}
            style={!isChecked ? {
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
            } : {}}>
            {isChecked ? '↩ 未完了に戻す' : '✅ 完了にする'}
          </button>
          {isChecked && (
            <Link href="/"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)', boxShadow: '0 4px 20px rgba(74,158,255,0.3)' }}>
              🔄 今すぐ再診断して反映を確認
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}