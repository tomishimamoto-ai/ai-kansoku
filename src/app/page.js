'use client';
import { useState, useEffect, useRef } from 'react';
import { Noto_Sans_JP } from 'next/font/google';
import { generateSiteId } from './utils/generateSiteId';
import { useRouter } from 'next/navigation';

const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], weight: ['300', '400', '500', '700'] });
const plusJakarta = { style: { fontFamily: "'Plus Jakarta Sans', sans-serif" } };
const dmMono = { style: { fontFamily: "'DM Mono', monospace" } };

const BLOG_POSTS = [
  {
    title: 'AIクローラーとは？ChatGPT・Claude・Perplexityに見つけてもらう方法',
    slug: 'ai-crawler',
    date: '2026.01.28',
    tag: '入門',
    tagColor: '#2d5be3',
    tagBg: '#e8edfb',
  },
  {
    title: 'robots.txtの正しい書き方【AI時代版】GPTBotを許可する設定',
    slug: 'robots-txt-ai-crawler-guide',
    date: '2026.01.29',
    tag: '実装',
    tagColor: '#6b8ef0',
    tagBg: '#eef1fd',
  },
  {
    title: 'llms.txtとは？最新のAI対応サイトマップを5ステップで実装',
    slug: 'llms-txt-guide',
    date: '2026.01.30',
    tag: '実装',
    tagColor: '#6b8ef0',
    tagBg: '#eef1fd',
  },
];

const FAQ_ITEMS = [
  { q: '完全無料ですか？', a: 'はい、登録不要・完全無料でご利用いただけます。' },
  { q: 'どんなAIに対応していますか？', a: 'ChatGPT（GPTBot）、Claude、Perplexity、Bing AI（Bingbot）など主要AIクローラーに対応しています。' },
  { q: '診断にどれくらいかかりますか？', a: '通常10〜30秒です。サーバーの応答速度によって変わります。' },
  { q: 'データは保存されますか？', a: '診断結果はブラウザのLocalStorageにのみ保存されます。サーバーには送信されません。' },
];

