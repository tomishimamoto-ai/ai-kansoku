'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
              <span className="text-lg md:text-xl font-bold">AI観測ラボ</span>
            </Link>
          </div>
        </div>

        {/* 404 Content */}
        <div className="flex items-center justify-center min-h-[80vh] px-6">
          <div className="text-center">
            {/* 404 Number */}
            <div className="mb-8">
              <h1 className="text-8xl md:text-9xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  404
                </span>
              </h1>
              <div className="text-6xl md:text-7xl mb-4">🔍</div>
            </div>

            {/* Error Message */}
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              ページが見つかりません
            </h2>
            <p className="text-base md:text-lg text-gray-400 mb-8 max-w-md mx-auto">
              お探しのページは存在しないか、移動した可能性があります。
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
              >
                🏠 トップページへ戻る
              </Link>
              <button
                onClick={() => window.history.back()}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
              >
                ← 前のページに戻る
              </button>
            </div>

            {/* Helpful Links */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-sm text-gray-500 mb-4">お探しのページはこちらですか？</p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/"
                  className="text-sm text-gray-400 hover:text-white transition-colors underline"
                >
                  診断ツール
                </Link>
                <Link
                  href="/guide"
                  className="text-sm text-gray-400 hover:text-white transition-colors underline"
                >
                  改善ガイド
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}