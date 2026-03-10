/**
 * AI観測ラボ - クローラー検知ロジック v5.5
 *
 * v5.4からの変更点:
 * 1. Accept-Language: 3段階判定（+3/+2/+1/-1）
 * 2. Accept詳細強化: text/html単独も+2
 * 3. Sec-Fetch-*: 欠如+3、人間シグナル-1〜-3
 * 4. sec-fetch-present: -1（headless Chrome対策）
 * 5. スコア上限: 31 → 35
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 検索エンジン・Google系Bot（AIではない）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SEARCH_ENGINE_PATTERNS = [
  'duckduckbot',
  'bingbot',
  'msnbot',
  'bingpreview',
  'googlebot',
  'slurp',
  'yandexbot',
  'baiduspider',
  'ia_archiver',
  'lighthouse',
  'vercel-screenshot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'discordbot',
  'whatsapp',
  'telegrambot',
  'slackbot',
  'adsbot-google',
  'chrome-lighthouse',
  'googleother',
  'google-inspectiontool',
  'apis-google',
  'google-safety',
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. AIクローラー定義
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AI_CRAWLERS = [
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
  {
    name: 'ClaudeBot',
    purpose: 'training',
    patterns: ['claudebot', 'anthropic'],
    officialDomains: ['anthropic.com'],
    ipRanges: ['160.79.104.0/23'],
  },
  {
    name: 'Claude-User',
    purpose: 'realtime',
    patterns: ['claude-user', 'claude-web', 'claude/'],
    officialDomains: ['anthropic.com'],
    ipRanges: ['160.79.104.0/23'],
  },
  {
    name: 'Claude-SearchBot',
    purpose: 'search-summary',
    patterns: ['claude-searchbot'],
    officialDomains: ['anthropic.com'],
    ipRanges: [],
  },
  {
    name: 'PerplexityBot',
    purpose: 'search-summary',
    patterns: ['perplexitybot'],
    officialDomains: ['perplexity.ai'],
    ipRanges: [],
  },
  {
    name: 'Gemini',
    purpose: 'training',
    patterns: ['google-extended'],
    officialDomains: ['google.com'],
    ipRanges: [],
  },
  {
    name: 'Microsoft Copilot',
    purpose: 'search-summary',
    patterns: ['copilotbot'],
    officialDomains: ['microsoft.com'],
    ipRanges: ['40.77.167.0/24', '207.46.13.0/24'],
  },
  {
    name: 'Meta AI',
    purpose: 'training',
    patterns: ['meta-externalagent', 'meta-externalachecker', 'facebookai', 'metaai'],
    officialDomains: ['meta.com', 'facebook.com'],
    ipRanges: [],
  },
  {
    name: 'Grok',
    purpose: 'realtime',
    patterns: ['xai', 'grokbot'],
    officialDomains: ['x.ai'],
    ipRanges: [],
  },
  {
    name: 'Mistral',
    purpose: 'training',
    patterns: ['mistral', 'mistralbot', 'le-chat'],
    officialDomains: ['mistral.ai'],
    ipRanges: [],
  },
  {
    name: 'DeepSeek',
    purpose: 'training',
    patterns: ['deepseek', 'deepseekbot'],
    officialDomains: ['deepseek.com'],
    ipRanges: [],
  },
  {
    name: 'Cohere',
    purpose: 'training',
    patterns: ['cohere', 'coherebot', 'command-r'],
    officialDomains: ['cohere.com'],
    ipRanges: [],
  },
  {
    name: 'YouBot',
    purpose: 'search-summary',
    patterns: ['youbot'],
    officialDomains: ['you.com'],
    ipRanges: [],
  },
  {
    name: 'Phind',
    purpose: 'search-summary',
    patterns: ['phindbot'],
    officialDomains: ['phind.com'],
    ipRanges: [],
  },
  {
    name: 'HuggingFaceBot',
    purpose: 'academic',
    patterns: ['transformersbot'],
    officialDomains: ['huggingface.co'],
    ipRanges: [],
  },
  {
    name: 'CCBot',
    purpose: 'academic',
    patterns: ['ccbot', 'commoncrawl'],
    officialDomains: ['commoncrawl.org'],
    ipRanges: [],
  },
  {
    name: 'AppleBot',
    purpose: 'training',
    patterns: ['applebot'],
    officialDomains: ['applebot.apple.com'],
    ipRanges: [],
  },
  {
    name: 'AmazonBot',
    purpose: 'training',
    patterns: ['amazonbot'],
    officialDomains: ['amazon.com'],
    ipRanges: [],
  },
  {
    name: 'ByteSpider',
    purpose: 'training',
    patterns: ['bytespider'],
    officialDomains: ['bytedance.com'],
    ipRanges: [],
  },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. メモリキャッシュ
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
  return last ? (now - last) < 1000 : false;
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
// 4. セッションID生成（ip + ua + 10分バケット）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function makeSessionId(ip, ua) {
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const raw = `${ip}::${ua}::${bucket}`;
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
//   totalScore = uaScore(0-40) + ipScore(0-30) + behaviorScore(0-35) + rapidScore(0-10)
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
    req.headers.get?.('cf-connecting-ip') ||
    req.headers.get?.('x-real-ip') ||
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

  const cookie = (
    req.headers.get?.('cookie') ||
    req.headers['cookie'] || ''
  );

  // v5.5: Sec-Fetch-* ヘッダー取得
  const secFetchSite = (
    req.headers.get?.('sec-fetch-site') ||
    req.headers['sec-fetch-site'] || ''
  ).toLowerCase();

  const secFetchMode = (
    req.headers.get?.('sec-fetch-mode') ||
    req.headers['sec-fetch-mode'] || ''
  ).toLowerCase();

  const secFetchDest = (
    req.headers.get?.('sec-fetch-dest') ||
    req.headers['sec-fetch-dest'] || ''
  ).toLowerCase();

  const secFetchUser = (
    req.headers.get?.('sec-fetch-user') ||
    req.headers['sec-fetch-user'] || ''
  );

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

  // ── STEP 1: 検索エンジン判定 ────────────────────────────
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

  // ── STEP 1.5: 正規アプリ・偽装UA判定 ────────────────────
  const LEGITIMATE_APP_PATTERNS = [
    'gsa/', 'yjapp-', 'jp.co.yahoo', 'yahoojapan/',
    'com.yahoo.', 'yjtop', 'line/', 'fbav/', 'instagram',
  ];

  const isLegitimateApp = LEGITIMATE_APP_PATTERNS.some(p => ua.includes(p));
  if (isLegitimateApp) {
    return {
      ...base,
      isHuman: true,
      crawlerType: 'human',
      crawlerName: 'Human',
      detectionMethod: 'human-default',
      confidence: 70,
      totalScore: 0,
    };
  }

  const iosMatch = ua.match(/iphone os (\d+)_/);
  if (iosMatch && parseInt(iosMatch[1]) >= 19) {
    return { ...base, crawlerType: 'spoofed-bot', crawlerName: 'Spoofed-iOS', detectionMethod: 'ua-normalization', confidence: 90, totalScore: 90 };
  }

  const ipadMatch = ua.match(/cpu os (\d+)_/);
  if (ipadMatch && parseInt(ipadMatch[1]) >= 19) {
    return { ...base, crawlerType: 'spoofed-bot', crawlerName: 'Spoofed-iOS', detectionMethod: 'ua-normalization', confidence: 90, totalScore: 90 };
  }

  if (ua.includes('android 10; k)')) {
    return { ...base, isSearchEngine: true, crawlerType: 'search-engine', crawlerName: 'Googlebot-family', detectionMethod: 'ua-normalization', confidence: 90, totalScore: 90 };
  }

  const chromeMatch = ua.match(/chrome\/(\d+)\./);
  if (chromeMatch && parseInt(chromeMatch[1]) >= 200) {
    return { ...base, crawlerType: 'spoofed-bot', crawlerName: 'Spoofed-Chrome', detectionMethod: 'ua-normalization', confidence: 85, totalScore: 85 };
  }

  if (ua.includes('vercel-screenshot')) {
    return { ...base, crawlerType: 'other-bot', crawlerName: 'Vercel-Screenshot', detectionMethod: 'ua-normalization', confidence: 99, totalScore: 99 };
  }

  if (
    ua.includes('nexus 5x build/mmb29p') ||
    ua.includes('moto g (4)') ||
    ua.includes('cros x86_64 14541')
  ) {
    return { ...base, isSearchEngine: true, crawlerType: 'search-engine', crawlerName: 'Googlebot-family', detectionMethod: 'ua-normalization', confidence: 90, totalScore: 90 };
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
    method, referer, robots, htmlOnly, cookie,
    secFetchSite, secFetchMode, secFetchDest, secFetchUser,
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
//
// v5.5: Sec-Fetch-* 判定追加
//       Accept-Language 3段階判定
//       Accept詳細強化
//       スコア上限: 31 → 35
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeBehavior({
  ua, acceptEncoding, acceptLang, accept, secChUa, connection,
  method, referer, robots, htmlOnly, cookie,
  secFetchSite, secFetchMode, secFetchDest, secFetchUser,
}) {
  let score = 0;
  const reasons = [];

  // Accept-Language: 3段階判定
  if (!acceptLang) {
    score += 3;
    reasons.push('no-accept-language');
  } else if (
    /[^\x20-\x7E]/.test(acceptLang) ||
    /q=[^01]/.test(acceptLang) ||
    acceptLang.trim() === '*'
  ) {
    score += 2;
    reasons.push('abnormal-accept-language');
  } else if (/^[a-z]{2}(-[A-Z]{2})?$/.test(acceptLang.trim())) {
    score += 1;
    reasons.push('minimal-accept-language');
  } else if (/ja/.test(acceptLang)) {
    score -= 1;
    reasons.push('ja-accept-language');
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
    (ua.includes('chrome') || ua.includes('firefox') || ua.includes('safari'));

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

  // Accept詳細強化
  if (accept === '*/*') {
    score += 3;
    reasons.push('accept-wildcard');
  } else if (accept === 'text/html' || accept === 'text/html;charset=utf-8') {
    score += 2;
    reasons.push('accept-html-only');
  }

  const looksLikeChrome =
    ua.includes('chrome') && ua.includes('mozilla') &&
    !ua.includes('edg') && !ua.includes('opr');
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

  if (!cookie && hasBrowserUA) {
    score += 3;
    reasons.push('no-cookie-with-browser-ua');
  }

  // Sec-Fetch-* 判定
  const hasSec = secFetchSite || secFetchMode || secFetchDest;

  if (!hasSec && hasBrowserUA) {
    // ブラウザUAなのにSec-Fetch完全欠如 → UA偽装bot疑い
    score += 3;
    reasons.push('sec-fetch-missing-with-browser-ua');
  } else if (hasSec) {
    if (
      secFetchSite === 'none' &&
      secFetchMode === 'navigate' &&
      secFetchDest === 'document'
    ) {
      // ユーザー直接アクセスの強いシグナル
      score -= 3;
      reasons.push('sec-fetch-direct-navigation');
      if (secFetchUser === '?1') {
        score -= 1;
        reasons.push('sec-fetch-user-gesture');
      }
    } else {
      // Sec-Fetch一式存在（headless Chromeも付けるので-1に留める）
      score -= 1;
      reasons.push('sec-fetch-present');
    }
  }

  return { score: Math.min(score, 35), reasons };
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