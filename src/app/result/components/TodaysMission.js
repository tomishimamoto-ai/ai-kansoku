// src/app/result/components/TodaysMission.js
'use client';

import Link from 'next/link';
import MissionDetail from './MissionDetail';

export default function TodaysMission({ item, isChecked, onCheck, wasImproved, currentScore, nextTarget }) {
  const predictedScore = Math.min(100, currentScore + (item.gain ?? 0));

  return (
    <div className="relative rounded-2xl transition-all duration-300"
      style={{
        background: isChecked ? '#f0fdf4' : '#fffbeb',
        border: `1px solid ${isChecked ? '#bbf7d0' : '#fde68a'}`,
      }}>

      {wasImproved && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 text-white text-xs font-bold rounded-full"
          style={{ background: 'var(--green)' }}>
          ✨ スコアに反映されました
        </div>
      )}

      <div className="p-5 md:p-6">
        {/* ヘッダー */}
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ background: isChecked ? '#dcfce7' : '#fef3c7' }}>
            {isChecked ? '✅' : item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <span className="text-xs font-bold tracking-widest uppercase"
                style={{ color: isChecked ? 'var(--green)' : 'var(--yellow)' }}>
                {isChecked ? '✔ ミッション完了' : 'AIに発見されるためのミッション'}
              </span>
            </div>
            {!isChecked && (
              <div className="text-xs mb-1.5" style={{ color: 'var(--ink-light)' }}>
                最も影響が大きい改善ポイント：
                <span className="font-semibold" style={{ color: 'var(--yellow)' }}>{item.title}</span>
                <span style={{ color: 'var(--ink-xlight)' }} className="ml-1">（現在 {item.score}点）</span>
              </div>
            )}
            <h4 className="font-bold text-lg leading-snug"
              style={{ color: isChecked ? 'var(--green)' : 'var(--ink)' }}>
              {item.title}
            </h4>
          </div>
        </div>

        {/* スコア予測 */}
        {!isChecked && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
            <div className="text-xs mb-2.5" style={{ color: 'var(--ink-light)' }}>この改善を実施すると</div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: 'var(--ink-mid)', fontFamily: "'DM Mono', monospace" }}>
                  {currentScore}
                </div>
                <div className="text-xs" style={{ color: 'var(--ink-xlight)' }}>現在</div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-semibold" style={{ color: 'var(--yellow)' }}>{item.gainLabel}</div>
                <div className="w-full h-0.5 rounded-full relative"
                  style={{ background: 'linear-gradient(90deg, #fde68a, #bbf7d0)' }}>
                  <div className="absolute right-0 -top-1 w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: 'var(--green)', fontFamily: "'DM Mono', monospace" }}>
                  {predictedScore}
                </div>
                <div className="text-xs" style={{ color: 'var(--green)' }}>予測スコア</div>
              </div>
            </div>
            {nextTarget && predictedScore >= nextTarget.target && (
              <div className="text-xs text-center py-1.5 px-3 rounded-lg"
                style={{ background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0' }}>
                🎯 この改善で <strong>{nextTarget.label}</strong> に到達できます！
              </div>
            )}
            {nextTarget && predictedScore < nextTarget.target && (
              <div className="text-xs text-center py-1.5 px-3 rounded-lg"
                style={{ background: 'var(--bg-sub)', color: 'var(--ink-light)' }}>
                {nextTarget.label}まであと <strong style={{ color: 'var(--ink-mid)' }}>{nextTarget.target - predictedScore}点</strong>
              </div>
            )}
          </div>
        )}

        {/* ミッション詳細 */}
        {!isChecked && <MissionDetail item={item} />}

        {/* 完了後メッセージ */}
        {isChecked && (
          <div className="mb-4 flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: '#dcfce7', border: '1px solid #bbf7d0', animation: 'badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <span className="text-base">🧪</span>
              <span className="text-sm font-bold" style={{ color: 'var(--green)' }}>実験完了</span>
            </div>
            <p className="text-sm text-center" style={{ color: 'var(--ink-light)' }}>
              再診断でスコアへの反映を確認しましょう。
            </p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => onCheck(item.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={isChecked ? {
              background: 'var(--bg-sub)',
              border: '1px solid var(--border)',
              color: 'var(--ink-light)',
            } : {
              background: 'var(--yellow)',
              color: '#ffffff',
            }}>
            {isChecked ? '↩ 未完了に戻す' : '✅ 完了にする'}
          </button>
          {isChecked && (
            <Link href="/"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: 'var(--accent)' }}>
              🔄 再診断して反映を確認
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}