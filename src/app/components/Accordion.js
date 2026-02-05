'use client';

import { useState } from 'react';

export default function Accordion({ title, icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-8 md:mb-12 bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/10 overflow-hidden">
      {/* ヘッダー（クリック可能） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <span>{icon}</span>
          <span>{title}</span>
        </h3>
        
        {/* 開閉アイコン */}
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* コンテンツ（折りたたみ） */}
      {isOpen && (
        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}