import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test connect operation');
    const { searchParams } = new URL(request.url);
    const singleflowerId = searchParams.get('singleflowerId');
    const fileId = searchParams.get('fileId');

    if (!singleflowerId || !fileId) {
      return NextResponse.json({ error: 'Missing singleflowerId or fileId' }, { status: 400 });
    }

    console.log('🔗 Testing connect:', { singleflowerId, fileId });

    // Спробуємо оновити singleflower з файлом
    const response = await fetch(`${STRAPI_URL}/api/singleflowers/${singleflowerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          image: {
            connect: [{ id: parseInt(fileId) }]
          }
        }
      }),
    });

    console.log(`📊 Connect response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Connect error:', errorText);
      throw new Error(`Connect failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Connect successful:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in test connect:', error);
    return NextResponse.json(
      { error: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