// ── Canvas 軌道アニメーション ──────────────────────────────────
function ObsCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    function draw(t) {
      if (document.hidden) { raf = requestAnimationFrame(draw); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width * 0.72;
      const cy = canvas.height * 0.45;
      const c = 'rgba(45,91,227,';

      [200, 340, 500, 680].forEach((r, i) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `${c}${0.04 + i * 0.007})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      });

      for (let a = 0; a < 360; a += 45) {
        const rad = (a * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(rad) * 720, cy + Math.sin(rad) * 720);
        ctx.strokeStyle = `${c}0.018)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      [
        { r: 200, s: 0.00014, sz: 2.5, p: 1.0 },
        { r: 340, s: 0.00008, sz: 2, p: 3.3 },
        { r: 500, s: 0.00005, sz: 1.8, p: 5.6 },
      ].forEach((b) => {
        const angle = t * b.s + b.p;
        const x = cx + Math.cos(angle) * b.r;
        const y = cy + Math.sin(angle) * b.r;
        ctx.beginPath();
        ctx.arc(cx, cy, b.r, angle - 0.22, angle);
        ctx.strokeStyle = `${c}0.28)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, b.sz, 0, Math.PI * 2);
        ctx.fillStyle = `${c}0.8)`;
        ctx.fill();
        const g = ctx.createRadialGradient(x, y, 0, x, y, b.sz * 5);
        g.addColorStop(0, `${c}0.14)`);
        g.addColorStop(1, `${c}0)`);
        ctx.beginPath();
        ctx.arc(x, y, b.sz * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}

// ── レーダーチャート（プレビュー用） ───────────────────────────
function RadarPreview() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const rc = canvasRef.current;
    if (!rc) return;
    const rctx = rc.getContext('2d');
    const labels = ['robots.txt', 'sitemap', 'llms.txt', '構造化', 'メタタグ', 'HTML', 'モバイル', '速度'];
    const scores = [0.9, 0.85, 0.1, 0.4, 0.75, 0.8, 0.95, 0.65];
    const N = labels.length;
    const cx = rc.width / 2;
    const cy = rc.height / 2 + 8;
    const maxR = 72;
    const px = (i, r) => cx + r * Math.cos((i / N) * 2 * Math.PI - Math.PI / 2);
    const py = (i, r) => cy + r * Math.sin((i / N) * 2 * Math.PI - Math.PI / 2);

    [0.25, 0.5, 0.75, 1].forEach((f) => {
      rctx.beginPath();
      for (let i = 0; i < N; i++) {
        i === 0 ? rctx.moveTo(px(i, maxR * f), py(i, maxR * f)) : rctx.lineTo(px(i, maxR * f), py(i, maxR * f));
      }
      rctx.closePath();
      rctx.strokeStyle = 'rgba(0,0,0,0.07)';
      rctx.lineWidth = 0.75;
      rctx.stroke();
    });
    for (let i = 0; i < N; i++) {
      rctx.beginPath();
      rctx.moveTo(cx, cy);
      rctx.lineTo(px(i, maxR), py(i, maxR));
      rctx.strokeStyle = 'rgba(0,0,0,0.06)';
      rctx.lineWidth = 0.75;
      rctx.stroke();
    }
    rctx.beginPath();
    scores.forEach((s, i) => {
      i === 0 ? rctx.moveTo(px(i, maxR * s), py(i, maxR * s)) : rctx.lineTo(px(i, maxR * s), py(i, maxR * s));
    });
    rctx.closePath();
    const grad = rctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(45,91,227,0.25)');
    grad.addColorStop(1, 'rgba(45,91,227,0.08)');
    rctx.fillStyle = grad;
    rctx.fill();
    rctx.strokeStyle = 'rgba(45,91,227,0.7)';
    rctx.lineWidth = 1.5;
    rctx.stroke();
    rctx.font = '9px DM Mono, monospace';
    rctx.fillStyle = '#999';
    rctx.textAlign = 'center';
    labels.forEach((l, i) => {
      rctx.fillText(l, px(i, maxR + 16), py(i, maxR + 16) + 3);
    });
  }, []);

  return <canvas ref={canvasRef} width={200} height={180} />;
}

// ── localStorage util ──────────────────────────────────────────
function saveAnalysisToStorage(siteId, data) {
  try {
    localStorage.setItem(`analysis_${siteId}`, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

// ═══════════════════════════════════════════════════════════════
export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [history, setHistory] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);

  const J = plusJakarta.style.fontFamily;
  const M = dmMono.style.fontFamily;
  const No = notoSansJP.style.fontFamily;

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

  // ── validateUrl ──────────────────────────────────────────────
const validateUrl = (inputUrl) => {
  if (!inputUrl.trim()) return { valid: false, error: 'URLを入力してください' };

  let normalizedUrl = inputUrl.trim();

  normalizedUrl = normalizedUrl.replace(/^https?:\/\//, '');
  normalizedUrl = 'https://' + normalizedUrl;

  try {
    const urlObj = new URL(normalizedUrl);

    if (!urlObj.hostname.includes('.')) {
      return { valid: false, error: '有効なドメインを入力してください' };
    }

    normalizedUrl = normalizedUrl.replace(/^(https?:\/\/)www\./, '$1');

    return { valid: true, url: normalizedUrl };
  } catch {
    return { valid: false, error: '有効なURLを入力してください（例: example.com）' };
  }
};

  const diagnoseFromHistory = (historyUrl) => {
    setUrl(historyUrl);
    handleAnalyze(historyUrl);
  };

  // ── handleAnalyze ────────────────────────────────────────────
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
        setLoadingStep('診断完了！');
        saveAnalysisToStorage(siteId, data);
        const params = new URLSearchParams({ url: normalizedUrl, siteId });
        setLoading(false);
        router.push(`/result?${params.toString()}`);
      } else {
        setLoading(false);
        let msg = data.error || '診断中にエラーが発生しました';
        if (response.status === 404) msg = 'サイトが見つかりませんでした。URLを確認してください。';
        else if (response.status === 403) msg = 'アクセスが拒否されました。クロールを許可していない可能性があります。';
        setError(msg);
      }
    } catch (e) {
      clearTimeout(timeoutId);
      setLoading(false);
      setError('診断に失敗しました。URLを確認して再度お試しください。');
    }
  };

  return (
    <>
    <script                          // ← ここに追加
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "AI観測ラボ",
        "url": "https://ai-kansoku.com",
        "description": "ChatGPT・Claude・PerplexityなどのAIクローラーに対するサイトの可視性を診断するツール。robots.txt・sitemap.xmlなど8項目を無料で分析。",
        "applicationCategory": "WebApplication",
        "operatingSystem": "Any",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
        "inLanguage": "ja"
      }) }}
    />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg:           #ffffff;
          --bg-sub:       #f7f7f5;
          --bg-dark:      #16161a;
          --accent:       #2d5be3;
          --accent-light: #e8edfb;
          --accent-mid:   #6b8ef0;
          --ink:          #111111;
          --ink-mid:      #444444;
          --ink-light:    #888888;
          --ink-xlight:   #bbbbbb;
          --border:       #e8e8e8;
          --border-dark:  #d0d0d0;
          --green:        #16a34a;
          --yellow:       #ca8a04;
          --red:          #dc2626;
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--ink); overflow-x: hidden; line-height: 1.7; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%,100% { opacity: .5; transform: scale(1); }
          50%     { opacity: 1; transform: scale(1.3); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .fu1 { animation: fadeUp .6s ease .1s both; }
        .fu2 { animation: fadeUp .6s ease .2s both; }
        .fu3 { animation: fadeUp .6s ease .3s both; }
        .fu4 { animation: fadeUp .6s ease .35s both; }
        .fu5 { animation: fadeUp .6s ease .45s both; }
        .fu6 { animation: fadeUp .7s ease .5s both; }

        .mono { font-family: 'DM Mono', monospace; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

        /* ── feat card hover ── */
        .feat-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 28px 24px;
          transition: box-shadow .2s, border-color .2s;
        }
        .feat-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,.07);
          border-color: var(--accent-mid);
        }

        /* ── blog card hover ── */
        .blog-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 24px;
          text-decoration: none;
          color: inherit;
          display: block;
          transition: box-shadow .2s, border-color .2s;
        }
        .blog-card:hover {
          box-shadow: 0 4px 20px rgba(0,0,0,.07);
          border-color: var(--accent-mid);
        }

        /* ── history card ── */
        .hist-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: border-color .15s;
        }
        .hist-card:hover { border-color: var(--accent-mid); }

        /* ── faq item ── */
        .faq-item {
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: white;
          cursor: pointer;
          transition: border-color .15s;
        }
        .faq-item:hover { border-color: var(--accent-mid); }

        /* ── nav link hover ── */
        .nav-a {
          font-size: 13px;
          color: var(--ink-mid);
          text-decoration: none;
          transition: color .15s;
          font-weight: 600;
        }
        .nav-a:hover { color: var(--ink); }

        /* ── why point ── */
        .why-point-title {
          font-weight: 600;
          font-size: 15px;
          color: var(--ink);
          margin-bottom: 5px;
          letter-spacing: -.01em;
        }

        /* ── responsive ── */
        @media (max-width: 960px) {
          .hero-inner { flex-direction: column !important; padding: 80px 24px 48px !important; gap: 40px !important; }
          .hero-right { flex: none !important; width: 100% !important; max-width: 460px !important; margin: 0 auto !important; }
          .why-grid   { grid-template-columns: 1fr !important; gap: 28px !important; }
          .feat-grid  { grid-template-columns: 1fr !important; }
          .blog-grid  { grid-template-columns: 1fr !important; }
          .stats-inner{ grid-template-columns: repeat(2,1fr) !important; }
          .stat-item  { border-right: none !important; border-bottom: 1px solid var(--border) !important; padding: 18px 0 !important; }
          .stat-item:nth-last-child(-n+2) { border-bottom: none !important; }
          .nav-desktop{ display: none !important; }
          .nav-hamburger { display: flex !important; }
          .page-section { padding: 60px 24px !important; }
          .features-wrap { padding: 60px 24px !important; }
          .cta-wrap    { padding: 72px 24px !important; }
          .footer-inner{ flex-direction: column !important; gap: 12px !important; text-align: center !important; padding: 24px !important; }
        }
        @media (min-width: 961px) {
          .nav-hamburger { display: none !important; }
          .mobile-menu   { display: none !important; }
        }
      `}</style>

      {/* ── Loading overlay ────────────────────────────────────── */}
      {loading && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.96)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{
            width: 38, height: 38,
            border: '3px solid var(--accent-light)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin .9s linear infinite',
          }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: J, fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 6 }}>
              {loadingStep}
            </p>
            <p style={{ fontFamily: M, fontSize: '11px', color: 'var(--ink-xlight)', letterSpacing: '.06em' }}>
              最大30秒かかる場合があります
            </p>
          </div>
        </div>
      )}

      {/* ── Canvas ─────────────────────────────────────────────── */}
      <ObsCanvas />

      {/* ── NAV ────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 60,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#2d5be3" strokeWidth="0.8" opacity="0.3" />
            <circle cx="14" cy="14" r="7" stroke="#2d5be3" strokeWidth="0.8" opacity="0.5" />
            <circle cx="14" cy="14" r="2.5" fill="#2d5be3" />
            <circle cx="14" cy="3.5" r="1.2" fill="#2d5be3" opacity="0.6" />
            <line x1="2" y1="14" x2="26" y2="14" stroke="#2d5be3" strokeWidth="0.5" opacity="0.2" />
            <line x1="14" y1="2" x2="14" y2="26" stroke="#2d5be3" strokeWidth="0.5" opacity="0.2" />
          </svg>
          <span style={{ fontFamily: J, fontWeight: 700, fontSize: 15, color: 'var(--ink)', letterSpacing: '-.02em' }}>
            AI観測<span style={{ color: 'var(--accent)' }}>ラボ</span>
          </span>
        </a>

        {/* PC nav */}
        <ul className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 28, listStyle: 'none',fontWeight: '600'  }}>
          {[['使い方', '/how-to-use'], ['改善ガイド', '/guide'], ['FAQ', '/faq'], ['ブログ', 'https://blog.ai-kansoku.com']].map(([l, h]) => (
            <li key={l}><a href={h} className="nav-a" style={{ fontFamily: No }}>{l}</a></li>
          ))}
          <li>
            <button
              onClick={() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
              style={{
                fontFamily: J, fontWeight: 600, fontSize: 13,
                background: 'var(--accent)', color: '#fff',
                padding: '8px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                transition: 'opacity .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >無料で診断する</button>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none', flexDirection: 'column', gap: 4, alignItems: 'center', justifyContent: 'center',
            background: 'none', border: '1px solid var(--border)', borderRadius: 6,
            padding: '7px 10px', cursor: 'pointer',
          }}
          aria-label="メニュー"
        >
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display: 'block', width: 18, height: 1.5,
              background: 'var(--ink)', borderRadius: 2, transition: 'all .25s',
              transform: menuOpen
                ? (i === 0 ? 'rotate(45deg) translate(2px,4px)' : i === 2 ? 'rotate(-45deg) translate(2px,-4px)' : 'scaleX(0)')
                : 'none',
              opacity: menuOpen && i === 1 ? 0 : 1,
            }} />
          ))}
        </button>

        {menuOpen && (
          <div className="mobile-menu" style={{
            position: 'fixed', top: 60, left: 0, right: 0,
            background: '#fff', borderBottom: '1px solid var(--border)',
            padding: '8px 20px 20px', zIndex: 200,
            boxShadow: '0 10px 30px rgba(0,0,0,.08)',
          }}>
            {[['使い方', '/how-to-use'], ['改善ガイド', '/guide'], ['FAQ', '/faq'], ['ブログ', 'https://blog.ai-kansoku.com']].map(([l, h]) => (
              <a key={l} href={h} onClick={() => setMenuOpen(false)} style={{
                display: 'block', fontFamily: No, fontSize: '0.95rem', color: 'var(--ink-mid)',
                textDecoration: 'none', padding: '13px 4px', borderBottom: '1px solid var(--border)',
              }}>{l}</a>
            ))}
            <button onClick={() => {
              setMenuOpen(false);
              setTimeout(() => { inputRef.current?.focus(); inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
            }} style={{
              width: '100%', marginTop: 14, fontFamily: J, fontWeight: 600, fontSize: '0.95rem',
              background: 'var(--accent)', color: '#fff',
              padding: 13, borderRadius: 8, border: 'none', cursor: 'pointer',
            }}>無料で診断する</button>
          </div>
        )}
      </nav>

      {/* ─── MAIN ─────────────────────────────────────────────── */}
      <div className={notoSansJP.className} style={{ background: 'var(--bg)', position: 'relative', minHeight: '100vh' }}>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-inner" style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', alignItems: 'center',
            minHeight: '100vh', padding: '100px 48px 60px', gap: 64,
          }}>
            {/* 左カラム */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* badge */}
              <p className="fu1" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'var(--accent-light)', color: 'var(--accent)',
                fontFamily: M, fontSize: 11, fontWeight: 500, letterSpacing: '.06em',
                padding: '5px 14px', borderRadius: 100, marginBottom: 28,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--accent)', display: 'inline-block',
                  animation: 'pulseDot 2s ease-in-out infinite',
                }} />
                AI Visibility Platform
              </p>

              {/* title */}
              <h1 className="fu2" style={{
                fontFamily: J, fontWeight: 700,
                fontSize: 'clamp(30px, 4.5vw, 56px)',
                lineHeight: 1.12, letterSpacing: '-.03em',
                color: 'var(--ink)', marginBottom: 16,
              }}>
                あなたのサイトは<br />
                AIに<span style={{ color: 'var(--accent)' }}>見つけられて</span>いますか？
              </h1>

              {/* sub */}
              <p className="fu3" style={{
                fontFamily: No, fontSize: 14, color: 'var(--ink-light)',
                lineHeight: 1.85, marginBottom: 36, fontWeight: 300,
              }}>
                URLを入力すると30秒でAI可視性を診断。<br />
                タグを設置すれば、AI訪問ログの観測もできます。
              </p>

              {/* 3ステップ */}
              <div className="fu4" style={{ display: 'flex', flexDirection: 'column', marginBottom: 36 }}>
                {[
                  { n: '01', title: 'URL診断（30秒）', desc: 'robots.txt・llms.txt・構造化データなど8項目をスコアリング' },
                  { n: '02', title: '観測タグを設置（1行）', desc: 'サイトに1行追加するだけで、AIクローラーの検知を開始' },
                  { n: '03', title: 'AI訪問ログを観測', desc: 'どのAIが・いつ・どのページを見たかをダッシュボードで確認' },
                ].map((step, i, arr) => (
                  <div key={step.n} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '12px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    position: 'relative',
                  }}>
                    <span style={{ fontFamily: M, fontSize: 11, fontWeight: 500, color: 'var(--accent)', minWidth: 20, paddingTop: 2 }}>
                      {step.n}
                    </span>
                    <div>
                      <p style={{ fontFamily: J, fontWeight: 600, fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{step.title}</p>
                      <p style={{ fontFamily: No, fontSize: 12, color: 'var(--ink-light)', fontWeight: 300, marginTop: 2 }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* フォーム */}
              <div className="fu5">
                <div style={{
                  display: 'flex',
                  border: focused ? '1.5px solid var(--accent)' : '1.5px solid var(--border-dark)',
                  borderRadius: 10, overflow: 'hidden',
                  background: '#fff',
                  boxShadow: focused ? '0 0 0 4px rgba(45,91,227,0.1)' : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'border-color .2s, box-shadow .2s',
                }}>
                  <span style={{
                    fontFamily: M, fontSize: 13, color: 'var(--ink-xlight)',
                    padding: '14px 10px 14px 18px', userSelect: 'none', whiteSpace: 'nowrap',
                  }}>URL://</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={url}
                    onChange={e => { setUrl(e.target.value); setError(null); }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAnalyze();
                      }
                    }}
                    placeholder="example.com を入力"
                    style={{
                      flex: 1, minWidth: 0, border: 'none', outline: 'none',
                      fontFamily: M, fontSize: 14, color: 'var(--ink)',
                      padding: '14px 0', background: 'transparent',
                    }}
                  />
                  <button
                    onClick={() => handleAnalyze()}
                    disabled={loading || !url.trim()}
                    style={{
                      border: 'none', background: 'var(--accent)', color: '#fff',
                      fontFamily: J, fontWeight: 600, fontSize: 13,
                      padding: '0 24px', cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
                      opacity: loading || !url.trim() ? 0.5 : 1,
                      transition: 'background .15s, opacity .15s',
                      whiteSpace: 'nowrap', borderRadius: '0 8px 8px 0',
                    }}
                    onMouseEnter={e => { if (!loading && url.trim()) e.currentTarget.style.background = '#2449c0'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                  >
                    {loading ? '診断中...' : '診断する →'}
                  </button>
                </div>

                {/* meta */}
                <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                  {['無料', '登録不要', '30秒以内'].map(t => (
                    <span key={t} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)',
                    }}>
                      <span style={{ color: 'var(--accent)', fontSize: 10 }}>✓</span> {t}
                    </span>
                  ))}
                </div>

                {/* error */}
                {error && (
                  <div style={{
                    marginTop: 10, padding: '10px 14px',
                    background: '#fff1f1', border: '1px solid #fca5a5',
                    borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'var(--red)', fontSize: '0.83rem', marginBottom: 4 }}>{error}</p>
                      <button onClick={() => setError(null)} style={{
                        background: 'none', border: 'none', color: '#f87171',
                        fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline',
                      }}>閉じる</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右カラム：診断プレビューカード */}
            <div className="hero-right fu6" style={{ flex: '0 0 420px' }}>
              <div style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 14,
                boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
                {/* ブラウザ風ヘッダー */}
                <div style={{
                  background: 'var(--bg-sub)', borderBottom: '1px solid var(--border)',
                  padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    ))}
                  </div>
                  <span style={{
                    fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)',
                    flex: 1, background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 4, padding: '4px 10px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    ai-kansoku.com の診断結果
                  </span>
                </div>

                <div style={{ padding: '24px 20px' }}>
                  {/* スコア */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: J, fontWeight: 700, fontSize: 48, color: 'var(--ink)', letterSpacing: '-.04em', lineHeight: 1 }}>62</span>
                      <span style={{ fontSize: 16, color: 'var(--ink-light)', fontWeight: 400 }}>/ 100</span>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: '#fef9c3', color: 'var(--yellow)',
                      fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.06em',
                      padding: '5px 10px', borderRadius: 6,
                    }}>
                      ⚠ 要改善
                    </div>
                  </div>

                  {/* レーダー */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <RadarPreview />
                  </div>

                  {/* 検出AI */}
                  <p style={{ fontFamily: M, fontSize: 9, letterSpacing: '.18em', color: 'var(--ink-xlight)', textTransform: 'uppercase', marginBottom: 10 }}>
                    検出されたAIクローラー
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                    {[
                      { label: 'GPTBot', active: true },
                      { label: 'ClaudeBot', active: true },
                      { label: 'PerplexityBot 未検出', active: false },
                    ].map(({ label, active }) => (
                      <div key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        border: `1px solid ${active ? 'var(--border)' : 'var(--border)'}`,
                        borderStyle: active ? 'solid' : 'dashed',
                        borderRadius: 6, padding: '4px 10px',
                        fontFamily: M, fontSize: 11,
                        color: active ? 'var(--ink-mid)' : 'var(--ink-xlight)',
                      }}>
                        {active && <span style={{
                          width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)',
                          animation: 'pulseDot 2.5s ease-in-out infinite', display: 'inline-block',
                        }} />}
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* 改善ポイント */}
                  <p style={{ fontFamily: M, fontSize: 9, letterSpacing: '.18em', color: 'var(--ink-xlight)', textTransform: 'uppercase', marginBottom: 10 }}>
                    主な改善ポイント
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { icon: '📄', text: 'llms.txt が設置されていません', level: '高', color: 'var(--red)', bg: '#fee2e2' },
                      { icon: '🔖', text: '構造化データが不足しています', level: '中', color: 'var(--yellow)', bg: '#fef9c3' },
                      { icon: '🗺️', text: 'サイトマップの更新が古い', level: '中', color: 'var(--yellow)', bg: '#fef9c3' },
                    ].map(({ icon, text, level, color, bg }) => (
                      <div key={text} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', background: 'var(--bg-sub)', borderRadius: 6,
                      }}>
                        <span style={{ fontSize: 12 }}>{icon}</span>
                        <span style={{ fontFamily: No, fontSize: 12, color: 'var(--ink-mid)', flex: 1 }}>{text}</span>
                        <span style={{ fontFamily: M, fontSize: 9, letterSpacing: '.06em', padding: '2px 7px', borderRadius: 4, background: bg, color }}>{level}</span>
                      </div>
                    ))}
                  </div>

                  <p style={{
                    marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)',
                    fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)',
                    textAlign: 'center', letterSpacing: '.04em',
                  }}>※ 診断結果のサンプルです</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ─────────────────────────────────────────────── */}
        <div style={{ position: 'relative', zIndex: 1, background: 'var(--bg-sub)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '28px 48px' }}>
          <div className="stats-inner" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              { n: '7', unit: '種', label: '検知AIクローラー' },
              { n: '8', unit: '項目', label: '診断チェック' },
              { n: '30', unit: '秒', label: '診断所要時間' },
              { n: '0', unit: '円', label: '完全無料' },
            ].map(({ n, unit, label }) => (
              <div key={label} className="stat-item" style={{ textAlign: 'center', padding: '8px 24px', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontFamily: J, fontWeight: 700, fontSize: 30, color: 'var(--ink)', letterSpacing: '-.03em', lineHeight: 1 }}>
                  {n}<em style={{ fontStyle: 'normal', fontSize: 15, color: 'var(--accent)', fontWeight: 500 }}>{unit}</em>
                </div>
                <div style={{ fontFamily: No, fontSize: 11, color: 'var(--ink-light)', marginTop: 5 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── WHY ───────────────────────────────────────────────── */}
        <section className="page-section" style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '100px 48px' }}>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>
            <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
            Why AI Observatory
          </p>
          <h2 style={{ fontFamily: J, fontWeight: 700, fontSize: 'clamp(24px,3vw,38px)', letterSpacing: '-.02em', color: 'var(--ink)', lineHeight: 1.2, marginBottom: 14 }}>
            改善したのに、<br />数字が落ちていませんか？
          </h2>
          <p style={{ fontFamily: No, fontSize: 14, color: 'var(--ink-light)', lineHeight: 1.85, maxWidth: 480, fontWeight: 300, marginBottom: 56 }}>
            SEO対策・コンテンツ改善をしても、GA4の数値が下がることがあります。その原因は、AIクローラーの訪問がGA4に映っていないからかもしれません。
          </p>

          <div className="why-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
            {/* ダーク可視化 */}
            <div style={{ background: 'var(--bg-dark)', borderRadius: 12, padding: 32 }}>
              <p style={{ fontFamily: M, fontSize: 9, letterSpacing: '.2em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 20 }}>// today's visit log</p>
              {[
                { name: 'google / organic', val: '9,241', tag: 'GA4', ghost: false },
                { name: 'direct', val: '3,104', tag: 'GA4', ghost: false },
                { name: 'GPTBot', val: '247', tag: '非表示', ghost: true },
                { name: 'ClaudeBot', val: '118', tag: '非表示', ghost: true },
                { name: 'PerplexityBot', val: '392', tag: '非表示', ghost: true },
              ].map(({ name, val, tag, ghost }, i, arr) => (
                <div key={name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 0', gap: 8,
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  opacity: ghost ? 0.3 : 1,
                }}>
                  <span style={{ fontFamily: M, fontSize: 12, color: 'rgba(255,255,255,0.55)', flex: 1 }}>{name}</span>
                  <span style={{ fontFamily: M, fontSize: 12, color: '#fff', minWidth: 48, textAlign: 'right' }}>{val}</span>
                  <span style={{
                    fontFamily: M, fontSize: 9, padding: '2px 8px', borderRadius: 100, letterSpacing: '.06em', minWidth: 52, textAlign: 'center',
                    background: ghost ? 'rgba(45,91,227,0.2)' : 'rgba(255,255,255,0.07)',
                    color: ghost ? 'rgba(107,142,240,0.8)' : 'rgba(255,255,255,0.3)',
                  }}>{tag}</span>
                </div>
              ))}
              <p style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', fontFamily: M, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '.06em', textAlign: 'center' }}>
                GA4には映らない訪問が存在する
              </p>
            </div>

            {/* ポイント */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {[
                { n: '01', title: 'GA4はAIクローラーを除外している', desc: 'GA4はbotを除外する設計です。GPTBot・ClaudeBot・PerplexityBotなど新興AIクローラーの訪問は、GA4の画面に一切表示されません。' },
                { n: '02', title: 'AIに訪れられることが、AI検索への露出に直結', desc: 'AIクローラーが来ているということは、AIに学習・引用される可能性があるということ。来ていなければ、AI検索では存在しないも同然です。' },
                { n: '03', title: '「来た・来ない」を知るだけで、施策が変わる', desc: 'どのAIが来ているか、どのページを見たか。その事実があるだけで、次に何をすべきかが明確になります。' },
              ].map(({ n, title, desc }) => (
                <div key={n} style={{ display: 'flex', gap: 16 }}>
                  <span style={{ fontFamily: M, fontSize: 11, color: 'var(--accent)', fontWeight: 500, paddingTop: 2, minWidth: 24 }}>{n}</span>
                  <div>
                    <p className="why-point-title" style={{ fontFamily: J }}>{title}</p>
                    <p style={{ fontFamily: No, fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.8, fontWeight: 300 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────── */}
        <div className="features-wrap" style={{ position: 'relative', zIndex: 1, background: 'var(--bg-sub)', borderTop: '1px solid var(--border)', padding: '100px 48px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <p style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>
              <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
              Features
            </p>
            <h2 style={{ fontFamily: J, fontWeight: 700, fontSize: 'clamp(24px,3vw,38px)', letterSpacing: '-.02em', color: 'var(--ink)', lineHeight: 1.2 }}>できること</h2>
            <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginTop: 48 }}>
              {[
                {
                  tag: 'Diagnosis',
                  title: '8項目のAI可視性診断',
                  desc: 'robots.txt・llms.txt・構造化データ・メタタグなど、AIに認識されやすい構造かをスコアで評価します。URLを入れるだけ。',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="#2d5be3" strokeWidth="1.5" opacity="0.4" />
                      <circle cx="10" cy="10" r="4.5" stroke="#2d5be3" strokeWidth="1.5" />
                      <circle cx="10" cy="10" r="1.5" fill="#2d5be3" />
                      <circle cx="10" cy="3" r="1" fill="#2d5be3" opacity="0.5" />
                    </svg>
                  ),
                },
                {
                  tag: 'Detection',
                  title: 'AIクローラーを名指しで検知',
                  desc: 'GPTBot・ClaudeBot・PerplexityBotなど、どのAIが来ているかをUA・IPレンジ・行動パターンで特定します。',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="#2d5be3" strokeWidth="1.5" opacity="0.4" />
                      <circle cx="10" cy="3" r="1.5" fill="#2d5be3" />
                      <path d="M10 3 A7 7 0 0 1 17 10" stroke="#2d5be3" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  tag: 'Analytics',
                  title: '訪問ログを7日間記録',
                  desc: 'いつ・どのAIが・どのページを見たか。観測ダッシュボードで訪問パターンを時系列で把握できます。',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <polyline points="2,14 6,9 10,11 14,6 18,4" stroke="#2d5be3" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="6" cy="9" r="1.5" fill="#2d5be3" />
                      <circle cx="14" cy="6" r="1.5" fill="#2d5be3" />
                    </svg>
                  ),
                },
              ].map(({ tag, title, desc, icon }) => (
                <div key={tag} className="feat-card">
                  <div style={{ width: 40, height: 40, background: 'var(--accent-light)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    {icon}
                  </div>
                  <p style={{ fontFamily: M, fontSize: 9, letterSpacing: '.15em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 7 }}>{tag}</p>
                  <h3 style={{ fontFamily: J, fontWeight: 700, fontSize: 15, color: 'var(--ink)', letterSpacing: '-.01em', marginBottom: 9, lineHeight: 1.35 }}>{title}</h3>
                  <p style={{ fontFamily: No, fontSize: 13, color: 'var(--ink-light)', lineHeight: 1.8, fontWeight: 300 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BLOG ──────────────────────────────────────────────── */}
        <section className="page-section" style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '100px 48px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>
                <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
                Latest Posts
              </p>
              <h2 style={{ fontFamily: J, fontWeight: 700, fontSize: 'clamp(22px,2.5vw,32px)', letterSpacing: '-.02em', color: 'var(--ink)' }}>最新ブログ記事</h2>
            </div>
            <a href="https://blog.ai-kansoku.com" target="_blank" style={{ fontFamily: No, fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>すべて見る →</a>
          </div>
          <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {BLOG_POSTS.map(post => (
              <a key={post.slug} href={`https://blog.ai-kansoku.com/${post.slug}/`} target="_blank" className="blog-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontFamily: No, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 4, background: post.tagBg, color: post.tagColor }}>{post.tag}</span>
                  <span style={{ fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)' }}>{post.date}</span>
                </div>
                <h3 style={{ fontFamily: No, fontSize: 14, fontWeight: 500, color: 'var(--ink)', lineHeight: 1.65, marginBottom: 16 }}>{post.title}</h3>
                <span style={{ fontFamily: No, fontSize: 12, color: 'var(--accent)' }}>読む →</span>
              </a>
            ))}
          </div>
        </section>

        {/* ── 診断履歴 ───────────────────────────────────────────── */}
        {history.length > 0 && (
          <section className="page-section" style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '0 48px 80px' }}>
            <div style={{ background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: 12, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: J, fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>診断履歴</h2>
                <button onClick={clearHistory} style={{ background: 'none', border: 'none', fontFamily: No, fontSize: '0.8rem', color: 'var(--ink-xlight)', cursor: 'pointer', textDecoration: 'underline' }}>
                  すべて削除
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((item, i) => {
                  const d = new Date(item.date);
                  const fmt = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                  const prev = history[i + 1];
                  const diff = prev && prev.url === item.url ? item.score - prev.score : null;
                  const scoreColor = item.score >= 80 ? 'var(--green)' : item.score >= 60 ? 'var(--yellow)' : 'var(--red)';
                  const historySiteId = generateSiteId(item.url);
                  return (
                    <div key={i} className="hist-card">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: M, fontWeight: 500, fontSize: '0.88rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.url.replace(/https?:\/\//, '')}
                          </span>
                          <span style={{ fontFamily: J, fontWeight: 700, fontSize: '1.1rem', color: scoreColor }}>{item.score}点</span>
                          {diff !== null && diff !== 0 && (
                            <span style={{
                              fontFamily: M, fontSize: '0.72rem', fontWeight: 500,
                              padding: '2px 7px', borderRadius: 100,
                              background: diff > 0 ? '#dcfce7' : '#fee2e2',
                              color: diff > 0 ? 'var(--green)' : 'var(--red)',
                            }}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: M, fontSize: '0.72rem', color: 'var(--ink-xlight)' }}>{fmt}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => diagnoseFromHistory(item.url)} style={{
                          padding: '7px 14px', borderRadius: 6, cursor: 'pointer',
                          background: 'var(--accent-light)', border: '1px solid rgba(45,91,227,0.2)',
                          color: 'var(--accent)', fontFamily: J, fontSize: '0.8rem', fontWeight: 600,
                        }}>再診断</button>
                        <a href={`/result?url=${encodeURIComponent(item.url)}&siteId=${historySiteId}`} style={{
                          padding: '7px 14px', borderRadius: 6, background: '#fff',
                          border: '1px solid var(--border)', color: 'var(--ink-mid)',
                          fontFamily: J, fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none',
                        }}>詳細</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── FAQ ───────────────────────────────────────────────── */}
        <section className="page-section" style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto', padding: '0 48px 100px' }}>
          <p style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: M, fontSize: 10, fontWeight: 500, letterSpacing: '.2em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>
            <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block' }} />
            FAQ
          </p>
          <h2 style={{ fontFamily: J, fontWeight: 700, fontSize: 'clamp(22px,2.5vw,32px)', letterSpacing: '-.02em', color: 'var(--ink)', marginBottom: 32 }}>よくある質問</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <p style={{ fontFamily: No, fontWeight: 500, fontSize: '0.92rem', color: 'var(--ink)' }}>Q. {item.q}</p>
                  <span style={{
                    color: 'var(--accent)', fontSize: '1.2rem', flexShrink: 0,
                    display: 'inline-block', transition: 'transform .2s',
                    transform: openFaq === i ? 'rotate(45deg)' : 'none',
                  }}>+</span>
                </div>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 16px', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontFamily: No, fontSize: '0.87rem', color: 'var(--ink-light)', lineHeight: 1.75 }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <a href="/faq" style={{ fontFamily: No, fontSize: '0.85rem', color: 'var(--ink-xlight)', textDecoration: 'none' }}>すべてのFAQを見る →</a>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <div className="cta-wrap" style={{ position: 'relative', zIndex: 1, background: 'var(--bg-dark)', padding: '100px 48px', textAlign: 'center', overflow: 'hidden' }}>
          {[400, 700, 1000].map(s => (
            <div key={s} style={{
              position: 'absolute', borderRadius: '50%', border: '1px solid rgba(45,91,227,0.12)',
              width: s, height: s, top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)', pointerEvents: 'none',
            }} />
          ))}
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 580, margin: '0 auto' }}>
            <p style={{ fontFamily: M, fontSize: 10, letterSpacing: '.2em', color: 'var(--accent-mid)', textTransform: 'uppercase', marginBottom: 18 }}>
              // Start Observation
            </p>
            <h2 style={{ fontFamily: J, fontWeight: 700, fontSize: 'clamp(26px,4vw,44px)', letterSpacing: '-.02em', color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
              AIに見つけられていますか？
            </h2>
            <p style={{ fontFamily: No, fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: 36, fontWeight: 300 }}>
              URLを入力するだけ。30秒でAI可視性を診断します。<br />アカウント登録不要。
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { inputRef.current?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{
                fontFamily: J, fontWeight: 600, fontSize: 13,
                background: '#fff', color: 'var(--ink)',
                border: 'none', padding: '13px 28px', borderRadius: 7,
                cursor: 'pointer', transition: 'opacity .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >無料で診断する</button>
              <a href="/how-to-use" style={{
                fontFamily: J, fontWeight: 500, fontSize: 13,
                background: 'transparent', color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '13px 28px', borderRadius: 7, textDecoration: 'none',
                transition: 'all .15s', display: 'inline-block',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >使い方を見る</a>
            </div>
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', background: 'var(--bg-sub)' }}>
          <div className="footer-inner" style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 48px' }}>
            <span style={{ fontFamily: M, fontSize: 11, color: 'var(--ink-xlight)' }}>© 2026 AI観測ラボ</span>
            <ul style={{ display: 'flex', gap: 20, listStyle: 'none', flexWrap: 'wrap' }}>
              {[['改善ガイド', '/guide'], ['FAQ', '/faq'], ['使い方', '/how-to-use'], ['ブログ', 'https://blog.ai-kansoku.com']].map(([l, h]) => (
                <li key={l}>
                  <a href={h} style={{ fontFamily: No, fontSize: 12, color: 'var(--ink-xlight)', textDecoration: 'none', transition: 'color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--ink-mid)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-xlight)'}
                  >{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </footer>

      </div>
    </>
  );
}