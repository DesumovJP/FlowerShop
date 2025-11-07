import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// GET - отримати всі сорти
export async function GET() {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Додаємо токен тільки якщо він є
    if (STRAPI_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
    }

    const url = new URL(`${STRAPI_URL}/api/varieties`);
    url.searchParams.set('populate', '*');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('sort[0]', 'name:asc');

    const response = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi API error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch varieties',
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Перетворюємо дані в очікуваний формат
    const varieties = data.data?.map((item: any) => ({
      documentId: item.documentId,
      name: item.name,
      slug: item.slug,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
    })) || [];

    return NextResponse.json({ data: varieties });
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

// POST - створити новий сорт
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating variety with data:', body);
    
    const response = await fetch(`${STRAPI_URL}/api/varieties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          name: body.name,
          slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: body.description ? [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: body.description
                }
              ]
            }
          ] : null,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi error:', errorText);
      throw new Error(`Strapi error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Variety created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating variety:', error);
    return NextResponse.json(
      { error: 'Failed to create variety' },
      { status: 500 }
    );
  }
}

// PUT - оновити сорт
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, ...updateData } = body;
    
    const response = await fetch(`${STRAPI_URL}/api/varieties/${documentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...updateData,
          slug: updateData.slug || (updateData.name ? updateData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined),
          description: updateData.description ? [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: updateData.description
                }
              ]
            }
          ] : null,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strapi error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating variety:', error);
    return NextResponse.json(
      { error: 'Failed to update variety' },
      { status: 500 }
    );
  }
}

// DELETE - видалити сорт
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${STRAPI_URL}/api/varieties/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strapi error: ${response.status} - ${errorText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variety:', error);
    return NextResponse.json(
      { error: 'Failed to delete variety' },
      { status: 500 }
    );
  }
}