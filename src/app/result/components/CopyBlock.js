// src/app/result/components/CopyBlock.js
'use client';

import { useState } from 'react';
import { COPY_TEMPLATES } from '../constants/copyTemplates';

export default function CopyBlock({ templateId }) {
  const tpl = COPY_TEMPLATES[templateId];
  const [copied, setCopied] = useState(false);

  if (!tpl) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tpl.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: 'var(--bg-sub)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs" style={{ color: 'var(--ink-light)', fontFamily: "'DM Mono', monospace" }}>
          {tpl.label}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
          style={copied ? {
            background: '#f0fdf4',
            color: 'var(--green)',
            border: '1px solid #bbf7d0',
          } : {
            background: '#ffffff',
            color: 'var(--ink-mid)',
            border: '1px solid var(--border)',
          }}>
          {copied ? '✅ コピーしました' : '📋 コピー'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed"
        style={{ background: '#1e1e2e', maxHeight: '200px' }}>
        <code className="whitespace-pre" style={{ color: '#a6e3a1', fontFamily: "'DM Mono', monospace" }}>
          {tpl.code}
        </code>
      </pre>
      {tpl.note && (
        <div className="px-4 py-2" style={{ background: '#fffbeb', borderTop: '1px solid #fde68a' }}>
          <p className="text-xs" style={{ color: 'var(--yellow)' }}>💡 {tpl.note}</p>
        </div>
      )}
    </div>
  );
}