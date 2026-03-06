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
    <div className="mb-8">
      {/* トグルヘッダー */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all">
        <div className="flex items-center gap-3">
          <span>🔬</span>
          <span className="text-sm text-gray-300 font-medium">技術的な詳細内訳</span>
          <span className="text-xs text-gray-600">上級者向け</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16" height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-1.5 space-y-3">

          {/* メタタグ詳細 */}
          {metaTags?.exists && (
            <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
              <h5 className="font-bold mb-4 flex items-center gap-2">🏷️ メタタグ詳細</h5>
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-black/20 border border-white/6">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-400">Title</span>
                    <span className={metaTags?.basic?.titleOptimal ? 'text-emerald-400' : 'text-amber-400'}>
                      {metaTags?.basic?.titleLength ?? 0}文字
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 break-words">{metaTags?.basic?.title ?? '—'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-black/20 border border-white/6">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-400">Description</span>
                    <span className={metaTags?.basic?.descriptionOptimal ? 'text-emerald-400' : 'text-amber-400'}>
                      {metaTags?.basic?.descriptionLength ?? 0}文字
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 break-words">{metaTags?.basic?.description ?? '—'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-black/15 border border-white/6 text-center">
                    <div className="text-xs text-gray-500 mb-1">OGP</div>
                    <span className={`font-bold ${(metaTags?.ogp?.completeness || 0) >= 4 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {metaTags?.ogp?.completeness ?? 0}/5項目
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/15 border border-white/6 text-center">
                    <div className="text-xs text-gray-500 mb-1">Twitter Card</div>
                    <span className={`font-bold ${(metaTags?.twitter?.completeness || 0) >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {metaTags?.twitter?.completeness ?? 0}/4項目
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* セマンティックHTML詳細 */}
          {semanticHTML?.exists && (
            <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
              <h5 className="font-bold mb-4">🏗️ セマンティックHTML詳細</h5>
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
                  <div
                    key={name + i}
                    className="flex flex-col items-center p-2 rounded-lg border text-center"
                    style={{
                      borderColor: used ? '#4ade8030' : '#f8717130',
                      background: used ? '#4ade8008' : '#f8717108',
                    }}>
                    <code className="text-xs">{name}</code>
                    <span className="text-sm mt-0.5" style={{ color: used ? '#4ade80' : '#f87171' }}>
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
                  <div key={h} className="p-3 rounded-xl bg-black/20 border border-white/6">
                    <div className="text-xs text-gray-500 mb-0.5">{h}</div>
                    <div className="text-lg font-bold">{c ?? 0}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* パフォーマンス詳細 */}
          {performance?.exists && (
            <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
              <h5 className="font-bold mb-4">⚡ パフォーマンス詳細</h5>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {[
                  ['総画像数',  performance.images?.totalCount    ?? 0],
                  ['遅延読込',  `${performance.images?.lazyLoadRatio ?? 0}%`],
                  ['ALT設定',   `${performance.images?.altTextRatio  ?? 0}%`],
                ].map(([label, val]) => (
                  <div key={label} className="p-3.5 rounded-xl bg-black/20 border border-white/6 text-center">
                    <div className="text-xs text-gray-500 mb-1.5">{label}</div>
                    <div className="font-bold text-base">{val}</div>
                  </div>
                ))}
              </div>
              {/* スクリプト詳細 */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  ['scripts', performance.scripts?.totalCount  ?? 0],
                  ['defer',   performance.scripts?.deferCount  ?? 0],
                  ['async',   performance.scripts?.asyncCount  ?? 0],
                ].map(([label, val]) => (
                  <div key={label} className="p-3 rounded-xl bg-black/15 border border-white/6 text-center">
                    <div className="text-xs text-gray-500 mb-1">
                      <code>{label}</code>
                    </div>
                    <div className="font-bold text-base">{val}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {performance.scripts?.hasDeferScripts && (
                  <span className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    defer ✓
                  </span>
                )}
                {performance.scripts?.hasAsyncScripts && (
                  <span className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                    async ✓
                  </span>
                )}
                {!performance.scripts?.hasDeferScripts && !performance.scripts?.hasAsyncScripts && (
                  <span className="text-sm px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/15">
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