import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
    }

    // Використовуємо REST API замість GraphQL
    const url = new URL(`${API_URL}/api/bouquets`);
    url.searchParams.set('populate[image]', 'true');
    url.searchParams.set('populate[varieties]', 'true');
    url.searchParams.set('pagination[page]', page.toString());
    url.searchParams.set('pagination[pageSize]', pageSize.toString());
    url.searchParams.set('sort[0]', 'createdAt:desc');

    const res = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Strapi REST API error', details: text }, { status: 500 });
    }

    const json = await res.json();
    console.log('Bouquets API response:', json);
    
    // Перетворюємо дані з REST API формату в GraphQL формат для сумісності
    const bouquets = json.data?.map((item: any) => ({
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
    })) || [];

    const pagination = {
      page: json.meta?.pagination?.page || page,
      pageSize: json.meta?.pagination?.pageSize || pageSize,
      pageCount: json.meta?.pagination?.pageCount || 1,
      total: json.meta?.pagination?.total || bouquets.length,
    };

    return NextResponse.json({
      data: bouquets,
      pagination,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
