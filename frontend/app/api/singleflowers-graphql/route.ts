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

    // Використовуємо REST API для singleflowers
    const url = new URL(`${API_URL}/api/singleflowers`);
    url.searchParams.set('populate[image]', 'true');
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
    console.log('Singleflowers API response:', json);
    
    // Перетворюємо дані з REST API формату в GraphQL формат для сумісності
    const singleflowers = json.data?.map((item: any) => ({
      documentId: item.documentId,
      name: item.name,
      slug: item.slug,
      price: item.price,
      description: item.description,
      cardType: item.cardType,
      color: item.color,
      collection: item.collection,
      image: item.image || [],
      // singleflowers не мають varieties
      varieties: [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
    })) || [];

    return NextResponse.json({
      data: singleflowers,
      pagination: json.meta?.pagination || null,
    });

  } catch (error) {
    console.error('Error fetching singleflowers:', error);
    return NextResponse.json({ error: 'Failed to fetch singleflowers' }, { status: 500 });
  }
}
