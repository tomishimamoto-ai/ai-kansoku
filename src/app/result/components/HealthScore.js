// src/app/result/components/HealthScore.js
'use client';

export default function HealthScore({ health, displayScore, totalScore, prevScore, nextTarget }) {
  return (
    <div className="mb-8">
      {/* ステータスバッジ + 前回比 */}
      <div className="flex items-center justify-between mb-6">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold tracking-wider uppercase ${health.badge}`}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: health.color }} />
          {health.code} — {health.ja}
        </span>
        {prevScore !== null && (
          <span className={`text-sm font-semibold
            ${totalScore > prevScore ? 'text-emerald-400'
            : totalScore < prevScore ? 'text-red-400'
            : 'text-gray-500'}`}>
            {totalScore > prevScore ? `▲ +${totalScore - prevScore}点`
            : totalScore < prevScore ? `▼ ${totalScore - prevScore}点`
            : '→ 前回と同点'}
          </span>
        )}
      </div>

      {/* スコアゲージ + 説明 */}
      <div className="flex items-center gap-6 md:gap-8 mb-6">
        {/* 円形ゲージ */}
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
            <circle
              cx="70" cy="70" r="58"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="10"
            />
            <circle
              cx="70" cy="70" r="58"
              fill="none"
              strokeWidth="10"
              stroke={health.color}
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - displayScore / 100)}`}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                filter: `drop-shadow(0 0 10px ${health.color})`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black" style={{ color: health.color }}>{displayScore}</span>
            <span className="text-sm text-gray-500">/100</span>
          </div>
        </div>

        {/* 説明 + 次のターゲット */}
        <div className="flex-1 min-w-0">
          <p className="text-base text-gray-300 mb-4 leading-relaxed">{health.desc}</p>
          {nextTarget && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/6 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${(totalScore / nextTarget.target) * 100}%`,
                      background: `linear-gradient(90deg, ${health.color}, #4a9eff)`,
                    }}
                  />
                </div>
                <span className="text-sm shrink-0 font-semibold" style={{ color: health.color }}>
                  あと{nextTarget.diff}点
                </span>
              </div>
              <p className="text-xs text-gray-500">{health.nextDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}