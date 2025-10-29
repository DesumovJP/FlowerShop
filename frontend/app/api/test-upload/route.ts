import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test upload without linking');
    const formData = await request.formData();

    const file = formData.get('files') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    console.log('📁 Test file:', file.name, file.size, file.type);

    // Створюємо FormData без ref, refId, field - тільки файл
    const testFormData = new FormData();
    testFormData.append('files', file);

    console.log('📤 Uploading to Strapi without linking...');

    const response = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: testFormData,
    });

    console.log(`📊 Strapi response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Strapi upload error:', errorText);
      throw new Error(`Strapi upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Test upload successful:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in test upload:', error);
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

