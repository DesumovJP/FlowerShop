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
      // Resolve product by documentId (preferred) or slug (fallback) to get numeric id
      let product: any = null;
      let numericId: string | null = null;

      // Try by documentId
      const restRes = await fetch(
        `${STRAPI_URL}/api/products?filters[documentId][$eq]=${encodeURIComponent(item.documentId)}&pagination[pageSize]=1`,
        { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' }
      );
      if (restRes.ok) {
        const restJson = await restRes.json();
        const found = restJson?.data?.[0];
        if (found) {
          product = found.attributes || found;
          numericId = found.id;
        }
      }

      // Fallback: try slug equals provided value
      if (!product || !numericId) {
        const slugRes = await fetch(
          `${STRAPI_URL}/api/products?filters[slug][$eq]=${encodeURIComponent(item.documentId)}&pagination[pageSize]=1`,
          { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' }
        );
        if (slugRes.ok) {
          const slugJson = await slugRes.json();
          const found = slugJson?.data?.[0];
          if (found) {
            product = found.attributes || found;
            numericId = found.id;
          }
        }
      }

      if (!product || !numericId) {
        console.error('Failed to resolve product by documentId or slug:', item.documentId);
        return NextResponse.json(
          { error: `Failed to read product ${item.documentId}` },
          { status: 404 }
        );
      }

      const before = Number(product.availableQuantity ?? 0);
      const after = Math.max(0, before - Number(item.quantity || 0));

      // Try GraphQL update by documentId first
      const updateMutation = `
        mutation UpdateProduct($documentId: ID!, $availableQuantity: Int!) {
          updateProduct(documentId: $documentId, data: { availableQuantity: $availableQuantity }) {
            documentId
            availableQuantity
          }
        }
      `;

      let putRes: Response | null = null;
      const gqlRes = await fetch(`${STRAPI_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: updateMutation, 
          variables: { documentId: item.documentId, availableQuantity: after } 
        }),
      });

      if (gqlRes.ok) {
        const gqlJson = await gqlRes.json();
        if (gqlJson?.data?.updateProduct) {
          putRes = new Response(JSON.stringify({ data: gqlJson.data.updateProduct }), { status: 200 });
        }
      }

      // Fallback to REST by numeric id
      if (!putRes) {
        putRes = await fetch(`${STRAPI_URL}/api/products/${numericId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
          body: JSON.stringify({ data: { availableQuantity: after } }),
        });
      }

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










