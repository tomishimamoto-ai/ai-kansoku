// src/app/result/components/CrawlerStatus.js
'use client';

import { useState } from 'react';

export default function CrawlerStatus({ crawlers }) {
  const [open, setOpen] = useState(false);

  if (!crawlers || crawlers.length === 0) return null;

  const allowedCount = crawlers.filter((c) => c.ok).length;
  const allOk = allowedCount === crawlers.length;

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all text-left"
        style={{ background: '#ffffff', border: '1px solid var(--border)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sub)'}
        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
        <div className="flex items-center gap-3">
          <span>🤖</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            AIクローラーのアクセス許可
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
            style={allOk ? {
              background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0',
            } : {
              background: '#fffbeb', color: 'var(--yellow)', border: '1px solid #fde68a',
            }}>
            {allowedCount}/{crawlers.length} 許可
          </span>
        </div>
        <span className="text-xs transition-transform duration-200"
          style={{ color: 'var(--ink-xlight)', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-1.5 px-5 py-4 rounded-2xl space-y-2.5"
          style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
          {crawlers.map((c) => (
            <div key={c.agent}
              className="flex items-center justify-between py-1.5 last:border-0"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full"
                  style={{ background: c.ok ? 'var(--green)' : 'var(--red)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{c.name}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--ink-xlight)', fontFamily: "'DM Mono', monospace" }}>
                  ({c.agent})
                </span>
              </div>
              <span className="text-sm font-semibold"
                style={{ color: c.ok ? 'var(--green)' : 'var(--red)' }}>
                {c.ok ? '✅ 許可' : '❌ ブロック'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}