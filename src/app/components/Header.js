'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const J = '"Noto Sans JP", sans-serif';

const NAV_LINKS = [
  ['使い方', '/how-to-use'],
  ['改善ガイド', '/guide'],
  ['FAQ', '/faq'],
  ['ブログ', 'https://blog.ai-kansoku.com'],
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 60,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* ロゴ */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
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
        </Link>

        {/* PC nav */}
        <ul className="nav-desktop" style={{
          display: 'flex', alignItems: 'center', gap: 28,
          listStyle: 'none', margin: 0, padding: 0,
        }}>
          {NAV_LINKS.map(([l, h]) => (
            <li key={l}>
              <Link href={h} className="nav-a" style={{
                fontFamily: J,
                fontWeight: pathname === h ? 700 : 500,
                color: pathname === h ? 'var(--accent)' : undefined,
              }}>
                {l}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/" style={{
              fontFamily: J, fontWeight: 600, fontSize: 13,
              background: 'var(--accent)', color: '#fff',
              padding: '8px 20px', borderRadius: 6,
              textDecoration: 'none', display: 'inline-block',
            }}>無料で診断する</Link>
          </li>
        </ul>

        {/* ハンバーガー */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
          style={{
            display: 'none', flexDirection: 'column', gap: 4,
            alignItems: 'center', justifyContent: 'center',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, padding: '7px 10px', cursor: 'pointer',
          }}
        >
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display: 'block', width: 18, height: 1.5,
              background: 'var(--ink)', borderRadius: 2, transition: 'all .25s',
              transform: menuOpen
                ? (i === 0 ? 'rotate(45deg) translate(2px,4px)'
                  : i === 2 ? 'rotate(-45deg) translate(2px,-4px)'
                  : 'scaleX(0)')
                : 'none',
              opacity: menuOpen && i === 1 ? 0 : 1,
            }} />
          ))}
        </button>
      </nav>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, zIndex: 200,
          background: '#fff', borderBottom: '1px solid var(--border)',
          padding: '8px 20px 20px',
          boxShadow: '0 10px 30px rgba(0,0,0,.08)',
        }}>
          {NAV_LINKS.map(([l, h]) => (
            <Link key={l} href={h} onClick={() => setMenuOpen(false)} style={{
              display: 'block', fontFamily: J, fontSize: '0.95rem',
              color: pathname === h ? 'var(--accent)' : 'var(--ink-mid)',
              fontWeight: pathname === h ? 700 : 400,
              textDecoration: 'none',
              padding: '13px 4px', borderBottom: '1px solid var(--border)',
            }}>{l}</Link>
          ))}
          <Link href="/" onClick={() => setMenuOpen(false)} style={{
            display: 'block', marginTop: 14,
            fontFamily: J, fontWeight: 600, fontSize: '0.95rem',
            background: 'var(--accent)', color: '#fff',
            padding: 13, borderRadius: 8, textAlign: 'center',
            textDecoration: 'none',
          }}>無料で診断する</Link>
        </div>
      )}
    </>
  );
}