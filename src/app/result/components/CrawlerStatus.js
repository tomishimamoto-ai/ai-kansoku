// src/app/result/components/CrawlerStatus.js
'use client';

import { useState } from 'react';

export default function CrawlerStatus({ crawlers }) {
  const [open, setOpen] = useState(false);

  if (!crawlers || crawlers.length === 0) return null;

  const allowedCount = crawlers.filter((c) => c.ok).length;

  return (
    <div className="mb-3">
      {/* トグルヘッダー */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all">
        <div className="flex items-center gap-3">
          <span>🤖</span>
          <span className="text-sm text-gray-300 font-medium">AIクローラーのアクセス許可</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border
            ${allowedCount === crawlers.length
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
              : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'}`}>
            {allowedCount}/{crawlers.length} 許可
          </span>
        </div>
        <span className={`text-gray-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* クローラーリスト */}
      {open && (
        <div className="mt-1.5 px-5 py-4 rounded-2xl border border-white/8 bg-white/2 space-y-2.5">
          {crawlers.map((c) => (
            <div
              key={c.agent}
              className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: c.ok ? '#4ade80' : '#f87171' }}
                />
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-gray-600 font-mono">({c.agent})</span>
              </div>
              <span className={`text-sm font-medium ${c.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {c.ok ? '✅ 許可' : '❌ ブロック'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}