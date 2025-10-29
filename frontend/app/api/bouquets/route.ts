import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET() {
  if (!STRAPI_API_TOKEN) {
    return NextResponse.json({ error: 'STRAPI_API_TOKEN is not set' }, { status: 500 });
  }

  try {
    const url = new URL(`${API_URL}/api/bouquets`);
    url.searchParams.set('populate[image]', 'true');
    url.searchParams.set('populate[varieties]', 'true');
    url.searchParams.set('pagination[pageSize]', '50');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      // Server-side only
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Strapi error', details: text }, { status: 500 });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}



