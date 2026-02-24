/**
 * AI観測ラボ - クローラー検知ロジック v5.3
 *
 * v5.2からの変更点:
 * 1. SEARCH_ENGINE_PATTERNS に以下を追加
 *    - adsbot-google（Google広告クローラー）
 *    - chrome-lighthouse（パフォーマンス計測）
 *    - googleother（Google汎用クローラー）
 *    - google-inspectiontool（Search Console）
 *    - apis-google（Google API）
 *    - google-safety（Googleセーフブラウジング）
 * 2. GeminiのAI_CRAWLERSパターンを純粋なAI系のみに絞る
 *    - google-extended のみ残す（Gemini学習用の公式UA）
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 検索エンジン・Google系Bot（AIではない）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SEARCH_ENGINE_PATTERNS = [
  // 検索エンジン
  'duckduckbot',
  'bingbot',
  'msnbot',
  'bingpreview',
  'googlebot',
  'slurp',
  'yandexbot',
  'baiduspider',
  'ia_archiver',
  // SNS系
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'discordbot',
  'whatsapp',
  'telegrambot',
  'slackbot',
  // Google系Bot（AI学習ではない）
  'adsbot-google',        // Google広告クローラー
  'chrome-lighthouse',    // PageSpeed Insights / Lighthouse
  'googleother',          // Google汎用クローラー
  'google-inspectiontool',// Search Console URL検査
  'apis-google',          // Google API
  'google-safety',        // Googleセーフブラウジング
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. AIクローラー定義
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AI_CRAWLERS = [

  // ── OpenAI ──────────────────────────────────────────────
  {
    name: 'GPTBot',
    purpose: 'training',
    patterns: ['gptbot'],
    officialDomains: ['openai.com'],
    ipRanges: [
      '20.15.240.64/28', '20.15.240.80/28', '20.15.240.96/28',
      '20.15.240.176/28', '20.15.241.0/28', '20.15.243.128/28',
    ],
  },
  {
    name: 'ChatGPT-User',
    purpose: 'realtime',
    patterns: ['chatgpt-user', 'chatgpt/1.'],
    officialDomains: ['openai.com'],
    ipRanges: [],
  },
  {
    name: 'SearchGPT',
    purpose: 'search-summary',
    patterns: ['oai-searchbot'],
    officialDomains: ['openai.com'],
    ipRanges: [],
  },

  // ── Anthropic (Claude) ──────────────────────────────────
  {
    name: 'Claude',
    purpose: 'realtime',
    patterns: ['claudebot', 'claude-web', 'anthropic', 'claude/'],
    officialDomains: ['anthropic.com'],
    ipRanges: ['160.79.104.0/23'],
  },

  // ── Perplexity ──────────────────────────────────────────
  {
    name: 'PerplexityBot',
    purpose: 'search-summary',
    patterns: ['perplexitybot', 'perplexity'],
    officialDomains: ['perplexity.ai'],
    ipRanges: [],
  },

  // ── Google Gemini（AI学習専用UAのみ）──────────────────
  {
    name: 'Gemini',
    purpose: 'training',
    patterns: [
      'google-extended', // Gemini学習用の公式UA（これのみ残す）
      'bard',
      'gemini',
    ],
    officialDomains: ['google.com'],
    ipRanges: [],
  },

  // ── Microsoft Copilot ───────────────────────────────────
  {
    name: 'Microsoft Copilot',
    purpose: 'search-summary',
    patterns: ['copilot'],
    officialDomains: ['microsoft.com'],
    ipRanges: ['40.77.167.0/24', '207.46.13.0/24'],
  },

  // ── Meta AI ─────────────────────────────────────────────
  {
    name: 'Meta AI',
    purpose: 'training',
    patterns: ['meta-externalagent', 'meta-externalachecker', 'facebookai', 'metaai', 'llama'],
    officialDomains: ['meta.com', 'facebook.com'],
    ipRanges: [],
  },

  // ── xAI (Grok) ──────────────────────────────────────────
  {
    name: 'Grok',
    purpose: 'realtime',
    patterns: ['grok', 'xai', 'grokbot'],
    officialDomains: ['x.ai'],
    ipRanges: [],
  },

  // ── Mistral ─────────────────────────────────────────────
  {
    name: 'Mistral',
    purpose: 'training',
    patterns: ['mistral', 'mistralbot', 'le-chat'],
    officialDomains: ['mistral.ai'],
    ipRanges: [],
  },

  // ── DeepSeek ────────────────────────────────────────────
  {
    name: 'DeepSeek',
    purpose: 'training',
    patterns: ['deepseek', 'deepseekbot'],
    officialDomains: ['deepseek.com'],
    ipRanges: [],
  },

  // ── Cohere ──────────────────────────────────────────────
  {
    name: 'Cohere',
    purpose: 'training',
    patterns: ['cohere', 'coherebot', 'command-r'],
    officialDomains: ['cohere.com'],
    ipRanges: [],
  },

  // ── You.com ─────────────────────────────────────────────
  {
    name: 'YouBot',
    purpose: 'search-summary',
    patterns: ['youbot'],
    officialDomains: ['you.com'],
    ipRanges: [],
  },

  // ── Phind ───────────────────────────────────────────────
  {
    name: 'Phind',
    purpose: 'search-summary',
    patterns: ['phindbot', 'phind'],
    officialDomains: ['phind.com'],
    ipRanges: [],
  },

  // ── Hugging Face ────────────────────────────────────────
  {
    name: 'HuggingFaceBot',
    purpose: 'academic',
    patterns: ['huggingface', 'transformersbot'],
    officialDomains: ['huggingface.co'],
    ipRanges: [],
  },

  // ── Common Crawl ────────────────────────────────────────
  {
    name: 'CCBot',
    purpose: 'academic',
    patterns: ['ccbot', 'commoncrawl'],
    officialDomains: ['commoncrawl.org'],
    ipRanges: [],
  },

  // ── Apple ───────────────────────────────────────────────
  {
    name: 'AppleBot',
    purpose: 'training',
    patterns: ['applebot'],
    officialDomains: ['applebot.apple.com'],
    ipRanges: [],
  },

  // ── Amazon ──────────────────────────────────────────────
  {
    name: 'AmazonBot',
    purpose: 'training',
    patterns: ['amazonbot'],
    officialDomains: ['amazon.com'],
    ipRanges: [],
  },

  // ── Bytedance ───────────────────────────────────────────
  {
    name: 'ByteSpider',
    purpose: 'training',
    patterns: ['bytespider', 'bytedance'],
    officialDomains: ['bytedance.com'],
    ipRanges: [],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. メモリキャッシュ（Serverlessでは補助的）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const accessMap   = new Map();
const robotsMap   = new Map();
const htmlOnlyMap = new Map();

export function isRapidAccess(ip) {
  if (!ip) return false;
  const now  = Date.now();
  const last = accessMap.get(ip);
  accessMap.set(ip, now);
  pruneMap(accessMap, 10000, now - 60_000);
  return last ? (now - last) < 300 : false;
}

export function markRobotsAccess(ip) {
  if (!ip) return;
  robotsMap.set(ip, Date.now());
  pruneMap(robotsMap, 10000, Date.now() - 30_000);
}

export function hadRobotsAccess(ip) {
  const t = robotsMap.get(ip);
  return t ? (Date.now() - t) < 5_000 : false;
}

export function trackHtmlOnly(ip, path) {
  const isHtml = !path.match(/\.(css|js|png|jpg|webp|svg|woff|woff2|ico|gif|mp4|pdf)$/i);
  if (!htmlOnlyMap.has(ip)) htmlOnlyMap.set(ip, { html: 0, total: 0 });
  const entry = htmlOnlyMap.get(ip);
  entry.total++;
  if (isHtml) entry.html++;
  pruneMap(htmlOnlyMap, 10000, null);
}

export function isHtmlOnly(ip) {
  const entry = htmlOnlyMap.get(ip);
  if (!entry || entry.total < 10) return false;
  return (entry.html / entry.total) >= 0.95;
}

function pruneMap(map, maxSize, cutoffTime) {
  if (map.size <= maxSize) return;
  for (const [k, v] of map.entries()) {
    if (cutoffTime !== null) {
      const t = typeof v === 'number' ? v : v?.updatedAt ?? 0;
      if (t < cutoffTime) map.delete(k);
    } else {
      map.delete(k);
      if (map.size <= maxSize * 0.8) break;
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. セッションID生成
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function makeSessionId(ip, ua) {
  const raw = `${ip}::${ua}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. メイン検知関数
//
//   totalScore = uaScore(0-40) + ipScore(0-30) + behaviorScore(0-28) + rapidScore(0-10)
//   >= 70 → AI (confirmed)
//   >= 40 → AI (suspicious)
//   <  40 → Human
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function detectCrawler(req, { path = '/', hadRobotsDb = false } = {}) {
  const ua = (
    req.headers.get?.('user-agent') ||
    req.headers['user-agent'] || ''
  ).toLowerCase();

  const ip = (
    req.headers.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.ip || ''
  );

  const referer = (
    req.headers.get?.('referer') ||
    req.headers['referer'] || ''
  ).toLowerCase();

  const acceptEncoding = (
    req.headers.get?.('accept-encoding') ||
    req.headers['accept-encoding'] || ''
  ).toLowerCase();

  const acceptLang = (
    req.headers.get?.('accept-language') ||
    req.headers['accept-language'] || ''
  );

  const accept = (
    req.headers.get?.('accept') ||
    req.headers['accept'] || ''
  ).toLowerCase();

  const secChUa = (
    req.headers.get?.('sec-ch-ua') ||
    req.headers['sec-ch-ua'] || ''
  );

  const connection = (
    req.headers.get?.('connection') ||
    req.headers['connection'] || ''
  ).toLowerCase();

  const method    = req.method || 'GET';
  const rapid     = isRapidAccess(ip);
  const robots    = hadRobotsDb || hadRobotsAccess(ip);
  const htmlOnly  = isHtmlOnly(ip);
  const sessionId = makeSessionId(ip, ua);

  if (path === '/robots.txt') markRobotsAccess(ip);
  trackHtmlOnly(ip, path);

  const base = {
    isAI: false,
    isSearchEngine: false,
    isHuman: false,
    crawlerName: 'Unknown',
    crawlerType: 'unknown',
    purpose: 'unknown',
    detectionMethod: 'none',
    confidence: 0,
    totalScore: 0,
    rapid,
    robots,
    htmlOnly,
    sessionId,
  };

  // ── STEP 1: 検索エンジン・Google系Bot判定 ──────────────
  for (const pattern of SEARCH_ENGINE_PATTERNS) {
    if (ua.includes(pattern)) {
      return {
        ...base,
        isSearchEngine: true,
        crawlerType: 'search-engine',
        crawlerName: formatName(pattern),
        detectionMethod: 'search-engine-ua',
        confidence: 95,
        totalScore: 95,
      };
    }
  }

  // ── STEP 2 & 3: 統合スコア計算 ─────────────────────────
  let uaScore        = 0;
  let ipScore        = 0;
  let matchedCrawler = null;

  for (const crawler of AI_CRAWLERS) {
    for (const pattern of crawler.patterns) {
      if (ua.includes(pattern.toLowerCase())) {
        uaScore = 40;
        matchedCrawler = crawler;
        break;
      }
    }
    if (matchedCrawler) break;
  }

  if (!ip.includes(':')) {
    for (const crawler of AI_CRAWLERS) {
      for (const cidr of (crawler.ipRanges || [])) {
        if (isIpInCidr(ip, cidr)) {
          if (matchedCrawler?.name === crawler.name) {
            ipScore = 30;
          } else if (!matchedCrawler) {
            ipScore = 20;
            matchedCrawler = crawler;
          }
          break;
        }
      }
      if (ipScore > 0) break;
    }
  }

  const behavior = analyzeBehavior({
    ua, acceptEncoding, acceptLang, accept, secChUa, connection,
    method, referer, robots, htmlOnly,
  });

  const rapidScore = rapid ? 10 : 0;
  const totalScore = uaScore + ipScore + behavior.score + rapidScore;

  // ── STEP 4: 判定 ────────────────────────────────────────
  if (matchedCrawler && (uaScore > 0 || ipScore > 0)) {
    const detectionMethod =
      uaScore > 0 && ipScore > 0 ? 'user-agent+ip-range' :
      uaScore > 0               ? 'user-agent' :
                                   'ip-range';
    return {
      ...base,
      isAI: true,
      crawlerType: 'ai',
      crawlerName: matchedCrawler.name,
      purpose: matchedCrawler.purpose,
      detectionMethod,
      confidence: Math.min(uaScore + ipScore + (rapid ? 5 : 0), 99),
      totalScore,
    };
  }

  if (totalScore >= 70) {
    const hinted = AI_CRAWLERS.find(c =>
      c.officialDomains?.some(d => referer.includes(d))
    );
    return {
      ...base,
      isAI: true,
      crawlerType: 'ai',
      crawlerName: hinted?.name || 'Unknown AI',
      purpose: hinted?.purpose || 'unknown',
      detectionMethod: rapid ? 'pattern-inference+rapid' : 'pattern-inference',
      confidence: Math.min(50 + behavior.score * 3 + (rapid ? 10 : 0), 85),
      totalScore,
      behaviorDetails: behavior.reasons,
    };
  }

  if (totalScore >= 40) {
    return {
      ...base,
      isAI: true,
      crawlerType: 'ai',
      crawlerName: 'Unknown AI (Suspicious)',
      purpose: 'unknown',
      detectionMethod: 'pattern-inference',
      confidence: Math.min(50 + behavior.score * 3 + (rapid ? 10 : 0), 65),
      totalScore,
      behaviorDetails: behavior.reasons,
    };
  }

  return {
    ...base,
    isHuman: true,
    crawlerType: 'human',
    crawlerName: 'Human',
    detectionMethod: 'human-default',
    confidence: 70,
    totalScore,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. 行動パターン分析
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeBehavior({
  ua, acceptEncoding, acceptLang, accept, secChUa, connection,
  method, referer, robots, htmlOnly,
}) {
  let score = 0;
  const reasons = [];

  if (!acceptLang) {
    score += 4;
    reasons.push('no-accept-language');
  }

  if (!acceptEncoding || acceptEncoding === 'identity') {
    score += 4;
    reasons.push('minimal-encoding');
  } else if (!acceptEncoding.includes('br') && !acceptEncoding.includes('zstd')) {
    score += 2;
    reasons.push('no-modern-encoding');
  }

  if (method === 'HEAD') {
    score += 4;
    reasons.push('head-method');
  }

  const hasBrowserUA =
    ua.includes('mozilla') &&
    (
      ua.includes('chrome') ||
      ua.includes('firefox') ||
      ua.includes('safari')
    );

  if (!hasBrowserUA) {
    score += 4;
    reasons.push('no-browser-ua');
  }

  if (ua.length < 50) {
    score += 2;
    reasons.push('short-ua');
  }

  if (!referer) {
    score += 2;
    reasons.push('no-referer');
  }

  if (robots) {
    score += 3;
    reasons.push('robots-first');
  }

  if (htmlOnly) {
    score += 3;
    reasons.push('html-only');
  }

  if (accept === '*/*') {
    score += 3;
    reasons.push('simple-accept');
  }

  const looksLikeChrome =
    ua.includes("chrome") &&
    ua.includes("mozilla") &&
    !ua.includes("edg") &&
    !ua.includes("opr");
  if (!secChUa && looksLikeChrome) {
    score += 4;
    reasons.push('ua-spoofing-suspected');
  } else if (!secChUa && !hasBrowserUA) {
    score += 2;
    reasons.push('no-sec-ch-ua');
  }

  if (connection === 'close') {
    score += 2;
    reasons.push('connection-close');
  }

  return { score: Math.min(score, 28), reasons };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. ユーティリティ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function isIpInCidr(ip, cidr) {
  try {
    const [range, bits] = cidr.split('/');
    const mask     = ~(2 ** (32 - parseInt(bits)) - 1);
    const ipNum    = ipToNum(ip);
    const rangeNum = ipToNum(range);
    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}

function ipToNum(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) | parseInt(octet), 0) >>> 0;
}

function formatName(pattern) {
  const map = {
    duckduckbot: 'DuckDuckBot',       googlebot: 'Googlebot',
    bingbot: 'Bingbot',               msnbot: 'MSNBot',
    bingpreview: 'BingPreview',       yandexbot: 'YandexBot',
    baiduspider: 'BaiduSpider',       slurp: 'Yahoo Slurp',
    'adsbot-google': 'AdsBot-Google', 'chrome-lighthouse': 'Chrome-Lighthouse',
    'googleother': 'GoogleOther',     'google-inspectiontool': 'Google-InspectionTool',
    'apis-google': 'APIs-Google',     'google-safety': 'Google-Safety',
  };
  return map[pattern] || pattern.charAt(0).toUpperCase() + pattern.slice(1);
}