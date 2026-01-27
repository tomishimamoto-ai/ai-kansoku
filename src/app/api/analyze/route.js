import { NextResponse } from 'next/server';

// タイムアウト付きfetch
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました');
    }
    throw error;
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URLが必要です' }, { status: 400 });
    }

    // URLの正規化とバリデーション
    let normalizedUrl;
    let baseUrl;
    
    try {
      normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(normalizedUrl);
      baseUrl = urlObj.origin;
      
      // ローカルホストや内部IPをブロック
      if (urlObj.hostname === 'localhost' || 
          urlObj.hostname.startsWith('127.') || 
          urlObj.hostname.startsWith('192.168.') ||
          urlObj.hostname.startsWith('10.')) {
        return NextResponse.json(
          { error: 'ローカルURLは診断できません' }, 
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: '有効なURLを入力してください' }, 
        { status: 400 }
      );
    }

    const results = {
      url: baseUrl,
      scores: {},
      details: {},
      timestamp: new Date().toISOString()
    };

    // HTMLを一度だけ取得（複数の解析で使い回す）
    let htmlContent = null;
    let siteAccessible = false;
    
    try {
      const response = await fetchWithTimeout(normalizedUrl, {
        headers: { 
          'User-Agent': 'AI-Observatory/1.0',
          'Accept': 'text/html'
        }
      }, 15000); // 15秒タイムアウト
      
      // ステータスコードをチェック
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'ページが見つかりません。URLを確認してください。' }, 
            { status: 404 }
          );
        } else if (response.status === 403) {
          return NextResponse.json(
            { error: 'アクセスが拒否されました。サイトがクロールを許可していない可能性があります。' }, 
            { status: 403 }
          );
        } else if (response.status >= 500) {
          return NextResponse.json(
            { error: 'サーバーエラーが発生しました。しばらく待ってから再度お試しください。' }, 
            { status: 500 }
          );
        } else {
          return NextResponse.json(
            { error: `サイトへの接続に失敗しました (HTTP ${response.status})` }, 
            { status: response.status }
          );
        }
      }
      
      // レスポンスが正常ならHTMLを取得
      htmlContent = await response.text();
      siteAccessible = true;
      
    } catch (error) {
      console.error('HTML取得エラー:', error);
      
      // エラーメッセージを詳細化
      if (error.message.includes('タイムアウト')) {
        return NextResponse.json(
          { error: 'サイトへの接続がタイムアウトしました。サイトが応答しない可能性があります。' }, 
          { status: 504 }
        );
      }
      
      // DNS解決エラーやネットワークエラー
      if (error.cause?.code === 'ENOTFOUND' || error.message.includes('fetch failed')) {
        return NextResponse.json(
          { error: 'サイトが見つかりませんでした。URLを確認してください。' }, 
          { status: 404 }
        );
      }
      
      // その他のネットワークエラー
      return NextResponse.json(
        { error: 'サイトへの接続に失敗しました。URLを確認してください。' }, 
        { status: 500 }
      );
    }
    
    // サイトにアクセスできない場合は診断を中止
    if (!siteAccessible) {
      return NextResponse.json(
        { error: 'サイトにアクセスできませんでした' }, 
        { status: 500 }
      );
    }

    // 1. robots.txt チェック
    await checkRobotsTxt(baseUrl, results);

    // 2. sitemap.xml チェック
    await checkSitemap(baseUrl, results);

    // 3. llms.txt チェック
    await checkLlmsTxt(baseUrl, results);

    // 4. 構造化データ解析
    await checkStructuredData(htmlContent, results);

    // 5. メタタグ解析
    await checkMetaTags(htmlContent, results);

    // 6. セマンティックHTML解析 (NEW!)
    await checkSemanticHTML(htmlContent, results);

    // 7. モバイル対応チェック (NEW!)
    await checkMobileOptimization(htmlContent, results);

    // 8. パフォーマンス解析 (NEW!)
    await checkPerformance(htmlContent, normalizedUrl, results);

    // 総合スコア計算
    const scores = Object.values(results.scores);
    results.totalScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return NextResponse.json(results);

  } catch (error) {
    console.error('分析エラー:', error);
    return NextResponse.json(
      { error: '分析中にエラーが発生しました', details: error.message },
      { status: 500 }
    );
  }
}

