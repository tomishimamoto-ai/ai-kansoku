// src/app/result/components/CollapsibleItem.js
'use client';

import { useState } from 'react';
import CopyBlock from './CopyBlock';
import { COPY_TEMPLATES } from '../constants/copyTemplates';

export default function CollapsibleItem({ item, isChecked, onCheck, wasImproved, priority }) {
  const [showCode, setShowCode] = useState(false);
  const hasTemplate = !!COPY_TEMPLATES[item.id];

  return (
    <div className={`rounded-xl border p-4 transition-all
      ${isChecked
        ? 'opacity-50 border-white/5 bg-transparent'
        : priority === 'urgent'
        ? 'border-red-500/20 bg-red-500/5'
        : 'border-white/8 bg-white/2'}`}>

      {wasImproved && (
        <span className="block text-xs text-emerald-400 font-bold mb-1.5">✨ 反映済み</span>
      )}

      <div className="flex items-center gap-3">
        <span className="shrink-0 text-base">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isChecked ? 'line-through text-gray-600' : 'text-gray-100'}`}>
              {item.title}
            </span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
              {item.gainLabel}
            </span>
          </div>
          {!isChecked && (
            <p className="text-xs text-gray-500 mt-0.5">⏱ {item.effort} — {item.howSimple}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasTemplate && !isChecked && (
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all">
              {showCode ? '▲' : '📋'}
            </button>
          )}
          <button
            onClick={() => onCheck(item.id)}
            className={`text-xs px-3 py-2 rounded-lg border font-medium transition-all
              ${isChecked
                ? 'border-emerald-500/20 text-emerald-500 hover:text-emerald-400'
                : 'border-white/12 text-gray-400 hover:border-white/25 hover:text-white bg-white/5'}`}>
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