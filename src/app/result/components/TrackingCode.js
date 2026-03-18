// src/app/result/components/TrackingCode.js
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function TrackingCode({ siteId, isInstalled, onCopy, totalScore }) {
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
  const isUnlocked = totalScore >= 70;

  if (isInstalled) {
    return (
      <div className="mb-6">
        <details className="group">
          <summary className="flex items-center gap-2.5 cursor-pointer px-5 py-3.5 rounded-2xl transition-all text-sm list-none"
            style={{ border: '1px solid var(--border)', color: 'var(--ink-light)' }}>
            <span>📋</span>
            <span>トラッキングコードを再確認</span>
            <span className="text-xs px-2 py-0.5 rounded-full ml-1 font-semibold"
              style={{ background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0' }}>
              ✓ 設置済み
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="ml-auto group-open:rotate-180 transition-transform duration-200"
              style={{ color: 'var(--ink-xlight)' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="mt-2 px-5 py-4 rounded-2xl" style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}>
            <p className="text-xs mb-3" style={{ color: 'var(--ink-light)' }}>
              このコードをサイトの &lt;head&gt; 内に追加してください
            </p>
            <pre className="overflow-x-auto text-sm mb-3 p-3 rounded-lg" style={{ background: '#1e1e2e' }}>
              <code className="break-all select-all" style={{ color: '#a6e3a1', fontFamily: "'DM Mono', monospace" }}>
                {scriptCode}
              </code>
            </pre>
            <button onClick={handleCopy}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
              style={copied ? {
                background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0',
              } : {
                background: '#ffffff', color: 'var(--ink-mid)', border: '1px solid var(--border)',
              }}>
              {copied ? '✅ コピーしました' : '📋 再コピー'}
            </button>
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="rounded-2xl p-6 md:p-7" style={{ background: 'var(--accent-light)', border: '1px solid #c5d3f5' }}>
        <div className="flex items-start gap-4 mb-5">
          <span className="text-3xl shrink-0">🛸</span>
          <div>
            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--ink)' }}>
              AI訪問トラッキングを設置する
            </h3>
            <p className="text-sm" style={{ color: 'var(--ink-mid)' }}>
              設置すると、どのAIがあなたのサイトを訪問したか観測できます
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--ink-light)' }}>
              ※ サイトの表示速度・見た目には影響しません
            </p>
          </div>
        </div>

        <p className="text-xs mb-3" style={{ color: 'var(--ink-light)' }}>
          このコードをサイトの &lt;head&gt; 内に追加してください
        </p>

        <pre className="p-4 rounded-xl mb-4 overflow-x-auto text-sm" style={{ background: '#1e1e2e' }}>
          <code className="break-all select-all" style={{ color: '#a6e3a1', fontFamily: "'DM Mono', monospace" }}>
            {scriptCode}
          </code>
        </pre>

        <button onClick={handleCopy}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all mb-3"
          style={copied ? {
            background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0',
          } : {
            background: 'var(--accent)', color: '#ffffff',
          }}>
          {copied ? '✅ コピーしました！' : '📋 コードをコピーして設置する'}
        </button>

        {isUnlocked ? (
          <Link href={dashboardUrl}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: '#ffffff', border: '1px solid #c5d3f5', color: 'var(--ink-mid)' }}>
            🔭 設置できたら観測を確認する →
          </Link>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium"
              style={{ background: '#f7f7f5', border: '1px solid #e8e8e8', color: '#bbbbbb', cursor: 'not-allowed' }}>
              🔒 ダッシュボードはスコア70点以上で開放
            </div>
            <p className="text-center text-xs mt-2" style={{ color: 'var(--ink-light)' }}>
              改善項目を完了してあと
              <span className="font-bold mx-1" style={{ color: 'var(--accent)' }}>
                {70 - totalScore}点
              </span>
              獲得しましょう
            </p>
          </div>
        )}
      </div>
    </div>
  );
}