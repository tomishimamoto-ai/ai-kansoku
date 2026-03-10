'use client';
import { useState, useMemo } from 'react';

const CX = 280;
const CY = 280;
const SIZE = 560;

const CRAWLER_CONFIG = {
  'GPTBot':           { color: '#f0e68c', orbitRadius: 100, label: '木星' },
  'ChatGPT-User':     { color: '#ffe066', orbitRadius: 100, label: '木星' },
  'ClaudeBot':        { color: '#7eb8ff', orbitRadius: 155, label: '海王星' },
  'Claude-User':      { color: '#7eb8ff', orbitRadius: 155, label: '海王星' },
  'Claude-SearchBot': { color: '#a0c8ff', orbitRadius: 155, label: '海王星' },
  'Gemini':           { color: '#ffd4a3', orbitRadius: 205, label: '土星' },
  'PerplexityBot':    { color: '#b8ffb8', orbitRadius: 248, label: '火星' },
  'Perplexity':       { color: '#b8ffb8', orbitRadius: 248, label: '火星' },
  'default':          { color: '#aaaacc', orbitRadius: 185, label: '小惑星' },
};

// 未観測候補（代表的なクローラー）
const UNDETECTED_CANDIDATES = [
  { name: 'ClaudeBot',    color: '#7eb8ff', label: '海王星' },
  { name: 'Gemini',       color: '#ffd4a3', label: '土星' },
  { name: 'PerplexityBot',color: '#b8ffb8', label: '火星' },
  { name: 'GPTBot',       color: '#f0e68c', label: '木星' },
];

const ORBIT_OFFSETS = [0, 22, -18, 30, -25, 15, -12];

const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: (i * 137.508 + 23) % SIZE,
  y: (i * 89.313 + 51) % SIZE,
  r: 0.3 + (i % 4) * 0.35,
  o: 0.12 + (i % 6) * 0.08,
  twinkle: i % 30 === 0,
}));

function toXY(r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + Math.cos(rad) * r, y: CY + Math.sin(rad) * r };
}

function getBodySize(sessions, maxSessions) {
  if (maxSessions === 0) return 8;
  return 7 + (sessions / maxSessions) * 18;
}

function getBrightness(lastVisitHours) {
  return Math.max(0.25, 1 - lastVisitHours / 168);
}

function calcLastVisitHours(lastVisit) {
  if (!lastVisit) return 168;
  const diff = Date.now() - new Date(lastVisit).getTime();
  return Math.floor(diff / (1000 * 60 * 60));
}

function formatLastVisit(hours) {
  if (hours < 1) return '1時間以内';
  if (hours < 24) return `${hours}h前`;
  return `${Math.floor(hours / 24)}d前`;
}

