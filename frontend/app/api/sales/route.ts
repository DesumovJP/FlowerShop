import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!STRAPI_TOKEN) {
      return NextResponse.json(
        { error: 'Missing STRAPI_API_TOKEN in environment' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, order } = body as {
      items: Array<{ documentId: string; quantity: number }>;
      order?: any;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const results: Array<{ documentId: string; before: number; after: number }> = [];

    for (const item of items) {
      // 1) Fetch current product to read availableQuantity
      const getRes = await fetch(`${STRAPI_URL}/api/products/${item.documentId}?populate=*`, {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        cache: 'no-store',
      });

      if (!getRes.ok) {
        const text = await getRes.text();
        console.error('Failed to read product', item.documentId, text);
        return NextResponse.json(
          { error: `Failed to read product ${item.documentId}` },
          { status: getRes.status }
        );
      }

      const productData = await getRes.json();
      const before = productData?.data?.availableQuantity ?? 0;
      const after = Math.max(0, before - item.quantity);

      // 2) Update product quantity
      const putRes = await fetch(`${STRAPI_URL}/api/products/${item.documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        body: JSON.stringify({ data: { availableQuantity: after } }),
      });

      if (!putRes.ok) {
        const text = await putRes.text();
        console.error('Failed to update product', item.documentId, text);
        return NextResponse.json(
          { error: `Failed to update product ${item.documentId}` },
          { status: putRes.status }
        );
      }

      results.push({ documentId: item.documentId, before, after });
    }

    return NextResponse.json({ ok: true, updated: results, order }, { status: 200 });
  } catch (error) {
    console.error('POST /api/sales error:', error);
    return NextResponse.json({ error: 'Failed to process sale' }, { status: 500 });
  }
}










