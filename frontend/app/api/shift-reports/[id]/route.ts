import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

// GET - отримати конкретний звіт про зміну
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching shift report with ID:', id);
    
    const response = await fetch(
      `${STRAPI_URL}/api/shift-reports/${id}?populate=worker`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi error:', response.status, errorText);
      throw new Error(`Failed to fetch shift report: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching shift report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift report' },
      { status: 500 }
    );
  }
}

// PUT - оновити звіт про зміну
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('Updating shift report:', { id, body });
    
    // Спочатку шукаємо за slug (якщо є) - найнадійніший спосіб
    let reportId = null;
    let isUpdate = false;

    if (body.slug) {
      console.log('=== SEARCHING BY SLUG ===');
      console.log('Searching for slug:', body.slug);
      
      const slugUrl = `${STRAPI_URL}/api/shift-reports?filters[slug][$eq]=${body.slug}&populate=worker`;
      console.log('Slug search URL:', slugUrl);
      
      const slugResponse = await fetch(slugUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (slugResponse.ok) {
        const slugData = await slugResponse.json();
        console.log('Slug search response:', JSON.stringify(slugData, null, 2));
        
        if (slugData.data && slugData.data.length > 0) {
          reportId = slugData.data[0].id;
          isUpdate = true;
          console.log('Found existing report by slug with ID:', reportId);
        } else {
          console.log('No report found by slug, will create new one');
        }
      } else {
        console.log('Slug search failed, will create new one');
      }
    }
    
    // 🔍 Крок 1: Знайти ID воркера по slug
    let workerId = body.worker; // Fallback на ID якщо передано
    
    if (body.workerSlug) {
      console.log('Looking up worker by slug:', body.workerSlug);
      const workerRes = await fetch(`${STRAPI_URL}/api/workers?filters[slug][$eq]=${body.workerSlug}`);
      
      if (!workerRes.ok) {
        throw new Error(`Failed to fetch worker: ${workerRes.status}`);
      }
      
      const workerJson = await workerRes.json();
      console.log('Worker lookup response:', workerJson);
      
      if (!workerJson.data || workerJson.data.length === 0) {
        throw new Error(`Worker with slug "${body.workerSlug}" not found`);
      }
      
      workerId = workerJson.data[0].id;
      console.log('Found worker ID:', workerId);
    }
    
    if (!workerId) {
      throw new Error('No worker ID found');
    }
    
    // ✅ Перевірка типу: worker має бути числом
    const workerIdNumber = Number(workerId);
    if (isNaN(workerIdNumber) || workerIdNumber <= 0) {
      throw new Error(`Invalid worker ID: ${workerId}. Must be a positive number.`);
    }
    
    console.log('Worker ID validation:', {
      original: workerId,
      type: typeof workerId,
      converted: workerIdNumber,
      isValid: !isNaN(workerIdNumber) && workerIdNumber > 0
    });
    
    // ✅ Крок 2: Передати worker через connect
    const requestData = {
      data: {
        date: body.date,
        worker: { connect: [workerIdNumber] }, // ← ключовий момент: connect з масивом ID
        itemsSnapshot: body.itemsSnapshot,
        shiftComment: body.shiftComment,
        cash: body.cash,
        slug: body.slug,
      },
    };

    let response;
    let data;

    if (isUpdate && reportId) {
      // Оновлюємо існуючий звіт за знайденим ID
      console.log('=== STRAPI UPDATE REQUEST ===');
      console.log('URL:', `${STRAPI_URL}/api/shift-reports/${reportId}`);
      console.log('Method: PUT by ID');
      console.log('Headers:', {
        'Content-Type': 'application/json',
      });
      console.log('Body:', JSON.stringify(requestData, null, 2));
      console.log('==============================');

      response = await fetch(`${STRAPI_URL}/api/shift-reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Strapi update error:', response.status, errorText);
        
        // Якщо оновлення не вдалося, спробуємо створити новий
        console.log('Update failed, falling back to create...');
        isUpdate = false;
        reportId = null;
      } else {
        data = await response.json();
        console.log('=== STRAPI UPDATE RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        console.log('==============================');
        console.log('Successfully updated shift report');
      }
    }
    
    if (!isUpdate) {
      // Створюємо новий звіт
      console.log('=== STRAPI CREATE REQUEST ===');
      console.log('URL:', `${STRAPI_URL}/api/shift-reports`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json',
      });
      console.log('Body:', JSON.stringify(requestData, null, 2));
      console.log('==============================');

      response = await fetch(`${STRAPI_URL}/api/shift-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Strapi create error:', response.status, errorText);
        throw new Error(`Failed to create shift report: ${response.status}`);
      }

      data = await response.json();
      console.log('=== STRAPI CREATE RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('==============================');
      console.log('Successfully created new shift report');
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating shift report:', error);
    return NextResponse.json(
      { error: 'Failed to update shift report' },
      { status: 500 }
    );
  }
}

// DELETE - видалити звіт про зміну
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Deleting shift report with ID:', id);
    
    const response = await fetch(`${STRAPI_URL}/api/shift-reports/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi delete error:', response.status, errorText);
      throw new Error(`Failed to delete shift report: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift report:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift report' },
      { status: 500 }
    );
  }
}
