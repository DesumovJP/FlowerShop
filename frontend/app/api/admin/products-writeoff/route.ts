import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// POST /api/admin/products-writeoff { documentId: string, amount: number }
export async function POST(request: NextRequest) {
  try {
    if (!STRAPI_TOKEN) {
      return NextResponse.json(
        { error: 'Missing STRAPI_API_TOKEN' },
        { status: 401 }
      );
    }

    const { documentId, amount } = await request.json();
    const writeoff = Number(amount) || 0;
    if (!documentId || writeoff <= 0) {
      return NextResponse.json(
        { error: 'documentId and positive amount are required' },
        { status: 400 }
      );
    }

    // Try REST API first - more reliable for finding products
    const restRes = await fetch(
      `${STRAPI_URL}/api/products?filters[documentId][$eq]=${encodeURIComponent(documentId)}&pagination[pageSize]=1`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' }
    );

    let product: any = null;
    let numericId: string | null = null;

    if (restRes.ok) {
      const restJson = await restRes.json();
      const foundProduct = restJson?.data?.[0];
      if (foundProduct) {
        product = foundProduct.attributes || foundProduct;
        numericId = foundProduct.id;
      }
    }

    // If not found by documentId, try by slug as fallback
    if (!product || !numericId) {
      console.log('Not found by documentId, trying by slug...');
      const slugRes = await fetch(
        `${STRAPI_URL}/api/products?filters[slug][$eq]=${encodeURIComponent(documentId)}&pagination[pageSize]=1`,
        { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' }
      );
      
      if (slugRes.ok) {
        const slugJson = await slugRes.json();
        const foundProduct = slugJson?.data?.[0];
        if (foundProduct) {
          product = foundProduct.attributes || foundProduct;
          numericId = foundProduct.id;
        }
      }
    }

    if (!product || !numericId) {
      return NextResponse.json({ error: 'Product not found by documentId or slug' }, { status: 404 });
    }

    const before = Number(product.availableQuantity ?? 0);
    const after = Math.max(0, before - writeoff);

    // Try GraphQL update first
    const updateMutation = `
      mutation UpdateProduct($documentId: ID!, $availableQuantity: Int!) {
        updateProduct(documentId: $documentId, data: { availableQuantity: $availableQuantity }) {
          documentId
          availableQuantity
        }
      }
    `;

    const gqlRes = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: updateMutation, 
        variables: { documentId, availableQuantity: after } 
      }),
    });

    let putRes: Response;
    if (gqlRes.ok) {
      const gqlJson = await gqlRes.json();
      if (gqlJson.data?.updateProduct) {
        // GraphQL success - create a mock response
        putRes = new Response(JSON.stringify({ data: gqlJson.data.updateProduct }), { status: 200 });
      } else {
        // GraphQL failed, try REST
        putRes = await fetch(`${STRAPI_URL}/api/products/${numericId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
          body: JSON.stringify({ data: { availableQuantity: after } }),
        });
      }
    } else {
      // GraphQL failed, try REST
      putRes = await fetch(`${STRAPI_URL}/api/products/${numericId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        body: JSON.stringify({ data: { availableQuantity: after } }),
      });
    }

    const text = await putRes.text();
    if (!putRes.ok) {
      return NextResponse.json(
        { error: `Write-off failed (${putRes.status}): ${text}` },
        { status: putRes.status }
      );
    }

    let updated: any; try { updated = JSON.parse(text); } catch { updated = { raw: text }; }
    return NextResponse.json({ ok: true, before, after, amount: writeoff, data: updated });
  } catch (error) {
    console.error('products-writeoff error:', error);
    return NextResponse.json(
      { error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


