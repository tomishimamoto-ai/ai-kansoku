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
    <div className="mb-5 rounded-2xl px-5 py-4" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>今日の進捗</span>
          <span className="text-sm font-black" style={{ color: allDone ? 'var(--green)' : 'var(--accent)' }}>
            {doneCount}/{total}
          </span>
          {allDone && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: 'var(--green)' }}>
              完了 🎉
            </span>
          )}
        </div>
        {totalPotentialGain > 0 && !allDone && (
          <span className="text-xs font-medium" style={{ color: 'var(--green)' }}>
            全部やると最大+{totalPotentialGain}点
          </span>
        )}
      </div>

      {/* プログレスバー */}
      <div className="w-full h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--bg-sub)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: allDone ? 'var(--green)' : 'var(--accent)',
          }}
        />
      </div>

      {/* タスクリスト */}
      <div className="flex flex-col gap-2">
        {allTasks.map((item, i) => {
          const isDone = !!checkedItems[item.id];
          return (
            <div key={item.id}
              className="flex items-center gap-2.5 transition-opacity"
              style={{ opacity: isDone ? 0.4 : 1 }}>
              <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: isDone ? '#f0fdf4' : i === 0 ? '#fffbeb' : 'var(--bg-sub)',
                  color: isDone ? 'var(--green)' : i === 0 ? 'var(--yellow)' : 'var(--ink-light)',
                  border: `1px solid ${isDone ? '#bbf7d0' : i === 0 ? '#fde68a' : 'var(--border)'}`,
                }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className="text-xs flex-1"
                style={{
                  color: isDone ? 'var(--ink-xlight)' : 'var(--ink-mid)',
                  textDecoration: isDone ? 'line-through' : 'none',
                }}>
                {item.title}
              </span>
              <span className="text-xs shrink-0" style={{ color: 'var(--ink-xlight)', fontFamily: "'DM Mono', monospace" }}>
                約{item.effort}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}