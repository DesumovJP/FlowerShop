import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Fetching bouquet with ID:', await params);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
    }

    // Використовуємо REST API замість GraphQL
    const resolvedParams = await params;
    const url = new URL(`${API_URL}/api/bouquets`);
    url.searchParams.set('filters[slug][$eq]', resolvedParams.id);
    url.searchParams.set('populate[image]', 'true');
    url.searchParams.set('populate[varieties]', 'true');
    
    console.log('Fetching from URL:', url.toString());

    const res = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Strapi API error:', text);
      return NextResponse.json({ error: 'Strapi REST API error', details: text }, { status: 500 });
    }

    const json = await res.json();
    
    if (!json.data || json.data.length === 0) {
      return NextResponse.json({ error: 'Bouquet not found' }, { status: 404 });
    }

    // Перетворюємо дані з REST API формату в GraphQL формат для сумісності
    const item = json.data[0];
    const bouquet = {
      documentId: item.documentId,
      name: item.name,
      slug: item.slug,
      price: item.price,
      description: item.description,
      cardType: item.cardType,
      color: item.color,
      collection: item.collection,
      image: item.image || [],
      varieties: item.varieties?.data || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
    };

    return NextResponse.json({ bouquet1: bouquet });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
