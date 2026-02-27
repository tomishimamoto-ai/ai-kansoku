 import { NextResponse } from 'next/server';
import { getTokenBySiteId } from '../../../../lib/token-store';

export async function POST(request) {
  try {
    const { siteId } = await request.json();
    if (!siteId) {
      return NextResponse.json({ error: 'siteId required' }, { status: 400 });
    }

    const token = await getTokenBySiteId(siteId);
    if (!token) {
      return NextResponse.json({ error: 'Not connected' }, { status: 401 });
    }

    const fetchRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/search-console/fetch?siteId=${siteId}&force=true`
    );

    if (!fetchRes.ok) {
      const err = await fetchRes.json();
      return NextResponse.json({ error: err.error }, { status: fetchRes.status });
    }

    const data = await fetchRes.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