export default function SolarSystemChart({ crawlers = [], lastVisit = null }) {
  const [selected, setSelected] = useState(null);

  const bodies = useMemo(() => {
    if (!crawlers || crawlers.length === 0) return [];

    const maxSessions = Math.max(...crawlers.map(c => c.visit_count || 0), 1);
    const usedOrbits = new Map();

    return crawlers.map((crawler, i) => {
      const name = crawler.crawler_name || 'Unknown';
      const cfg = CRAWLER_CONFIG[name] || CRAWLER_CONFIG['default'];

      let orbitR = cfg.orbitRadius;
      const key = orbitR;
      const offset = usedOrbits.get(key) ?? 0;
      usedOrbits.set(key, offset + 1);
      orbitR += (ORBIT_OFFSETS[offset] || offset * 20);

      const angle = (i * (360 / crawlers.length)) + 15;

      const crawlerLastVisit = crawler.last_visit || lastVisit;
      const lastVisitHours = calcLastVisitHours(crawlerLastVisit);
      const brightness = getBrightness(lastVisitHours);
      const size = getBodySize(crawler.visit_count || 0, maxSessions);

      return {
        id: name,
        name,
        label: cfg.label,
        color: cfg.color,
        orbitRadius: orbitR,
        angle,
        sessions: crawler.visit_count || 0,
        uniqueSessions: crawler.unique_sessions || 0,
        change: crawler.change_percent || 0,
        trend: crawler.trend || 'stable',
        lastVisitHours,
        brightness,
        size,
      };
    });
  }, [crawlers, lastVisit]);

  // 未観測クローラー（検知済みを除外）
  const detectedNames = new Set(bodies.map(b => b.name));
  const undetected = UNDETECTED_CANDIDATES.filter(c => !detectedNames.has(c.name));

  const total = bodies.reduce((s, b) => s + b.sessions, 0);
  const sel = bodies.find(b => b.id === selected);

  if (bodies.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#0f1229] to-[#1a1e47] border border-[#2a2f57] rounded-2xl p-8 mb-8 text-center">
        <p className="text-4xl mb-3">🔭</p>
        <p className="text-gray-400 text-sm">AIクローラーの観測データがありません</p>
        <p className="text-gray-600 text-xs mt-1">トラッキングコードを設置して数日お待ちください</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#080c20] to-[#0f1535] border border-[#2a2f57] rounded-2xl p-6 mb-8 shadow-xl">

      {/* ヘッダー + ミニ凡例 */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
            <span>🌌</span>
            <span className="bg-gradient-to-r from-[#7eb8ff] via-white to-[#ffd4a3] bg-clip-text text-transparent">
              クローラー惑星系
            </span>
          </h2>
          <p className="text-xs text-gray-500">天体をクリックして詳細を表示</p>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7eb8ff]/60 border border-[#7eb8ff]/40" />
            <span className="text-[10px] text-gray-400">サイズ <span className="text-gray-600">=</span> <span className="text-[#7eb8ff]">訪問数</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffd4a3]/60 border border-[#ffd4a3]/40" style={{ boxShadow: '0 0 4px #ffd4a3' }} />
            <span className="text-[10px] text-gray-400">輝度 <span className="text-gray-600">=</span> <span className="text-[#ffd4a3]">最終観測</span></span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* SVGマップ */}
        <div className="relative flex-shrink-0 mx-auto lg:mx-0">
          <svg
            width={SIZE} height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{
              maxWidth: 'min(560px, 90vw)',
              height: 'auto',
              display: 'block',
              borderRadius: '50%',
              border: '1px solid rgba(74,122,255,0.1)',
              background: 'radial-gradient(ellipse at 38% 32%, #071030 0%, #020818 45%, #000208 100%)',
            }}
          >
            <defs>
              <radialGradient id="sc-sunGrad" cx="38%" cy="32%">
                <stop offset="0%" stopColor="#fff8e0" />
                <stop offset="45%" stopColor="#ffcc44" />
                <stop offset="100%" stopColor="#ff8800" />
              </radialGradient>
              {bodies.map(b => (
                <radialGradient key={b.id} id={`sc-body-${b.id}`} cx="35%" cy="30%">
                  <stop offset="0%" stopColor={b.color} />
                  <stop offset="100%" stopColor={b.color + '88'} />
                </radialGradient>
              ))}
              <filter id="sc-sun-glow">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r}
                fill={`rgba(255,255,255,${s.o})`}>
                {s.twinkle && (
                  <animate attributeName="opacity"
                    values={`${s.o};1;${s.o}`}
                    dur={`${2 + (i % 3)}s`}
                    repeatCount="indefinite" />
                )}
              </circle>
            ))}

            {bodies.map(b => (
              <circle key={b.id + '-orbit'}
                cx={CX} cy={CY} r={b.orbitRadius}
                fill="none" stroke="rgba(255,255,255,0.04)"
                strokeWidth={1} strokeDasharray="4 10" />
            ))}

            {[4.2, 3.0, 2.0].map((m, i) => (
              <circle key={i} cx={CX} cy={CY} r={28 * m}
                fill={`rgba(255,175,35,${0.028 - i * 0.007})`} />
            ))}

            <circle cx={CX} cy={CY} r={28} fill="url(#sc-sunGrad)" filter="url(#sc-sun-glow)" />
            <text x={CX} y={CY + 44} textAnchor="middle"
              fill="rgba(255,210,80,0.6)" fontSize={8} letterSpacing="1.5">
              YOUR SITE
            </text>
            {/* ゴースト惑星（未観測） */}
{undetected.map((c, i) => {
  const cfg = CRAWLER_CONFIG[c.name] || CRAWLER_CONFIG['default'];
  const angle = 45 + i * 90;
  const { x, y } = toXY(cfg.orbitRadius, angle);
  return (
    <g key={c.name + '-ghost'}>
      <circle cx={x} cy={y} r={8}
        fill="none"
        stroke={c.color}
        strokeWidth={1}
        strokeOpacity={0.45}
        strokeDasharray="2 4"
      />
      <text x={x} y={y - 14}
        textAnchor="middle"
        fill={c.color}
        fontSize={8}
        opacity={0.45}>
        {c.name}
      </text>
    </g>
  );
})}
            {bodies.map(b => {
              const isSel = selected === b.id;
              const { x, y } = toXY(b.orbitRadius, b.angle);
              const dur = `${180 + (b.orbitRadius % 60)}s`;

              return (
                <g key={b.id}
                  onClick={() => setSelected(p => p === b.id ? null : b.id)}
                  style={{ cursor: 'pointer' }}>
                  <g>
                    <animateTransform
                      attributeName="transform" type="rotate"
                      from={`${b.angle} ${CX} ${CY}`}
                      to={`${b.angle + 360} ${CX} ${CY}`}
                      dur={dur} repeatCount="indefinite" />
                    <circle cx={x} cy={y} r={b.size * 2.5}
                      fill={b.color} opacity={b.brightness * 0.15} />
                    <circle cx={x} cy={y} r={b.size * 1.8}
                      fill={b.color} opacity={b.brightness * 0.4} />
                    {isSel && (
                      <circle cx={x} cy={y} r={b.size + 7}
                        fill="none" stroke={b.color}
                        strokeWidth={1} strokeOpacity={0.6}
                        strokeDasharray="3 4" />
                    )}
                    <circle cx={x} cy={y} r={b.size}
                      fill={`url(#sc-body-${b.id})`}
                      opacity={0.5 + b.brightness * 0.5} />
                    <text x={x} y={y - b.size - 7}
                      textAnchor="middle" fill={b.color}
                      fontSize={9} fontWeight="bold"
                      opacity={isSel ? 1 : 0.7}>
                      {b.name}
                    </text>
                    <text x={x} y={y + b.size + 13}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.28)" fontSize={8}>
                      {b.sessions}回
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          <div style={{
            position: 'absolute', bottom: 14, left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,2,12,0.88)',
            border: '1px solid rgba(74,122,255,0.2)',
            borderRadius: 20, padding: '3px 16px',
            fontSize: 10, color: '#7eb8ff',
            letterSpacing: '0.18em', whiteSpace: 'nowrap',
          }}>
            TOTAL {total} VISITS
          </div>
        </div>

        {/* 右パネル */}
        <div className="flex-1 flex flex-col gap-4 w-full min-w-0">

          {/* 検知済みリスト */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
            <p className="text-[9px] tracking-[0.28em] text-[#3a6aee] mb-3 uppercase">Detected Bodies</p>
            {[...bodies].sort((a, b) => b.sessions - a.sessions).map(b => {
              const isSel = selected === b.id;
              return (
                <div key={b.id}
                  onClick={() => setSelected(p => p === b.id ? null : b.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer mb-1 transition-all border ${
                    isSel ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                  }`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: b.color }}>{b.name}</p>
                    <p className="text-[1px] text-white-400">{b.label} · {formatLastVisit(b.lastVisitHours)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      b.trend === 'up' ? 'bg-green-500/20 text-green-400' :
                      b.trend === 'down' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {b.trend === 'up' ? '+' : ''}{b.change}%
                    </span>
                    <span className="text-sm font-bold text-white/75">{b.sessions}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 詳細パネル */}
          {sel ? (
            <div className="bg-white/[0.03] rounded-xl p-4"
              style={{ border: `1px solid ${sel.color}22` }}>
              <p className="text-[9px] tracking-[0.28em] mb-3 uppercase" style={{ color: sel.color }}>Details</p>
              <p className="text-sm font-bold mb-4" style={{ color: sel.color }}>{sel.name}</p>
              {[
                ['訪問数', `${sel.sessions} 回`],
                ['ユニーク', `${sel.uniqueSessions} セッション`],
                ['先週比', `${sel.change > 0 ? '+' : ''}${sel.change}%`],
                ['最終観測', formatLastVisit(sel.lastVisitHours)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between mb-2">
                  <span className="text-[11px] text-white/75">{k}</span>
                  <span className="text-[11px] text-white/75">{v}</span>
                </div>
              ))}
              <div className="mt-3">
                <p className="text-[9px] text-gray-600 mb-1">観測輝度</p>
                <div className="bg-white/[0.07] rounded-full h-1">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${sel.brightness * 100}%`,
                      background: `linear-gradient(90deg, ${sel.color}55, ${sel.color})`,
                    }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.015] border border-dashed border-white/[0.07] rounded-xl p-4 text-center text-gray-400 text-sm leading-loose">
              天体をクリックして<br />詳細を表示
            </div>
          )}

          {/* 未観測クローラー候補 */}
          {undetected.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              <p className="text-[9px] tracking-[0.28em] text-gray-600 mb-3 uppercase">Undetected</p>
              {undetected.map(c => (
                <div key={c.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
                  {/* グレーアウトのドット（点滅なし） */}
                  <div className="w-2 h-2 rounded-full flex-shrink-0 border"
                    style={{ borderColor: c.color + '30', background: 'transparent' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-gray-600">{c.name}</p>
                    <p className="text-[9px] text-gray-700">{c.label} · 未観測</p>
                  </div>
                  <span className="text-[9px] text-gray-700 flex-shrink-0">—</span>
                </div>
              ))}
              <p className="text-[9px] text-gray-700 mt-2 px-1">
                これらのAIはまだあなたのサイトを訪問していません
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}