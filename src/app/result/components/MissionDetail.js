// src/app/result/components/MissionDetail.js
'use client';

import { useState } from 'react';
import CopyBlock from './CopyBlock';
import { COPY_TEMPLATES } from '../constants/copyTemplates';

export default function MissionDetail({ item }) {
  const [showCode, setShowCode] = useState(false);
  const hasTemplate = !!COPY_TEMPLATES[item.id];

  return (
    <div className="mb-5 space-y-2.5">
      <p className="text-sm text-amber-200/70">⚠ {item.why}</p>
      <div className="flex items-start gap-2 p-3.5 rounded-xl bg-black/20 border border-white/6">
        <span className="text-gray-500 shrink-0 mt-0.5">→</span>
        <p className="text-sm text-gray-300">{item.howSimple}</p>
      </div>
      {hasTemplate && (
        <button
          onClick={() => setShowCode(!showCode)}
          className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg border font-medium transition-all
            ${showCode
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
              : 'bg-white/6 border-white/12 text-gray-300 hover:bg-white/10 hover:text-white'}`}>
          <span>{showCode ? '▲' : '▼'}</span>
          {showCode ? 'コードを隠す' : '📋 コピペ用コードを見る'}
        </button>
      )}
      {showCode && hasTemplate && <CopyBlock templateId={item.id} />}
    </div>
  );
}