import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET() {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
    }

    // Використовуємо REST API замість GraphQL
    const url = new URL(`${API_URL}/api/varieties`);
    url.searchParams.set('populate[bouquets]', 'true');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('sort[0]', 'name:asc');

    const res = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Strapi REST API error', details: text }, { status: 500 });
    }

    const json = await res.json();
    
    // Перетворюємо дані з REST API формату в GraphQL формат для сумісності
    const varieties = json.data?.map((item: any) => ({
      documentId: item.documentId,
      name: item.name,
      slug: item.slug,
      bouquets: item.bouquets?.data || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
    })) || [];

    return NextResponse.json({ variety1S: varieties });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
