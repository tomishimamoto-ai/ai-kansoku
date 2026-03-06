// src/app/result/constants/improvements.js

export function getImprovements(analyzedData) {
  if (!analyzedData) return { urgent: [], medium: [], completed: [] };
  const scores = analyzedData.scores || {};
  const details = analyzedData.details || {};
  const urgent = [], medium = [], completed = [];

  const addItem = (score, thresholdBad, thresholdGood, item) => {
    if (score >= thresholdGood) completed.push({ icon: item.icon, title: item.title });
    else if (score < thresholdBad) urgent.push({ ...item, score });
    else medium.push({ ...item, score });
  };

  addItem(scores.robotsTxt || 0, 50, 70, {
    id: 'robotsTxt', icon: '🤖', title: 'AIクローラーの許可設定',
    why: 'GPTBot・ClaudeBotがブロックされている可能性があります',
    how: 'robots.txtにUser-Agent: GPTBot / Allow: / を追加',
    howSimple: 'robots.txtに3行追加するだけ（コピペOK）',
    gain: 10, gainLabel: '+10〜20点', effort: '15分',
  });
  addItem(scores.llmsTxt || 0, 30, 70, {
    id: 'llmsTxt', icon: '📝', title: 'llms.txtの作成',
    why: 'AI専用のサイト情報ファイルが未設定です',
    how: '/llms.txtにサイト概要・主要ページを記述して設置',
    howSimple: 'サイト概要をMarkdown形式で書いて/llms.txtに配置',
    gain: 12, gainLabel: '+10〜15点', effort: '30分',
  });
  addItem(scores.structuredData || 0, 30, 70, {
    id: 'structuredData', icon: '📊', title: '構造化データの実装',
    why: 'JSON-LDが未設定。AIがサイト情報を正確に読めていません',
    how: 'Schema.orgのWebSite・Organizationスキーマを<head>に追加',
    howSimple: '<head>にJSON-LDスクリプトを追加（テンプレートあり）',
    gain: 20, gainLabel: '+15〜25点', effort: '1時間',
  });
  addItem(scores.sitemap || 0, 40, 70, {
    id: 'sitemap', icon: '🗺️', title: 'サイトマップの整備',
    why: 'サイト構造がAIに伝わっておらず、ページが見落とされています',
    how: 'sitemap.xmlを作成。lastmod・priorityも追加すると効果的',
    howSimple: 'sitemap.xmlを作成して/publicに配置（無料ツールで自動生成可）',
    gain: 12, gainLabel: '+10〜15点', effort: '20分',
  });
  addItem(scores.metaTags || 0, 40, 70, {
    id: 'metaTags', icon: '🏷️', title: 'OGP・メタタグの設定',
    why: !details.metaTags?.ogp?.hasOgp
      ? 'OGPが未設定。SNSシェア時に画像が表示されません'
      : 'Twitter Cardが未設定です',
    how: '<head>にOGP3点セット（og:title・og:image・og:description）を追加',
    howSimple: '<head>にOGP3点セットを追加（SNSの見え方が改善）',
    gain: 15, gainLabel: '+10〜20点', effort: '20分',
  });
  addItem(scores.semanticHTML || 0, 40, 70, {
    id: 'semanticHTML', icon: '🏗️', title: 'セマンティックHTMLの改善',
    why: 'header・main・articleタグが不足。AIがコンテンツ構造を把握できません',
    how: 'divをheader / nav / main / article / sectionに置き換え',
    howSimple: 'divタグを意味のあるタグ（main・articleなど）に置き換え',
    gain: 10, gainLabel: '+8〜15点', effort: '1〜2時間',
  });
  addItem(scores.performance || 0, 40, 70, {
    id: 'performance', icon: '⚡', title: 'ページ速度の改善',
    why: `画像のlazy load率が${details.performance?.images?.lazyLoadRatio || 0}%にとどまっています`,
    how: '全画像にloading="lazy"を追加。deferスクリプトも活用',
    howSimple: '全画像にloading="lazy"を追加（ページ読み込みが速くなる）',
    gain: 10, gainLabel: '+8〜15点', effort: '30分',
  });
  addItem(scores.mobileOptimization || 0, 40, 70, {
    id: 'mobileOptimization', icon: '📱', title: 'モバイル対応',
    why: 'viewportメタタグが未設定またはレスポンシブ設計が不足',
    how: '<meta name="viewport" content="width=device-width, initial-scale=1">を追加',
    howSimple: 'viewportメタタグを1行追加（スマホ対応の基本）',
    gain: 12, gainLabel: '+10〜20点', effort: '15分',
  });

  return { urgent, medium, completed };
}