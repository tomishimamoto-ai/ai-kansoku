 import { NextResponse } from 'next/server';
import { fetchSearchAnalytics, detectZeroClickPages, analyzeBrandQueryGrowth } from '../../../../lib/google-auth';
import { getValidAccessToken, getTokenBySiteId, upsertScCache, getScCache, updateLastSynced } from '../../../../lib/token-store';

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    endDate: end.toISOString().split('T')[0],
    startDate: start.toISOString().split('T')[0],
  };
}

function isCacheValid(fetchedAt) {
  if (!fetchedAt) return false;
  return Date.now() - new Date(fetchedAt).getTime() < 6 * 60 * 60 * 1000;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');
  const force = searchParams.get('force') === 'true';

  if (!siteId) {
    return NextResponse.json({ error: 'siteId required' }, { status: 400 });
  }

  try {
    const tokenRecord = await getTokenBySiteId(siteId);
    if (!tokenRecord) {
      return NextResponse.json({ error: 'Not connected', connected: false }, { status: 401 });
    }
    if (!tokenRecord.sc_site_url) {
      return NextResponse.json({ error: 'SC site URL not configured', needsConfig: true }, { status: 400 });
    }

    if (!force) {
      const cached = await getScCache(siteId, 'daily_summary');
      if (cached && isCacheValid(cached.fetched_at)) {
        return NextResponse.json({ cached: true, fetchedAt: cached.fetched_at, ...cached.data });
      }
    }

    const accessToken = await getValidAccessToken(siteId);
    const scSiteUrl = tokenRecord.sc_site_url;

    const [summaryData, pageData, queryData, prevSummaryData, pageDataPrev] = await Promise.all([
      fetchSearchAnalytics(accessToken, scSiteUrl, { ...getDateRange(28), dimensions: ['date'] }),
      fetchSearchAnalytics(accessToken, scSiteUrl, { ...getDateRange(28), dimensions: ['page'], rowLimit: 100 }),
      fetchSearchAnalytics(accessToken, scSiteUrl, { ...getDateRange(28), dimensions: ['query'], rowLimit: 500 }),
      fetchSearchAnalytics(accessToken, scSiteUrl, {
        startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 56); return d.toISOString().split('T')[0]; })(),
        endDate: (() => { const d = new Date(); d.setDate(d.getDate() - 28); return d.toISOString().split('T')[0]; })(),
        dimensions: ['date'],
      }),
      fetchSearchAnalytics(accessToken, scSiteUrl, {
        startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 56); return d.toISOString().split('T')[0]; })(),
        endDate: (() => { const d = new Date(); d.setDate(d.getDate() - 28); return d.toISOString().split('T')[0]; })(),
        dimensions: ['page'],
        rowLimit: 100,
      }),
    ]);

    const zeroClickPages = detectZeroClickPages(pageData.rows || [], pageDataPrev.rows || []);
    const currentRows = summaryData.rows || [];
    const prevRows = prevSummaryData.rows || [];

    const currentTotal = currentRows.reduce((acc, r) => ({ impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks }), { impressions: 0, clicks: 0 });
    const prevTotal = prevRows.reduce((acc, r) => ({ impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks }), { impressions: 0, clicks: 0 });

    const avgCtr = currentTotal.impressions > 0 ? (currentTotal.clicks / currentTotal.impressions * 100).toFixed(2) : 0;
    const prevAvgCtr = prevTotal.impressions > 0 ? (prevTotal.clicks / prevTotal.impressions * 100).toFixed(2) : 0;

    const zeroClickScore = zeroClickPages.length > 0
      ? Math.min(100, Math.round(zeroClickPages.length * 5 + zeroClickPages.slice(0, 3).reduce((sum, p) => sum + parseFloat(p.impressionGrowth), 0) / 3))
      : 0;

    const brandName = scSiteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('.')[0];
    const brandAnalysis = analyzeBrandQueryGrowth(brandName, queryData.rows || []);

    const impressionUp = prevTotal.impressions > 0 && currentTotal.impressions > prevTotal.impressions;
    const clicksDown = prevTotal.clicks > 0 && currentTotal.clicks < prevTotal.clicks;
    let aiSummary, aiConfidence;

    if (impressionUp && clicksDown && zeroClickScore > 30) {
      aiSummary = `表示回数が増加しているのにクリック数が減少しています。AIが検索結果から直接回答を生成している「ゼロクリック現象」の典型的なパターンです。`;
      aiConfidence = 'high';
    } else if (impressionUp && zeroClickScore > 20) {
      aiSummary = `表示回数が増加しており、AIクローラーがコンテンツを読み込んでいる可能性があります。`;
      aiConfidence = 'medium';
    } else {
      aiSummary = `現時点では明確なAI参照シグナルは検出されていません。llms.txtの設置や構造化データの追加を推奨します。`;
      aiConfidence = 'low';
    }

    const result = {
      connected: true,
      scSiteUrl,
      summary: {
        impressions: currentTotal.impressions,
        clicks: currentTotal.clicks,
        ctr: parseFloat(avgCtr),
        impressionChange: prevTotal.impressions > 0 ? ((currentTotal.impressions - prevTotal.impressions) / prevTotal.impressions * 100).toFixed(1) : null,
        clickChange: prevTotal.clicks > 0 ? ((currentTotal.clicks - prevTotal.clicks) / prevTotal.clicks * 100).toFixed(1) : null,
        ctrChange: (parseFloat(avgCtr) - parseFloat(prevAvgCtr)).toFixed(2),
      },
      dailyTrend: currentRows.map(r => ({ date: r.keys[0], impressions: r.impressions, clicks: r.clicks, ctr: (r.ctr * 100).toFixed(2) })),
      zeroClick: {
        score: zeroClickScore,
        detectedPages: zeroClickPages,
        interpretation: zeroClickScore > 50 ? 'AIが多くのクエリに回答しています' : zeroClickScore > 20 ? 'ゼロクリック現象が一部発生しています' : 'ゼロクリック現象は限定的です',
      },
      brandQuery: brandAnalysis,
      topPages: (pageData.rows || []).sort((a, b) => b.impressions - a.impressions).slice(0, 10).map(r => ({
        page: r.keys[0], impressions: r.impressions, clicks: r.clicks, ctr: (r.ctr * 100).toFixed(2), position: r.position?.toFixed(1),
      })),
      aiContext: { summary: aiSummary, confidence: aiConfidence },
    };

    await upsertScCache({ siteId, dataType: 'daily_summary', periodStart: getDateRange(28).startDate, periodEnd: getDateRange(28).endDate, data: result });
    await updateLastSynced(siteId);

    return NextResponse.json({ cached: false, fetchedAt: new Date().toISOString(), ...result });
  } catch (error) {
    console.error('SC fetch error:', error);
    if (error.message.includes('re-authenticate')) {
      return NextResponse.json({ error: 'Token expired. Please reconnect.', needsReauth: true }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
