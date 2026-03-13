// src/app/result/components/HealthScore.js
'use client';

export default function HealthScore({ health, displayScore, totalScore, prevScore, nextTarget }) {
  // ライトテーマ用カラーマッピング
  const accentColor = health.color;

  return (
    <div className="mb-6 p-6 rounded-2xl" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>

      {/* ステータスバッジ + 前回比 */}
      <div className="flex items-center justify-between mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid #c5d3f5' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
          {health.code} — {health.ja}
        </span>
        {prevScore !== null && (
          <span className="text-sm font-semibold"
            style={{ color: totalScore > prevScore ? 'var(--green)' : totalScore < prevScore ? 'var(--red)' : 'var(--ink-light)' }}>
            {totalScore > prevScore ? `▲ +${totalScore - prevScore}点`
              : totalScore < prevScore ? `▼ ${totalScore - prevScore}点`
              : '→ 前回と同点'}
          </span>
        )}
      </div>

      {/* スコアゲージ + 説明 */}
      <div className="flex items-center gap-6 md:gap-8 mb-5">

        {/* 円形ゲージ */}
        <div className="relative shrink-0">
          <svg width="120" height="120" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r="58" fill="none"
              stroke="var(--border)" strokeWidth="10" />
            <circle cx="70" cy="70" r="58" fill="none"
              strokeWidth="10"
              stroke={accentColor}
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - displayScore / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black" style={{ color: accentColor, fontFamily: "'DM Mono', monospace" }}>
              {displayScore}
            </span>
            <span className="text-xs" style={{ color: 'var(--ink-xlight)' }}>/100</span>
          </div>
        </div>

        {/* 説明 + 次のターゲット */}
        <div className="flex-1 min-w-0">
          <p className="text-sm mb-4 leading-relaxed" style={{ color: 'var(--ink-mid)' }}>
            {health.desc}
          </p>
          {nextTarget && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-sub)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(totalScore / nextTarget.target) * 100}%`,
                      background: accentColor,
                    }}
                  />
                </div>
                <span className="text-xs font-bold shrink-0" style={{ color: accentColor }}>
                  あと{nextTarget.diff}点
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--ink-light)' }}>{health.nextDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}