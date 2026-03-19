'use client';

import { useState, useEffect, useCallback } from 'react';

export default function SearchConsolePanel({ siteId }) {
  const [status, setStatus] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async (force = false) => {
    try {
      const res = await fetch(`/api/search-console/fetch?siteId=${siteId}${force ? '&force=true' : ''}`);
      if (!res.ok) throw new Error('Fetch failed');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/search-console/status?siteId=${siteId}`);
      const json = await res.json();
      setStatus(json);
      if (json.connected && json.scSiteUrl) {
        await fetchData();
      } else {
        setLoading(false);
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, [siteId, fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    await fetchData(true);
    const res = await fetch(`/api/search-console/status?siteId=${siteId}`);
    setStatus(await res.json());
    setSyncing(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('Search Console連携を解除しますか？')) return;
    await fetch(`/api/search-console/status?siteId=${siteId}`, { method: 'DELETE' });
    setStatus({ connected: false });
    setData(null);
  };

  const handleSiteUrlChange = async (newUrl) => {
    await fetch('/api/search-console/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, scSiteUrl: newUrl }),
    });
    setStatus(prev => ({ ...prev, scSiteUrl: newUrl }));
    setLoading(true);
    await fetchData(true);
  };

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  if (!status?.connected) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#2a2f57] bg-gradient-to-br from-[#0f1229] to-[#1a1e47] p-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e2451] text-xl">📊</div>
            <div>
              <h3 className="font-semibold text-white">Search Console 連携</h3>
              <p className="text-xs text-gray-400">Googleが保証するデータでAI参照を分析</p>
            </div>
          </div>
          <div className="mb-5 rounded-xl bg-[#1e2451]/60 p-4 text-sm text-gray-300 leading-relaxed">
            <p className="mb-2 font-medium text-blue-300">✦ 連携するとわかること</p>
            <ul className="space-y-1 text-gray-400">
              <li>• ゼロクリック現象の検出（AIが答えを生成しているサイン）</li>
              <li>• 表示回数 vs CTRの乖離分析</li>
              <li>• ブランドクエリの増加傾向（AIが紹介した証拠）</li>
              <li>• AIに刺さっているページTOP10</li>
            </ul>
          </div>
          <a href={`/api/auth/google?siteId=${siteId}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-400 hover:to-blue-500"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Googleアカウントで連携する
          </a>
          <p className="mt-2 text-center text-xs text-gray-500">Search Console の読み取り権限のみ取得します</p>
        </div>
      </div>
    );
  }

  if (status.connected && !status.scSiteUrl && status.scSiteUrlOptions?.length > 0) {
    return (
      <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-[#0f1229] to-[#1a1e47] p-6">
        <h3 className="mb-3 font-semibold text-white">Search Consoleのサイトを選択</h3>
        <div className="space-y-2">
          {status.scSiteUrlOptions.map(opt => (
            <button key={opt.url} onClick={() => handleSiteUrlChange(opt.url)}
              className="w-full rounded-xl border border-[#2a2f57] bg-[#1e2451]/60 px-4 py-3 text-left text-sm text-gray-200 transition-colors hover:border-blue-500/50">
              <span className="font-medium">{opt.url}</span>
              <span className="ml-2 text-xs text-gray-500">({opt.permissionLevel})</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#2a2f57] bg-gradient-to-br from-[#0f1229] to-[#1a1e47] p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-gray-400">Search Consoleデータを取得中...</span>
        </div>
      </div>
    );
  }

  // ─── エラー表示（ライトテーマ・トークン切れ対応）──────────────
  if (error) {
    const isTokenError = error.includes('Token') || error.includes('401') || error.includes('refresh');
    return (
      <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1px solid #e8e8e8' }}>
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0">{isTokenError ? '🔑' : '⚠️'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-1" style={{ color: '#111111' }}>
              {isTokenError ? 'Search Console の再認証が必要です' : 'データ取得に失敗しました'}
            </p>
            <p className="text-xs mb-4" style={{ color: '#888888' }}>
              {isTokenError
                ? 'アクセストークンの有効期限が切れました。Googleアカウントで再接続してください。'
                : error}
            </p>
            {isTokenError ? (
              <a
                href={`/api/auth/google?siteId=${siteId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: '#2d5be3' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                </svg>
                Googleアカウントで再接続
              </a>
            ) : (
              <button
                onClick={() => checkStatus()}
                className="text-xs font-medium hover:underline"
                style={{ color: '#2d5be3' }}
              >
                再試行
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { summary, dailyTrend, zeroClick, brandQuery, topPages, aiContext } = data || {};

  return (
    <div className="rounded-2xl border border-[#2a2f57] bg-gradient-to-br from-[#0f1229] to-[#1a1e47]">
      <div className="flex items-center justify-between border-b border-[#2a2f57] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e2451]">📊</div>
          <div>
            <h3 className="text-sm font-semibold text-white">Search Console分析</h3>
            <p className="text-xs text-gray-500">{status.scSiteUrl}</p>
          </div>
          <span className="ml-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 border border-green-500/20">● 接続中</span>
        </div>
        <div className="flex items-center gap-2">
          {data?.fetchedAt && (
            <span className="text-xs text-gray-600">{new Date(data.fetchedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}更新</span>
          )}
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border border-[#2a2f57] bg-[#1e2451] px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-blue-500/40 disabled:opacity-50">
            {syncing ? <span className="h-3 w-3 animate-spin rounded-full border border-blue-400 border-t-transparent" /> : '↻'}
            {syncing ? '同期中...' : '同期'}
          </button>
        </div>
      </div>

      {aiContext && (
        <div className={`mx-6 mt-4 rounded-xl border p-4 text-xs leading-relaxed ${
          aiContext.confidence === 'high' ? 'border-blue-500/30 bg-blue-500/5 text-blue-200' :
          aiContext.confidence === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-200' :
          'border-gray-600/30 bg-gray-500/5 text-gray-400'}`}>
          {aiContext.confidence === 'high' ? '🔵' : aiContext.confidence === 'medium' ? '🟡' : '⚪'} {aiContext.summary}
        </div>
      )}

      <div className="flex gap-1 border-b border-[#2a2f57] px-6 pt-4">
        {[
          { id: 'overview', label: '概要' },
          { id: 'zero_click', label: `ゼロクリック${zeroClick?.detectedPages?.length > 0 ? ` (${zeroClick.detectedPages.length})` : ''}` },
          { id: 'pages', label: 'ページ分析' },
          { id: 'brand', label: 'ブランドクエリ' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-3 pb-2 pt-1 text-xs font-medium transition-colors ${
              activeTab === tab.id ? 'border-b-2 border-blue-400 text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'overview' && summary && (
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: '表示回数', value: summary.impressions.toLocaleString(), change: summary.impressionChange, icon: '👁' },
                { label: 'クリック数', value: summary.clicks.toLocaleString(), change: summary.clickChange, icon: '🖱' },
                { label: 'CTR', value: `${summary.ctr}%`, change: summary.ctrChange, icon: '📈' },
                { label: 'ゼロクリックスコア', value: `${zeroClick?.score || 0}`, icon: '🤖', desc: zeroClick?.score > 50 ? 'AI参照が多い' : zeroClick?.score > 20 ? '兆候あり' : '低い' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-[#1e2451]/40 border border-[#2a2f57]/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">{item.label}</span>
                    <span>{item.icon}</span>
                  </div>
                  <div className="text-xl font-bold text-white">{item.value}</div>
                  {item.change != null && (
                    <div className={`text-xs mt-0.5 ${parseFloat(item.change) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {parseFloat(item.change) > 0 ? '↑' : '↓'} {Math.abs(item.change)}% 前期比
                    </div>
                  )}
                  {item.desc && <div className="text-xs mt-0.5 text-gray-500">{item.desc}</div>}
                </div>
              ))}
            </div>
            {dailyTrend && dailyTrend.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2">表示回数 推移（28日間）</p>
                <MiniBarChart data={dailyTrend} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'zero_click' && (
          <div>
            <div className={`mb-4 rounded-xl p-4 text-sm ${zeroClick?.score > 50 ? 'border border-blue-500/30 bg-blue-500/5' : 'border border-[#2a2f57] bg-[#1e2451]/30'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">ゼロクリック指数</span>
                <span className={`text-2xl font-bold ${zeroClick?.score > 50 ? 'text-blue-300' : 'text-gray-300'}`}>{zeroClick?.score || 0}</span>
              </div>
              <p className="text-xs text-gray-400">{zeroClick?.interpretation}</p>
            </div>
            {zeroClick?.detectedPages?.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">AI参照疑いページ（表示回数↑・CTR↓）</p>
                {zeroClick.detectedPages.slice(0, 8).map((page, i) => (
                  <div key={i} className="rounded-lg border border-[#2a2f57]/50 bg-[#1e2451]/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-300 truncate flex-1">{page.page.replace(/^https?:\/\/[^/]+/, '') || '/'}</p>
                      <span className="shrink-0 rounded bg-blue-500/10 px-1.5 py-0.5 text-xs text-blue-300">+{page.impressionGrowth}%</span>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-gray-500">
                      <span>表示: {page.impressions.toLocaleString()}</span>
                      <span>CTR: {page.ctr}% → {page.ctrPrev}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-6">ゼロクリックページは検出されませんでした</p>
            )}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-3">表示回数 TOP10</p>
            {(topPages || []).map((page, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-[#2a2f57]/40 bg-[#1e2451]/20 px-3 py-2">
                <span className="w-4 shrink-0 text-xs text-gray-600">{i + 1}</span>
                <p className="truncate text-xs text-gray-300 flex-1">{page.page.replace(/^https?:\/\/[^/]+/, '') || '/'}</p>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-medium text-white">{page.impressions.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">CTR {page.ctr}%</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'brand' && (
          <div>
            {brandQuery ? (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'ブランドクエリ数', value: brandQuery.brandQueryCount },
                    { label: 'ブランド表示回数', value: brandQuery.brandImpressions.toLocaleString() },
                    { label: 'ブランドシェア', value: `${brandQuery.brandShare}%` },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl bg-[#1e2451]/40 border border-[#2a2f57]/50 p-3 text-center">
                      <div className="text-lg font-bold text-white">{item.value}</div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                    </div>
                  ))}
                </div>
                {brandQuery.topBrandQueries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-[#2a2f57]/40 bg-[#1e2451]/20 px-3 py-2 mb-1.5">
                    <span className="text-xs text-gray-300">{q.query}</span>
                    <span className="text-xs text-gray-500">{q.impressions}回表示</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-6">ブランドクエリデータがありません</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#2a2f57]/50 px-6 py-3">
        <span className="text-xs text-gray-600">{status.email} で接続中</span>
        <button onClick={handleDisconnect} className="text-xs text-gray-600 transition-colors hover:text-red-400">連携解除</button>
      </div>
    </div>
  );
}

function MiniBarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.impressions));
  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {data.map((d, i) => (
        <div key={i}
          className="flex-1 rounded-sm bg-blue-500/40 hover:bg-blue-400/60 transition-colors cursor-default group relative"
          style={{ height: `${maxVal > 0 ? (d.impressions / maxVal) * 100 : 0}%`, minHeight: '2px' }}
          title={`${d.date}: ${d.impressions.toLocaleString()}回`}>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-[#0a0e27] px-1.5 py-0.5 text-xs text-gray-200 border border-[#2a2f57] z-10">
            {d.impressions.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}