// robots.txt チェック
async function checkRobotsTxt(baseUrl, results) {
  try {
    const response = await fetch(`${baseUrl}/robots.txt`, {
      headers: { 'User-Agent': 'AI-Observatory/1.0' }
    });

    if (response.ok) {
      const content = await response.text();
      const lines = content.split('\n').filter(line => line.trim());
      
      const hasUserAgent = lines.some(line => line.toLowerCase().includes('user-agent'));
      const hasDisallow = lines.some(line => line.toLowerCase().includes('disallow'));
      const hasSitemap = lines.some(line => line.toLowerCase().includes('sitemap'));
      
      let score = 50;
      if (hasUserAgent) score += 20;
      if (hasDisallow) score += 15;
      if (hasSitemap) score += 15;

      results.scores.robotsTxt = score;
      results.details.robotsTxt = {
        exists: true,
        hasUserAgent,
        hasDisallow,
        hasSitemap,
        lineCount: lines.length
      };
    } else {
      results.scores.robotsTxt = 0;
      results.details.robotsTxt = { exists: false };
    }
  } catch (error) {
    results.scores.robotsTxt = 0;
    results.details.robotsTxt = { exists: false, error: error.message };
  }
}

// sitemap.xml チェック
async function checkSitemap(baseUrl, results) {
  try {
    const response = await fetch(`${baseUrl}/sitemap.xml`, {
      headers: { 'User-Agent': 'AI-Observatory/1.0' }
    });

    if (response.ok) {
      const content = await response.text();
      const urlMatches = content.match(/<loc>(.*?)<\/loc>/g) || [];
      const urlCount = urlMatches.length;
      
      const hasLastmod = content.includes('<lastmod>');
      const hasPriority = content.includes('<priority>');
      const hasChangefreq = content.includes('<changefreq>');

      let score = 50;
      if (urlCount > 0) score += 20;
      if (urlCount > 10) score += 10;
      if (hasLastmod) score += 10;
      if (hasPriority || hasChangefreq) score += 10;

      results.scores.sitemap = score;
      results.details.sitemap = {
        exists: true,
        urlCount,
        hasLastmod,
        hasPriority,
        hasChangefreq
      };
    } else {
      results.scores.sitemap = 0;
      results.details.sitemap = { exists: false };
    }
  } catch (error) {
    results.scores.sitemap = 0;
    results.details.sitemap = { exists: false, error: error.message };
  }
}

// llms.txt チェック
async function checkLlmsTxt(baseUrl, results) {
  try {
    const response = await fetch(`${baseUrl}/llms.txt`, {
      headers: { 'User-Agent': 'AI-Observatory/1.0' }
    });

    if (response.ok) {
      const content = await response.text();
      const lines = content.split('\n').filter(line => line.trim());
      
      const hasTitle = content.toLowerCase().includes('# ') || 
                       lines.some(line => line.startsWith('# '));
      const hasSummary = lines.length > 3;
      const hasMarkdown = content.includes('#') || content.includes('##');
      const hasLinks = /https?:\/\//.test(content);
      const hasStructure = content.includes('##') || content.includes('###');
      const wordCount = content.split(/\s+/).length;
      
      let score = 30;
      if (hasTitle) score += 15;
      if (hasSummary) score += 15;
      if (hasMarkdown) score += 10;
      if (hasLinks) score += 10;
      if (hasStructure) score += 10;
      if (wordCount > 100) score += 10;

      results.scores.llmsTxt = Math.min(score, 100);
      results.details.llmsTxt = {
        exists: true,
        hasTitle,
        hasSummary,
        hasMarkdown,
        hasLinks,
        hasStructure,
        wordCount,
        lineCount: lines.length,
        quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'basic'
      };
    } else {
      results.scores.llmsTxt = 0;
      results.details.llmsTxt = { 
        exists: false,
        message: 'llms.txtが見つかりません'
      };
    }
  } catch (error) {
    results.scores.llmsTxt = 0;
    results.details.llmsTxt = { 
      exists: false, 
      error: error.message 
    };
  }
}

