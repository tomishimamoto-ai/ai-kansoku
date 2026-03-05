'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import RadarChart from './RadarChart';
import dynamic from 'next/dynamic';
import { generateSiteId } from '../utils/generateSiteId';
import ShareDropdown from '../components/ShareDropdown';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

// ─── 健康ステータス定義 ─────────────────────────────────────
const HEALTH_STATUS = {
  CRITICAL: {
    code: 'CRITICAL', ja: '要緊急処置',
    desc: 'AIクローラーにほぼ発見されていない可能性があります',
    nextDesc: 'CAUTIONに到達すると、主要AIクローラーに認識され始めます',
    color: '#ff5555', badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  CAUTION: {
    code: 'CAUTION', ja: '要経過観察',
    desc: '基本設定は揃っています。改善でAI露出が向上します',
    nextDesc: 'STABLEに到達すると、AIに安定して認識されます',
    color: '#f59e0b', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  STABLE: {
    code: 'STABLE', ja: '安定観測中',
    desc: 'AIクローラーに適切に認識されています',
    nextDesc: 'OPTIMALに到達すると、AIに最優先で認識・引用されます',
    color: '#4a9eff', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  OPTIMAL: {
    code: 'OPTIMAL', ja: '最適化済',
    desc: 'AIクローラーへの可視性は最高レベルです',
    nextDesc: null,
    color: '#00ffc8', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
};

function getHealthStatus(score) {
  if (score >= 90) return HEALTH_STATUS.OPTIMAL;
  if (score >= 70) return HEALTH_STATUS.STABLE;
  if (score >= 40) return HEALTH_STATUS.CAUTION;
  return HEALTH_STATUS.CRITICAL;
}

function getNextTarget(score) {
  if (score < 40) return { target: 40, label: 'CAUTION', diff: 40 - score };
  if (score < 70) return { target: 70, label: 'STABLE', diff: 70 - score };
  if (score < 90) return { target: 90, label: 'OPTIMAL', diff: 90 - score };
  return null;
}

// ─── 改善項目抽出 ──────────────────────────────────────────
function getImprovements(analyzedData) {
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
    why: !details.metaTags?.ogp?.hasOgp ? 'OGPが未設定。SNSシェア時に画像が表示されません' : 'Twitter Cardが未設定です',
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

// ─── コピペコードテンプレート定義 ──────────────────────────
const COPY_TEMPLATES = {
  robotsTxt: {
    label: 'robots.txt',
    lang: 'text',
    code: `User-agent: *
Allow: /

# AI クローラーを明示的に許可
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`,
    note: 'your-domain.com を実際のドメインに変更してください',
  },
  llmsTxt: {
    label: 'llms.txt',
    lang: 'markdown',
    code: `# サイト名

> ひとこと説明（例：フローリング専門のECサイトです）

## サービス概要
- 提供するサービスや商品の簡単な説明
- ターゲットユーザー
- 主な特徴

## 主要ページ
- [トップページ](https://your-domain.com/)
- [商品一覧](https://your-domain.com/products/)
- [会社概要](https://your-domain.com/about/)
- [お問い合わせ](https://your-domain.com/contact/)

## 更新情報
最終更新: 2025年XX月XX日`,
    note: '/llms.txt としてサイトルートに配置してください',
  },
  structuredData: {
    label: 'JSON-LD（構造化データ）',
    lang: 'html',
    code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://your-domain.com/#website",
      "url": "https://your-domain.com/",
      "name": "サイト名",
      "description": "サイトの説明",
      "inLanguage": "ja"
    },
    {
      "@type": "Organization",
      "@id": "https://your-domain.com/#organization",
      "name": "会社名 / サービス名",
      "url": "https://your-domain.com/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://your-domain.com/logo.png"
      }
    }
  ]
}
</script>`,
    note: '<head> タグ内に貼り付けてください',
  },
  metaTags: {
    label: 'OGP メタタグ',
    lang: 'html',
    code: `<!-- 基本メタ -->
<meta name="description" content="ページの説明（120文字以内）">

<!-- OGP -->
<meta property="og:title" content="ページタイトル">
<meta property="og:description" content="ページの説明（120文字以内）">
<meta property="og:type" content="website">
<meta property="og:url" content="https://your-domain.com/">
<meta property="og:image" content="https://your-domain.com/ogp.png">
<meta property="og:site_name" content="サイト名">
<meta property="og:locale" content="ja_JP">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ページタイトル">
<meta name="twitter:description" content="ページの説明">
<meta name="twitter:image" content="https://your-domain.com/ogp.png">`,
    note: '<head> タグ内に貼り付けてください',
  },
  mobileOptimization: {
    label: 'viewport メタタグ',
    lang: 'html',
    code: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    note: '<head> タグの先頭付近に追加してください',
  },
};

// コピペブロックコンポーネント
function CopyBlock({ templateId }) {
  const tpl = COPY_TEMPLATES[templateId];
  const [copied, setCopied] = useState(false);
  if (!tpl) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tpl.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/4 border-b border-white/8">
        <span className="text-xs text-gray-400 font-mono">{tpl.label}</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all
            ${copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/8 text-gray-300 border border-white/12 hover:bg-white/15'}`}>
          {copied ? '✅ コピーしました' : '📋 コピー'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed"
        style={{ background: 'rgba(0,0,0,0.5)', maxHeight: '200px' }}>
        <code className="text-emerald-300/90 whitespace-pre">{tpl.code}</code>
      </pre>
      {tpl.note && (
        <div className="px-4 py-2 bg-amber-500/6 border-t border-amber-500/15">
          <p className="text-xs text-amber-300/70">💡 {tpl.note}</p>
        </div>
      )}
    </div>
  );
}

// スコアアニメーション
function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

// ─── ミッション詳細 ────────────────────────────────────────
function MissionDetail({ item }) {
  const [showCode, setShowCode] = useState(false);
  const hasTemplate = !!COPY_TEMPLATES[item.id];

  return (
    <div className="mb-5 space-y-2.5">
      <p className="text-sm text-amber-200/70">⚠ {item.why}</p>
      <div className="flex items-start gap-2 p-3.5 rounded-xl bg-black/20 border border-white/6">
        <span className="text-gray-500 shrink-0 mt-0.5">→</span>
        <p className="text-sm text-gray-300">{item.howSimple}</p>
      </div>
      {hasTemplate && (
        <button
          onClick={() => setShowCode(!showCode)}
          className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg border font-medium transition-all
            ${showCode
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
              : 'bg-white/6 border-white/12 text-gray-300 hover:bg-white/10 hover:text-white'}`}>
          <span>{showCode ? '▲' : '▼'}</span>
          {showCode ? 'コードを隠す' : '📋 コピペ用コードを見る'}
        </button>
      )}
      {showCode && hasTemplate && <CopyBlock templateId={item.id} />}
    </div>
  );
}

// ─── 今日のミッションカード ────────────────────────────────
function TodaysMission({ item, isChecked, onCheck, wasImproved, currentScore, nextTarget }) {
  const predictedScore = Math.min(100, currentScore + item.gain);

  return (
    <div className={`relative rounded-2xl border transition-all duration-300
      ${isChecked
        ? 'border-emerald-500/25 bg-emerald-500/8'
        : 'border-amber-400/35 bg-gradient-to-br from-amber-500/10 to-orange-500/6'}`}
      style={{ boxShadow: isChecked ? '0 0 24px rgba(52,211,153,0.08)' : '0 0 24px rgba(245,158,11,0.08)' }}>

      {wasImproved && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full shadow-lg">
          ✨ スコアに反映されました
        </div>
      )}

      <div className="p-5 md:p-7">
        <div className="flex items-start gap-4 mb-4">
          <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl
            ${isChecked ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
            {isChecked ? '✅' : item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`text-xs font-bold tracking-widest uppercase
                ${isChecked ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isChecked ? '✔ ミッション完了' : '本日のミッション'}
              </span>
            </div>
            {!isChecked && (
              <div className="text-xs text-gray-500 mb-1.5">
                最大のボトルネック：<span className="text-amber-300 font-semibold">{item.title}</span>
                <span className="text-gray-600 ml-1">（現在 {item.score}点）</span>
              </div>
            )}
            <h4 className={`font-bold text-xl leading-snug ${isChecked ? 'text-emerald-300' : 'text-white'}`}>
              {item.title}
            </h4>
          </div>
        </div>

        {!isChecked && (
          <div className="mb-4 p-4 rounded-xl bg-black/25 border border-white/8">
            <div className="text-xs text-gray-500 mb-2.5">この改善を実施すると</div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-center">
                <div className="text-2xl font-black text-gray-400">{currentScore}</div>
                <div className="text-xs text-gray-600">現在</div>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-amber-400 font-semibold">{item.gainLabel}</div>
                <div className="w-full h-0.5 bg-gradient-to-r from-amber-400/50 to-emerald-400/50 rounded-full relative">
                  <div className="absolute right-0 -top-1 w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">{predictedScore}</div>
                <div className="text-xs text-emerald-600">予測スコア</div>
              </div>
            </div>
            {nextTarget && predictedScore >= nextTarget.target && (
              <div className="text-xs text-center text-emerald-400 bg-emerald-500/10 rounded-lg py-1.5 px-3">
                🎯 この改善で <strong>{nextTarget.label}</strong> に到達できます！
              </div>
            )}
            {nextTarget && predictedScore < nextTarget.target && (
              <div className="text-xs text-center text-gray-500 bg-white/4 rounded-lg py-1.5 px-3">
                {nextTarget.label}まであと <strong className="text-gray-300">{nextTarget.target - predictedScore}点</strong>
              </div>
            )}
          </div>
        )}

        {!isChecked && <MissionDetail item={item} />}

        {isChecked && (
          <div className="mb-5 flex flex-col items-center gap-3 py-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25"
              style={{ animation: 'badgePop 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <span className="text-lg">🧪</span>
              <span className="text-sm font-bold text-emerald-400">実験完了</span>
            </div>
            <p className="text-sm text-emerald-300/70 text-center">再診断でスコアへの反映を確認しましょう。</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={() => onCheck(item.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm transition-all
              ${isChecked
                ? 'bg-white/8 border border-white/12 text-gray-400 hover:bg-white/12'
                : 'text-black hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'}`}
            style={!isChecked ? {
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
            } : {}}>
            {isChecked ? '↩ 取り消す' : '✅ 完了にする'}
          </button>
          {isChecked && (
            <Link href="/"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)', boxShadow: '0 4px 20px rgba(74,158,255,0.3)' }}>
              🔄 今すぐ再診断して反映を確認
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 折りたたみ改善アイテム ────────────────────────────────
function CollapsibleItem({ item, isChecked, onCheck, wasImproved, priority }) {
  const [showCode, setShowCode] = useState(false);
  const hasTemplate = !!COPY_TEMPLATES[item.id];

  return (
    <div className={`rounded-xl border p-4 transition-all
      ${isChecked ? 'opacity-50 border-white/5 bg-transparent'
        : priority === 'urgent' ? 'border-red-500/20 bg-red-500/5'
        : 'border-white/8 bg-white/2'}`}>
      {wasImproved && <span className="block text-xs text-emerald-400 font-bold mb-1.5">✨ 反映済み</span>}
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-base">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isChecked ? 'line-through text-gray-600' : 'text-gray-100'}`}>
              {item.title}
            </span>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
              {item.gainLabel}
            </span>
          </div>
          {!isChecked && (
            <p className="text-xs text-gray-500 mt-0.5">⏱ {item.effort} — {item.howSimple}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasTemplate && !isChecked && (
            <button
              onClick={() => setShowCode(!showCode)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all">
              {showCode ? '▲' : '📋'}
            </button>
          )}
          <button
            onClick={() => onCheck(item.id)}
            className={`text-xs px-3 py-2 rounded-lg border font-medium transition-all
              ${isChecked
                ? 'border-emerald-500/20 text-emerald-500 hover:text-emerald-400'
                : 'border-white/12 text-gray-400 hover:border-white/25 hover:text-white bg-white/5'}`}>
            {isChecked ? '✅' : '完了'}
          </button>
        </div>
      </div>
      {showCode && !isChecked && hasTemplate && (
        <div className="mt-2"><CopyBlock templateId={item.id} /></div>
      )}
    </div>
  );
}

// ─── データなしエラーUI ────────────────────────────────────
function NoDataError({ url }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#080c1a' }}>
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔭</div>
        <h2 className="text-xl font-bold text-white mb-3">診断データが見つかりません</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          診断データの有効期限が切れたか、別のブラウザでアクセスした可能性があります。<br />
          もう一度診断してください。
        </p>
        <Link href={url ? `/?url=${encodeURIComponent(url)}` : '/'}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)' }}>
          🔄 再診断する
        </Link>
      </div>
    </div>
  );
}

// ─── メイン ────────────────────────────────────────────────
function ResultContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || 'https://example.com';
  const siteId = searchParams.get('siteId') || generateSiteId(url);

  const [isClient, setIsClient] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);   // ← 追加
  const [analyzedData, setAnalyzedData] = useState(null); // ← localStorageから読む
  const [PDFReport, setPDFReport] = useState(null);
  const [isTrackingInstalled, setIsTrackingInstalled] = useState(false);
  const [prevScore, setPrevScore] = useState(null);
  const [prevScores, setPrevScores] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [radarOpen, setRadarOpen] = useState(false);
  const [crawlOpen, setCrawlOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [othersOpen, setOthersOpen] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [dashPreview, setDashPreview] = useState(null);

  // ── ① localStorageから診断データを取得 ──────────────────
  useEffect(() => {
    setIsClient(true);
    import('../components/PDFReport').then((mod) => setPDFReport(() => mod.default));
    try {
      // 診断データをlocalStorageから取得
      const raw = localStorage.getItem(`analysis_${siteId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setAnalyzedData(parsed);
      }
      setDataLoaded(true);

      if (localStorage.getItem(`trackingInstalled_${siteId}`)) setIsTrackingInstalled(true);
      const saved = localStorage.getItem(`checkedItems_${siteId}`);
      if (saved) setCheckedItems(JSON.parse(saved));
      const visitCount = localStorage.getItem(`visitCount_${siteId}`);
      setDashPreview(visitCount !== null ? parseInt(visitCount) : null);
    } catch (e) {
      setDataLoaded(true);
    }
  }, [siteId]);

  // ── ② データロード中はスピナー表示 ──────────────────────
  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080c1a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          <span className="text-base text-gray-500">観測データを読み込み中...</span>
        </div>
      </div>
    );
  }

  // ── ③ データなしはエラーUI ───────────────────────────────
  if (!analyzedData) {
    return <NoDataError url={url} />;
  }

  const totalScore = analyzedData.totalScore ?? 0;
  const currentScores = analyzedData.scores || {};
  const health = getHealthStatus(totalScore);
  const nextTarget = getNextTarget(totalScore);
  const improvements = getImprovements(analyzedData);
  const displayScore = useCountUp(totalScore);

  const totalPotentialGain = [...improvements.urgent, ...improvements.medium]
    .reduce((sum, item) => sum + (item.gain || 0), 0);

  const scoreCards = [
    { icon: '📊', name: '構造化データ', key: 'structuredData' },
    { icon: '🤖', name: 'robots.txt', key: 'robotsTxt' },
    { icon: '🗺️', name: 'サイトマップ', key: 'sitemap' },
    { icon: '📝', name: 'llms.txt', key: 'llmsTxt' },
    { icon: '🏷️', name: 'メタタグ', key: 'metaTags' },
    { icon: '🏗️', name: 'HTML構造', key: 'semanticHTML' },
    { icon: '📱', name: 'モバイル', key: 'mobileOptimization' },
    { icon: '⚡', name: 'パフォーマンス', key: 'performance' },
  ].map(item => {
    const score = currentScores[item.key] || 0;
    return { ...item, score, status: score >= 70 ? 'good' : score >= 40 ? 'warning' : 'bad' };
  });

  const crawlers = analyzedData?.details?.robotsTxt?.crawlers ? [
    { name: 'ChatGPT', agent: 'GPTBot', ok: analyzedData.details.robotsTxt.crawlers.chatgpt },
    { name: 'Claude', agent: 'ClaudeBot', ok: analyzedData.details.robotsTxt.crawlers.claude },
    { name: 'Gemini', agent: 'Google-Extended', ok: analyzedData.details.robotsTxt.crawlers.gemini },
    { name: 'Perplexity', agent: 'PerplexityBot', ok: analyzedData.details.robotsTxt.crawlers.perplexity },
    { name: 'Cohere', agent: 'cohere-ai', ok: analyzedData.details.robotsTxt.crawlers.cohere },
  ] : [];
  const allowedCount = crawlers.filter(c => c.ok).length;

  const pdfData = { url, totalScore, scores: scoreCards, improvements: { high: improvements.urgent, medium: improvements.medium, completed: improvements.completed } };

  const saveHistory = (url, score, data) => {
    try {
      const h = JSON.parse(localStorage.getItem('aiObservatoryHistory') || '[]');
      const prev = h.find(i => i.url === url);
      if (prev) { setPrevScore(prev.score); if (prev.data?.scores) setPrevScores(prev.data.scores); }
      const next = [{ url, score, date: new Date().toISOString(), data }, ...h.filter(i => i.url !== url)];
      localStorage.setItem('aiObservatoryHistory', JSON.stringify(next.slice(0, 10)));
    } catch (e) {}
  };

  const handleCheck = (id) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    try { localStorage.setItem(`checkedItems_${siteId}`, JSON.stringify(next)); } catch (e) {}
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(
      `<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>\n<a href="https://ai-kansoku.com/api/track/honeypot?siteId=${siteId}" style="display:none;position:absolute;left:-9999px;" aria-hidden="true" tabindex="-1"></a>`
    );
    try { localStorage.setItem(`trackingInstalled_${siteId}`, 'true'); } catch (e) {}
    setIsTrackingInstalled(true);
    alert('コピーしました！サイトのheadタグに貼り付けてください。');
  };

  const wasImproved = (id) => {
    if (!prevScores) return false;
    return !!checkedItems[id] && (currentScores[id] || 0) > (prevScores[id] || 0);
  };

  useEffect(() => {
    if (url && totalScore && analyzedData) saveHistory(url, totalScore, analyzedData);
  }, [url, totalScore]);

  useEffect(() => {
    if (prevScore === null || !prevScores) return;
    const list = [];
    const diff = totalScore - prevScore;
    if (diff > 0) list.push({ emoji: diff >= 10 ? '🔥' : '✨', text: `スコアが ${diff}点 アップ！` });
    const names = { metaTags:'メタタグ', performance:'パフォーマンス', sitemap:'サイトマップ', structuredData:'構造化データ', semanticHTML:'セマンティックHTML', robotsTxt:'robots.txt', llmsTxt:'llms.txt', mobileOptimization:'モバイル対応' };
    Object.entries(checkedItems).forEach(([id, done]) => {
      if (!done) return;
      const d = (currentScores[id] || 0) - (prevScores[id] || 0);
      if (d > 0) list.push({ emoji: '🟢', text: `${names[id] || id} が改善 (+${d}点)` });
    });
    setAchievements(list);
  }, [prevScore, prevScores]);

  const todaysMission = improvements.urgent[0] || improvements.medium[0] || null;
  const urgentRest = improvements.urgent.slice(1);
  const mediumAll = todaysMission && improvements.urgent[0] ? improvements.medium : improvements.medium.slice(1);
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <div className="min-h-screen text-white" style={{ background: '#080c1a' }}>

      {/* 背景 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[55vw] h-[55vw] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${health.color}44, transparent 70%)` }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #4a9eff22, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-20">

        {/* ヘッダー */}
        <div className="flex items-center justify-between py-5 border-b border-white/8 mb-8 gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="font-bold text-base tracking-wide">AI観測ラボ</span>
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/12 bg-white/5 min-w-0">
              <span className="text-xs text-gray-500 shrink-0">診断中</span>
              <span className="text-xs text-gray-200 font-mono truncate max-w-[180px]">{displayUrl}</span>
            </div>
            <Link href={`/dashboard?siteId=${siteId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-all shrink-0">
              <span className="text-sm">📊</span>
              <span className="text-xs text-purple-300 hidden md:block">ダッシュボード</span>
            </Link>
          </div>
        </div>

        {/* SP用URL表示 */}
        <div className="sm:hidden mb-4 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/4">
          <span className="text-xs text-gray-500 shrink-0">診断中</span>
          <span className="text-xs text-gray-200 font-mono truncate">{displayUrl}</span>
        </div>

        {/* ブランドコピー */}
        <div className="mb-7 text-center">
          <p className="text-xs tracking-[0.25em] uppercase font-medium"
            style={{ color: health.color, opacity: 0.7 }}>
            改善を、観測で証明する。
          </p>
        </div>

        <style>{`
          @keyframes badgePop {
            0% { transform: scale(0.7); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* 成果演出 */}
        {achievements.length > 0 && (
          <div className="mb-6 space-y-2">
            {achievements.map((a, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border text-base font-medium"
                style={{ background: 'rgba(0,255,136,0.07)', borderColor: 'rgba(0,255,136,0.2)', color: '#4ade80' }}>
                <span className="text-xl">{a.emoji}</span>
                <span>{a.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* ① 健康判定 + スコア */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold tracking-wider uppercase ${health.badge}`}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: health.color }} />
              {health.code} — {health.ja}
            </span>
            {prevScore !== null && (
              <span className={`text-sm font-semibold ${totalScore > prevScore ? 'text-emerald-400' : totalScore < prevScore ? 'text-red-400' : 'text-gray-500'}`}>
                {totalScore > prevScore ? `▲ +${totalScore - prevScore}点` : totalScore < prevScore ? `▼ ${totalScore - prevScore}点` : '→ 前回と同点'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6 md:gap-8 mb-6">
            <div className="relative shrink-0">
              <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle cx="70" cy="70" r="58" fill="none" strokeWidth="10"
                  stroke={health.color}
                  strokeDasharray={`${2 * Math.PI * 58}`}
                  strokeDashoffset={`${2 * Math.PI * 58 * (1 - displayScore / 100)}`}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: `drop-shadow(0 0 10px ${health.color})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black" style={{ color: health.color }}>{displayScore}</span>
                <span className="text-sm text-gray-500">/100</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base text-gray-300 mb-4 leading-relaxed">{health.desc}</p>
              {nextTarget && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/6 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${(totalScore / nextTarget.target) * 100}%`, background: `linear-gradient(90deg, ${health.color}, #4a9eff)` }} />
                    </div>
                    <span className="text-sm shrink-0 font-semibold" style={{ color: health.color }}>
                      あと{nextTarget.diff}点
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{health.nextDesc}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ② 今日の進捗バー */}
        {(improvements.urgent.length + improvements.medium.length) > 0 && (() => {
          const allTasks = [...improvements.urgent, ...improvements.medium].slice(0, 3);
          const doneCount = allTasks.filter(t => !!checkedItems[t.id]).length;
          const total = allTasks.length;
          const pct = Math.round((doneCount / total) * 100);
          const allDone = doneCount === total;
          return (
            <div className="mb-6 rounded-2xl border border-white/8 bg-white/2 px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-gray-200">今日の進捗</span>
                  <span className={`text-sm font-black ${allDone ? 'text-emerald-400' : 'text-white'}`}>{doneCount}/{total}</span>
                  {allDone && <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">完了 🎉</span>}
                </div>
                {totalPotentialGain > 0 && !allDone && (
                  <span className="text-xs text-emerald-400/80">全部やると最大+{totalPotentialGain}点</span>
                )}
              </div>
              <div className="w-full h-2 bg-white/6 rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: allDone ? 'linear-gradient(90deg, #4ade80, #34d399)' : 'linear-gradient(90deg, #f59e0b, #4a9eff)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                {allTasks.map((item, i) => {
                  const isDone = !!checkedItems[item.id];
                  return (
                    <div key={item.id} className={`flex items-center gap-2.5 transition-opacity ${isDone ? 'opacity-40' : ''}`}>
                      <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs
                        ${isDone ? 'bg-emerald-500/30 text-emerald-400' : i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/8 text-gray-600'}`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs flex-1 ${isDone ? 'line-through text-gray-600' : 'text-gray-300'}`}>{item.title}</span>
                      <span className="text-xs text-gray-600 shrink-0">⏱{item.effort}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ③ 今日のミッション */}
        {todaysMission ? (
          <div className="mb-6">
            <TodaysMission
              item={todaysMission}
              isChecked={!!checkedItems[todaysMission.id]}
              onCheck={handleCheck}
              wasImproved={wasImproved(todaysMission.id)}
              currentScore={totalScore}
              nextTarget={nextTarget}
            />
          </div>
        ) : (
          <div className="mb-6 p-7 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-emerald-300 font-bold text-lg">すべての改善が完了しています</p>
            <p className="text-sm text-gray-500 mt-1.5">引き続き定期的な観測を続けましょう</p>
          </div>
        )}

        {/* ④ その他の改善項目 */}
        {(urgentRest.length + mediumAll.length + improvements.completed.length > 0) && (
          <div className="mb-6 rounded-2xl border border-white/8 overflow-hidden">
            <button
              onClick={() => setOthersOpen(!othersOpen)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-all text-left">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-gray-200">その他の改善項目</span>
                <span className="text-sm px-2.5 py-0.5 rounded-full bg-white/8 text-gray-300 font-medium">
                  {urgentRest.length + mediumAll.length + improvements.completed.length}件
                </span>
                {totalPotentialGain > 0 && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    最大+{totalPotentialGain}点の伸びしろ
                  </span>
                )}
              </div>
              <span className={`text-gray-500 text-sm transition-transform duration-200 ${othersOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {othersOpen && (
              <div className="px-5 pb-5 space-y-2.5">
                {urgentRest.length > 0 && (
                  <>
                    <div className="text-xs text-red-400 font-bold tracking-widest uppercase pt-1 pb-1">優先度 高</div>
                    {urgentRest.map(item => (
                      <CollapsibleItem key={item.id} item={item} priority="urgent"
                        isChecked={!!checkedItems[item.id]} onCheck={handleCheck} wasImproved={wasImproved(item.id)} />
                    ))}
                  </>
                )}
                {mediumAll.length > 0 && (
                  <>
                    <div className={`text-xs text-yellow-400 font-bold tracking-widest uppercase pb-1 ${urgentRest.length > 0 ? 'pt-3' : 'pt-1'}`}>推奨</div>
                    {mediumAll.map(item => (
                      <CollapsibleItem key={item.id} item={item} priority="medium"
                        isChecked={!!checkedItems[item.id]} onCheck={handleCheck} wasImproved={wasImproved(item.id)} />
                    ))}
                  </>
                )}
                {improvements.completed.length > 0 && (
                  <>
                    <div className="text-xs text-emerald-400 font-bold tracking-widest uppercase pt-3 pb-1">対応済み</div>
                    <div className="grid grid-cols-2 gap-2">
                      {improvements.completed.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/12 text-sm text-gray-400">
                          <span className="text-emerald-500/70">{item.icon}</span>
                          <span>{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ダッシュボード導線 */}
        <div className="mb-6 rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'linear-gradient(135deg, rgba(99,102,241,0.09), rgba(59,130,246,0.05))' }}>
          <div className="p-5 md:p-7">
            <div className="flex items-start gap-4">
              <span className="text-4xl shrink-0">🔭</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1.5">AIは、本当に来ていますか？</h3>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  スコアが上がっても、AIが増えたかは別問題です。<br />
                  効果の証明はダッシュボードで。
                </p>
              </div>
            </div>
            <div className="mb-4 p-3.5 rounded-xl border border-white/8 bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-base shrink-0">🛸</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">直近7日間のAI訪問</div>
                  {dashPreview === null ? (
                    <p className="text-sm text-gray-400 leading-snug">
                      まだ観測されていません。<br />
                      <span className="text-gray-500">改善後に増えるか、一緒に確認しましょう。</span>
                    </p>
                  ) : dashPreview === 0 ? (
                    <p className="text-sm text-gray-400 leading-snug">
                      まだAI訪問は観測されていません。<br />
                      <span className="text-gray-500">改善後に増えるか確認しましょう。</span>
                    </p>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-white">{dashPreview}件</span>
                      <span className="text-xs text-purple-300">のAI訪問を観測中</span>
                    </div>
                  )}
                </div>
                <Link href={`/dashboard?siteId=${siteId}`}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors shrink-0 whitespace-nowrap">
                  詳細 →
                </Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all">
                🔄 改善後に再診断
              </Link>
              <Link href={`/dashboard?siteId=${siteId}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                📊 観測ダッシュボードへ →
              </Link>
            </div>
          </div>
        </div>

        {/* AIクロール許可状況 */}
        {crawlers.length > 0 && (
          <div className="mb-3">
            <button onClick={() => setCrawlOpen(!crawlOpen)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                <span>🤖</span>
                <span className="text-sm text-gray-300 font-medium">AIクロール許可状況</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border
                  ${allowedCount === crawlers.length
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                    : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'}`}>
                  {allowedCount}/{crawlers.length}社許可
                </span>
              </div>
              <span className={`text-gray-500 text-xs transition-transform duration-200 ${crawlOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {crawlOpen && (
              <div className="mt-1.5 px-5 py-4 rounded-2xl border border-white/8 bg-white/2 space-y-2.5">
                {crawlers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: c.ok ? '#4ade80' : '#f87171' }} />
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-gray-600 font-mono">({c.agent})</span>
                    </div>
                    <span className={`text-sm font-medium ${c.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {c.ok ? '✅ 許可' : '❌ ブロック'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 詳細スコア */}
        <div className="mb-3">
          <button onClick={() => setRadarOpen(!radarOpen)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all">
            <div className="flex items-center gap-3">
              <span>📡</span>
              <span className="text-sm text-gray-300 font-medium">8項目の詳細スコア</span>
              <span className="text-xs text-gray-600">レーダーチャート</span>
            </div>
            <span className={`text-gray-500 text-xs transition-transform duration-200 ${radarOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {radarOpen && (
            <div className="mt-1.5 px-4 py-6 rounded-2xl border border-white/8 bg-white/2">
              <RadarChart scores={scoreCards} />
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                {scoreCards.map((item) => {
                  const c = item.status === 'good' ? '#4ade80' : item.status === 'warning' ? '#fbbf24' : '#f87171';
                  return (
                    <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl"
                      style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{item.icon}</span>
                        <span className="text-sm text-gray-300 truncate">{item.name}</span>
                      </div>
                      <span className="text-base font-bold shrink-0" style={{ color: c }}>{item.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 技術詳細 */}
        <div className="mb-8">
          <button onClick={() => setTechOpen(!techOpen)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all">
            <div className="flex items-center gap-3">
              <span>🔬</span>
              <span className="text-sm text-gray-300 font-medium">技術的な詳細内訳</span>
              <span className="text-xs text-gray-600">上級者向け</span>
            </div>
            <span className={`text-gray-500 text-xs transition-transform duration-200 ${techOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {techOpen && (
            <div className="mt-1.5 space-y-3">
              {analyzedData?.details?.metaTags?.exists && (() => {
                const d = analyzedData.details.metaTags;
                return (
                  <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
                    <h5 className="font-bold mb-4 flex items-center gap-2">🏷️ メタタグ詳細</h5>
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-black/20 border border-white/6">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-400">Title</span>
                          <span className={d.basic?.titleOptimal ? 'text-emerald-400' : 'text-amber-400'}>{d.basic?.titleLength}文字</span>
                        </div>
                        <p className="text-sm text-gray-300 break-words">{d.basic?.title}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-black/20 border border-white/6">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-400">Description</span>
                          <span className={d.basic?.descriptionOptimal ? 'text-emerald-400' : 'text-amber-400'}>{d.basic?.descriptionLength}文字</span>
                        </div>
                        <p className="text-sm text-gray-300 break-words">{d.basic?.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-xl bg-black/15 border border-white/6 text-center">
                          <div className="text-xs text-gray-500 mb-1">OGP</div>
                          <span className={(d.ogp?.completeness || 0) >= 4 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {d.ogp?.completeness}/5項目
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-black/15 border border-white/6 text-center">
                          <div className="text-xs text-gray-500 mb-1">Twitter Card</div>
                          <span className={(d.twitter?.completeness || 0) >= 3 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {d.twitter?.completeness}/4項目
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {analyzedData?.details?.semanticHTML?.exists && (() => {
                const d = analyzedData.details.semanticHTML;
                const tags = [['header', d.semanticTags?.hasHeader], ['nav', d.semanticTags?.hasNav], ['main', d.semanticTags?.hasMain], ['article', d.semanticTags?.hasArticle], ['section', d.semanticTags?.hasSection], ['aside', d.semanticTags?.hasAside], ['footer', d.semanticTags?.hasFooter]];
                return (
                  <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
                    <h5 className="font-bold mb-4">🏗️ セマンティックHTML詳細</h5>
                    <div className="grid grid-cols-7 gap-1.5 mb-4">
                      {tags.map(([name, used]) => (
                        <div key={name} className="flex flex-col items-center p-2 rounded-lg border text-center"
                          style={{ borderColor: used ? '#4ade8030' : '#f8717130', background: used ? '#4ade8008' : '#f8717108' }}>
                          <code className="text-xs">{name}</code>
                          <span className="text-sm mt-0.5" style={{ color: used ? '#4ade80' : '#f87171' }}>{used ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[['H1', d.headingStructure?.h1Count], ['H2', d.headingStructure?.h2Count], ['H3', d.headingStructure?.h3Count], ['H4', d.headingStructure?.h4Count]].map(([h, c]) => (
                        <div key={h} className="p-3 rounded-xl bg-black/20 border border-white/6">
                          <div className="text-xs text-gray-500 mb-0.5">{h}</div>
                          <div className="text-lg font-bold">{c}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {analyzedData?.details?.performance?.exists && (() => {
                const d = analyzedData.details.performance;
                return (
                  <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
                    <h5 className="font-bold mb-4">⚡ パフォーマンス詳細</h5>
                    <div className="grid grid-cols-3 gap-2.5 mb-3">
                      {[['総画像数', d.images?.totalCount], ['遅延読込', `${d.images?.lazyLoadRatio}%`], ['ALT設定', `${d.images?.altTextRatio}%`]].map(([label, val]) => (
                        <div key={label} className="p-3.5 rounded-xl bg-black/20 border border-white/6 text-center">
                          <div className="text-xs text-gray-500 mb-1.5">{label}</div>
                          <div className="font-bold text-base">{val}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {d.scripts?.hasDeferScripts && <span className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">defer ✓</span>}
                      {d.scripts?.hasAsyncScripts && <span className="text-sm px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">async ✓</span>}
                      {!d.scripts?.hasDeferScripts && !d.scripts?.hasAsyncScripts && (
                        <span className="text-sm px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/15">非同期読込 未使用</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* トラッキングコード */}
        <div className="mb-8">
          {isTrackingInstalled ? (
            <details className="group">
              <summary className="flex items-center gap-2.5 cursor-pointer px-5 py-3.5 rounded-2xl border border-white/6 hover:border-white/12 transition-all text-sm text-gray-500 list-none">
                <span>📋</span>
                <span>トラッキングコードを再確認</span>
                <span className="ml-auto group-open:rotate-180 transition-transform duration-200 text-xs">▼</span>
              </summary>
              <div className="mt-2 px-5 py-4 rounded-2xl border border-white/6 bg-black/20">
                <pre className="overflow-x-auto text-sm mb-3">
                  <code className="text-emerald-400/70 break-all">{`<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>`}</code>
                </pre>
                <button onClick={handleCopyTracking} className="text-sm px-4 py-2 rounded-lg border border-white/8 text-gray-400 hover:text-gray-200 hover:border-white/20 transition-all">
                  📋 再コピー
                </button>
              </div>
            </details>
          ) : (
            <div className="rounded-2xl border p-6 md:p-7"
              style={{ borderColor: 'rgba(74,158,255,0.2)', background: 'linear-gradient(135deg, rgba(74,158,255,0.07), rgba(99,102,241,0.04))' }}>
              <div className="flex items-start gap-4 mb-5">
                <span className="text-4xl shrink-0">🛸</span>
                <div>
                  <h3 className="font-bold text-lg mb-1">AI訪問トラッキングを設置する</h3>
                  <p className="text-sm text-gray-400">設置すると、どのAIがあなたのサイトを訪問したか観測できます</p>
                  <p className="text-xs text-gray-600 mt-1">※ サイトの表示速度・見た目には影響しません</p>
                </div>
              </div>
              <pre className="p-4 rounded-xl mb-4 overflow-x-auto text-sm"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <code className="text-emerald-400 break-all">{`<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>`}</code>
              </pre>
              <button onClick={handleCopyTracking}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)' }}>
                📋 コードをコピーして設置する
              </button>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/"
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)', boxShadow: '0 4px 24px rgba(74,158,255,0.25)' }}>
            🔄 再診断する
          </Link>
          <ShareDropdown
            url={url} totalScore={totalScore}
            PDFDownloadLink={PDFDownloadLink} PDFReport={PDFReport}
            pdfData={pdfData} isClient={isClient}
          />
        </div>

        {/* フッター */}
        <div className="mt-12 text-center text-sm text-gray-700">
          <Link href="/guide" className="hover:text-gray-500 transition-colors">改善ガイド</Link>
          <span className="mx-3">·</span>
          <Link href="/faq" className="hover:text-gray-500 transition-colors">FAQ</Link>
          <span className="mx-3">·</span>
          <Link href="/how-to-use" className="hover:text-gray-500 transition-colors">使い方</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080c1a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          <span className="text-base text-gray-500">観測データを読み込み中...</span>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}