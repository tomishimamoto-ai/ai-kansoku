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
    <div className="mt-3 rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/4 border-b border-white/8">
        <span className="text-xs text-gray-400 font-mono">{tpl.label}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
            ${copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/8 text-gray-300 border border-white/12 hover:bg-white/15'}`}>
          {copied ? '✅ コピーしました' : '📋 コピー'}
        </button>
      </div>
      <pre
        className="p-4 overflow-x-auto text-xs leading-relaxed"
        style={{ background: 'rgba(0,0,0,0.5)', maxHeight: '200px' }}>
        <code className="text-emerald-300/90 whitespace-pre">{tpl.code}</code>
      </pre>
      {tpl.note && (
        <div className="px-4 py-2 bg-amber-500/6 border-t border-amber-500/15">
          <p className="text-xs text-amber-300/70">💡 {tpl.note}</p>
        </div>
      )}
    </div>
  );
}