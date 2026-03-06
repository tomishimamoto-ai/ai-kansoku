// src/app/result/page.js
import { Suspense } from 'react';
import ResultContent from './ResultContent';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080c1a' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
        <span className="text-base text-gray-500">観測データを読み込み中...</span>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultContent />
    </Suspense>
  );
}