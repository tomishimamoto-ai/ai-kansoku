'use client';

import { useState, useRef, useEffect } from 'react';

export default function ShareDropdown({ url, totalScore }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setIsOpen(false);
      }, 1500);
    } catch (error) {
      alert('リンクのコピーに失敗しました');
    }
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`AI可視性診断結果 - ${url}`);
    const body = encodeURIComponent(
      `AI観測ラボで診断した結果です。\n\n診断URL: ${url}\n総合スコア: ${totalScore}点\n\n詳細はこちら:\n${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsOpen(false);
  };

  const shareOnX = () => {
    const shareText = `私のサイトのAI可視性スコアは${totalScore}点でした！ #AI観測ラボ`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full md:flex-1" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
      >
        <span>📤</span>
        <span>共有する</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50">
          <button
            onClick={copyLink}
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-white/10 transition-colors border-b border-white/10"
          >
            <span className="text-2xl">{copySuccess ? '✅' : '📋'}</span>
            <div className="flex-1 text-left">
              <div className="font-medium">{copySuccess ? 'コピーしました！' : 'リンクをコピー'}</div>
              <div className="text-xs text-gray-400">URLをクリップボードにコピー</div>
            </div>
          </button>

          <button
            onClick={shareByEmail}
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-white/10 transition-colors border-b border-white/10"
          >
            <span className="text-2xl">📧</span>
            <div className="flex-1 text-left">
              <div className="font-medium">メールで送信</div>
              <div className="text-xs text-gray-400">メーラーを起動して共有</div>
            </div>
          </button>

          <button
            onClick={shareOnX}
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-white/10 transition-colors"
          >
            <span className="text-2xl">🐦</span>
            <div className="flex-1 text-left">
              <div className="font-medium">Xで共有</div>
              <div className="text-xs text-gray-400">診断結果をポスト</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}