// ========================================
// lib/ip-ranges.js
// 各社公式JSONからIPレンジを動的取得・キャッシュ
// ========================================

// キャッシュ: { prefixes: [], fetchedAt: timestamp }
let cache = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間

// 公式JSONエンドポイント一覧
const IP_RANGE_SOURCES = [
  // ── OpenAI ──────────────────────────────────────────────
  {
    url: 'https://openai.com/gptbot.json',
    name: 'ChatGPT',
    format: 'openai', // { prefixes: [{ ipv4Prefix: '...' }] }
  },
  {
    url: 'https://openai.com/chatgpt-user.json',
    name: 'ChatGPT',
    format: 'openai',
  },
  {
    url: 'https://openai.com/searchbot.json',
    name: 'ChatGPT',
    format: 'openai',
  },

  // ── Google ──────────────────────────────────────────────
  {
    url: 'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
    name: 'Gemini',
    format: 'google', // { prefixes: [{ ipv4Prefix: '...' }, { ipv6Prefix: '...' }] }
  },
  {
    url: 'https://developers.google.com/static/search/apis/ipranges/special-crawlers.json',
    name: 'Gemini',
    format: 'google',
  },
  {
    url: 'https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers.json',
    name: 'Gemini',
    format: 'google',
  },

  // ── Perplexity ──────────────────────────────────────────
  {
    url: 'https://www.perplexity.com/perplexitybot.json',
    name: 'Perplexity',
    format: 'openai',
  },

  // ── DuckDuckGo ──────────────────────────────────────────
  {
    url: 'https://duckduckgo.com/duckduckbot.json',
    name: 'DuckDuckGo',
    format: 'openai',
  },

  // ── Microsoft / Bing ────────────────────────────────────
  // 公式: https://www.bing.com/toolbox/bingbot.json
  {
    url: 'https://www.bing.com/toolbox/bingbot.json',
    name: 'Bing AI',
    format: 'openai', // Bing も { prefixes: [{ ipv4Prefix: ... }] } 形式
  },

  // ── Apple ───────────────────────────────────────────────
  // 公式: https://search.developer.apple.com/applebot.json
  {
    url: 'https://search.developer.apple.com/applebot.json',
    name: 'Apple AI',
    format: 'openai',
  },
];

// ========================================
// CIDRマッチング（IPv4のみ）
// ========================================
function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function isIpInCidr(ip, cidr) {
  try {
    const [range, bits] = cidr.split('/');
    const mask = ~(0xffffffff >>> parseInt(bits)) >>> 0;
    return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
  } catch {
    return false;
  }
}

// ========================================
// 公式JSONからIPレンジを取得
// ========================================
async function fetchIpRanges() {
  const prefixes = [];

  await Promise.allSettled(
    IP_RANGE_SOURCES.map(async (source) => {
      try {
        const res = await Promise.race([
          fetch(source.url, {
            headers: { 'User-Agent': 'AI-Kansoku-Lab/1.0' },
            next: { revalidate: 0 }, // Next.jsキャッシュを使わない
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          ),
        ]);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const items = json.prefixes || json.ipRanges || [];

        for (const item of items) {
          const cidr = item.ipv4Prefix || item.ip_prefix;
          if (cidr && cidr.includes('.')) {
            // IPv4のみ
            prefixes.push({ cidr, name: source.name });
          }
        }

        console.log(`✅ IP ranges fetched: ${source.name} (${source.url})`);
      } catch (err) {
        console.warn(`⚠️ Failed to fetch IP ranges from ${source.url}:`, err.message);
      }
    })
  );

  return prefixes;
}

// ========================================
// キャッシュ付きIPレンジ取得（メイン関数）
// ========================================
export async function getAiIpRanges() {
  const now = Date.now();

  // キャッシュが有効なら返す
  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return cache.prefixes;
  }

  // 取得失敗時のフォールバック
  // ── 公式に掲載されているハードコード値（最終更新: 2026年2月）──
  const FALLBACK_RANGES = [
    // OpenAI / ChatGPT
    { cidr: '23.102.140.112/28', name: 'ChatGPT' },
    { cidr: '13.65.240.240/28',  name: 'ChatGPT' },
    { cidr: '40.83.2.64/28',     name: 'ChatGPT' },
    { cidr: '20.97.188.144/28',  name: 'ChatGPT' },
    // Anthropic / Claude
    { cidr: '160.79.104.0/23',   name: 'Claude'  },
    // Google / Gemini
    { cidr: '66.249.64.0/19',    name: 'Gemini'  },
    { cidr: '66.249.80.0/20',    name: 'Gemini'  },
    // Perplexity
    { cidr: '52.7.25.0/24',      name: 'Perplexity' },
    // Bing / Microsoft ──────────────────────────────────────────
    // 公式 bingbot.json から抜粋（代表レンジ）
    { cidr: '157.55.39.0/24',    name: 'Bing AI' },
    { cidr: '157.56.93.0/24',    name: 'Bing AI' },
    { cidr: '157.56.94.0/24',    name: 'Bing AI' },
    { cidr: '40.77.167.0/24',    name: 'Bing AI' },
    { cidr: '65.55.210.0/24',    name: 'Bing AI' },
    { cidr: '207.46.13.0/24',    name: 'Bing AI' },
    // Apple Applebot ────────────────────────────────────────────
    // 公式 applebot.json から抜粋（代表レンジ）
    { cidr: '17.0.0.0/8',        name: 'Apple AI' }, // Apple 全体の割り当て
    { cidr: '17.172.224.0/24',   name: 'Apple AI' },
    { cidr: '17.142.160.0/24',   name: 'Apple AI' },
  ];

  try {
    const prefixes = await fetchIpRanges();

    if (prefixes.length > 0) {
      cache = { prefixes, fetchedAt: now };
      console.log(`📦 IP range cache updated: ${prefixes.length} ranges`);
      return prefixes;
    } else {
      // 全部失敗した場合はフォールバック
      console.warn('⚠️ Using fallback IP ranges');
      cache = { prefixes: FALLBACK_RANGES, fetchedAt: now };
      return FALLBACK_RANGES;
    }
  } catch (err) {
    console.error('❌ IP range fetch error:', err);
    return FALLBACK_RANGES;
  }
}

// ========================================
// IPがAIクローラーかチェック（メイン検索関数）
// ========================================
export async function checkIpRangeDynamic(ip) {
  if (!ip || ip === 'unknown' || ip.includes(':')) return null; // IPv6スキップ

  const ranges = await getAiIpRanges();

  for (const { cidr, name } of ranges) {
    if (isIpInCidr(ip, cidr)) return name;
  }

  return null;
}