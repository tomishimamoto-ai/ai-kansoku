// src/app/result/components/TrackingCode.js
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function TrackingCode({ siteId, isInstalled, onCopy }) {
  const [copied, setCopied] = useState(false);

  if (!siteId) return null;

  const scriptCode = useMemo(
    () => `<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>`,
    [siteId]
  );

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dashboardUrl = `/dashboard?siteId=${encodeURIComponent(siteId)}`;

  if (isInstalled) {
    return (
      <div className="mb-8">
        <details className="group">
          <summary className="flex items-center gap-2.5 cursor-pointer px-5 py-3.5 rounded-2xl border border-white/6 hover:border-white/12 transition-all text-sm text-gray-500 list-none">
            <span>📋</span>
            <span>トラッキングコードを再確認</span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full ml-1">
              ✓ 設置済み
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14" height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-auto group-open:rotate-180 transition-transform duration-200 text-gray-600">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="mt-2 px-5 py-4 rounded-2xl border border-white/6 bg-black/20">
            <p className="text-xs text-gray-500 mb-3">
              このコードをサイトの &lt;head&gt; 内に追加してください
            </p>
            <pre className="overflow-x-auto text-sm mb-3">
              <code className="text-emerald-400/70 break-all select-all">{scriptCode}</code>
            </pre>
            <button
              onClick={handleCopy}
              aria-label="トラッキングコードをコピー"
              className={`text-sm px-4 py-2 rounded-lg border font-medium transition-all
                ${copied
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  : 'border-white/8 text-gray-400 hover:text-gray-200 hover:border-white/20'}`}>
              {copied ? '✅ コピーしました' : '📋 再コピー'}
            </button>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div
        className="rounded-2xl border border-blue-400/20 p-6 md:p-7"
        style={{
          background: 'linear-gradient(135deg, rgba(74,158,255,0.07), rgba(99,102,241,0.04))',
        }}>
        {/* ヘッダー */}
        <div className="flex items-start gap-4 mb-5">
          <span className="text-4xl shrink-0">🛸</span>
          <div>
            <h3 className="font-bold text-lg mb-1">AI訪問トラッキングを設置する</h3>
            <p className="text-sm text-gray-400">
              設置すると、どのAIがあなたのサイトを訪問したか観測できます
            </p>
            <p className="text-xs text-gray-600 mt-1">
              ※ サイトの表示速度・見た目には影響しません
            </p>
          </div>
        </div>

        {/* 設置手順 */}
        <p className="text-xs text-gray-500 mb-3">
          このコードをサイトの &lt;head&gt; 内に追加してください
        </p>

        {/* コード表示 */}
        <pre
          className="p-4 rounded-xl mb-4 overflow-x-auto text-sm"
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
          <code className="text-emerald-400 break-all select-all">{scriptCode}</code>
        </pre>

        {/* コピーボタン */}
        <button
          onClick={handleCopy}
          aria-label="トラッキングコードをコピー"
          className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all mb-3
            ${copied
              ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
              : 'hover:opacity-90 text-white'}`}
          style={!copied ? { background: 'linear-gradient(135deg, #4a9eff, #6366f1)' } : {}}>
          {copied ? '✅ コピーしました！' : '📋 コードをコピーして設置する'}
        </button>

        {/* 設置後の確認導線 */}
        <Link
          href={dashboardUrl}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/4 hover:bg-white/8 text-sm text-gray-400 hover:text-gray-200 transition-all">
          🔭 設置できたら観測を確認する →
        </Link>
      </div>
    </div>
  );
}