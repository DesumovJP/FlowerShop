import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '1000';
    const productType = searchParams.get('productType'); // bouquet, singleflower, composition, else, або null для всіх
    const search = searchParams.get('search');

    console.log('🛒 Admin API: Fetching products with params:', {
      page,
      pageSize,
      productType,
      search
    });

    // Будуємо фільтри для GraphQL (аналогічно до публічного API, але БЕЗ фільтрації по publishedAt)
    const filterConditions = [];
    
    if (productType && productType !== 'all') {
      filterConditions.push(`productType: { eq: "${productType}" }`);
    }
    
    if (search) {
      filterConditions.push(`name: { contains: "${search}" }`);
    }
    
    // НЕ додаємо фільтр по publishedAt - адмінка має бачити всі товари
    
    // Додаємо пагінацію до GraphQL запиту
    const pageSizeInt = parseInt(pageSize);
    const pageInt = parseInt(page);
    const paginationParams = pageSizeInt >= 1000 
      ? 'pagination: { pageSize: 1000 }' 
      : `pagination: { page: ${pageInt}, pageSize: ${pageSizeInt} }`;
    
    // Будуємо параметри для GraphQL запиту
    const queryParams = [];
    if (filterConditions.length > 0) {
      queryParams.push(`filters: { ${filterConditions.join(', ')} }`);
    }
    queryParams.push(paginationParams);
    
    const query = `
      query GetAllProducts {
        products(${queryParams.join(', ')}) {
          documentId
          name
          slug
          price
          availableQuantity
          productType
          color
          description
          cardType
          image {
            documentId
            url
            alternativeText
            width
            height
          }
          varieties {
            documentId
            name
            slug
          }
          createdAt
          updatedAt
          publishedAt
        }
      }
    `;

    console.log('🛒 Admin API GraphQL query:', query);

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GraphQL error:', errorText);
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('🛒 Admin API GraphQL response:', data);

    if (data.errors) {
      console.error('❌ GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const products = data.data.products || [];
    
    // Якщо pageSize великий (>= 1000), повертаємо всі товари без пагінації
    let paginatedProducts = products;
    let total = products.length;
    let pageCount = 1;
    
    // Застосовуємо пагінацію тільки якщо pageSize менше 1000
    if (pageSizeInt < 1000) {
      const startIndex = (pageInt - 1) * pageSizeInt;
      const endIndex = startIndex + pageSizeInt;
      paginatedProducts = products.slice(startIndex, endIndex);
      pageCount = Math.ceil(total / pageSizeInt);
    }

    console.log('🛒 Admin API: Returning products:', {
      total,
      returned: paginatedProducts.length,
      page: pageInt,
      pageCount
    });

    return NextResponse.json({
      data: paginatedProducts,
      pagination: {
        page: pageInt,
        pageSize: pageSizeInt,
        pageCount,
        total
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin products:', error);
    
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Strapi server is not running. Please start the backend server.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
