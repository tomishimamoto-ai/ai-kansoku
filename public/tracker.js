(function() {
  'use strict';
  
  // サイトIDを取得
  const script = document.currentScript;
  const siteId = script.getAttribute('data-site-id');
  
  if (!siteId) {
    console.warn('[AI Observatory] data-site-id is required');
    return;
  }
  
  // User-Agent を取得
  const ua = navigator.userAgent;
  
  // AIクローラーか判定
  const AI_PATTERNS = [
    /ChatGPT-User/i,
    /GPTBot/i,
    /Claude-Web/i,
    /ClaudeBot/i,
    /PerplexityBot/i,
    /anthropic-ai/i,
    /Google-Extended/i,
    /CCBot/i
  ];
  
  const isAICrawler = AI_PATTERNS.some(pattern => pattern.test(ua));
  
  if (!isAICrawler) {
    return; // 通常のユーザーは記録しない
  }
  
  // 現在のパス
  const path = window.location.pathname;
  
  // データ送信
  const data = {
    site: siteId,
    ua: ua,
    path: path
  };
  
  // ビーコン送信（非同期、ページ遷移をブロックしない）
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    navigator.sendBeacon('/api/track', blob);
  } else {
    // フォールバック（古いブラウザ）
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(function(err) {
      console.error('[AI Observatory] Tracking failed:', err);
    });
  }
})();