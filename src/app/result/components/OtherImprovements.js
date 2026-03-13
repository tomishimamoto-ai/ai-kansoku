// src/app/result/components/OtherImprovements.js
'use client';

import { useState } from 'react';
import CollapsibleItem from './CollapsibleItem';

export default function OtherImprovements({
  urgentRest, mediumAll, completed,
  checkedItems, onCheck, wasImproved, totalPotentialGain,
}) {
  const [open, setOpen] = useState(false);
  const totalCount = (urgentRest?.length ?? 0) + (mediumAll?.length ?? 0) + (completed?.length ?? 0);

  if (totalCount === 0) return null;

  return (
    <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 transition-all text-left"
        style={{ background: open ? 'var(--bg-sub)' : '#ffffff' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sub)'}
        onMouseLeave={e => e.currentTarget.style.background = open ? 'var(--bg-sub)' : '#ffffff'}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>さらに改善できるポイント</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'var(--bg-sub)', color: 'var(--ink-mid)', border: '1px solid var(--border)' }}>
            {totalCount}件
          </span>
          {totalPotentialGain > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0' }}>
              最大+{totalPotentialGain}点の伸びしろ
            </span>
          )}
        </div>
        <span className="text-sm transition-transform duration-200" style={{ color: 'var(--ink-xlight)', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-2.5" style={{ borderTop: '1px solid var(--border)', background: '#ffffff' }}>
          {urgentRest.length > 0 && (
            <>
              <div className="text-xs font-bold tracking-widest uppercase pt-4 pb-1" style={{ color: 'var(--red)' }}>
                優先度 高
              </div>
              {urgentRest.map((item) => (
                <CollapsibleItem key={item.id} item={item} priority="urgent"
                  isChecked={!!checkedItems[item.id]} onCheck={onCheck} wasImproved={wasImproved(item.id)} />
              ))}
            </>
          )}

          {mediumAll.length > 0 && (
            <>
              <div className={`text-xs font-bold tracking-widest uppercase pb-1 ${urgentRest.length > 0 ? 'pt-4' : 'pt-4'}`}
                style={{ color: 'var(--yellow)' }}>
                推奨
              </div>
              {mediumAll.map((item) => (
                <CollapsibleItem key={item.id} item={item} priority="medium"
                  isChecked={!!checkedItems[item.id]} onCheck={onCheck} wasImproved={wasImproved(item.id)} />
              ))}
            </>
          )}

          {completed.length > 0 && (
            <>
              <div className="text-xs font-bold tracking-widest uppercase pt-4 pb-1" style={{ color: 'var(--green)' }}>
                対応済み
              </div>
              <div className="grid grid-cols-2 gap-2">
                {completed.map((item) => (
                  <div key={item.id ?? item.title}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: 'var(--ink-mid)' }}>
                    <span>{item.icon}</span>
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