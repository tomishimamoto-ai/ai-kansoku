// src/app/result/components/RadarSection.js
'use client';

import { useState } from 'react';
import RadarChart from '../RadarChart';

export default function RadarSection({ scoreCards }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all text-left"
        style={{ background: '#ffffff', border: '1px solid var(--border)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sub)'}
        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
        <div className="flex items-center gap-3">
          <span>📡</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>8項目の詳細スコア</span>
          <span className="text-xs" style={{ color: 'var(--ink-xlight)' }}>レーダーチャート</span>
        </div>
        <span className="text-xs transition-transform duration-200"
          style={{ color: 'var(--ink-xlight)', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-1.5 px-4 py-6 rounded-2xl" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
          <RadarChart scores={scoreCards} />
          <div className="grid grid-cols-2 gap-2 mt-5">
            {scoreCards.map((item) => {
              const color = item.status === 'good' ? 'var(--green)' : item.status === 'warning' ? 'var(--yellow)' : 'var(--red)';
              const bg = item.status === 'good' ? '#f0fdf4' : item.status === 'warning' ? '#fffbeb' : '#fff5f5';
              const border = item.status === 'good' ? '#bbf7d0' : item.status === 'warning' ? '#fde68a' : '#fecaca';
              return (
                <div key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="text-sm truncate" style={{ color: 'var(--ink-mid)' }}>{item.name}</span>
                  </div>
                  <span className="text-base font-bold shrink-0" style={{ color, fontFamily: "'DM Mono', monospace" }}>
                    {item.score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}