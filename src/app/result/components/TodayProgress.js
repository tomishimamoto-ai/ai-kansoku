// src/app/result/components/TodayProgress.js
'use client';

export default function TodayProgress({ improvements, checkedItems, totalPotentialGain }) {
  const allTasks = [...improvements.urgent, ...improvements.medium].slice(0, 3);
  const doneCount = allTasks.filter((t) => !!checkedItems[t.id]).length;
  const total = allTasks.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const allDone = doneCount === total;

  if (total === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-white/8 bg-white/2 px-5 py-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold text-gray-200">今日の進捗</span>
          <span className={`text-sm font-black ${allDone ? 'text-emerald-400' : 'text-white'}`}>
            {doneCount}/{total}
          </span>
          {allDone && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              完了 🎉
            </span>
          )}
        </div>
        {totalPotentialGain > 0 && !allDone && (
          <span className="text-xs text-emerald-400/80">
            全部やると最大+{totalPotentialGain}点
          </span>
        )}
      </div>

      {/* プログレスバー */}
      <div className="w-full h-2 bg-white/6 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: allDone
              ? 'linear-gradient(90deg, #4ade80, #34d399)'
              : 'linear-gradient(90deg, #f59e0b, #4a9eff)',
          }}
        />
      </div>

      {/* タスクリスト */}
      <div className="flex flex-col gap-1.5">
        {allTasks.map((item, i) => {
          const isDone = !!checkedItems[item.id];
          return (
            <div
              key={item.id}
              className={`flex items-center gap-2.5 transition-opacity ${isDone ? 'opacity-40' : ''}`}>
              <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs
                ${isDone
                  ? 'bg-emerald-500/30 text-emerald-400'
                  : i === 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-white/8 text-gray-600'}`}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`text-xs flex-1 ${isDone ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                {item.title}
              </span>
              <span className="text-xs text-gray-600 shrink-0">所要：約{item.effort}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}