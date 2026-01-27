'use client';
import Link from 'next/link';

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
              <span className="text-lg md:text-xl font-bold">AI観測ラボ</span>
            </Link>
            <div className="flex gap-3 md:gap-4 text-xs md:text-sm">
              <Link href="/how-to-use" className="text-white font-medium">使い方</Link>
              <Link href="/guide" className="text-gray-400 hover:text-white transition-colors">改善ガイド</Link>
              <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Header */}
          <div className="mb-8 md:mb-12 text-center">
            <div className="text-5xl md:text-6xl mb-4">📖</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">使い方ガイド</h1>
            <p className="text-sm md:text-base text-gray-400">AI観測ラボの基本的な使い方を解説します</p>
          </div>

          {/* Steps */}
          <div className="space-y-8 md:space-y-12">
            {/* Step 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">URLを入力</h2>
                  <p className="text-gray-400">診断したいサイトのURLを入力します</p>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                <p className="text-sm text-gray-400 mb-3">入力例：</p>
                <div className="space-y-2">
                  <div className="bg-white/5 px-4 py-3 rounded-lg font-mono text-sm">
                    https://example.com
                  </div>
                  <div className="bg-white/5 px-4 py-3 rounded-lg font-mono text-sm">
                    example.com
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    ※ https:// は自動で補完されます
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">診断を実行</h2>
                  <p className="text-gray-400">「診断する」ボタンをクリックして待ちます</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm">診断には10〜30秒程度かかります。以下の項目をチェックします：</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    '📊 構造化データ',
                    '🤖 robots.txt',
                    '🗺️ sitemap.xml',
                    '📝 llms.txt',
                    '🏷️ メタタグ',
                    '🏗️ セマンティックHTML',
                    '📱 モバイル対応',
                    '⚡ パフォーマンス'
                  ].map((item, i) => (
                    <div key={i} className="bg-white/5 px-4 py-2 rounded-lg text-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">結果を確認</h2>
                  <p className="text-gray-400">診断結果ページでスコアと改善点を確認します</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                  <h3 className="font-bold mb-4">結果ページの見方</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <p className="font-medium mb-1">総合スコア</p>
                        <p className="text-gray-400">8項目の平均点（0〜100点）</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <p className="font-medium mb-1">レーダーチャート</p>
                        <p className="text-gray-400">各項目のバランスを可視化</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="font-medium mb-1">改善ポイント</p>
                        <p className="text-gray-400">優先度別の改善提案</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold">
                  4
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">改善を実施</h2>
                  <p className="text-gray-400">改善ガイドを参考に、サイトを最適化します</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm">「詳しい改善ガイドを見る」ボタンから、各項目の具体的な実装方法を確認できます。</p>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-sm">
                    💡 <strong>ヒント：</strong> 高優先度の項目から順に対応すると効率的です。
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold">
                  5
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">再診断して効果を確認</h2>
                  <p className="text-gray-400">改善後、もう一度診断してスコアの変化を確認します</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm">トップページの診断履歴から、過去のスコアと比較できます。</p>
                <div className="bg-black/30 rounded-xl p-6 border border-white/10">
                  <p className="text-sm text-gray-400 mb-3">スコア比較の例：</p>
                  <div className="bg-white/5 px-4 py-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">example.com</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-400">75点</span>
                        <span className="text-sm font-semibold px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          📈 +12
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-12 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6">💡 活用のヒント</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl">📅</span>
                <div>
                  <p className="font-medium mb-1">定期的に診断しましょう</p>
                  <p className="text-gray-400">月1回程度の定期診断で、サイトの健全性を維持できます</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="font-medium mb-1">更新後は必ず再診断</p>
                  <p className="text-gray-400">サイトを更新したら、意図せず設定が変わっていないか確認しましょう</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">👥</span>
                <div>
                  <p className="font-medium mb-1">チームで共有</p>
                  <p className="text-gray-400">PDF出力機能で診断結果を共有し、チーム全体で改善に取り組めます</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <p className="font-medium mb-1">競合分析にも活用</p>
                  <p className="text-gray-400">競合サイトを診断して、自社サイトとの差を把握しましょう</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
            >
              🔍 今すぐ診断を始める
            </Link>
            <p className="text-sm text-gray-400 mt-4">
              わからないことがあれば <Link href="/faq" className="text-blue-400 hover:underline">FAQ</Link> をご覧ください
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}