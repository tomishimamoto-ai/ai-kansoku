'use client';

// ページランキングコンポーネント
// サーコン連携あり: AI訪問 × 表示回数 × バッジ表示
// サーコン連携なし: AI訪問 TOP10のみ

function getPageBadge(aiVisits, impressions, ctr) {
  // 🔥 AIにも来てて検索露出も高い（優秀コンテンツ）
  if (aiVisits > 0 && impressions > 500) {
    return { icon: '🔥', label: 'AI×検索 好調', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
  }
  // 💸 検索露出高いのにAI訪問ゼロ（機会損失）
  if (aiVisits === 0 && impressions > 200) {
    return { icon: '💸', label: '機会損失', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
  }
  // 🤖 AI訪問多いのにCTR低い（ゼロクリック疑惑）
  if (aiVisits > 5 && parseFloat(ctr) < 1.5) {
    return { icon: '🤖', label: 'AI代替疑い', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
  }
  return null;
}

export default function PageRanking({ topPages, scData }) {
  const hasScData = scData && scData.connected && scData.topPages && scData.topPages.length > 0;

  // サーコンURLをパスに正規化
  const normalizeUrl = (url) => {
    try {
      return new URL(url).pathname || '/';
    } catch {
      return url;
    }
  };

  // 突合: AI訪問 × サーコンデータ
  const mergedPages = (() => {
    if (!hasScData) {
      return topPages.map(p => ({ url: p.url, aiVisits: p.visits, crawlerVariety: p.crawler_variety }));
    }

    const scMap = new Map();
    scData.topPages.forEach(p => {
      const path = normalizeUrl(p.page);
      scMap.set(path, { impressions: p.impressions, clicks: p.clicks, ctr: p.ctr, position: p.position });
    });

    // AI訪問ページにサーコンデータをマージ
    const filteredTopPages = topPages.filter(p => !p.url.includes('honeypot'));
    const aiPages = filteredTopPages.map(p => {
      const sc = scMap.get(p.url) || null;
      scMap.delete(p.url); // 使用済みフラグ
      return { url: p.url, aiVisits: p.visits, crawlerVariety: p.crawler_variety, sc };
    });

    // サーコンのみのページ（AI訪問ゼロ）を追加
    scMap.forEach((sc, path) => {
      aiPages.push({ url: path, aiVisits: 0, crawlerVariety: 0, sc });
    });

    // AI訪問数 × 表示回数でソート
    return aiPages
      .sort((a, b) => {
        const scoreA = (a.aiVisits * 10) + (a.sc?.impressions || 0) / 100;
        const scoreB = (b.aiVisits * 10) + (b.sc?.impressions || 0) / 100;
        return scoreB - scoreA;
      })
      .slice(0, 10);
  })();

  const maxAiVisits = Math.max(...mergedPages.map(p => p.aiVisits), 1);
  const maxImpressions = hasScData ? Math.max(...mergedPages.map(p => p.sc?.impressions || 0), 1) : 1;

  return (
    <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📄</span>
          ページランキング
          {hasScData && (
            <span className="text-xs font-normal text-gray-500 ml-1">AI訪問 × Search Console</span>
          )}
        </h2>
        <span className="text-xs text-gray-500">TOP{Math.min(mergedPages.length, 10)}</span>
      </div>

      {/* バッジ凡例（サーコン連携時のみ）*/}
      {hasScData && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { icon: '🔥', label: 'AI×検索 好調', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
            { icon: '💸', label: '機会損失', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
            { icon: '🤖', label: 'AI代替疑い', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
          ].map(b => (
            <span key={b.label} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${b.color}`}>
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      )}

      {mergedPages.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-2 block">📡</span>
          <p className="text-gray-400">観測データがありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mergedPages.map((page, idx) => {
            const badge = hasScData ? getPageBadge(page.aiVisits, page.sc?.impressions || 0, page.sc?.ctr || '0') : null;

            return (
              <div key={idx} className="bg-[#1a1e47]/50 rounded-xl p-4 border border-[#2a2f57] hover:border-[#4a9eff]/40 transition-all">
                {/* URL行 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-[#4a9eff] bg-[#4a9eff]/20 px-2 py-0.5 rounded shrink-0">
                    #{idx + 1}
                  </span>
                  <p className="text-sm font-mono text-[#6eb5ff] truncate flex-1">{page.url}</p>
                  {badge && (
                    <span className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.icon} {badge.label}
                    </span>
                  )}
                </div>

                {/* データ行 */}
                <div className={`grid gap-3 ${hasScData ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {/* AI訪問バー */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">✦ AI訪問</span>
                      <span className="text-xs font-bold text-[#4a9eff]">{page.aiVisits}回</span>
                    </div>
                    <div className="h-1.5 bg-[#0a0e27] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#4a9eff] to-[#6eb5ff] rounded-full transition-all"
                        style={{ width: `${(page.aiVisits / maxAiVisits) * 100}%` }}
                      />
                    </div>
                    {page.crawlerVariety > 0 && (
                      <p className="text-xs text-gray-600 mt-1">{page.crawlerVariety}種類のAIが観測</p>
                    )}
                  </div>

                  {/* サーコンバー（連携時のみ）*/}
                  {hasScData && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">👁 表示回数</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-400">
                            {page.sc ? page.sc.impressions.toLocaleString() : '−'}
                          </span>
                          {page.sc && (
                            <span className="text-xs text-gray-600">順位{page.sc.position}</span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#0a0e27] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                          style={{ width: page.sc ? `${(page.sc.impressions / maxImpressions) * 100}%` : '0%' }}
                        />
                      </div>
                      {page.sc && (
                        <p className="text-xs text-gray-600 mt-1">CTR {page.sc.ctr}%</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 機会損失インサイト */}
                {badge?.icon === '💸' && (
                  <div className="mt-3 text-xs text-yellow-400/80 bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
                    💡 検索では露出しているのにAIに読まれていません。llms.txtにこのページを追加しましょう。
                  </div>
                )}
                {badge?.icon === '🤖' && (
                  <div className="mt-3 text-xs text-blue-400/80 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
                    💡 AIがこのページの内容を代わりに回答している可能性があります。
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}