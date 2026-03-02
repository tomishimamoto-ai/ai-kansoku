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

// ─── 健康診断ステータス定義（4段階） ──────────────────────
const HEALTH_STATUS = {
  CRITICAL: {
    code: 'CRITICAL',
    ja: '要緊急処置',
    desc: 'AIクローラーにほぼ発見されていない可能性があります',
    color: '#ff4444',
    glow: 'rgba(255,68,68,0.15)',
    border: 'rgba(255,68,68,0.25)',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    ring: 'from-red-500 via-red-400 to-orange-400',
    scoreRange: '0〜39点',
  },
  CAUTION: {
    code: 'CAUTION',
    ja: '要経過観察',
    desc: '基本設定は揃っています。いくつかの改善でAI露出が向上します',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.25)',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    ring: 'from-yellow-400 via-amber-400 to-orange-300',
    scoreRange: '40〜69点',
  },
  STABLE: {
    code: 'STABLE',
    ja: '安定観測中',
    desc: 'AIクローラーに適切に認識されています。さらなる最適化が可能です',
    color: '#4a9eff',
    glow: 'rgba(74,158,255,0.15)',
    border: 'rgba(74,158,255,0.25)',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ring: 'from-blue-400 via-cyan-400 to-teal-300',
    scoreRange: '70〜89点',
  },
  OPTIMAL: {
    code: 'OPTIMAL',
    ja: '最適化済',
    desc: 'AIクローラーへの可視性は最高レベルです',
    color: '#00ffc8',
    glow: 'rgba(0,255,200,0.15)',
    border: 'rgba(0,255,200,0.25)',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    ring: 'from-emerald-400 via-teal-300 to-cyan-300',
    scoreRange: '90〜100点',
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

// ─── 改善項目抽出（優先度付き） ────────────────────────────
function getImprovements(analyzedData) {
  if (!analyzedData) return { urgent: [], medium: [], completed: [] };
  const scores = analyzedData.scores || {};
  const details = analyzedData.details || {};
  const urgent = [], medium = [], completed = [];

  const addItem = (score, thresholdBad, thresholdGood, item) => {
    if (score >= thresholdGood) {
      completed.push({ icon: item.icon, title: item.title });
    } else if (score < thresholdBad) {
      urgent.push({ ...item, score });
    } else {
      medium.push({ ...item, score });
    }
  };

  addItem(scores.robotsTxt || 0, 50, 70, {
    id: 'robotsTxt', icon: '🤖', title: 'AIクローラーの許可設定',
    why: 'GPTBot・ClaudeBotがブロックされている可能性があります',
    how: 'robots.txtにUser-Agent: GPTBot / Allow: / を追加',
    gain: '+10〜20点', effort: '15分',
  });

  addItem(scores.llmsTxt || 0, 30, 70, {
    id: 'llmsTxt', icon: '📝', title: 'llms.txtの作成',
    why: 'AI専用のサイト情報ファイルが未設定です',
    how: '/llms.txtにサイト概要・主要ページを記述して設置',
    gain: '+10〜15点', effort: '30分',
  });

  addItem(scores.structuredData || 0, 30, 70, {
    id: 'structuredData', icon: '📊', title: '構造化データの実装',
    why: 'JSON-LDが未設定。AIがサイト情報を正確に読めていません',
    how: 'Schema.orgのWebSite・Organizationスキーマを<head>に追加',
    gain: '+15〜25点', effort: '1時間',
  });

  addItem(scores.sitemap || 0, 40, 70, {
    id: 'sitemap', icon: '🗺️', title: 'サイトマップの整備',
    why: 'サイト構造がAIに伝わっておらず、ページが見落とされています',
    how: 'sitemap.xmlを作成。lastmod・priorityも追加すると効果的',
    gain: '+10〜15点', effort: '20分',
  });

  addItem(scores.metaTags || 0, 40, 70, {
    id: 'metaTags', icon: '🏷️', title: 'OGP・メタタグの設定',
    why: !details.metaTags?.ogp?.hasOgp ? 'OGPが未設定。SNSシェア時に画像が表示されません' : 'Twitter Cardが未設定です',
    how: 'og:title, og:image, og:descriptionを<head>に追加',
    gain: '+10〜20点', effort: '20分',
  });

  addItem(scores.semanticHTML || 0, 40, 70, {
    id: 'semanticHTML', icon: '🏗️', title: 'セマンティックHTMLの改善',
    why: 'header・main・articleタグが不足。AIがコンテンツ構造を把握できません',
    how: 'divをheader / nav / main / article / sectionに置き換え',
    gain: '+8〜15点', effort: '1〜2時間',
  });

  addItem(scores.performance || 0, 40, 70, {
    id: 'performance', icon: '⚡', title: 'ページ速度の改善',
    why: `画像${details.performance?.images?.totalCount || 0}枚中、lazy load率が${details.performance?.images?.lazyLoadRatio || 0}%にとどまっています`,
    how: '全画像にloading="lazy"を追加。deferスクリプトも活用',
    gain: '+8〜15点', effort: '30分',
  });

  addItem(scores.mobileOptimization || 0, 40, 70, {
    id: 'mobileOptimization', icon: '📱', title: 'モバイル対応',
    why: 'viewportメタタグが未設定またはレスポンシブ設計が不足',
    how: '<meta name="viewport" content="width=device-width, initial-scale=1">を追加',
    gain: '+10〜20点', effort: '15分',
  });

  return { urgent, medium, completed };
}

// ─── スコアリングのアニメーション ────────────────────────
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

// ─── 今日のミッションカード ────────────────────────────────
function TodaysMission({ item, isChecked, onCheck, wasImproved }) {
  return (
    <div className={`relative rounded-2xl border p-5 md:p-6 transition-all duration-300
      ${isChecked
        ? 'border-white/10 bg-white/3 opacity-70'
        : 'border-amber-400/30 bg-gradient-to-br from-amber-500/8 to-orange-500/5'
      }`}>

      {wasImproved && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full">
          ✨ スコアに反映されました
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl
          ${isChecked ? 'bg-white/5' : 'bg-amber-500/15'}`}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {!isChecked && (
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">本日のミッション</span>
            )}
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {item.gain}
            </span>
            <span className="text-xs text-gray-500">⏱ {item.effort}</span>
          </div>

          <h4 className={`font-bold text-base mb-2 ${isChecked ? 'line-through text-gray-500' : 'text-white'}`}>
            {item.title}
          </h4>

          {!isChecked && (
            <>
              <p className="text-xs text-amber-300/80 mb-1">⚠ {item.why}</p>
              <p className="text-xs text-gray-400 font-mono bg-black/20 px-3 py-2 rounded-lg mt-2 leading-relaxed">
                → {item.how}
              </p>
            </>
          )}

          <button
            onClick={() => onCheck(item.id)}
            className={`mt-3 flex items-center gap-2 text-sm px-4 py-2 rounded-xl border font-medium transition-all
              ${isChecked
                ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/10'
                : 'bg-white/8 border-white/15 text-white hover:bg-white/15'
              }`}
          >
            {isChecked ? '✅ 実施済み（クリックで取消）' : '☐ 実施した'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 改善項目（折りたたみ） ────────────────────────────────
function CollapsibleItem({ item, isChecked, onCheck, wasImproved, priority }) {
  const borderStyle = priority === 'urgent'
    ? 'border-red-500/20 bg-red-500/5'
    : 'border-white/8 bg-white/3';

  return (
    <div className={`rounded-xl border p-4 transition-all ${isChecked ? 'opacity-50 border-white/5 bg-transparent' : borderStyle}`}>
      {wasImproved && (
        <span className="inline-block text-xs text-emerald-400 font-bold mb-1">✨ 反映済み</span>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-sm">{item.icon}</span>
          <span className={`text-sm font-medium ${isChecked ? 'line-through text-gray-600' : 'text-gray-200'}`}>
            {item.title}
          </span>
          <span className="shrink-0 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {item.gain}
          </span>
        </div>
        <button
          onClick={() => onCheck(item.id)}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-all
            ${isChecked
              ? 'border-emerald-500/20 text-emerald-500 hover:text-emerald-400'
              : 'border-white/10 text-gray-400 hover:border-white/25 hover:text-white'
            }`}
        >
          {isChecked ? '✅' : '☐'}
        </button>
      </div>
      {!isChecked && (
        <p className="text-xs text-gray-500 mt-2 ml-6">⏱ {item.effort} — {item.how}</p>
      )}
    </div>
  );
}

// ─── メインコンポーネント ──────────────────────────────────
function ResultContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url') || 'https://example.com';
  const siteId = searchParams.get('siteId') || generateSiteId(url);

  const [isClient, setIsClient] = useState(false);
  const [PDFReport, setPDFReport] = useState(null);
  const [isTrackingInstalled, setIsTrackingInstalled] = useState(false);
  const [prevScore, setPrevScore] = useState(null);
  const [prevScores, setPrevScores] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [showAllUrgent, setShowAllUrgent] = useState(false);
  const [showAllMedium, setShowAllMedium] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);
  const [crawlOpen, setCrawlOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(false);

  // データ取得
  const apiData = searchParams.get('data');
  let analyzedData = null;
  if (apiData) { try { analyzedData = JSON.parse(apiData); } catch (e) {} }

  const totalScore = analyzedData?.totalScore || 67;
  const currentScores = analyzedData?.scores || {};
  const health = getHealthStatus(totalScore);
  const nextTarget = getNextTarget(totalScore);
  const improvements = getImprovements(analyzedData);
  const displayScore = useCountUp(totalScore);

  // スコアカード用データ
  const scoreCards = [
    { icon: '📊', name: '構造化データ', key: 'structuredData' },
    { icon: '🤖', name: 'robots.txt', key: 'robotsTxt' },
    { icon: '🗺️', name: 'サイトマップ', key: 'sitemap' },
    { icon: '📝', name: 'llms.txt', key: 'llmsTxt' },
    { icon: '🏷️', name: 'メタタグ', key: 'metaTags' },
    { icon: '🏗️', name: 'セマンティックHTML', key: 'semanticHTML' },
    { icon: '📱', name: 'モバイル対応', key: 'mobileOptimization' },
    { icon: '⚡', name: 'パフォーマンス', key: 'performance' },
  ].map(item => {
    const score = currentScores[item.key] || 0;
    return {
      ...item,
      score,
      status: score >= 70 ? 'good' : score >= 40 ? 'warning' : 'bad',
    };
  });

  const pdfData = { url, totalScore, scores: scoreCards, improvements: { high: improvements.urgent, medium: improvements.medium, completed: improvements.completed } };

  // クローラー許可状況
  const crawlers = analyzedData?.details?.robotsTxt?.crawlers ? [
    { name: 'ChatGPT', agent: 'GPTBot', ok: analyzedData.details.robotsTxt.crawlers.chatgpt },
    { name: 'Claude', agent: 'ClaudeBot', ok: analyzedData.details.robotsTxt.crawlers.claude },
    { name: 'Gemini', agent: 'Google-Extended', ok: analyzedData.details.robotsTxt.crawlers.gemini },
    { name: 'Perplexity', agent: 'PerplexityBot', ok: analyzedData.details.robotsTxt.crawlers.perplexity },
    { name: 'Cohere', agent: 'cohere-ai', ok: analyzedData.details.robotsTxt.crawlers.cohere },
  ] : [];
  const allowedCount = crawlers.filter(c => c.ok).length;

  // ──LocalStorage処理──
  const saveHistory = (url, score, data) => {
    try {
      const h = JSON.parse(localStorage.getItem('aiObservatoryHistory') || '[]');
      const prev = h.find(i => i.url === url);
      if (prev) {
        setPrevScore(prev.score);
        if (prev.data?.scores) setPrevScores(prev.data.scores);
      }
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

  // 成果演出計算
  useEffect(() => {
    if (prevScore === null || !prevScores) return;
    const list = [];
    const diff = totalScore - prevScore;
    if (diff > 0) list.push({ emoji: diff >= 10 ? '🔥' : '✨', text: `スコアが ${diff}点 アップしました！` });
    Object.entries(checkedItems).forEach(([id, done]) => {
      if (!done) return;
      const d = (currentScores[id] || 0) - (prevScores[id] || 0);
      const names = { metaTags:'メタタグ', performance:'パフォーマンス', sitemap:'サイトマップ', structuredData:'構造化データ', semanticHTML:'セマンティックHTML', robotsTxt:'robots.txt', llmsTxt:'llms.txt', mobileOptimization:'モバイル対応' };
      if (d > 0) list.push({ emoji: '🟢', text: `${names[id] || id} の改善が反映 (+${d}点)` });
    });
    if (list.length > 0) { setAchievements(list); setShowAchievement(true); }
  }, [prevScore, prevScores]);

  useEffect(() => {
    setIsClient(true);
    import('../components/PDFReport').then((mod) => setPDFReport(() => mod.default));
    try {
      const installed = localStorage.getItem(`trackingInstalled_${siteId}`);
      if (installed) setIsTrackingInstalled(true);
      const saved = localStorage.getItem(`checkedItems_${siteId}`);
      if (saved) setCheckedItems(JSON.parse(saved));
    } catch (e) {}
  }, [siteId]);

  useEffect(() => {
    if (url && totalScore && analyzedData) saveHistory(url, totalScore, analyzedData);
  }, [url, totalScore]);

  // 今日のミッション（最優先1件）
  const todaysMission = improvements.urgent[0] || improvements.medium[0] || null;
  const urgentRest = improvements.urgent.slice(1);
  const mediumRest = todaysMission && improvements.urgent[0] ? improvements.medium : improvements.medium.slice(1);

  // チェック&改善の対応判定
  const wasImproved = (id) => {
    if (!prevScores) return false;
    return checkedItems[id] && (currentScores[id] || 0) > (prevScores[id] || 0);
  };

  return (
    <div className="min-h-screen text-white" style={{ background: '#080c1a' }}>

      {/* 背景エフェクト */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${health.color}33, transparent 70%)` }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4a9eff33, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pb-16">

        {/* ヘッダー */}
        <div className="flex items-center justify-between py-5 border-b border-white/8 mb-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
            <span className="font-bold text-sm tracking-wide">AI観測ラボ</span>
          </Link>
          <div className="text-xs text-gray-600 font-mono truncate max-w-[200px]">{url}</div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ① 健康診断判定 + スコア（最上部・主役）  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mb-8">

          {/* 成果演出 */}
          {showAchievement && achievements.length > 0 && (
            <div className="mb-5 space-y-2 animate-pulse-once">
              {achievements.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium"
                  style={{ background: 'rgba(0,255,136,0.07)', borderColor: 'rgba(0,255,136,0.2)', color: '#4ade80' }}>
                  <span className="text-base">{a.emoji}</span>
                  <span>{a.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* 健康判定バッジ */}
          <div className="flex items-center justify-between mb-5">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase ${health.badge}`}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: health.color }} />
              {health.code} — {health.ja}
            </span>
            {prevScore !== null && (
              <span className={`text-xs font-semibold ${totalScore > prevScore ? 'text-emerald-400' : totalScore < prevScore ? 'text-red-400' : 'text-gray-500'}`}>
                {totalScore > prevScore ? `▲ +${totalScore - prevScore}点` : totalScore < prevScore ? `▼ ${totalScore - prevScore}点` : '→ 前回と同点'}
              </span>
            )}
          </div>

          {/* スコアリング */}
          <div className="flex items-end gap-5 mb-4">
            <div className="relative shrink-0">
              {/* リングアニメーション */}
              <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8"
                  stroke={health.color}
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - displayScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 8px ${health.color})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black" style={{ color: health.color }}>{displayScore}</span>
                <span className="text-xs text-gray-500">/100</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">{health.desc}</p>

              {/* 次の目標 */}
              {nextTarget && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(totalScore / nextTarget.target) * 100}%`, background: `linear-gradient(90deg, ${health.color}, #4a9eff)` }} />
                  </div>
                  <span className="shrink-0 font-medium">
                    あと <span style={{ color: health.color }}>{nextTarget.diff}点</span> で {nextTarget.label}
                  </span>
                </div>
              )}

              {/* ダッシュボードショートカット（設置済みのみ） */}
              {isTrackingInstalled && (
                <Link href={`/dashboard?siteId=${siteId}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:opacity-80"
                  style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)', color: '#c4b5fd' }}>
                  📊 改善効果をダッシュボードで確認 →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ② 今日のミッション（クエスト・主役2）    */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {todaysMission ? (
          <div className="mb-6">
            <TodaysMission
              item={todaysMission}
              isChecked={!!checkedItems[todaysMission.id]}
              onCheck={handleCheck}
              wasImproved={wasImproved(todaysMission.id)}
            />
          </div>
        ) : (
          <div className="mb-6 p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 text-center">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-emerald-400 font-bold">すべての改善が完了しています</p>
            <p className="text-xs text-gray-500 mt-1">引き続き定期的な観測を続けましょう</p>
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ③ 残りの改善項目（折りたたみ）            */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {(urgentRest.length > 0 || mediumRest.length > 0 || improvements.completed.length > 0) && (
          <div className="mb-6 rounded-2xl border border-white/8 overflow-hidden">
            <button
              onClick={() => setShowAllUrgent(!showAllUrgent)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-300">その他の改善項目</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-400">
                  {urgentRest.length + mediumRest.length + improvements.completed.length}件
                </span>
              </div>
              <span className={`text-gray-500 text-xs transition-transform duration-200 ${showAllUrgent ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showAllUrgent && (
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
                {mediumRest.length > 0 && (
                  <>
                    <div className={`text-xs text-yellow-400 font-bold tracking-widest uppercase pb-1 ${urgentRest.length > 0 ? 'pt-3' : 'pt-1'}`}>推奨</div>
                    {mediumRest.map(item => (
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
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/12 text-xs text-gray-400">
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

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ④ ダッシュボード導線（ギャップコピー）   */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mb-6 rounded-2xl border p-5 md:p-6"
          style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(59,130,246,0.05))' }}>
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0">🔭</span>
            <div className="flex-1">
              <p className="text-sm text-gray-300 font-medium mb-1">
                スコアが上がっても、AIが増えたかは別問題です。
              </p>
              <p className="text-xs text-gray-500 mb-4">
                効果の証明はダッシュボードで。改善がAIクローラーの訪問に繋がっているか、一緒に確認しましょう。
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <Link href="/"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all text-center">
                  🔄 改善後に再診断
                </Link>
                <Link href={`/dashboard?siteId=${siteId}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 text-center"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                  📊 観測ダッシュボードへ →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ⑤ AIクロール許可率（折りたたみ）         */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {crawlers.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setCrawlOpen(!crawlOpen)}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">🤖</span>
                <span className="text-sm text-gray-300">AIクロール許可状況</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border
                  ${allowedCount === crawlers.length
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                    : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25'}`}>
                  {allowedCount}/{crawlers.length}社
                </span>
              </div>
              <span className={`text-gray-600 text-xs transition-transform duration-200 ${crawlOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {crawlOpen && (
              <div className="mt-1.5 px-5 py-4 rounded-2xl border border-white/8 bg-white/2 space-y-2">
                {crawlers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.ok ? '#4ade80' : '#f87171' }} />
                      <span className="text-sm">{c.name}</span>
                      <span className="text-xs text-gray-600 font-mono">({c.agent})</span>
                    </div>
                    <span className={`text-xs font-medium ${c.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {c.ok ? '✅ 許可' : '❌ ブロック'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ⑥ レーダーチャート・詳細スコア（下部）  */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mb-3">
          <button
            onClick={() => setRadarOpen(!radarOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm">📡</span>
              <span className="text-sm text-gray-300">8項目の詳細スコア</span>
              <span className="text-xs text-gray-600">（レーダーチャート）</span>
            </div>
            <span className={`text-gray-600 text-xs transition-transform duration-200 ${radarOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {radarOpen && (
            <div className="mt-1.5 px-4 py-5 rounded-2xl border border-white/8 bg-white/2">
              <RadarChart scores={scoreCards} />
              <div className="grid grid-cols-2 gap-2 mt-4">
                {scoreCards.map((item) => {
                  const statusColor = item.status === 'good' ? '#4ade80' : item.status === 'warning' ? '#fbbf24' : '#f87171';
                  return (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: `${statusColor}08`, border: `1px solid ${statusColor}20` }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span className="text-xs text-gray-300 truncate">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold shrink-0" style={{ color: statusColor }}>{item.score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ⑦ 技術詳細（最下部、上級者向け）         */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mb-6">
          <button
            onClick={() => setTechOpen(!techOpen)}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm">🔬</span>
              <span className="text-sm text-gray-300">技術的な詳細内訳</span>
              <span className="text-xs text-gray-600">（上級者向け）</span>
            </div>
            <span className={`text-gray-600 text-xs transition-transform duration-200 ${techOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {techOpen && (
            <div className="mt-1.5 space-y-3">
              {/* メタタグ */}
              {analyzedData?.details?.metaTags?.exists && (() => {
                const d = analyzedData.details.metaTags;
                return (
                  <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
                    <h5 className="font-bold text-sm mb-4 flex items-center gap-2">🏷️ メタタグ詳細</h5>
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-black/20 border border-white/6">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Title</span>
                          <span className={d.basic?.titleOptimal ? 'text-emerald-400' : 'text-amber-400'}>{d.basic?.titleLength}文字</span>
                        </div>
                        <p className="text-xs text-gray-300 break-words">{d.basic?.title}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-black/20 border border-white/6">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Description</span>
                          <span className={d.basic?.descriptionOptimal ? 'text-emerald-400' : 'text-amber-400'}>{d.basic?.descriptionLength}文字</span>
                        </div>
                        <p className="text-xs text-gray-300 break-words">{d.basic?.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-black/15 border border-white/6">
                          <div className="text-gray-500 mb-1">OGP</div>
                          <span className={(d.ogp?.completeness || 0) >= 4 ? 'text-emerald-400' : 'text-amber-400'}>
                            {d.ogp?.completeness}/5項目
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/15 border border-white/6">
                          <div className="text-gray-500 mb-1">Twitter Card</div>
                          <span className={(d.twitter?.completeness || 0) >= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                            {d.twitter?.completeness}/4項目
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* セマンティックHTML */}
              {analyzedData?.details?.semanticHTML?.exists && (() => {
                const d = analyzedData.details.semanticHTML;
                const tags = [['header', d.semanticTags?.hasHeader], ['nav', d.semanticTags?.hasNav], ['main', d.semanticTags?.hasMain], ['article', d.semanticTags?.hasArticle], ['section', d.semanticTags?.hasSection], ['aside', d.semanticTags?.hasAside], ['footer', d.semanticTags?.hasFooter]];
                return (
                  <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
                    <h5 className="font-bold text-sm mb-4">🏗️ セマンティックHTML詳細</h5>
                    <div className="grid grid-cols-7 gap-1.5 mb-4">
                      {tags.map(([name, used]) => (
                        <div key={name} className="flex flex-col items-center p-1.5 rounded-lg border text-center"
                          style={{ borderColor: used ? '#4ade8030' : '#f8717130', background: used ? '#4ade8008' : '#f8717108' }}>
                          <code className="text-xs">{name}</code>
                          <span className="text-xs mt-0.5" style={{ color: used ? '#4ade80' : '#f87171' }}>{used ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {[['H1', d.headingStructure?.h1Count], ['H2', d.headingStructure?.h2Count], ['H3', d.headingStructure?.h3Count], ['H4', d.headingStructure?.h4Count]].map(([h, c]) => (
                        <div key={h} className="p-2 rounded-lg bg-black/20 border border-white/6">
                          <div className="text-gray-500 mb-0.5">{h}</div>
                          <div className="font-bold">{c}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* パフォーマンス */}
              {analyzedData?.details?.performance?.exists && (() => {
                const d = analyzedData.details.performance;
                return (
                  <div className="p-5 rounded-2xl border border-white/8 bg-white/2">
                    <h5 className="font-bold text-sm mb-4">⚡ パフォーマンス詳細</h5>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[['総画像数', d.images?.totalCount], ['遅延読込', `${d.images?.lazyLoadRatio}%`], ['ALT設定', `${d.images?.altTextRatio}%`]].map(([label, val]) => (
                        <div key={label} className="p-3 rounded-xl bg-black/20 border border-white/6 text-center">
                          <div className="text-xs text-gray-500 mb-1">{label}</div>
                          <div className="font-bold text-sm">{val}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {d.scripts?.hasDeferScripts && <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">defer ✓</span>}
                      {d.scripts?.hasAsyncScripts && <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">async ✓</span>}
                      {!d.scripts?.hasDeferScripts && !d.scripts?.hasAsyncScripts && (
                        <span className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/15">非同期読込 未使用</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ⑧ トラッキングコード                     */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mb-8">
          {isTrackingInstalled ? (
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-2xl border border-white/6 hover:border-white/12 transition-all text-xs text-gray-600 list-none">
                <span>📋</span>
                <span>トラッキングコードを再確認</span>
                <span className="ml-auto group-open:rotate-180 transition-transform duration-200">▼</span>
              </summary>
              <div className="mt-2 px-4 py-4 rounded-2xl border border-white/6 bg-black/20">
                <pre className="overflow-x-auto text-xs mb-3">
                  <code className="text-emerald-400/70 break-all">{`<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>`}</code>
                </pre>
                <button onClick={handleCopyTracking} className="text-xs px-4 py-2 rounded-lg border border-white/8 text-gray-400 hover:text-gray-200 hover:border-white/20 transition-all">
                  📋 再コピー
                </button>
              </div>
            </details>
          ) : (
            <div className="rounded-2xl border p-5 md:p-6"
              style={{ borderColor: 'rgba(74,158,255,0.2)', background: 'linear-gradient(135deg, rgba(74,158,255,0.06), rgba(99,102,241,0.04))' }}>
              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl shrink-0">🛸</span>
                <div>
                  <h3 className="font-bold mb-1">AI訪問トラッキングを設置する</h3>
                  <p className="text-xs text-gray-400">設置すると、どのAIがあなたのサイトを訪問したか観測できます</p>
                </div>
              </div>
              <pre className="p-3 rounded-xl mb-3 overflow-x-auto text-xs" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <code className="text-emerald-400 break-all">{`<script src="https://ai-kansoku.com/track.js" data-site="${siteId}"></script>`}</code>
              </pre>
              <button onClick={handleCopyTracking}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)' }}>
                📋 コードをコピーして設置する
              </button>
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {/* ⑨ アクションボタン                        */}
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #4a9eff, #6366f1)' }}>
            🔄 再診断する
          </Link>
          <ShareDropdown
            url={url}
            totalScore={totalScore}
            PDFDownloadLink={PDFDownloadLink}
            PDFReport={PDFReport}
            pdfData={pdfData}
            isClient={isClient}
          />
        </div>

        {/* フッター */}
        <div className="mt-10 text-center text-xs text-gray-700">
          <Link href="/guide" className="hover:text-gray-500 transition-colors">改善ガイド</Link>
          <span className="mx-2">·</span>
          <Link href="/faq" className="hover:text-gray-500 transition-colors">FAQ</Link>
          <span className="mx-2">·</span>
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
          <span className="text-sm text-gray-500">観測データを読み込み中...</span>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}