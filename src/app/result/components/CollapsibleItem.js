// src/app/result/components/CollapsibleItem.js
'use client';

import { useState } from 'react';
import CopyBlock from './CopyBlock';
import { COPY_TEMPLATES } from '../constants/copyTemplates';

export default function CollapsibleItem({ item, isChecked, onCheck, wasImproved, priority }) {
  const [showCode, setShowCode] = useState(false);
  const hasTemplate = !!COPY_TEMPLATES[item.id];

  return (
    <div className="rounded-xl p-4 transition-all"
      style={{
        opacity: isChecked ? 0.5 : 1,
        background: isChecked ? 'transparent' : priority === 'urgent' ? '#fff5f5' : '#ffffff',
        border: `1px solid ${isChecked ? 'var(--border)' : priority === 'urgent' ? '#fecaca' : 'var(--border)'}`,
      }}>

      {wasImproved && (
        <span className="block text-xs font-bold mb-1.5" style={{ color: 'var(--green)' }}>✨ 反映済み</span>
      )}

      <div className="flex items-center gap-3">
        <span className="shrink-0 text-base">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold"
              style={{ color: isChecked ? 'var(--ink-xlight)' : 'var(--ink)', textDecoration: isChecked ? 'line-through' : 'none' }}>
              {item.title}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-semibold"
              style={{ background: '#f0fdf4', color: 'var(--green)', border: '1px solid #bbf7d0' }}>
              {item.gainLabel}
            </span>
          </div>
          {!isChecked && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--ink-light)' }}>
              ⏱ {item.effort} — {item.howSimple}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasTemplate && !isChecked && (
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
              style={{ border: '1px solid var(--border)', color: 'var(--ink-light)', background: 'var(--bg-sub)' }}>
              {showCode ? '▲' : '📋'}
            </button>
          )}
          <button
            onClick={() => onCheck(item.id)}
            className="text-xs px-3 py-2 rounded-lg font-medium transition-all"
            style={isChecked ? {
              border: '1px solid #bbf7d0',
              color: 'var(--green)',
              background: '#f0fdf4',
            } : {
              border: '1px solid var(--border)',
              color: 'var(--ink-mid)',
              background: 'var(--bg-sub)',
            }}>
            {isChecked ? '✅' : '完了'}
          </button>
        </div>
      </div>

      {showCode && !isChecked && hasTemplate && (
        <div className="mt-2">
          <CopyBlock templateId={item.id} />
        </div>
      )}
    </div>
  );
}