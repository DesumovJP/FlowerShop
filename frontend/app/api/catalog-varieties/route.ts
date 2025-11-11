import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

// GraphQL query для сортів квітів (використовуємо GraphQL без токену, як в /api/products)
const VARIETIES_QUERY = `
  query GetVarieties {
    varieties(pagination: { pageSize: 100 }, sort: "name:asc") {
      documentId
      name
      slug
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

// GET - отримати всі сорти для публічного каталогу
export async function GET() {
  try {
    // Використовуємо GraphQL без токену (як в /api/products, який працює)
    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: VARIETIES_QUERY,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('GraphQL error:', response.status, text);
      return NextResponse.json(
        { 
          error: 'GraphQL error', 
          details: text,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const json = await response.json();
    
    if (json.errors) {
      console.error('GraphQL errors:', json.errors);
      return NextResponse.json(
        { 
          error: 'GraphQL errors', 
          details: json.errors 
        },
        { status: 500 }
      );
    }

    console.log('Varieties GraphQL response:', json);
    
    // Повертаємо в форматі, сумісному з admin/varieties endpoint
    return NextResponse.json({
      data: json.data?.varieties || []
    });
  } catch (error: any) {
    console.error('Error fetching varieties:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch varieties',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}














