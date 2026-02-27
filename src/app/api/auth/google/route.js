import { NextResponse } from 'next/server';
import { buildAuthUrl } from '../../../../lib/google-auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'siteId is required' }, { status: 400 });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Google OAuth is not configured.' }, { status: 500 });
    }

    const authUrl = buildAuthUrl(siteId);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('OAuth start error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
