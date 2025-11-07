import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// GET - отримати звіти про зміни
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const worker = searchParams.get('worker');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let filters = '';
    if (date) {
      filters += `&filters[date][$eq]=${date}`;
    }
    if (worker) {
      filters += `&filters[worker][id][$eq]=${worker}`;
    }
    if (month && year) {
      // Використовуємо правильний формат для фільтрації по місяцю
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      // Отримуємо перший і останній день місяця
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0); // Останній день місяця
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      filters += `&filters[date][$gte]=${startDateStr}&filters[date][$lte]=${endDateStr}`;
    }

    const url = `${STRAPI_URL}/api/shift-reports?populate=worker${filters}&sort=date:desc`;
    console.log('🔍 Fetching shift reports from:', url);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Додаємо токен тільки якщо він є
    if (STRAPI_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
    }
    
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Strapi error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: 'Failed to fetch shift reports',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📋 Strapi response data:', data);
    
    // Перетворюємо дані в очікуваний формат (якщо потрібно)
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching shift reports:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch shift reports',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - створити новий звіт про зміну
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 🔍 Крок 1: Знайти ID воркера по slug
    let workerId = body.worker; // Fallback на ID якщо передано
    
    if (body.workerSlug) {
      const workerRes = await fetch(`${STRAPI_URL}/api/workers?filters[slug][$eq]=${body.workerSlug}`);
      
      if (!workerRes.ok) {
        throw new Error(`Failed to fetch worker: ${workerRes.status}`);
      }
      
      const workerJson = await workerRes.json();
      workerId = workerJson.data[0].id;
    }
    
    if (!workerId) {
      throw new Error('No worker ID found');
    }
    
    // ✅ Перевірка типу: worker має бути числом
    const workerIdNumber = Number(workerId);
    if (isNaN(workerIdNumber) || workerIdNumber <= 0) {
      throw new Error(`Invalid worker ID: ${workerId}. Must be a positive number.`);
    }
    
    // ✅ Крок 2: Передати worker через connect
    const strapiData = {
      data: {
        date: body.date,
        worker: { connect: [workerIdNumber] }, // ← ключовий момент: connect з масивом ID
        itemsSnapshot: body.itemsSnapshot,
        shiftComment: body.shiftComment,
        cash: body.cash,
        slug: body.slug,
      },
    };
    
    
    const response = await fetch(`${STRAPI_URL}/api/shift-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(strapiData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi error response:', response.status, errorText);
      throw new Error(`Failed to create shift report: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // ✅ Перевірка: чи зв'язок зберігся
    if (data.data && data.data.id) {
      const verifyResponse = await fetch(`${STRAPI_URL}/api/shift-reports/${data.data.id}?populate=worker`);
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        
        if (!verifyData.data.attributes.worker?.data) {
          console.warn('⚠️ Worker relation was not saved properly!');
        }
      } else {
        const errorText = await verifyResponse.text();
        console.warn('Could not verify worker relation:', verifyResponse.status, errorText);
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating shift report:', error);
    return NextResponse.json(
      { error: 'Failed to create shift report' },
      { status: 500 }
    );
  }
}
