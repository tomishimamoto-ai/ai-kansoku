(function() {
  'use strict';

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

  // ① AI_DOMAINS定義
  const AI_DOMAINS = [
    'chatgpt.com','chat.openai.com','claude.ai',
    'perplexity.ai','gemini.google.com','copilot.microsoft.com',
    'copilot.com','you.com','phind.com','poe.com'
  ];

  // ② referrer取得（sessionStorage保持）
  const referrer = (() => {
    const direct = (document.referrer || '').slice(0, 500);
    if (direct) {
      if (AI_DOMAINS.some(d => direct.includes(d))) {
        try { sessionStorage.setItem('ai_ref', direct); } catch(e) {}
      }
      return direct;
    }
    try { return sessionStorage.getItem('ai_ref') || ''; } catch(e) { return ''; }
  })();

  // ③ session_id（referrerの直後）
  let aiSid = '';
  try {
    aiSid = sessionStorage.getItem('ai_sid') || '';
    if (!aiSid) {
      aiSid = crypto.randomUUID();
      sessionStorage.setItem('ai_sid', aiSid);
    }
  } catch(e) {}

  // Phase 1: 画像ピクセル
  const img = new Image(1, 1);
  img.src = `${baseUrl}?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}&t=${Date.now()}`;
  img.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;';
  img.alt = '';

  // Phase 2: JS実行検出
  if (typeof fetch !== 'undefined') {
    const jsUrl = `${baseUrl}/js-active?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}&referrer=${encodeURIComponent(referrer)}&ai_ref=${encodeURIComponent(referrer)}&sid=${encodeURIComponent(aiSid)}&t=${Date.now()}`;
    fetch(jsUrl, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    }).catch(() => {
      const jsImg = new Image(1, 1);
      jsImg.src = jsUrl;
    });
  }

  // Phase 3: ハニーポット（JS依存のまま、HTML直書き版は別途）
  const honeypot = document.createElement('a');
  honeypot.href = `${baseUrl}/honeypot?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}`;
  honeypot.style.cssText = 'position:absolute;left:-9999px;top:0;';
  honeypot.setAttribute('tabindex', '-1');
  honeypot.setAttribute('aria-hidden', 'true');
  honeypot.textContent = '.';

  // Phase 4: capability fingerprint
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
      body: JSON.stringify({ siteId, path: currentPath, fp: fingerprint, t: Date.now() })
    }).catch(() => {});
  } catch(e) {}

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