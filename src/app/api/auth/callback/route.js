import { NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserInfo, listSearchConsoleSites } from '../../../../lib/google-auth';
import { upsertToken, updateScSiteUrl, initTokenTable } from '../../../../lib/token-store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-kansoku.com';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/dashboard?siteId=${state}&sc_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard?sc_error=missing_params`);
  }

  try {
    await initTokenTable();
    const tokens = await exchangeCodeForTokens(code);
    const userInfo = await getGoogleUserInfo(tokens.access_token);
    await upsertToken({
      siteId: state,
      googleEmail: userInfo.email,
      googleName: userInfo.name,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in || 3600,
    });

    try {
      const sites = await listSearchConsoleSites(tokens.access_token);
      if (sites.length > 0) {
        const siteUrlOptions = sites.map(s => ({ url: s.siteUrl, permissionLevel: s.permissionLevel }));
        await updateScSiteUrl(state, siteUrlOptions[0].url, siteUrlOptions);
      }
    } catch (scError) {
      console.warn('Failed to fetch SC sites:', scError.message);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?siteId=${state}&sc_connected=true`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${baseUrl}/dashboard?siteId=${state}&sc_error=${encodeURIComponent(err.message)}`);
  }
} 
