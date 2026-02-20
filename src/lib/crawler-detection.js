/**
 * AI観測ラボ - クローラー検知ロジック v5
 *
 * v4からの変更点:
 * 1. 統合スコア方式（uaScore + ipScore + behaviorScore + rapidScore）
 * 2. chatgpt パターンを 'chatgpt/1.' に絞る（過剰検知防止）
 * 3. confidence を動的計算（50 + behaviorScore*3 + rapid*10）
 * 4. セッションID導入（IP + UAハッシュ）
 * 5. robots.txt先行アクセスフラグ
 * 6. HTML only 比率チェック（補助）
 *
 * 統合スコア:
 *   uaScore      0-40  UA完全一致=40, パターン一致=30
 *   ipScore      0-30  IP+UA一致=30, IPのみ=20
 *   behaviorScore 0-20  各フラグの合算
 *   rapidScore   0-10  連続アクセス=10
 *
 *   >= 70 → AI (isAI=true)
 *   >= 40 → Suspicious (isAI=true, confidence低め)
 *   <  40 → Human
 *
 * NOTE: accessMap / robotsMap は Serverless では
 *       インスタンス分散により補助的な効果にとどまる。
 *       本番強化は Redis 推奨（将来対応）。
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 検索エンジン（AIではない）
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
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'discordbot',
  'whatsapp',
  'telegrambot',
  'slackbot',
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. AIクローラー定義
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AI_CRAWLERS = [

  // ── OpenAI: 用途別に3分割 ───────────────────────────────
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
    patterns: [
      'chatgpt-user',
      'chatgpt/1.',     // ✅ 'chatgpt'から絞る（ChatGPT-Plugin等の誤検知防止）
    ],
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

  // ── Google Gemini / AI ──────────────────────────────────
  {
    name: 'Gemini',
    purpose: 'training',
    patterns: ['google-extended', 'googleother', 'google-inspectiontool', 'bard', 'gemini'],
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
// 3. メモリキャッシュ
//    NOTE: Serverlessでは補助的効果。本番強化はRedis推奨。
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 連続アクセス検知用
const accessMap = new Map();

// robots.txt 先行アクセスフラグ
const robotsMap = new Map();

// HTMLのみアクセス比率用
const htmlOnlyMap = new Map(); // { ip: { html: n, total: n } }

/** 300ms以内の連続アクセスか */
export function isRapidAccess(ip) {
  if (!ip) return false;
  const now  = Date.now();
  const last = accessMap.get(ip);
  accessMap.set(ip, now);
  pruneMap(accessMap, 10000, now - 60_000);
  return last ? (now - last) < 300 : false;
}

/** robots.txt を先に叩いたIPか（5秒以内） */
export function markRobotsAccess(ip) {
  if (!ip) return;
  robotsMap.set(ip, Date.now());
  pruneMap(robotsMap, 10000, Date.now() - 30_000);
}

export function hadRobotsAccess(ip) {
  const t = robotsMap.get(ip);
  return t ? (Date.now() - t) < 5_000 : false;
}

/** HTML only 比率を記録（CSS/JS/画像を読まないクローラーの特徴） */
export function trackHtmlOnly(ip, path) {
  const isHtml = !path.match(/\.(css|js|png|jpg|webp|svg|woff|woff2|ico|gif|mp4|pdf)$/i);
  if (!htmlOnlyMap.has(ip)) htmlOnlyMap.set(ip, { html: 0, total: 0 });
  const entry = htmlOnlyMap.get(ip);
  entry.total++;
  if (isHtml) entry.html++;
  pruneMap(htmlOnlyMap, 10000, null); // サイズ超過時のみ間引き
}

