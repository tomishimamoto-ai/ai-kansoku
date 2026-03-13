import { Suspense } from 'react';
import ResultContent from './ResultContent';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7f5' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: '#e8edfb', borderTopColor: '#2d5be3' }} />
        <span className="text-sm" style={{ color: '#888888', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          観測データを読み込み中...
        </span>
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