// 構造化データ解析
async function checkStructuredData(html, results) {
  try {
    if (!html) {
      results.scores.structuredData = 0;
      results.details.structuredData = { exists: false };
      return;
    }

    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    
    if (jsonLdMatches.length === 0) {
      results.scores.structuredData = 0;
      results.details.structuredData = { 
        exists: false,
        message: '構造化データが見つかりません'
      };
      return;
    }

    const schemas = [];
    const schemaTypes = new Set();
    let totalProperties = 0;

    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
        const parsed = JSON.parse(jsonContent);
        const types = Array.isArray(parsed) ? parsed : [parsed];
        
        types.forEach(item => {
          if (item['@type']) {
            const typeValue = Array.isArray(item['@type']) ? item['@type'][0] : item['@type'];
            schemaTypes.add(typeValue);
            totalProperties += Object.keys(item).length;
            schemas.push({
              type: typeValue,
              properties: Object.keys(item)
            });
          }
        });
      } catch (e) {
        console.error('JSON-LD parse error:', e);
      }
    }

    let score = 30;
    const importantTypes = ['WebSite', 'Organization', 'Article', 'Product', 'Person', 'BreadcrumbList'];
    const hasImportantType = Array.from(schemaTypes).some(type => importantTypes.includes(type));
    
    if (hasImportantType) score += 30;
    if (jsonLdMatches.length >= 2) score += 10;
    if (totalProperties >= 10) score += 15;
    if (totalProperties >= 20) score += 15;

    results.scores.structuredData = Math.min(score, 100);
    results.details.structuredData = {
      exists: true,
      schemaCount: jsonLdMatches.length,
      schemaTypes: Array.from(schemaTypes),
      totalProperties,
      schemas: schemas.slice(0, 5),
      hasImportantType,
      quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'basic'
    };

  } catch (error) {
    results.scores.structuredData = 0;
    results.details.structuredData = { 
      exists: false, 
      error: error.message 
    };
  }
}

