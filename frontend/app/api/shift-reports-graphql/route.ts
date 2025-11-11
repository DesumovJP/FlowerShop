import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// GET - отримати звіти про зміни через GraphQL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Будуємо фільтри для GraphQL
    let filters = '';
    
    if (date) {
      // Простий фільтр по даті
      filters = `(filters: { date: { eq: "${date}" } })`;
    } else if (month && year) {
      // Фільтр по місяцю - використовуємо правильний синтаксис для Strapi v5
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      // Отримуємо перший і останній день місяця
      const startDate = new Date(yearNum, monthNum - 1, 1);
      const endDate = new Date(yearNum, monthNum, 0); // Останній день місяця
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Використовуємо правильний синтаксис для Strapi v5 GraphQL з and
      filters = `(filters: { and: [{ date: { gte: "${startDateStr}" } }, { date: { lte: "${endDateStr}" } }] })`;
    }

    const query = `
      query GetAllShiftReports {
        shiftReports${filters} {
          documentId
          date
          cash
          slug
          shiftComment
          itemsSnapshot
          worker {
            documentId
            name
            slug
          }
          createdAt
          updatedAt
        }
      }
    `;

    console.log('🔍 GraphQL query for shift reports:', query);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    // Додаємо токен якщо він присутній у середовищі (уникаємо 401 на приватних інстансах)
    if (STRAPI_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
    }

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers,
      cache: 'no-store',
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GraphQL error:', response.status, errorText);
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
    console.log('📦 Raw GraphQL response:', data);

    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      return NextResponse.json(
        { 
          error: 'GraphQL errors',
          details: data.errors
        },
        { status: 400 }
      );
    }

    // Обробляємо дані для сумісності з компонентами
    const reports = (data.data?.shiftReports || []).map((report: any) => ({
      ...report,
      id: report.documentId, // Використовуємо documentId як id
    }));

    console.log('📦 Processed shift reports:', reports);
    return NextResponse.json({
      data: reports
    });

  } catch (error: any) {
    console.error('Error fetching shift reports via GraphQL:', error);
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch shift reports',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - створити новий звіт про зміну через GraphQL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📦 Incoming POST body:', body);
    
    // ✅ Short-circuit: if documentId and itemsSnapshot provided, do JSON update immediately
    if (body.documentId && body.itemsSnapshot !== undefined) {
      console.log('🔁 Detected direct JSON update payload');
      const updateMutation = `
        mutation UpdateShiftReport($documentId: ID!, $itemsSnapshot: JSON) {
          updateShiftReport(documentId: $documentId, data: { itemsSnapshot: $itemsSnapshot }) {
            documentId
            itemsSnapshot
          }
        }
      `;

      const response = await fetch(`${STRAPI_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: updateMutation,
          variables: { documentId: body.documentId, itemsSnapshot: body.itemsSnapshot },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GraphQL update error (direct JSON):', errorText);
        throw new Error(`GraphQL request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        console.error('❌ GraphQL errors (direct JSON):', data.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return NextResponse.json(data.data.updateShiftReport);
    }
    
    // Визначаємо тип запиту
    const isCheckQuery = body.query?.includes('shiftReports') && !body.query?.includes('mutation');
    const isUpdateQuery = body.query?.includes('updateShiftReport');
    const containsSet = body.query?.includes('set');
    
    console.log('🔍 Query type:', isCheckQuery ? 'checkExistingShift' : isUpdateQuery ? 'updateItemsSnapshot' : 'createShiftReport');
    console.log('🔍 Query contains updateShiftReport:', isUpdateQuery);
    console.log('🔍 Query contains set:', containsSet);
    
    if (isCheckQuery) {
      // ✅ Це запит на перевірку — виконуємо GraphQL запит без додаткової валідації
      const response = await fetch(`${STRAPI_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: body.query,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GraphQL check error:', errorText);
        throw new Error(`GraphQL request failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors) {
        console.error('❌ GraphQL errors:', data.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return NextResponse.json(data);
    }
    
    if (isUpdateQuery) {
      // ✅ Перехоплюємо старі запити і переводимо на JSON-оновлення
      console.log('📦 Processing updateShiftReport query');
      // Спробуємо витягти documentId з запиту, інакше візьмемо з body.documentId
      const documentId = body.documentId;
      const itemsSnapshot = body.itemsSnapshot;

      if (documentId && itemsSnapshot !== undefined) {
        const updateMutation = `
          mutation UpdateShiftReport($documentId: ID!, $itemsSnapshot: JSON) {
            updateShiftReport(documentId: $documentId, data: { itemsSnapshot: $itemsSnapshot }) {
              documentId
              itemsSnapshot
            }
          }
        `;

        const response = await fetch(`${STRAPI_URL}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: updateMutation,
            variables: { documentId, itemsSnapshot },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ GraphQL update error:', errorText);
          throw new Error(`GraphQL request failed: ${response.status}`);
        }

        const data = await response.json();
        if (data.errors) {
          console.error('❌ GraphQL errors:', data.errors);
          throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        }

        return NextResponse.json(data.data.updateShiftReport);
      }

      // Якщо прийшов сирий запит, все ще пропускаємо як є (задля зворотної сумісності)
      const response = await fetch(`${STRAPI_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: body.query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GraphQL update error:', errorText);
        throw new Error(`GraphQL request failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.errors) {
        console.error('❌ GraphQL errors:', data.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return NextResponse.json(data);
    }
    
    // ✅ Це запит на створення — вимагаємо всі поля
    if (!body.workerSlug) {
      console.error('❌ Missing workerSlug in request body');
      throw new Error('workerSlug is required');
    }
    
    if (!body.date) {
      console.error('❌ Missing date in request body');
      throw new Error('date is required');
    }
    
    if (!body.slug) {
      console.error('❌ Missing slug in request body');
      throw new Error('slug is required');
    }
    
    if (body.cash === undefined || body.cash === null) {
      console.error('❌ Missing cash in request body');
      throw new Error('cash is required');
    }
    
    if (body.shiftComment === undefined || body.shiftComment === null) {
      console.error('❌ Missing shiftComment in request body');
      throw new Error('shiftComment is required');
    }
    
    if (!body.worker) {
      console.error('❌ Missing worker in request body');
      throw new Error('worker is required');
    }
    
    // Крок 1: Знайти worker.id по slug
    const findWorkerQuery = `
      query FindWorker($slug: String!) {
        workers(filters: { slug: { eq: $slug } }) {
          documentId
        }
      }
    `;

    
    const findWorkerResponse = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: findWorkerQuery,
        variables: { slug: body.workerSlug }
      }),
    });


    if (!findWorkerResponse.ok) {
      const errorText = await findWorkerResponse.text();
      console.error('❌ Find worker error:', findWorkerResponse.status, errorText);
      throw new Error(`Failed to find worker: ${findWorkerResponse.status}`);
    }

    const findWorkerData = await findWorkerResponse.json();
    
    if (findWorkerData.errors) {
      console.error('Find worker GraphQL errors:', findWorkerData.errors);
      throw new Error(`Find worker GraphQL errors: ${JSON.stringify(findWorkerData.errors)}`);
    }

    if (!findWorkerData.data.workers.length) {
      throw new Error(`Worker with slug "${body.workerSlug}" not found`);
    }

    const workerId = findWorkerData.data.workers[0].documentId;
    console.log('📦 Found workerId:', workerId, 'Type:', typeof workerId);

    // Перевіряємо, що workerId є валідним UUID
    if (!workerId || typeof workerId !== 'string') {
      console.error('❌ Invalid workerId:', workerId);
      throw new Error(`Invalid workerId: ${workerId}`);
    }

    // Крок 2: Створити ShiftReport з connect: [id]
    
    // Перевіряємо структуру itemsSnapshot
    
  const createMutation = `
      mutation CreateShiftReport($date: Date!, $slug: String!, $cash: Float!, $shiftComment: String!, $worker: ID!) {
        createShiftReport(data: {
          date: $date,
          slug: $slug,
          cash: $cash,
          shiftComment: $shiftComment,
          worker: $worker
        }) {
          documentId
          date
          slug
          cash
          shiftComment
          worker {
            name
          }
          createdAt
          updatedAt
        }
      }
    `;

    // Валідація обов'язкових полів
    if (!body.slug) {
      console.error('❌ Missing slug in request body');
      throw new Error('slug is required');
    }
    
    if (body.cash === undefined || body.cash === null) {
      console.error('❌ Missing cash in request body');
      throw new Error('cash is required');
    }
    
    if (body.shiftComment === undefined || body.shiftComment === null) {
      console.error('❌ Missing shiftComment in request body');
      throw new Error('shiftComment is required');
    }

    const createVariables = {
      date: body.date,
      slug: body.slug,
      cash: Number(body.cash) || 0,
      shiftComment: body.shiftComment || '',
      worker: workerId
    };
    
    console.log('🔍 Create variables:', createVariables);
    console.log('🔍 GraphQL mutation:', createMutation);
    console.log('📦 GraphQL request body:', {
      query: createMutation,
      variables: createVariables
    });
    
    const createResponse = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: createMutation,
        variables: createVariables
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Create error response:', errorText);
      throw new Error(`Create request failed: ${createResponse.status}`);
    }

    const createData = await createResponse.json();
    console.log('📦 Create response from Strapi:', createData);
    
    if (createData.errors) {
      console.error('Create GraphQL errors:', createData.errors);
      throw new Error(`Create GraphQL errors: ${JSON.stringify(createData.errors)}`);
    }

    const shiftId = createData.data?.createShiftReport?.documentId;
    console.log('📦 Extracted shiftId:', shiftId);

    // Тепер додаємо itemsSnapshot як JSON через updateShiftReport
    const itemsSnapshot = body.itemsSnapshot || [];
    if (itemsSnapshot && itemsSnapshot.length > 0 && shiftId) {
      const updateMutation = `
        mutation UpdateShiftReport($documentId: ID!, $itemsSnapshot: JSON) {
          updateShiftReport(documentId: $documentId, data: {
            itemsSnapshot: $itemsSnapshot
          }) {
            documentId
            itemsSnapshot
          }
        }
      `;

      const updateResponse = await fetch(`${STRAPI_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: updateMutation,
          variables: { documentId: shiftId, itemsSnapshot },
        })
      });

      const updateResult = await updateResponse.json();
      if (updateResult.errors) {
        console.error('❌ GraphQL update errors:', updateResult.errors);
        throw new Error(`Update GraphQL errors: ${JSON.stringify(updateResult.errors)}`);
      }
    }

    // Повертаємо тільки дані зміни без зайвих обгорток
    return NextResponse.json(createData.data.createShiftReport);
  } catch (error) {
    console.error('Error creating shift report via GraphQL:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { 
        error: 'Failed to create shift report via GraphQL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
