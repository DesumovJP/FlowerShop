import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// GraphQL query для одиночних квітів
const SINGLEFLOWERS_QUERY = `
  query GetSingleflowers($page: Int, $pageSize: Int) {
    singleflowers(pagination: { page: $page, pageSize: $pageSize }, sort: "createdAt:desc") {
      documentId
      name
      slug
      price
      description
      cardType
      color
      collection
      image {
        documentId
        url
        name
      }
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '12');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
    }

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: SINGLEFLOWERS_QUERY,
        variables: { page, pageSize }
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('GraphQL error:', text);
      return NextResponse.json({ error: 'GraphQL error', details: text }, { status: 500 });
    }

    const json = await response.json();
    
    if (json.errors) {
      console.error('GraphQL errors:', json.errors);
      return NextResponse.json({ error: 'GraphQL errors', details: json.errors }, { status: 500 });
    }

    console.log('Singleflowers GraphQL response:', json);
    
    return NextResponse.json({
      data: json.data.singleflowers || [],
      pagination: {
        page,
        pageSize,
        pageCount: Math.ceil((json.data.singleflowers?.length || 0) / pageSize),
        total: json.data.singleflowers?.length || 0,
      }
    });
  } catch (e: any) {
    console.error('Singleflowers GraphQL error:', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
