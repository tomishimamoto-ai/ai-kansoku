'use client';

export default function PageRanking({ topPages, scData }) {
  const hasScData = scData && scData.connected && scData.topPages && scData.topPages.length > 0;

  const normalizeUrl = (url) => {
    try {
      return new URL(url).pathname || '/';
    } catch {
      return url;
    }
  };

  const pages = (() => {
    if (!hasScData) {
      return topPages
        .filter(p => !p.url.includes('honeypot'))
        .map(p => ({ url: p.url, aiVisits: p.visits, crawlerVariety: p.crawler_variety, sc: null }));
    }

    const scMap = new Map();
    scData.topPages.forEach(p => {
      const path = normalizeUrl(p.page);
      scMap.set(path, { impressions: p.impressions, clicks: p.clicks, ctr: p.ctr, position: p.position });
    });

    const aiMap = new Map();
    topPages
      .filter(p => !p.url.includes('honeypot'))
      .forEach(p => {
        aiMap.set(p.url, { aiVisits: p.visits, crawlerVariety: p.crawler_variety });
      });

    const result = [];
    scMap.forEach((sc, path) => {
      const ai = aiMap.get(path) || { aiVisits: 0, crawlerVariety: 0 };
      result.push({ url: path, aiVisits: ai.aiVisits, crawlerVariety: ai.crawlerVariety, sc });
    });

    aiMap.forEach((ai, path) => {
      if (!scMap.has(path)) {
        result.push({ url: path, aiVisits: ai.aiVisits, crawlerVariety: ai.crawlerVariety, sc: null });
      }
    });

    return result
      .sort((a, b) => (b.sc?.impressions || 0) - (a.sc?.impressions || 0))
      .slice(0, 10);
  })();

  const maxImpressions = hasScData ? Math.max(...pages.map(p => p.sc?.impressions || 0), 1) : 1;

  return (
    <div className="bg-gradient-to-br from-[#120f29] to-[#1e1a47] border border-[#3a2f7a] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📄</span>
          ページランキング
          {hasScData && (
            <span className="text-xs font-normal text-gray-500 ml-1">Search Console</span>
          )}
        </h2>
        <span className="text-xs text-gray-500">TOP{Math.min(pages.length, 10)}</span>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl mb-2 block">📡</span>
          <p className="text-gray-400">観測データがありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map((page, idx) => (
            <div key={idx} className="bg-[#1a1e47]/50 rounded-xl p-4 border border-[#2a2f57] hover:border-[#4a9eff]/40 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-[#4a9eff] bg-[#4a9eff]/20 px-2 py-0.5 rounded shrink-0">
                  #{idx + 1}
                </span>
                <p className="text-sm font-mono text-[#6eb5ff] truncate flex-1">{page.url}</p>
                {page.aiVisits > 0 && (
                  <span className="shrink-0 text-xs text-[#4a9eff] bg-[#4a9eff]/10 border border-[#4a9eff]/30 px-2 py-0.5 rounded-full">
                    ✦ AI {page.aiVisits}回
                  </span>
                )}
              </div>

              {page.sc ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">表示回数</p>
                    <p className="text-lg font-bold text-white">{page.sc.impressions.toLocaleString()}</p>
                    <div className="h-1 bg-[#0a0e27] rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                        style={{ width: `${(page.sc.impressions / maxImpressions) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">平均順位</p>
                    <p className="text-lg font-bold text-[#ffd700]">{page.sc.position}</p>
                    <p className="text-xs text-gray-600 mt-1">位</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CTR</p>
                    <p className="text-lg font-bold text-green-400">{page.sc.ctr}%</p>
                    <p className="text-xs text-gray-600 mt-1">クリック率</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{page.crawlerVariety}種類のAIが観測</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}