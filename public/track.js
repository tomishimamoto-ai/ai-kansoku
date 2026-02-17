// ========================================
// AI観測ラボ - 統合トラッキングスクリプト
// Phase 1（画像ピクセル）+ Phase 2（JS検出）を1行で実装
// ========================================

(function() {
  'use strict';
  
  // サイトID取得
  const script = document.currentScript;
  const siteId = script?.getAttribute('data-site');
  
  if (!siteId) {
    console.warn('[AI観測ラボ] data-site属性が必要です');
    return;
  }
  
  const currentPath = window.location.pathname;
  const baseUrl = 'https://ai-kansoku.com/api/track';
  
  // Phase 1: 画像ピクセル（AIクローラーも動く）
  const img = new Image(1, 1);
  img.src = `${baseUrl}?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}&t=${Date.now()}`;
  img.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;';
  img.alt = '';
  
  // Phase 2: JS実行検出（人間ブラウザ判定用）
  if (typeof fetch !== 'undefined') {
    fetch(`${baseUrl}/js-active?siteId=${encodeURIComponent(siteId)}&path=${encodeURIComponent(currentPath)}&t=${Date.now()}`, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-cache'
    }).catch(() => {});
  }
  
  // DOM準備後に画像を追加
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(img));
  } else {
    document.body.appendChild(img);
  }
  
})();