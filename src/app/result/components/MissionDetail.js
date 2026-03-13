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
      <p className="text-sm" style={{ color: 'var(--yellow)' }}>⚠ {item.why}</p>
      <div className="flex items-start gap-2 p-3.5 rounded-xl" style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)' }}>
        <span className="shrink-0 mt-0.5" style={{ color: 'var(--ink-xlight)' }}>→</span>
        <p className="text-sm" style={{ color: 'var(--ink-mid)' }}>{item.howSimple}</p>
      </div>
      {hasTemplate && (
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg font-medium transition-all"
          style={showCode ? {
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: 'var(--green)',
          } : {
            background: 'var(--bg-sub)',
            border: '1px solid var(--border)',
            color: 'var(--ink-mid)',
          }}>
          <span>{showCode ? '▲' : '▼'}</span>
          {showCode ? 'コードを隠す' : '📋 コピペ用コードを見る'}
        </button>
      )}
      {showCode && hasTemplate && <CopyBlock templateId={item.id} />}
    </div>
  );
}