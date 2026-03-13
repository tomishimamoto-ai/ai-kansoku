// src/app/result/components/TechDetails.js
'use client';

import { useState } from 'react';

export default function TechDetails({ analyzedData }) {
  const [open, setOpen] = useState(false);

  if (!analyzedData) return null;

  const metaTags = analyzedData.details?.metaTags;
  const semanticHTML = analyzedData.details?.semanticHTML;
  const performance = analyzedData.details?.performance;

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all text-left"
        style={{ background: '#ffffff', border: '1px solid var(--border)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sub)'}
        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
        <div className="flex items-center gap-3">
          <span>🔬</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>技術的な詳細内訳</span>
          <span className="text-xs" style={{ color: 'var(--ink-xlight)' }}>上級者向け</span>
        </div>
        <span className="text-xs transition-transform duration-200"
          style={{ color: 'var(--ink-xlight)', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-1.5 space-y-2.5">

          {/* メタタグ詳細 */}
          {metaTags?.exists && (
            <div className="p-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
              <h5 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                🏷️ メタタグ詳細
              </h5>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl" style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span style={{ color: 'var(--ink-light)' }}>Title</span>
                    <span style={{ color: metaTags?.basic?.titleOptimal ? 'var(--green)' : 'var(--yellow)' }}>
                      {metaTags?.basic?.titleLength ?? 0}文字
                    </span>
                  </div>
                  <p className="text-sm break-words" style={{ color: 'var(--ink-mid)' }}>
                    {metaTags?.basic?.title ?? '—'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl" style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span style={{ color: 'var(--ink-light)' }}>Description</span>
                    <span style={{ color: metaTags?.basic?.descriptionOptimal ? 'var(--green)' : 'var(--yellow)' }}>
                      {metaTags?.basic?.descriptionLength ?? 0}文字
                    </span>
                  </div>
                  <p className="text-sm break-words" style={{ color: 'var(--ink-mid)' }}>
                    {metaTags?.basic?.description ?? '—'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['OGP', metaTags?.ogp?.completeness ?? 0, 5, 4],
                    ['Twitter Card', metaTags?.twitter?.completeness ?? 0, 4, 3],
                  ].map(([label, val, max, threshold]) => (
                    <div key={label} className="p-3 rounded-xl text-center"
                      style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}>
                      <div className="text-xs mb-1" style={{ color: 'var(--ink-light)' }}>{label}</div>
                      <span className="font-bold text-sm"
                        style={{ color: val >= threshold ? 'var(--green)' : 'var(--yellow)' }}>
                        {val}/{max}項目
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* セマンティックHTML詳細 */}
          {semanticHTML?.exists && (
            <div className="p-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
              <h5 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>🏗️ セマンティックHTML詳細</h5>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 mb-4">
                {[
                  ['header',  semanticHTML.semanticTags?.hasHeader],
                  ['nav',     semanticHTML.semanticTags?.hasNav],
                  ['main',    semanticHTML.semanticTags?.hasMain],
                  ['article', semanticHTML.semanticTags?.hasArticle],
                  ['section', semanticHTML.semanticTags?.hasSection],
                  ['aside',   semanticHTML.semanticTags?.hasAside],
                  ['footer',  semanticHTML.semanticTags?.hasFooter],
                ].map(([name, used], i) => (
                  <div key={name + i}
                    className="flex flex-col items-center p-2 rounded-lg text-center"
                    style={{
                      background: used ? '#f0fdf4' : '#fff5f5',
                      border: `1px solid ${used ? '#bbf7d0' : '#fecaca'}`,
                    }}>
                    <code className="text-xs" style={{ color: 'var(--ink-mid)' }}>{name}</code>
                    <span className="text-sm mt-0.5" style={{ color: used ? 'var(--green)' : 'var(--red)' }}>
                      {used ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  ['H1', semanticHTML.headingStructure?.h1Count],
                  ['H2', semanticHTML.headingStructure?.h2Count],
                  ['H3', semanticHTML.headingStructure?.h3Count],
                  ['H4', semanticHTML.headingStructure?.h4Count],
                ].map(([h, c]) => (
                  <div key={h} className="p-3 rounded-xl"
                    style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}>
                    <div className="text-xs mb-0.5" style={{ color: 'var(--ink-light)' }}>{h}</div>
                    <div className="text-lg font-bold" style={{ color: 'var(--ink)', fontFamily: "'DM Mono', monospace" }}>
                      {c ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* パフォーマンス詳細 */}
          {performance?.exists && (
            <div className="p-5 rounded-2xl" style={{ background: '#ffffff', border: '1px solid var(--border)' }}>
              <h5 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>⚡ パフォーマンス詳細</h5>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {[
                  ['総画像数',  performance.images?.totalCount    ?? 0],
                  ['遅延読込',  `${performance.images?.lazyLoadRatio ?? 0}%`],
                  ['ALT設定',   `${performance.images?.altTextRatio  ?? 0}%`],
                ].map(([label, val]) => (
                  <div key={label} className="p-3.5 rounded-xl text-center"
                    style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}>
                    <div className="text-xs mb-1.5" style={{ color: 'var(--ink-light)' }}>{label}</div>
                    <div className="font-bold text-base" style={{ color: 'var(--ink)', fontFamily: "'DM Mono', monospace" }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  ['scripts', performance.scripts?.totalCount  ?? 0],
                  ['defer',   performance.scripts?.deferCount  ?? 0],
                  ['async',   performance.scripts?.asyncCount  ?? 0],
                ].map(([label, val]) => (
                  <div key={label} className="p-3 rounded-xl text-center"
                    style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--ink-light)' }}>
                      <code style={{ fontFamily: "'DM Mono', monospace" }}>{label}</code>
                    </div>
                    <div className="font-bold" style={{ color: 'var(--ink)', fontFamily: "'DM Mono', monospace" }}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {performance.scripts?.hasDeferScripts && (
                  <span className="text-sm px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0' }}>
                    defer ✓
                  </span>
                )}
                {performance.scripts?.hasAsyncScripts && (
                  <span className="text-sm px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0' }}>
                    async ✓
                  </span>
                )}
                {!performance.scripts?.hasDeferScripts && !performance.scripts?.hasAsyncScripts && (
                  <span className="text-sm px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: '#fff5f5', color: 'var(--red)', border: '1px solid #fecaca' }}>
                    非同期読込 未使用
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}