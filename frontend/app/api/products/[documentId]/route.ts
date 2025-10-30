import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function PUT(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    if (!STRAPI_TOKEN) {
      return NextResponse.json(
        { error: 'Missing STRAPI_API_TOKEN in environment' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Use Strapi GraphQL to update by documentId
    const mutation = `
      mutation UpdateProduct($documentId: ID!, $data: ProductInput!) {
        updateProduct(documentId: $documentId, data: $data) {
          documentId
          name
          price
          cardType
          productType
        }
      }
    `;

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({ query: mutation, variables: { documentId: params.documentId, data } }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GraphQL update error:', errorText);
      return NextResponse.json(
        { error: `Failed to update product: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const json = await response.json();
    if (json.errors) {
      console.error('GraphQL update errors:', json.errors);
      return NextResponse.json(
        { error: 'GraphQL update failed', details: json.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(json.data.updateProduct, { status: 200 });
  } catch (error) {
    console.error('PUT /api/products/[documentId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}


