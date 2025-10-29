import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Fetching singleflower with ID:', await params);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_API_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`;
    }

    // Використовуємо REST API для singleflowers
    const resolvedParams = await params;
    const url = new URL(`${API_URL}/api/singleflowers`);
    url.searchParams.set('filters[slug][$eq]', resolvedParams.id);
    url.searchParams.set('populate[image]', 'true');
    // singleflowers не мають varieties, тому не додаємо populate[varieties]
    
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
      return NextResponse.json({ error: 'Singleflower not found' }, { status: 404 });
    }

    // Перетворюємо дані з REST API формату в GraphQL формат для сумісності
    const item = json.data[0];
    const singleflower = {
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
    };

    return NextResponse.json({
      singleflower1: singleflower,
    });

  } catch (error) {
    console.error('Error fetching singleflower:', error);
    return NextResponse.json({ error: 'Failed to fetch singleflower' }, { status: 500 });
  }
}

