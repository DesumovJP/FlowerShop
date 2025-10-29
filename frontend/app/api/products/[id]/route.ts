import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching product with ID/slug:', id);

    // Використовуємо простий запит для всіх продуктів
    const query = `
      query GetAllProducts {
        products(filters: { publishedAt: { notNull: true } }) {
          documentId
          name
          slug
          price
          productType
          color
          description
          cardType
          image {
            documentId
            url
            alternativeText
            width
            height
          }
          varieties {
            documentId
            name
            slug
          }
          createdAt
          updatedAt
          publishedAt
        }
      }
    `;

    console.log('GraphQL query:', query);

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GraphQL error:', errorText);
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }
    
    // Шукаємо продукт по slug або documentId
    const products = data.data.products || [];
    console.log('All products:', products.map(p => ({ documentId: p.documentId, slug: p.slug, name: p.name })));
    console.log('Looking for:', id);
    
    const product = products.find((p: any) => {
      const matchesSlug = p.slug === id;
      const matchesDocumentId = p.documentId === id;
      console.log(`Product ${p.name}: slug=${p.slug}, documentId=${p.documentId}, matchesSlug=${matchesSlug}, matchesDocumentId=${matchesDocumentId}`);
      return matchesSlug || matchesDocumentId;
    });
    
    if (product) {
      return NextResponse.json({ product });
    }

    console.error('Product not found');
    return NextResponse.json(
      { error: 'Product not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
