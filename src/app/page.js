'use client';
import { useState, useEffect, useRef } from 'react';
import { Syne, Noto_Sans_JP } from 'next/font/google';
import { generateSiteId } from './utils/generateSiteId';

const syne = Syne({ subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'] });

// ブログ記事（実際はAPIから取得するか直書き）
const BLOG_POSTS = [
  {
    title: 'AIクローラーとは？ChatGPT・Claude・Perplexityに見つけてもらう方法',
    slug: 'ai-crawler-guide',
    date: '2026.01.28',
    tag: '入門',
    tagColor: 'blue',
    emoji: '🤖',
  },
  {
    title: 'robots.txtの正しい書き方【AI時代版】GPTBotを許可する設定',
    slug: 'robots-txt-ai-guide',
    date: '2026.01.29',
    tag: '実装',
    tagColor: 'purple',
    emoji: '📄',
  },
  {
    title: 'llms.txtとは？最新のAI対応サイトマップを5ステップで実装',
    slug: 'llms-txt-guide',
    date: '2026.01.30',
    tag: '実装',
    tagColor: 'purple',
    emoji: '🗺️',
  },
];

const STEPS = [
  { num: '01', title: 'URLを入力', desc: '観測したいサイトのURLを入力。http://は不要です。' },
  { num: '02', title: '観測開始', desc: '8項目を自動解析。最大30秒ほどかかります。' },
  { num: '03', title: '結果を確認', desc: 'スコアとレーダーチャートで現状を把握。' },
  { num: '04', title: '改善して再観測', desc: '提案に沿って改善し、スコアアップを確認。' },
];

const FAQ_ITEMS = [
  { q: '完全無料ですか？', a: 'はい、登録不要・完全無料でご利用いただけます。' },
  { q: 'どんなAIに対応していますか？', a: 'ChatGPT（GPTBot）、Claude、Perplexity、Bing AI（Bingbot）など主要AIクローラーに対応しています。' },
  { q: '診断にどれくらいかかりますか？', a: '通常10〜30秒です。サーバーの応答速度によって変わります。' },
  { q: 'データは保存されますか？', a: '診断結果はブラウザのLocalStorageにのみ保存されます。サーバーには送信されません。' },
];

// 星パーティクル生成（SSR対策）
function StarField({ count = 80 }) {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    setStars(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.6 + 0.1,
        dur: Math.random() * 4 + 3,
        delay: Math.random() * 4,
      }))
    );
  }, [count]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      {stars.map((s) => (
        <circle
          key={s.id}
          cx={`${s.x}%`}
          cy={`${s.y}%`}
          r={s.size}
          fill="white"
          opacity={s.opacity}
          style={{
            animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
    </svg>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [history, setHistory] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [stats, setStats] = useState({ sites: 0, crawlers: 0, score: 0 });
  const inputRef = useRef(null);

  // カウントアップアニメーション
  useEffect(() => {
    const targets = { sites: 1280, crawlers: 200, score: 74 };
    const duration = 2000;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setStats({
        sites: Math.floor(targets.sites * ease),
        crawlers: Math.floor(targets.crawlers * ease),
        score: Math.floor(targets.score * ease),
      });
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  const validateUrl = (inputUrl) => {
    if (!inputUrl.trim()) return { valid: false, error: 'URLを入力してください' };
    let normalizedUrl = inputUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    try {
      const urlObj = new URL(normalizedUrl);
      if (!urlObj.hostname.includes('.')) return { valid: false, error: '有効なドメインを入力してください' };
      return { valid: true, url: normalizedUrl };
    } catch {
      return { valid: false, error: '有効なURLを入力してください（例: example.com）' };
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const h = localStorage.getItem('aiObservatoryHistory');
        if (h) setHistory(JSON.parse(h).slice(0, 5));
      } catch {}
    }
  }, []);

  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aiObservatoryHistory');
      setHistory([]);
    }
  };

  const diagnoseFromHistory = (historyUrl) => {
    setUrl(historyUrl);
    handleAnalyze(historyUrl);
  };

  const handleAnalyze = async (targetUrl) => {
    const urlToAnalyze = targetUrl || url;
    setError(null);
    const validation = validateUrl(urlToAnalyze);
    if (!validation.valid) { setError(validation.error); return; }
    const normalizedUrl = validation.url;
    const siteId = generateSiteId(normalizedUrl);
    setLoading(true);
    setLoadingStep('準備中...');
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('タイムアウトしました。後でもう一度お試しください。');
    }, 30000);
    try {
      setLoadingStep('サイトに接続中...');
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, siteId }),
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (response.ok) {
        setLoadingStep('観測完了！');
        const params = new URLSearchParams({
          url: normalizedUrl,
          score: data.totalScore,
          data: JSON.stringify(data),
          siteId,
        });
        window.location.href = `/result?${params.toString()}`;
      } else {
        setLoading(false);
        let msg = data.error || '観測中にエラーが発生しました';
        if (response.status === 404) msg = 'サイトが見つかりませんでした。URLを確認してください。';
        else if (response.status === 403) msg = 'アクセスが拒否されました。クロールを許可していない可能性があります。';
        setError(msg);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      setLoading(false);
      setError('観測に失敗しました。URLを確認して再度お試しください。');
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #03040e;
          --card: rgba(255,255,255,0.04);
          --border: rgba(255,255,255,0.08);
          --border-hover: rgba(255,255,255,0.18);
          --blue: #4a9eff;
          --purple: #9b6dff;
          --pink: #ff6eb4;
          --green: #3dffa0;
          --yellow: #ffd460;
          --text-muted: rgba(255,255,255,0.45);
          --text-sub: rgba(255,255,255,0.65);
        }

        body { background: var(--bg); color: #fff; font-family: var(--font-noto); }

        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(var(--r, 120px)) rotate(0deg); }
          to { transform: rotate(360deg) translateX(var(--r, 120px)) rotate(-360deg); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes counterPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        /* font-syne は next/font で制御 */
        .animate-fadeSlideUp { animation: fadeSlideUp 0.7s ease-out both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }

        .glass-card {
          background: var(--card);
          border: 1px solid var(--border);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
          transition: border-color 0.3s, background 0.3s, transform 0.3s;
        }
        .glass-card:hover {
          border-color: var(--border-hover);
          background: rgba(255,255,255,0.07);
          transform: translateY(-2px);
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--blue), var(--purple), var(--pink));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .gradient-text-blue {
          background: linear-gradient(90deg, var(--blue), #a0cfff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--blue), var(--purple));
          border: none;
          border-radius: 14px;
          color: #fff;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          box-shadow: 0 4px 24px rgba(74, 158, 255, 0.3);
        }
        .btn-primary:hover:not(:disabled) {
          transform: scale(1.04);
          box-shadow: 0 8px 32px rgba(74, 158, 255, 0.45);
        }
        .btn-primary:active:not(:disabled) { transform: scale(0.97); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .tag {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 3px 10px;
          border-radius: 100px;
        }
        .tag-blue { background: rgba(74,158,255,0.15); color: var(--blue); border: 1px solid rgba(74,158,255,0.3); }
        .tag-purple { background: rgba(155,109,255,0.15); color: var(--purple); border: 1px solid rgba(155,109,255,0.3); }
        .tag-green { background: rgba(61,255,160,0.12); color: var(--green); border: 1px solid rgba(61,255,160,0.3); }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
      `}</style>

      {/* ── ローディングオーバーレイ ── */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(3,4,14,0.97)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: '24px',
        }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '3px solid rgba(255,255,255,0.08)',
              borderTopColor: 'var(--blue)',
              borderRadius: '50%',
              animation: 'orbit 1.2s linear infinite',
              '--r': '0px',
            }} />
            <div style={{
              position: 'absolute', inset: 16,
              border: '3px solid rgba(255,255,255,0.08)',
              borderTopColor: 'var(--purple)',
              borderRadius: '50%',
              animation: 'spinReverse 2s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)',
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--blue)',
              boxShadow: '0 0 20px var(--blue)',
            }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}
               className="gradient-text">観測中...</p>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>{loadingStep}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 8 }}>最大30秒かかる場合があります</p>
          </div>
        </div>
      )}

      <div className={notoSansJP.className} style={{ minHeight: '100vh', background: 'var(--bg)', overflowX: 'hidden', position: 'relative' }}>

        {/* ── 星フィールド（固定背景） ── */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <StarField count={100} />
          {/* Nebula blobs */}
          <div style={{
            position: 'absolute', top: '-10%', left: '10%',
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(74,158,255,0.12) 0%, transparent 70%)',
            animation: 'pulseGlow 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', right: '5%',
            width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(155,109,255,0.1) 0%, transparent 70%)',
            animation: 'pulseGlow 10s 2s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', top: '40%', left: '40%',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(255,110,180,0.07) 0%, transparent 70%)',
            animation: 'pulseGlow 12s 4s ease-in-out infinite',
          }} />
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
        </div>

        {/* ── HEADER ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
          background: 'rgba(3,4,14,0.7)',
        }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto', padding: '0 24px',
            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Logo mark */}
              <div style={{
                width: 34, height: 34,
                background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem',
              }}>✦</div>
              <span style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif", fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                AI観測ラボ
              </span>
            </div>
            <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              {[
                ['使い方', '/how-to-use'],
                ['改善ガイド', '/guide'],
                ['ブログ', 'https://blog.ai-kansoku.com'],
                ['FAQ', '/faq'],
              ].map(([label, href]) => (
                <a key={label} href={href}
                   style={{ color: 'var(--text-sub)', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.2s' }}
                   onMouseEnter={e => e.target.style.color = '#fff'}
                   onMouseLeave={e => e.target.style.color = 'var(--text-sub)'}
                >{label}</a>
              ))}
            </nav>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{
          position: 'relative', zIndex: 1,
          maxWidth: 900, margin: '0 auto',
          padding: '100px 24px 60px',
          textAlign: 'center',
        }}>
          {/* Badge */}
          <div className="animate-fadeSlideUp" style={{ marginBottom: 20 }}>
            <span className="tag tag-blue" style={{ fontSize: '0.78rem' }}>
              ✦ AIクロール可視化ツール — 無料・登録不要
            </span>
          </div>

          {/* Headline */}
          <h1 className='animate-fadeSlideUp delay-100' style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",
            fontSize: 'clamp(1.8rem, 4.5vw, 3.6rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: 20,
            wordBreak: 'keep-all',
          }}>
            <span style={{ color: '#fff', display: 'block' }}>あなたのサイトは</span>
            <span className="gradient-text">AIに好かれていますか？</span>
          </h1>

          <p className="animate-fadeSlideUp delay-200" style={{
            fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
            color: 'var(--text-sub)',
            maxWidth: 540,
            margin: '0 auto 48px',
            lineHeight: 1.8,
          }}>
            ChatGPT・Claude・Perplexityなど主要AIが<br />
            あなたのサイトをどう観測しているかを30秒で解析。
          </p>

          {/* ── 観測フォーム ── */}
          <div className="animate-fadeSlideUp delay-300" style={{ maxWidth: 600, margin: '0 auto 16px' }}>
            <div style={{
              position: 'relative',
              padding: 1,
              borderRadius: 20,
              background: focused
                ? 'linear-gradient(135deg, var(--blue), var(--purple), var(--pink))'
                : 'linear-gradient(135deg, rgba(74,158,255,0.3), rgba(155,109,255,0.3))',
              transition: 'background 0.3s',
              boxShadow: focused ? '0 0 40px rgba(74,158,255,0.25)' : 'none',
            }}>
              <div style={{
                background: '#07091c',
                borderRadius: 19,
                padding: '6px 6px 6px 20px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>🔭</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError(null); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  placeholder="example.com"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#fff', fontSize: '1rem', padding: '10px 0',
                    fontFamily: notoSansJP.style.fontFamily,
                  }}
                />
                <button
                  onClick={() => handleAnalyze()}
                  disabled={loading || !url.trim()}
                  className="btn-primary"
                  style={{ padding: '12px 28px', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  {loading
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 16, height: 16,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'orbit 1s linear infinite',
                          '--r': '0px',
                        }} />観測中
                      </span>
                    : '観測する →'
                  }
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                marginTop: 12, padding: '12px 16px',
                background: 'rgba(255,80,80,0.1)',
                border: '1px solid rgba(255,80,80,0.3)',
                borderRadius: 12,
                display: 'flex', gap: 10, alignItems: 'flex-start',
                animation: 'fadeSlideUp 0.3s ease-out',
              }}>
                <span>⚠️</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#ff8080', fontSize: '0.85rem', marginBottom: 4 }}>{error}</p>
                  <button onClick={() => setError(null)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,128,128,0.7)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                    閉じる
                  </button>
                </div>
              </div>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 12 }}>
              🔒 登録不要 · 完全無料 · データはブラウザにのみ保存
            </p>
          </div>
        </section>

        {/* ── 実績カウンター ── */}
        <section style={{
          position: 'relative', zIndex: 1,
          maxWidth: 800, margin: '0 auto 80px',
          padding: '0 24px',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          }}>
            {[
              { val: stats.sites, suffix: '+', label: '累計観測サイト数', color: 'var(--blue)' },
              { val: stats.crawlers, suffix: '種類', label: '対応AIクローラー', color: 'var(--purple)' },
              { val: stats.score, suffix: '点', label: '平均観測スコア', color: 'var(--green)' },
            ].map(({ val, suffix, label, color }) => (
              <div key={label} className="glass-card" style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                  fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                  fontWeight: 800,
                  color,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  marginBottom: 6,
                  fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {val.toLocaleString()}<span style={{ fontSize: '0.5em', fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>{suffix}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3ステップ（使い方） ── */}
        <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="tag tag-purple" style={{ marginBottom: 12, display: 'inline-block' }}>HOW IT WORKS</span>
            <h2 style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",  fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em' }}>
              4ステップで観測完了
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {STEPS.map((step, i) => (
              <div key={step.num} className="glass-card" style={{ padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
                {/* BG number */}
                <div style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                  position: 'absolute', top: -10, right: 12,
                  fontSize: '5rem', fontWeight: 800,
                  color: 'rgba(255,255,255,0.04)', lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {step.num}
                </div>
                <div style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
                  fontSize: '0.72rem', fontWeight: 700,
                  color: 'var(--blue)', letterSpacing: '0.1em',
                  marginBottom: 8,
                }}>
                  STEP {step.num}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 観測項目8 ── */}
        <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="tag tag-green" style={{ marginBottom: 12, display: 'inline-block' }}>WHAT WE ANALYZE</span>
            <h2 style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",  fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 700, letterSpacing: '-0.03em' }}>
              8項目の観測レポート
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.9rem' }}>
              AIがサイトを評価する重要指標を網羅的に解析します
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {[
              { icon: '📊', label: '構造化データ', desc: 'JSON-LD / Schema.orgの実装状況', color: 'var(--blue)' },
              { icon: '🤖', label: 'robots.txt', desc: 'AIクローラーへの許可・拒否設定', color: 'var(--purple)' },
              { icon: '🗺️', label: 'sitemap.xml', desc: 'サイトマップの存在と形式', color: 'var(--pink)' },
              { icon: '📝', label: 'llms.txt', desc: 'AI専用サイトマップの有無', color: 'var(--green)' },
              { icon: '🏷️', label: 'メタタグ', desc: 'title / description / OGP設定', color: 'var(--yellow)' },
              { icon: '🧬', label: 'セマンティックHTML', desc: 'header / main / article等の使用', color: 'var(--blue)' },
              { icon: '📱', label: 'モバイル対応', desc: 'viewport設定・レスポンシブ', color: 'var(--purple)' },
              { icon: '⚡', label: 'パフォーマンス', desc: 'ページ速度・最適化状況', color: 'var(--green)' },
            ].map(({ icon, label, desc, color }) => (
              <div key={label} className="glass-card" style={{ padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${color}1a`,
                  border: `1px solid ${color}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>
                  {icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>{label}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 診断履歴 ── */}
        {history.length > 0 && (
          <section style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto 100px', padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",  fontSize: '1.4rem', fontWeight: 700 }}>
                🛸 観測履歴
              </h2>
              <button onClick={clearHistory}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}>
                すべて削除
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((item, i) => {
                const date = new Date(item.date);
                const fmt = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
                const prev = history[i + 1];
                const diff = prev && prev.url === item.url ? item.score - prev.score : null;
                const scoreColor = item.score >= 80 ? 'var(--green)' : item.score >= 60 ? 'var(--yellow)' : '#ff6b6b';
                return (
                  <div key={i} className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.url.replace(/https?:\/\//, '')}
                        </span>
                        <span style={{ color: scoreColor, fontWeight: 800, fontSize: '1.2rem', fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>
                          {item.score}点
                        </span>
                        {diff !== null && diff !== 0 && (
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 700,
                            padding: '2px 8px', borderRadius: 100,
                            background: diff > 0 ? 'rgba(61,255,160,0.12)' : 'rgba(255,80,80,0.12)',
                            color: diff > 0 ? 'var(--green)' : '#ff8080',
                          }}>
                            {diff > 0 ? '↑' : '↓'} {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{fmt}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => diagnoseFromHistory(item.url)}
                        style={{
                          padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                          background: 'rgba(74,158,255,0.12)',
                          border: '1px solid rgba(74,158,255,0.25)',
                          color: 'var(--blue)', fontSize: '0.8rem', fontWeight: 600,
                          transition: 'background 0.2s',
                        }}>
                        再観測
                      </button>
                      <a href={`/result?url=${encodeURIComponent(item.url)}&data=${encodeURIComponent(JSON.stringify(item.data))}`}
                        style={{
                          padding: '8px 14px', borderRadius: 10,
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 600,
                          textDecoration: 'none', display: 'inline-block',
                          transition: 'background 0.2s',
                        }}>
                        詳細
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── ブログ最新記事 ── */}
        <section style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="tag tag-blue" style={{ marginBottom: 8, display: 'inline-block' }}>LATEST POSTS</span>
              <h2 style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",  fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.03em' }}>
                最新ブログ記事
              </h2>
            </div>
            <a href="https://blog.ai-kansoku.com" target="_blank"
              style={{ color: 'var(--blue)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              すべて見る →
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {BLOG_POSTS.map((post) => (
              <a
                key={post.slug}
                href={`https://blog.ai-kansoku.com/${post.slug}`}
                target="_blank"
                className="glass-card"
                style={{ padding: '24px', display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: 16 }}>{post.emoji}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className={`tag tag-${post.tagColor}`}>{post.tag}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{post.date}</span>
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.6, color: '#fff' }}>
                  {post.title}
                </h3>
                <div style={{ marginTop: 16, color: 'var(--blue)', fontSize: '0.82rem', fontWeight: 600 }}>
                  読む →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto 100px', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag tag-purple" style={{ marginBottom: 12, display: 'inline-block' }}>FAQ</span>
            <h2 style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",  fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.03em' }}>
              よくある質問
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                className="glass-card"
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div style={{
                  padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Q. {item.q}</p>
                  <span style={{
                    color: 'var(--blue)', fontSize: '1.2rem', flexShrink: 0,
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 0.25s',
                    display: 'inline-block',
                  }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{
                    padding: '0 20px 18px',
                    color: 'var(--text-sub)', fontSize: '0.88rem', lineHeight: 1.7,
                    borderTop: '1px solid var(--border)',
                    paddingTop: 14,
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a href="/faq" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
              すべてのFAQを見る →
            </a>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          position: 'relative', zIndex: 1,
          maxWidth: 700, margin: '0 auto 120px',
          padding: '0 24px',
          textAlign: 'center',
        }}>
          <div style={{
            padding: '56px 40px',
            borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(74,158,255,0.1), rgba(155,109,255,0.1))',
            border: '1px solid rgba(74,158,255,0.2)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 300, height: 300,
              background: 'radial-gradient(circle, rgba(74,158,255,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✦</div>
              <h2 style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, system-ui, sans-serif",  fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: 12, letterSpacing: '-0.03em' }}>
                今すぐ観測をはじめよう
              </h2>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.7 }}>
                登録不要・完全無料。あなたのサイトが<br />AIにどう見えているかを今すぐ確認しましょう。
              </p>
              <button
                onClick={() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                className="btn-primary"
                style={{ padding: '14px 36px', fontSize: '1rem' }}
              >
                無料で観測する →
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          position: 'relative', zIndex: 1,
          borderTop: '1px solid var(--border)',
          padding: '32px 24px',
        }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28,
                background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem',
              }}>✦</div>
              <span style={{ fontFamily: "'Inter', -apple-system, system-ui, sans-serif", fontSize: '0.9rem', fontWeight: 700 }}>AI観測ラボ</span>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              {[['改善ガイド', '/guide'], ['FAQ', '/faq'], ['使い方', '/how-to-use'], ['ブログ', 'https://blog.ai-kansoku.com']].map(([l, h]) => (
                <a key={l} href={h} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>{l}</a>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              © 2026 AI観測ラボ
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}