/** HTML比率が 95% 以上か（10回以上アクセスがある場合のみ判定） */
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
      map.delete(k); // cutoff不明時は先頭から削除
      if (map.size <= maxSize * 0.8) break;
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. セッションIDの生成（IP + UAハッシュ）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function makeSessionId(ip, ua) {
  // 軽量ハッシュ（crypto不要）
  const raw = `${ip}::${ua}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. 統合スコア方式 メイン検知関数
//
//   totalScore = uaScore(0-40) + ipScore(0-30) + behaviorScore(0-20) + rapidScore(0-10)
//   >= 70 → AI  (confirmed)
//   >= 40 → AI  (suspicious)
//   <  40 → Human
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function detectCrawler(req, { path = '/' } = {}) {
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

  const method     = req.method || 'GET';
  const rapid      = isRapidAccess(ip);
  const robots     = hadRobotsAccess(ip);
  const htmlOnly   = isHtmlOnly(ip);
  const sessionId  = makeSessionId(ip, ua);

  // robots.txt のアクセスを記録
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

  // ── STEP 1: 検索エンジン判定（最優先）──────────────────
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
  let uaScore       = 0;
  let ipScore       = 0;
  let matchedCrawler = null;

  // UA判定
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

  // IP判定（IPv4のみ、TODO: IPv6対応）
  if (!ip.includes(':')) {
    for (const crawler of AI_CRAWLERS) {
      for (const cidr of (crawler.ipRanges || [])) {
        if (isIpInCidr(ip, cidr)) {
          if (matchedCrawler?.name === crawler.name) {
            // UA + IP 両方一致
            ipScore = 30;
          } else if (!matchedCrawler) {
            // IPのみ一致
            ipScore = 20;
            matchedCrawler = crawler;
          }
          break;
        }
      }
      if (ipScore > 0) break;
    }
  }

  // behavior スコア（0-20）
  const behavior = analyzeBehavior({ ua, acceptEncoding, acceptLang, method, referer, robots, htmlOnly });

  // rapid スコア（0-10）
  const rapidScore = rapid ? 10 : 0;

  const totalScore = uaScore + ipScore + behavior.score + rapidScore;

  // ── STEP 4: 判定 ────────────────────────────────────────

  // 確定AI（UA or IP 一致あり）
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

  // パターン推論（統合スコアで判定）
  if (totalScore >= 70) {
    // refererからクローラー名を推測
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
      // ✅ 動的confidence: behaviorScore に基づいて計算
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

  // ── STEP 5: 人間判定 ─────────────────────────────────────
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
// 6. 行動パターン分析（0-20点）
//
//   no-accept-language : +4  最も強いシグナル
//   minimal-encoding   : +4
//   head-method        : +4
//   no-browser-ua      : +4  ※ mozilla偽装は STEP2で先に捕捉済み
//   short-ua           : +2
//   no-referer         : +2  ✅ 復活（補助）
//   robots-first       : +3  ✅ 新規: robots.txtを先に叩いた
//   html-only          : +3  ✅ 新規: CSS/JS/画像を読まない
//
//   合計上限: 20点（rawが超えても20でキャップ）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function analyzeBehavior({ ua, acceptEncoding, acceptLang, method, referer, robots, htmlOnly }) {
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
    ua.includes('mozilla') ||
    ua.includes('chrome')  ||
    ua.includes('safari')  ||
    ua.includes('firefox');
  if (!hasBrowserUA) {
    score += 4;
    reasons.push('no-browser-ua');
  }

  if (ua.length < 50) {
    score += 2;
    reasons.push('short-ua');
  }

  if (!referer) {
    score += 2;  // ✅ 復活（補助スコア）
    reasons.push('no-referer');
  }

  if (robots) {
    score += 3;  // ✅ 新規: robots.txt先行アクセス
    reasons.push('robots-first');
  }

  if (htmlOnly) {
    score += 3;  // ✅ 新規: HTML only（CSS/JS/画像を読まない）
    reasons.push('html-only');
  }

  return { score: Math.min(score, 20), reasons };
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
    duckduckbot: 'DuckDuckBot', googlebot: 'Googlebot',
    bingbot: 'Bingbot',         msnbot: 'MSNBot',
    bingpreview: 'BingPreview', yandexbot: 'YandexBot',
    baiduspider: 'BaiduSpider', slurp: 'Yahoo Slurp',
  };
  return map[pattern] || pattern.charAt(0).toUpperCase() + pattern.slice(1);
}