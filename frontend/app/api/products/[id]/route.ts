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
    // Для адмінки також показуємо неопубліковані товари
    const query = `
      query GetAllProducts {
        products {
          documentId
          name
          slug
          price
          productType
          availableQuantity
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;
  const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
  
  if (!STRAPI_TOKEN) {
    return NextResponse.json(
      { error: 'Missing STRAPI_API_TOKEN in environment' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const data = await request.json();

    console.log('Updating product via GraphQL:', { documentId: id, data });

    // Використовуємо GraphQL мутацію для оновлення товару
    // Для зображень Strapi GraphQL очікує масив ID
    let processedData = { ...data };
    
    // Якщо це оновлення зображень, перетворюємо масив ID в правильний формат
    if (data.image && Array.isArray(data.image)) {
      // Strapi GraphQL очікує масив ID для зображень
      processedData.image = data.image.map((imgId: any) => {
        // Якщо це вже об'єкт з id, використовуємо його
        if (typeof imgId === 'object' && imgId.id) {
          return imgId.id;
        }
        // Якщо це число, використовуємо як є
        return typeof imgId === 'number' ? imgId : parseInt(imgId, 10);
      }).filter((imgId: any) => !isNaN(imgId));
    }

    const mutation = `
      mutation UpdateProduct($documentId: ID!, $data: ProductInput!) {
        updateProduct(documentId: $documentId, data: $data) {
          documentId
          name
          price
          cardType
          productType
          image {
            documentId
            url
            alternativeText
          }
        }
      }
    `;

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          documentId: id,
          data: processedData,
        },
      }),
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
    console.error('PUT /api/products/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
