import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// GraphQL query для сортів квітів
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

export async function GET() {
  try {
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
        query: VARIETIES_QUERY,
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

    console.log('Varieties GraphQL response:', json);
    
    return NextResponse.json({
      variety1S: json.data.varieties || []
    });
  } catch (e: any) {
    console.error('Varieties GraphQL error:', e);
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}













