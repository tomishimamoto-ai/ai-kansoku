const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const SEARCH_CONSOLE_BASE = 'https://www.googleapis.com/webmasters/v3';

const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'openid',
  'email',
  'profile',
].join(' ');

export function buildAuthUrl(siteId) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: siteId,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      grant_type: 'authorization_code',
      code,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }
  return response.json();
}

export async function refreshAccessToken(refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }
  return response.json();
}

export async function getGoogleUserInfo(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch user info');
  return response.json();
}

export async function listSearchConsoleSites(accessToken) {
  const response = await fetch(`${SEARCH_CONSOLE_BASE}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch Search Console sites');
  const data = await response.json();
  return data.siteEntry || [];
}

export async function fetchSearchAnalytics(accessToken, siteUrl, options = {}) {
  const { startDate, endDate, dimensions = ['date'], rowLimit = 1000 } = options;
  const end = endDate || new Date().toISOString().split('T')[0];
  const start = startDate || (() => {
    const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0];
  })();

  const encodedUrl = encodeURIComponent(siteUrl);
  const response = await fetch(
    `${SEARCH_CONSOLE_BASE}/sites/${encodedUrl}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Search Analytics fetch failed: ${JSON.stringify(error)}`);
  }
  return response.json();
}

export function detectZeroClickPages(rows, previousRows) {
  const prevMap = new Map();
  previousRows.forEach(row => { const key = row.keys?.[0]; if (key) prevMap.set(key, row); });

  return rows
    .filter(row => {
      const key = row.keys?.[0];
      const prev = prevMap.get(key);
      if (!prev) return false;
      const impressionGrowth = (row.impressions - prev.impressions) / (prev.impressions || 1);
      return impressionGrowth > 0.1 && row.ctr < prev.ctr;
    })
    .map(row => {
      const key = row.keys?.[0];
      const prev = prevMap.get(key);
      return {
        page: key,
        impressions: row.impressions,
        impressionGrowth: ((row.impressions - prev.impressions) / (prev.impressions || 1) * 100).toFixed(1),
        ctr: (row.ctr * 100).toFixed(2),
        ctrPrev: (prev.ctr * 100).toFixed(2),
        clicks: row.clicks,
        position: row.position?.toFixed(1),
      };
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);
}

export function analyzeBrandQueryGrowth(brandName, rows) {
  if (!brandName || !rows?.length) return null;
  const brandLower = brandName.toLowerCase();
  const brandRows = rows.filter(row => row.keys?.[0]?.toLowerCase().includes(brandLower));
  const totalImpressions = rows.reduce((sum, r) => sum + r.impressions, 0);
  const brandImpressions = brandRows.reduce((sum, r) => sum + r.impressions, 0);
  const brandClicks = brandRows.reduce((sum, r) => sum + r.clicks, 0);
  return {
    brandQueryCount: brandRows.length,
    brandImpressions,
    brandClicks,
    brandShare: totalImpressions > 0 ? (brandImpressions / totalImpressions * 100).toFixed(1) : 0,
    topBrandQueries: brandRows.sort((a, b) => b.impressions - a.impressions).slice(0, 5)
      .map(r => ({ query: r.keys[0], impressions: r.impressions, clicks: r.clicks })),
  };
} 
