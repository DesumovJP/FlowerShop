import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

const DELETE_PRODUCT_GQL = `
  mutation DeleteProduct($documentId: ID!) {
    deleteProduct(documentId: $documentId) {
      documentId
    }
  }
`;

// DELETE /api/admin/products-delete?documentId=xxx
export async function DELETE(request: NextRequest) {
  try {
    if (!STRAPI_TOKEN) {
      return NextResponse.json(
        { error: 'Missing STRAPI_API_TOKEN' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Try GraphQL delete by documentId (unified Product collection)
    const gqlRes = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: DELETE_PRODUCT_GQL, variables: { documentId } }),
    });

    if (gqlRes.ok) {
      const gqlJson = await gqlRes.json();
      if (gqlJson.errors) {
        // Fall back to REST if GraphQL errors
          
      } else {
        return NextResponse.json({ ok: true, data: gqlJson.data?.deleteProduct });
      }
    }

    // Fallback: lookup numeric id via REST, then delete
    const findRes = await fetch(
      `${STRAPI_URL}/api/products?filters[documentId][$eq]=${encodeURIComponent(documentId)}&pagination[pageSize]=1`,
      { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` }, cache: 'no-store' }
    );
    const findText = await findRes.text();
    if (!findRes.ok) {
      return NextResponse.json(
        { error: `Lookup failed (${findRes.status}): ${findText}` },
        { status: 500 }
      );
    }
    const findJson = JSON.parse(findText);
    const numericId = findJson?.data?.[0]?.id;
    if (!numericId) {
      return NextResponse.json(
        { error: 'Product not found by documentId (REST lookup empty)' },
        { status: 404 }
      );
    }

    const delRes = await fetch(`${STRAPI_URL}/api/products/${numericId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
    });
    const delText = await delRes.text();
    if (!delRes.ok) {
      return NextResponse.json(
        { error: `REST delete failed (${delRes.status}): ${delText}` },
        { status: delRes.status }
      );
    }

    let delJson: any;
    try { delJson = JSON.parse(delText); } catch { delJson = { raw: delText }; }
    return NextResponse.json({ ok: true, data: delJson });
  } catch (error) {
    console.error('Admin products-delete error:', error);
    return NextResponse.json(
      { error: `Unexpected error deleting product: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