// メタタグ解析
async function checkMetaTags(html, results) {
  try {
    if (!html) {
      results.scores.metaTags = 0;
      results.details.metaTags = { exists: false };
      return;
    }

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    
    const descriptionMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const description = descriptionMatch ? descriptionMatch[1].trim() : null;
    
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const ogDescriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    const ogUrlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["'](.*?)["']/i);
    const ogTypeMatch = html.match(/<meta\s+property=["']og:type["']\s+content=["'](.*?)["']/i);
    
    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : null;
    const ogDescription = ogDescriptionMatch ? ogDescriptionMatch[1].trim() : null;
    const ogImage = ogImageMatch ? ogImageMatch[1].trim() : null;
    const ogUrl = ogUrlMatch ? ogUrlMatch[1].trim() : null;
    const ogType = ogTypeMatch ? ogTypeMatch[1].trim() : null;
    
    const twitterCardMatch = html.match(/<meta\s+name=["']twitter:card["']\s+content=["'](.*?)["']/i);
    const twitterTitleMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["'](.*?)["']/i);
    const twitterDescriptionMatch = html.match(/<meta\s+name=["']twitter:description["']\s+content=["'](.*?)["']/i);
    const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["'](.*?)["']/i);
    
    const twitterCard = twitterCardMatch ? twitterCardMatch[1].trim() : null;
    const twitterTitle = twitterTitleMatch ? twitterTitleMatch[1].trim() : null;
    const twitterDescription = twitterDescriptionMatch ? twitterDescriptionMatch[1].trim() : null;
    const twitterImage = twitterImageMatch ? twitterImageMatch[1].trim() : null;
    
    let score = 0;
    
    if (title) {
      score += 15;
      if (title.length >= 10 && title.length <= 60) score += 5;
    }
    if (description) {
      score += 15;
      if (description.length >= 50 && description.length <= 160) score += 5;
    }
    
    if (ogTitle) score += 8;
    if (ogDescription) score += 7;
    if (ogImage) score += 10;
    if (ogUrl) score += 3;
    if (ogType) score += 2;
    
    if (twitterCard) score += 10;
    if (twitterTitle) score += 7;
    if (twitterDescription) score += 7;
    if (twitterImage) score += 6;

    results.scores.metaTags = Math.min(score, 100);
    results.details.metaTags = {
      exists: true,
      basic: {
        title: title || '未設定',
        titleLength: title ? title.length : 0,
        titleOptimal: title ? (title.length >= 10 && title.length <= 60) : false,
        description: description || '未設定',
        descriptionLength: description ? description.length : 0,
        descriptionOptimal: description ? (description.length >= 50 && description.length <= 160) : false
      },
      ogp: {
        hasOgp: !!(ogTitle || ogDescription || ogImage),
        ogTitle: ogTitle || '未設定',
        ogDescription: ogDescription || '未設定',
        ogImage: ogImage || '未設定',
        ogUrl: ogUrl || '未設定',
        ogType: ogType || '未設定',
        completeness: [ogTitle, ogDescription, ogImage, ogUrl, ogType].filter(Boolean).length
      },
      twitter: {
        hasTwitterCard: !!twitterCard,
        twitterCard: twitterCard || '未設定',
        twitterTitle: twitterTitle || '未設定',
        twitterDescription: twitterDescription || '未設定',
        twitterImage: twitterImage || '未設定',
        completeness: [twitterCard, twitterTitle, twitterDescription, twitterImage].filter(Boolean).length
      },
      quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
    };

  } catch (error) {
    results.scores.metaTags = 0;
    results.details.metaTags = { 
      exists: false, 
      error: error.message 
    };
  }
}

// セマンティックHTML解析 (NEW!)
async function checkSemanticHTML(html, results) {
  try {
    if (!html) {
      results.scores.semanticHTML = 0;
      results.details.semanticHTML = { exists: false };
      return;
    }

    // セマンティックタグの検出
    const hasHeader = /<header[^>]*>/i.test(html);
    const hasNav = /<nav[^>]*>/i.test(html);
    const hasMain = /<main[^>]*>/i.test(html);
    const hasArticle = /<article[^>]*>/i.test(html);
    const hasSection = /<section[^>]*>/i.test(html);
    const hasAside = /<aside[^>]*>/i.test(html);
    const hasFooter = /<footer[^>]*>/i.test(html);

    // 見出し階層の検証
    const h1Matches = html.match(/<h1[^>]*>/gi) || [];
    const h2Matches = html.match(/<h2[^>]*>/gi) || [];
    const h3Matches = html.match(/<h3[^>]*>/gi) || [];
    const h4Matches = html.match(/<h4[^>]*>/gi) || [];
    
    const h1Count = h1Matches.length;
    const h2Count = h2Matches.length;
    const h3Count = h3Matches.length;
    const h4Count = h4Matches.length;
    
    const hasProperH1 = h1Count === 1; // h1は1つが理想
    const hasHeadingHierarchy = h1Count > 0 && h2Count > 0;

    // ARIAラベルの使用
    const hasAriaLabels = /aria-label/i.test(html);
    const hasAriaRoles = /role=/i.test(html);

    // スコア計算
    let score = 0;
    
    // セマンティックタグ（50点）
    if (hasHeader) score += 8;
    if (hasNav) score += 7;
    if (hasMain) score += 10; // mainは重要
    if (hasArticle) score += 7;
    if (hasSection) score += 6;
    if (hasAside) score += 6;
    if (hasFooter) score += 6;

    // 見出し階層（40点）
    if (hasProperH1) score += 20;
    if (hasHeadingHierarchy) score += 15;
    if (h3Count > 0) score += 5;

    // アクセシビリティ（10点）
    if (hasAriaLabels) score += 5;
    if (hasAriaRoles) score += 5;

    const semanticTagsUsed = [
      hasHeader && 'header',
      hasNav && 'nav',
      hasMain && 'main',
      hasArticle && 'article',
      hasSection && 'section',
      hasAside && 'aside',
      hasFooter && 'footer'
    ].filter(Boolean);

    results.scores.semanticHTML = Math.min(score, 100);
    results.details.semanticHTML = {
      exists: true,
      semanticTags: {
        hasHeader,
        hasNav,
        hasMain,
        hasArticle,
        hasSection,
        hasAside,
        hasFooter,
        tagsUsed: semanticTagsUsed,
        count: semanticTagsUsed.length
      },
      headingStructure: {
        h1Count,
        h2Count,
        h3Count,
        h4Count,
        hasProperH1,
        hasHeadingHierarchy,
        isOptimal: hasProperH1 && hasHeadingHierarchy
      },
      accessibility: {
        hasAriaLabels,
        hasAriaRoles
      },
      quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
    };

  } catch (error) {
    results.scores.semanticHTML = 0;
    results.details.semanticHTML = { 
      exists: false, 
      error: error.message 
    };
  }
}

// モバイル対応チェック (NEW!)
async function checkMobileOptimization(html, results) {
  try {
    if (!html) {
      results.scores.mobileOptimization = 0;
      results.details.mobileOptimization = { exists: false };
      return;
    }

    // viewportメタタグの検出
    const viewportMatch = html.match(/<meta\s+name=["']viewport["']\s+content=["'](.*?)["']/i);
    const hasViewport = !!viewportMatch;
    const viewportContent = viewportMatch ? viewportMatch[1] : null;
    
    // 理想的なviewport設定
    const hasWidthDevice = viewportContent ? viewportContent.includes('width=device-width') : false;
    const hasInitialScale = viewportContent ? viewportContent.includes('initial-scale=1') : false;
    
    // レスポンシブデザインの検出
    const hasMediaQueries = /@media/.test(html);
    const mediaQueryCount = (html.match(/@media/g) || []).length;
    
    // フレキシブルレイアウトの検出
    const hasFlexbox = /display:\s*flex/i.test(html);
    const hasGrid = /display:\s*grid/i.test(html);
    
    // モバイルフレンドリーなフォントサイズ
    const hasFontSizeVW = /font-size:\s*\d+vw/i.test(html);
    const hasRemUnit = /font-size:\s*\d+(\.\d+)?rem/i.test(html);
    
    // タッチ対応の検出
    const hasTouchEvents = /ontouchstart|ontouchend|ontouchmove/i.test(html);
    
    // スコア計算
    let score = 0;
    
    // viewport設定（40点）
    if (hasViewport) {
      score += 20;
      if (hasWidthDevice) score += 10;
      if (hasInitialScale) score += 10;
    }
    
    // レスポンシブデザイン（40点）
    if (hasMediaQueries) {
      score += 20;
      if (mediaQueryCount >= 3) score += 10; // 複数のブレークポイント
      if (mediaQueryCount >= 5) score += 10; // さらに充実
    }
    
    // フレキシブルレイアウト（15点）
    if (hasFlexbox) score += 8;
    if (hasGrid) score += 7;
    
    // その他（5点）
    if (hasFontSizeVW || hasRemUnit) score += 3;
    if (hasTouchEvents) score += 2;

    results.scores.mobileOptimization = Math.min(score, 100);
    results.details.mobileOptimization = {
      exists: true,
      viewport: {
        hasViewport,
        content: viewportContent || '未設定',
        hasWidthDevice,
        hasInitialScale,
        isOptimal: hasViewport && hasWidthDevice && hasInitialScale
      },
      responsive: {
        hasMediaQueries,
        mediaQueryCount,
        hasFlexbox,
        hasGrid
      },
      typography: {
        hasFontSizeVW,
        hasRemUnit
      },
      touch: {
        hasTouchEvents
      },
      quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
    };

  } catch (error) {
    results.scores.mobileOptimization = 0;
    results.details.mobileOptimization = { 
      exists: false, 
      error: error.message 
    };
  }
}

// パフォーマンス解析 (NEW!)
async function checkPerformance(html, url, results) {
  try {
    if (!html) {
      results.scores.performance = 0;
      results.details.performance = { exists: false };
      return;
    }

    // 画像の検出と最適化チェック
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    const imgCount = imgMatches.length;
    
    // 画像の最適化属性
    let lazyLoadCount = 0;
    let altTextCount = 0;
    let widthHeightCount = 0;
    let webpCount = 0;
    
    imgMatches.forEach(img => {
      if (/loading=["']lazy["']/i.test(img)) lazyLoadCount++;
      if (/alt=["'][^"']*["']/i.test(img)) altTextCount++;
      if (/width=["']\d+["']/.test(img) && /height=["']\d+["']/.test(img)) widthHeightCount++;
      if (/\.webp/i.test(img)) webpCount++;
    });
    
    // リソース最適化
    const hasDeferScripts = /<script[^>]*defer/i.test(html);
    const hasAsyncScripts = /<script[^>]*async/i.test(html);
    const scriptCount = (html.match(/<script/gi) || []).length;
    const externalScriptCount = (html.match(/<script[^>]*src=/gi) || []).length;
    
    // CSS最適化
    const hasInlineCSS = /<style/i.test(html);
    const externalCSSCount = (html.match(/<link[^>]*rel=["']stylesheet["']/gi) || []).length;
    
    // プリロード/プリコネクトの使用
    const hasPreload = /<link[^>]*rel=["']preload["']/i.test(html);
    const hasPreconnect = /<link[^>]*rel=["']preconnect["']/i.test(html);
    const hasDNSPrefetch = /<link[^>]*rel=["']dns-prefetch["']/i.test(html);
    
    // 圧縮の検出（推測）
    const htmlSize = html.length;
    const isLikelyMinified = !/\n\s{4,}/.test(html.substring(0, 1000)); // インデントが少ない
    
    // スコア計算
    let score = 30; // 基本点
    
    // 画像最適化（40点）
    if (imgCount > 0) {
      const lazyLoadRatio = lazyLoadCount / imgCount;
      const altTextRatio = altTextCount / imgCount;
      const dimensionsRatio = widthHeightCount / imgCount;
      
      score += Math.floor(lazyLoadRatio * 15);
      score += Math.floor(altTextRatio * 10);
      score += Math.floor(dimensionsRatio * 10);
      if (webpCount > 0) score += 5;
    } else {
      score += 20; // 画像がない場合は一部加点
    }
    
    // スクリプト最適化（20点）
    if (hasDeferScripts || hasAsyncScripts) score += 10;
    if (externalScriptCount <= 5) score += 5;
    if (scriptCount <= 10) score += 5;
    
    // リソース最適化（10点）
    if (hasPreload) score += 4;
    if (hasPreconnect) score += 3;
    if (hasDNSPrefetch) score += 3;

    results.scores.performance = Math.min(score, 100);
    results.details.performance = {
      exists: true,
      images: {
        totalCount: imgCount,
        lazyLoadCount,
        lazyLoadRatio: imgCount > 0 ? Math.round((lazyLoadCount / imgCount) * 100) : 0,
        altTextCount,
        altTextRatio: imgCount > 0 ? Math.round((altTextCount / imgCount) * 100) : 0,
        widthHeightCount,
        dimensionsRatio: imgCount > 0 ? Math.round((widthHeightCount / imgCount) * 100) : 0,
        webpCount
      },
      scripts: {
        totalCount: scriptCount,
        externalCount: externalScriptCount,
        hasDeferScripts,
        hasAsyncScripts
      },
      css: {
        externalCount: externalCSSCount,
        hasInlineCSS
      },
      resourceHints: {
        hasPreload,
        hasPreconnect,
        hasDNSPrefetch
      },
      optimization: {
        htmlSize,
        isLikelyMinified
      },
      quality: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
    };

  } catch (error) {
    results.scores.performance = 0;
    results.details.performance = { 
      exists: false, 
      error: error.message 
    };
  }
}