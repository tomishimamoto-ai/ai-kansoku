// src/app/result/components/RadarSection.js
'use client';

import { useState } from 'react';
import RadarChart from '../RadarChart';

export default function RadarSection({ scoreCards }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3">
      {/* トグルヘッダー */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all">
        <div className="flex items-center gap-3">
          <span>📡</span>
          <span className="text-sm text-gray-300 font-medium">8項目の詳細スコア</span>
          <span className="text-xs text-gray-600">レーダーチャート</span>
        </div>
        <span className={`text-gray-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* レーダーチャート + スコアグリッド */}
      {open && (
        <div className="mt-1.5 px-4 py-6 rounded-2xl border border-white/8 bg-white/2">
          <RadarChart scores={scoreCards} />
          <div className="grid grid-cols-2 gap-2.5 mt-5">
            {scoreCards.map((item) => {
              const c = item.status === 'good'
                ? '#4ade80'
                : item.status === 'warning'
                ? '#fbbf24'
                : '#f87171';
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3.5 rounded-xl"
                  style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="text-sm text-gray-300 truncate">{item.name}</span>
                  </div>
                  <span className="text-base font-bold shrink-0" style={{ color: c }}>
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