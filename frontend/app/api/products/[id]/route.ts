import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching product with ID/slug:', id);

    // Використовуємо GraphQL запит з фільтром по slug для публічного API
    // Фільтруємо тільки опубліковані товари
    const query = `
      query GetProductBySlug {
        products(
          filters: { 
            slug: { eq: "${id}" },
            publishedAt: { notNull: true }
          }
        ) {
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
    
    // Отримуємо продукт з відповіді (GraphQL вже відфільтрував по slug)
    const products = data.data?.products || [];
    console.log('Products found:', products.length);
    
    if (products.length === 0) {
      // Якщо не знайдено по slug, спробуємо знайти по documentId
      console.log('Product not found by slug, trying documentId:', id);
      
      const queryById = `
        query GetProductById {
          products(
            filters: { 
              documentId: { eq: "${id}" },
              publishedAt: { notNull: true }
            }
          ) {
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
      
      const responseById = await fetch(`${STRAPI_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryById,
        }),
      });
      
      if (responseById.ok) {
        const dataById = await responseById.json();
        if (!dataById.errors && dataById.data?.products?.length > 0) {
          const product = dataById.data.products[0];
          console.log('Product found by documentId:', product.name);
          return NextResponse.json({ product });
        }
      }
      
      console.error('Product not found by slug or documentId');
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Знайдено продукт по slug
    const product = products[0];
    console.log('Product found by slug:', product.name);
    return NextResponse.json({ product });

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

    let response = await fetch(`${STRAPI_URL}/graphql`, {
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

    // REST fallback if GraphQL fails (e.g., 401 or schema mismatch)
    if (!response.ok) {
      const errText = await response.text();
      console.warn('GraphQL update failed, trying REST fallback. Status:', response.status, errText);

      // Try to resolve numeric ID via direct REST API call to Strapi
      // Use the documentId directly as a path parameter
      const restRes = await fetch(`${STRAPI_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        body: JSON.stringify({ data: processedData }),
      });

      if (!restRes.ok) {
        const txt = await restRes.text();
        console.error('REST update by documentId failed:', restRes.status, txt);
        
        // Last resort: try to find by slug if id looks like a slug
        if (id.includes('-')) {
          const searchRes = await fetch(
            `${STRAPI_URL}/api/products?filters[slug][$eq]=${encodeURIComponent(id)}&pagination[pageSize]=1`,
            {
              headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
              cache: 'no-store',
            }
          );
          
          if (searchRes.ok) {
            const searchJson = await searchRes.json();
            const found = searchJson?.data?.[0];
            if (found && found.id) {
              const retryRes = await fetch(`${STRAPI_URL}/api/products/${found.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${STRAPI_TOKEN}`,
                },
                body: JSON.stringify({ data: processedData }),
              });
              
              if (retryRes.ok) {
                const retryJson = await retryRes.json();
                return NextResponse.json(retryJson?.data || retryJson, { status: 200 });
              }
            }
          }
        }
        
        return NextResponse.json(
          { error: `Failed to update product via REST: ${restRes.status} ${txt}` },
          { status: restRes.status }
        );
      }

      const restJson = await restRes.json();
      return NextResponse.json(restJson?.data || restJson, { status: 200 });
    }

    const json = await response.json();
    
    if (json.errors) {
      console.warn('GraphQL update errors, attempting REST fallback...', json.errors);
      
      // Try to update via REST API directly with documentId
      const restRes = await fetch(`${STRAPI_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
        body: JSON.stringify({ data: processedData }),
      });
      
      if (!restRes.ok) {
        const txt = await restRes.text();
        console.error('REST update by documentId failed after GraphQL errors:', restRes.status, txt);
        
        // Last resort: try to find by slug if id looks like a slug
        if (id.includes('-')) {
          const searchRes = await fetch(
            `${STRAPI_URL}/api/products?filters[slug][$eq]=${encodeURIComponent(id)}&pagination[pageSize]=1`,
            {
              headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
              cache: 'no-store',
            }
          );
          
          if (searchRes.ok) {
            const searchJson = await searchRes.json();
            const found = searchJson?.data?.[0];
            if (found && found.id) {
              const retryRes = await fetch(`${STRAPI_URL}/api/products/${found.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${STRAPI_TOKEN}`,
                },
                body: JSON.stringify({ data: processedData }),
              });
              
              if (retryRes.ok) {
                const retryJson = await retryRes.json();
                return NextResponse.json(retryJson?.data || retryJson, { status: 200 });
              }
            }
          }
        }
        
        return NextResponse.json(
          { error: `GraphQL failed and REST update failed: ${restRes.status} ${txt}` },
          { status: restRes.status }
        );
      }
      
      const restJson = await restRes.json();
      return NextResponse.json(restJson?.data || restJson, { status: 200 });
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
