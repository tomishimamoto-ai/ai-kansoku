import { neon } from '@neondatabase/serverless';

function getDb() {
  return neon(process.env.DATABASE_URL);
}

export async function initTokenTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS google_auth_tokens (
      id SERIAL PRIMARY KEY,
      site_id VARCHAR(20) NOT NULL UNIQUE,
      google_email VARCHAR(255) NOT NULL,
      google_name VARCHAR(255),
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_expires_at TIMESTAMPTZ NOT NULL,
      sc_site_url VARCHAR(500),
      sc_site_url_options JSONB,
      last_synced_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS search_console_cache (
      id SERIAL PRIMARY KEY,
      site_id VARCHAR(20) NOT NULL,
      data_type VARCHAR(50) NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      data JSONB NOT NULL,
      fetched_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(site_id, data_type, period_start, period_end)
    )
  `;
}

export async function upsertToken({ siteId, googleEmail, googleName, accessToken, refreshToken, expiresIn }) {
  const sql = getDb();
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await sql`
    INSERT INTO google_auth_tokens (site_id, google_email, google_name, access_token, refresh_token, token_expires_at)
    VALUES (${siteId}, ${googleEmail}, ${googleName}, ${accessToken}, ${refreshToken}, ${expiresAt})
    ON CONFLICT (site_id) DO UPDATE SET
      google_email = EXCLUDED.google_email,
      google_name = EXCLUDED.google_name,
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, google_auth_tokens.refresh_token),
      token_expires_at = EXCLUDED.token_expires_at,
      updated_at = NOW()
  `;
}

export async function getTokenBySiteId(siteId) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM google_auth_tokens WHERE site_id = ${siteId} LIMIT 1`;
  return rows[0] || null;
}

export async function updateAccessToken(siteId, accessToken, expiresIn) {
  const sql = getDb();
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  await sql`UPDATE google_auth_tokens SET access_token = ${accessToken}, token_expires_at = ${expiresAt}, updated_at = NOW() WHERE site_id = ${siteId}`;
}

export async function updateScSiteUrl(siteId, scSiteUrl, scSiteUrlOptions) {
  const sql = getDb();
  await sql`UPDATE google_auth_tokens SET sc_site_url = ${scSiteUrl}, sc_site_url_options = ${JSON.stringify(scSiteUrlOptions)}, updated_at = NOW() WHERE site_id = ${siteId}`;
}

export async function updateLastSynced(siteId) {
  const sql = getDb();
  await sql`UPDATE google_auth_tokens SET last_synced_at = NOW(), updated_at = NOW() WHERE site_id = ${siteId}`;
}

export async function deleteToken(siteId) {
  const sql = getDb();
  await sql`DELETE FROM google_auth_tokens WHERE site_id = ${siteId}`;
  await sql`DELETE FROM search_console_cache WHERE site_id = ${siteId}`;
}

export async function upsertScCache({ siteId, dataType, periodStart, periodEnd, data }) {
  const sql = getDb();
  await sql`
    INSERT INTO search_console_cache (site_id, data_type, period_start, period_end, data, fetched_at)
    VALUES (${siteId}, ${dataType}, ${periodStart}, ${periodEnd}, ${JSON.stringify(data)}, NOW())
    ON CONFLICT (site_id, data_type, period_start, period_end) DO UPDATE SET
      data = EXCLUDED.data, fetched_at = NOW()
  `;
}

export async function getScCache(siteId, dataType) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM search_console_cache WHERE site_id = ${siteId} AND data_type = ${dataType} ORDER BY fetched_at DESC LIMIT 1`;
  return rows[0] || null;
}

export async function getValidAccessToken(siteId) {
  const { refreshAccessToken } = await import('./google-auth');
  const token = await getTokenBySiteId(siteId);
  if (!token) throw new Error('No token found for this site');
  const now = new Date();
  const expiresAt = new Date(token.token_expires_at);
  if (expiresAt - now < 5 * 60 * 1000) {
    if (!token.refresh_token) throw new Error('No refresh token available. Please re-authenticate.');
    const refreshed = await refreshAccessToken(token.refresh_token);
    await updateAccessToken(siteId, refreshed.access_token, refreshed.expires_in);
    return refreshed.access_token;
  }
  return token.access_token;
} 
