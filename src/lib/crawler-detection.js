/**
 * AI観測ラボ - クローラー検知ロジック v5.4
 *
 * v5.3からの変更点:
 * 1. makeSessionId: ip + ua + 10分バケット（NAT環境のセッション混在を防止）
 * 2. isRapidAccess: 閾値 300ms → 1000ms（AI crawlerの実際のアクセス間隔に合わせる）
 * 3. analyzeBehavior: Cookie無しシグナルを追加（+3点）
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
  'lighthouse',
  'vercel-screenshot', 
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

  // ── Perplexity ──────────────────────────────────────────
  {
    name: 'PerplexityBot',
    purpose: 'search-summary',
    patterns: ['perplexitybot'],
    officialDomains: ['perplexity.ai'],
    ipRanges: [],
  },

  // ── Google Gemini（AI学習専用UAのみ）──────────────────
  {
    name: 'Gemini',
    purpose: 'training',
    patterns: ['google-extended'],
    officialDomains: ['google.com'],
    ipRanges: [],
  },

  // ── Microsoft Copilot ───────────────────────────────────
  {
    name: 'Microsoft Copilot',
    purpose: 'search-summary',
    patterns: ['copilotbot'],
    officialDomains: ['microsoft.com'],
    ipRanges: ['40.77.167.0/24', '207.46.13.0/24'],
  },

  // ── Meta AI ─────────────────────────────────────────────
  {
    name: 'Meta AI',
    purpose: 'training',
    patterns: ['meta-externalagent', 'meta-externalachecker', 'facebookai', 'metaai'],
    officialDomains: ['meta.com', 'facebook.com'],
    ipRanges: [],
  },

  // ── xAI (Grok) ──────────────────────────────────────────
  {
    name: 'Grok',
    purpose: 'realtime',
    patterns: ['xai', 'grokbot'],
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
    patterns: ['phindbot'],
    officialDomains: ['phind.com'],
    ipRanges: [],
  },

  // ── Hugging Face ────────────────────────────────────────
  {
    name: 'HuggingFaceBot',
    purpose: 'academic',
    patterns: ['transformersbot'],
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
    patterns: ['bytespider'],
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
  // v5.4: 300ms → 1000ms
  // AI crawlerの実際のアクセス間隔は0.3〜2秒が多い。
  // 300msは厳しすぎて正規ブラウザ（スマホの低速回線等）を誤検知しやすかった。
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
// 4. セッションID生成
//
// v5.4: ip + ua + 10分バケット
// 理由: NAT環境（会社・大学・携帯キャリア）では複数ユーザーが同一IPを共有する。
//       ip + ua だけだと同一IPの異なる人間がセッション混在する問題があった。
//       10分バケットを加えることで、同じIP/UAであっても時間窓が変わればID変化し、
//       「同じセッションの連続アクセス」と「別タイミングのアクセス」を区別できる。
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function makeSessionId(ip, ua) {
  // 10分単位のバケット（epoch ms / 10min）
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
//   totalScore = uaScore(0-40) + ipScore(0-30) + behaviorScore(0-31) + rapidScore(0-10)
//   ※ behaviorスコア上限を28→31に更新（cookie無しシグナル+3追加のため）
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

  // v5.4: cookie ヘッダーを追加取得
  const cookie = (
    req.headers.get?.('cookie') ||
    req.headers['cookie'] || ''
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

  // ── STEP 1.5: 偽装UA・正規化ルール ──────────────────────
  const LEGITIMATE_APP_PATTERNS = [
    'gsa/',          // Google Search App (iOS)
    'yjapp-',        // Yahoo! JAPAN アプリ (Android)
    'jp.co.yahoo',   // Yahoo! JAPAN アプリ識別子
    'yahoojapan/',   // Yahoo Japan 関連
    'com.yahoo.',    // Yahoo アプリ系 bundle ID
    'yjtop',         // Yahoo! JAPANトップ
    'line/',         // LINE アプリ内ブラウザ
    'fbav/',         // Facebook アプリ内ブラウザ
    'instagram',     // Instagram アプリ内ブラウザ
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
  if (iosMatch) {
    const majorVersion = parseInt(iosMatch[1]);
    if (majorVersion >= 19) {
      return {
        ...base,
        crawlerType: 'spoofed-bot',
        crawlerName: 'Spoofed-iOS',
        detectionMethod: 'ua-normalization',
        confidence: 90,
        totalScore: 90,
      };
    }
  }

  const ipadMatch = ua.match(/cpu os (\d+)_/);
  if (ipadMatch) {
    const majorVersion = parseInt(ipadMatch[1]);
    if (majorVersion >= 19) {
      return {
        ...base,
        crawlerType: 'spoofed-bot',
        crawlerName: 'Spoofed-iOS',
        detectionMethod: 'ua-normalization',
        confidence: 90,
        totalScore: 90,
      };
    }
  }

  if (ua.includes('android 10; k)')) {
    return {
      ...base,
      isSearchEngine: true,
      crawlerType: 'search-engine',
      crawlerName: 'Googlebot-family',
      detectionMethod: 'ua-normalization',
      confidence: 90,
      totalScore: 90,
    };
  }

  const chromeMatch = ua.match(/chrome\/(\d+)\./);
  if (chromeMatch) {
    const chromeVersion = parseInt(chromeMatch[1]);
    if (chromeVersion >= 200) {
      return {
        ...base,
        crawlerType: 'spoofed-bot',
        crawlerName: 'Spoofed-Chrome',
        detectionMethod: 'ua-normalization',
        confidence: 85,
        totalScore: 85,
      };
    }
  }

  if (ua.includes('vercel-screenshot')) {
    return {
      ...base,
      crawlerType: 'other-bot',
      crawlerName: 'Vercel-Screenshot',
      detectionMethod: 'ua-normalization',
      confidence: 99,
      totalScore: 99,
    };
  }

  if (
    ua.includes('nexus 5x build/mmb29p') ||
    ua.includes('moto g (4)') ||
    ua.includes('cros x86_64 14541')
  ) {
    return {
      ...base,
      isSearchEngine: true,
      crawlerType: 'search-engine',
      crawlerName: 'Googlebot-family',
      detectionMethod: 'ua-normalization',
      confidence: 90,
      totalScore: 90,
    };
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
// v5.4: cookie 引数を追加
//       スコア上限: 28 → 31
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeBehavior({
  ua, acceptEncoding, acceptLang, accept, secChUa, connection,
  method, referer, robots, htmlOnly, cookie,
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

  // v5.4: Cookie無し判定
  // AIクローラーはセッションを維持しないためcookieを送らないことが多い。
  // ただしブラウザUAを偽装している場合のみカウント（純粋なbot UAはno-browser-uaで加点済み）。
  // 正規ブラウザの初回アクセスでも cookie='' になるため、
  // 他のシグナル（no-accept-language等）との組み合わせで効果を発揮する設計。
  if (!cookie && hasBrowserUA) {
    score += 3;
    reasons.push('no-cookie-with-browser-ua');
  }

  // スコア上限: v5.3=28 → v5.4=31（+3追加のため更新）
  return { score: Math.min(score, 31), reasons };
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