// src/app/result/components/OtherImprovements.js
'use client';

import { useState } from 'react';
import CollapsibleItem from './CollapsibleItem';

export default function OtherImprovements({
  urgentRest,
  mediumAll,
  completed,
  checkedItems,
  onCheck,
  wasImproved,
  totalPotentialGain,
}) {
  const [open, setOpen] = useState(false);
  const totalCount =
    (urgentRest?.length ?? 0) +
    (mediumAll?.length ?? 0) +
    (completed?.length ?? 0);

  if (totalCount === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-white/8 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-all text-left">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold text-gray-200">さらに改善できるポイント</span>
          <span className="text-sm px-2.5 py-0.5 rounded-full bg-white/8 text-gray-300 font-medium">
            {totalCount}件
          </span>
          {totalPotentialGain > 0 && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              最大+{totalPotentialGain}点の伸びしろ
            </span>
          )}
        </div>
        <span className={`text-gray-500 text-sm transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-2.5">
          {urgentRest.length > 0 && (
            <>
              <div className="text-xs text-red-400 font-bold tracking-widest uppercase pt-1 pb-1">
                優先度 高
              </div>
              {urgentRest.map((item) => (
                <CollapsibleItem
                  key={item.id}
                  item={item}
                  priority="urgent"
                  isChecked={!!checkedItems[item.id]}
                  onCheck={onCheck}
                  wasImproved={wasImproved(item.id)}
                />
              ))}
            </>
          )}

          {mediumAll.length > 0 && (
            <>
              <div className={`text-xs text-yellow-400 font-bold tracking-widest uppercase pb-1
                ${urgentRest.length > 0 ? 'pt-3' : 'pt-1'}`}>
                推奨
              </div>
              {mediumAll.map((item) => (
                <CollapsibleItem
                  key={item.id}
                  item={item}
                  priority="medium"
                  isChecked={!!checkedItems[item.id]}
                  onCheck={onCheck}
                  wasImproved={wasImproved(item.id)}
                />
              ))}
            </>
          )}

          {completed.length > 0 && (
            <>
              <div className="text-xs text-emerald-400 font-bold tracking-widest uppercase pt-3 pb-1">
                対応済み
              </div>
              <div className="grid grid-cols-2 gap-2">
                {completed.map((item) => (
                  <div
                    key={item.id ?? item.title}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/12 text-sm text-gray-400">
                    <span className="text-emerald-500/70">{item.icon}</span>
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}