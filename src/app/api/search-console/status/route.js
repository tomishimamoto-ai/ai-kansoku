 import { NextResponse } from 'next/server';
import { getTokenBySiteId } from '../../../../lib/token-store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');

  if (!siteId) {
    return NextResponse.json({ error: 'siteId required' }, { status: 400 });
  }

  try {
    const token = await getTokenBySiteId(siteId);

    if (!token) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: true,
      email: token.google_email,
      name: token.google_name,
      scSiteUrl: token.sc_site_url,
      scSiteUrlOptions: token.sc_site_url_options || [],
      lastSyncedAt: token.last_synced_at,
      tokenExpiresAt: token.token_expires_at,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}

export async function POST(request) {
  try {
    const { siteId, scSiteUrl } = await request.json();
    if (!siteId || !scSiteUrl) {
      return NextResponse.json({ error: 'siteId and scSiteUrl required' }, { status: 400 });
    }
    const { updateScSiteUrl, getTokenBySiteId } = await import('../../../../lib/token-store');
    const token = await getTokenBySiteId(siteId);
    if (!token) {
      return NextResponse.json({ error: 'Not connected' }, { status: 404 });
    }
    await updateScSiteUrl(siteId, scSiteUrl, token.sc_site_url_options || []);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('siteId');

  if (!siteId) {
    return NextResponse.json({ error: 'siteId required' }, { status: 400 });
  }

  try {
    const { deleteToken } = await import('../../../../lib/token-store');
    await deleteToken(siteId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
