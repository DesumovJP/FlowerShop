import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Next.js Upload API called');
    const formData = await request.formData();

    console.log('📁 Upload API - Received FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const ref = formData.get('ref') as string;
    const documentId = formData.get('refId') as string; // Це documentId
    const field = formData.get('field') as string;
    const file = formData.get('files') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ref || !documentId || !field) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log('🔍 Converting documentId to entry.id:', { documentId, ref });

    // Отримуємо числовий id за documentId
    let entryId: number;
    if (ref === 'api::singleflower.singleflower') {
      const res = await fetch(`${STRAPI_URL}/api/singleflowers?filters[documentId][$eq]=${documentId}`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch singleflower: ${res.status}`);
      }
      
      const json = await res.json();
      entryId = json.data?.[0]?.id;
      
      if (!entryId) {
        throw new Error(`Singleflower with documentId ${documentId} not found`);
      }
    } else if (ref === 'api::bouquet.bouquet') {
      const res = await fetch(`${STRAPI_URL}/api/bouquets?filters[documentId][$eq]=${documentId}`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch bouquet: ${res.status}`);
      }
      
      const json = await res.json();
      entryId = json.data?.[0]?.id;
      
      if (!entryId) {
        throw new Error(`Bouquet with documentId ${documentId} not found`);
      }
    } else if (ref === 'api::product.product') {
      const res = await fetch(`${STRAPI_URL}/api/products?filters[documentId][$eq]=${documentId}`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch product: ${res.status}`);
      }
      
      const json = await res.json();
      entryId = json.data?.[0]?.id;
      
      if (!entryId) {
        throw new Error(`Product with documentId ${documentId} not found`);
      }
    } else {
      throw new Error(`Unknown ref type: ${ref}`);
    }

    console.log('✅ Found entry.id:', entryId);

    // Створюємо новий FormData з правильним refId
    const uploadFormData = new FormData();
    uploadFormData.append('files', file);
    uploadFormData.append('ref', ref);
    uploadFormData.append('refId', entryId.toString()); // ✅ числовий ID
    uploadFormData.append('field', field);

    console.log('🔧 Using default Strapi v5 upload with correct refId:', { ref, refId: entryId.toString(), field });

    // Використовуємо дефолтний Strapi v5 upload
    const response = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
      },
      body: uploadFormData,
    });

    console.log(`📊 Strapi response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Strapi upload error:', errorText);
      throw new Error(`Strapi upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}