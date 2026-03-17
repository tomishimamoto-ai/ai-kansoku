// ========================================
// AI観測ラボ - 統合トラッキングスクリプト
// Phase 1（画像ピクセル）+ Phase 2（JS検出）+ Phase 3（ハニーポット）+ Phase 4（フィンガープリント）
// v5.8: capability fingerprint追加
// ========================================

(function() {
  'use strict';

  // async/defer/bundle環境でcurrentScriptがnullになる対策
  const script =
    document.currentScript ||
    document.querySelector('script[data-site]');
  const siteId = script?.getAttribute('data-site');

  if (!siteId) {
    console.warn('[AI観測ラボ] data-site属性が必要です');
    return;
  }

  const currentPath = window.location.pathname;
  const baseUrl = 'https://ai-kansoku.com/api/track';

  // referrer長すぎ防止（500文字上限）
  const referrer = (document.referrer || '').slice(0, 500);

  // Phase 1: 画像ピクセル（AIクローラーも動く）
  const img = new Image(1, 1);
  img.src = `${baseUrl}?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}&t=${Date.now()}`;
  img.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;';
  img.alt = '';

  // Phase 2: JS実行検出（人間ブラウザ判定用）
  if (typeof fetch !== 'undefined') {
    fetch(`${baseUrl}/js-active?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}&referrer=${encodeURIComponent(referrer)}&t=${Date.now()}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    }).catch(() => {
      // CSP等でfetchが止まった場合のfallback
      const jsImg = new Image(1, 1);
      jsImg.src = `${baseUrl}/js-active?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}&referrer=${encodeURIComponent(referrer)}&t=${Date.now()}`;
    });
  }

  // Phase 3: ハニーポットリンク（HTMLを解析するbotが踏む）
  const honeypot = document.createElement('a');
  honeypot.href = `${baseUrl}/honeypot?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}`;
  honeypot.style.cssText = 'position:absolute;left:-9999px;top:0;';
  honeypot.setAttribute('tabindex', '-1');
  honeypot.setAttribute('aria-hidden', 'true');
  honeypot.textContent = '.';

  // Phase 4: JS capability fingerprint（headless/bot検出）
  try {
       const fingerprint = {
       webdriver:           navigator.webdriver || false,
       languages:           navigator.languages || [],
       platform:            navigator.platform  || '',
       plugins:             navigator.plugins ? navigator.plugins.length : 0,
       touch:               navigator.maxTouchPoints || 0,
       screen:              window.screen ? `${screen.width}x${screen.height}` : '',
       viewport:            { w: window.innerWidth, h: window.innerHeight },
       hardwareConcurrency: navigator.hardwareConcurrency || 0,
       deviceMemory:        navigator.deviceMemory || 0,
       };
    fetch(`${baseUrl}/capability`, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        path: currentPath,
        fp: fingerprint,
        t: Date.now(),
      })
    }).catch(() => {});
  } catch(e) {}

  // honeypotを先、imgを後に追加（クローラーはDOM下部リンクを拾いやすい）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(honeypot);
      document.body.appendChild(img);
    });
  } else {
    document.body.appendChild(honeypot);
    document.body.appendChild(img);
  }

})();