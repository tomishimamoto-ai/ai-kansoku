// ========================================
// lib/ip-ranges.js
// 各社公式JSONからIPレンジを動的取得・キャッシュ
// ========================================

// キャッシュ: { prefixes: [], fetchedAt: timestamp }
let cache = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間

// 公式JSONエンドポイント一覧
const IP_RANGE_SOURCES = [
  {
    url: 'https://openai.com/gptbot.json',
    name: 'ChatGPT',
    format: 'openai' // { prefixes: [{ ipv4Prefix: '...' }] }
  },
  {
    url: 'https://openai.com/chatgpt-user.json',
    name: 'ChatGPT',
    format: 'openai'
  },
  {
    url: 'https://openai.com/searchbot.json',
    name: 'ChatGPT',
    format: 'openai'
  },
  {
    url: 'https://developers.google.com/static/search/apis/ipranges/googlebot.json',
    name: 'Gemini',
    format: 'google' // { prefixes: [{ ipv4Prefix: '...' }, { ipv6Prefix: '...' }] }
  },
  {
    url: 'https://www.perplexity.com/perplexitybot.json',
    name: 'Perplexity',
    format: 'openai'
  },
  {
    url: 'https://duckduckgo.com/duckduckbot.json',
    name: 'DuckDuckGo',
    format: 'openai'
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
            next: { revalidate: 0 } // Next.jsキャッシュを使わない
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000)
          )
        ]);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const items = json.prefixes || json.ipRanges || [];

        for (const item of items) {
          const cidr = item.ipv4Prefix || item.ip_prefix;
          if (cidr && cidr.includes('.')) { // IPv4のみ
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
  if (cache && (now - cache.fetchedAt) < CACHE_TTL) {
    return cache.prefixes;
  }

  // 取得失敗時のフォールバック（ハードコードされた最低限のリスト）
  const FALLBACK_RANGES = [
    { cidr: '23.102.140.112/28', name: 'ChatGPT' },
    { cidr: '13.65.240.240/28',  name: 'ChatGPT' },
    { cidr: '160.79.104.0/23',   name: 'Claude'  },
    { cidr: '66.249.64.0/19',    name: 'Gemini'  },
    { cidr: '52.7.25.0/24',      name: 'Perplexity' },
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