import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '12';
    const productType = searchParams.get('productType'); // bouquet, singleflower, або null для всіх
    const variety = searchParams.get('variety');
    const color = searchParams.get('color');
    const search = searchParams.get('search');

    console.log('Fetching products with params:', {
      page,
      pageSize,
      productType,
      variety,
      color,
      search
    });

    // Будуємо фільтри для GraphQL
    const filterConditions = [];
    
    if (productType) {
      filterConditions.push(`productType: { eq: "${productType}" }`);
    }
    
    if (variety) {
      filterConditions.push(`varieties: { name: { eq: "${variety}" } }`);
    }
    
    if (color) {
      // Переводимо український колір в translit формат, який використовується в Strapi
      const colorMapping: Record<string, string> = {
        'Червоний': 'chervonij',
        'Рожевий': 'rozhevyj',
        'Білий': 'bilyj',
        'Жовтий': 'zhyovtyj',
        'Фіолетовий': 'fioletovij',
        'Синій': 'synij',
        'Зелений': 'zelenyj',
        'Помаранчевий': 'oranzhevyj',
        'Оранжевий': 'oranzhevyj',
        'Кремовий': 'kremovyj',
        'Персиковий': 'peach',
        'Голубий': 'golubyj',
        'Бордовий': 'bordovyj',
        'Мікс': 'miks'
      };
      const strapiColor = colorMapping[color] || color;
      filterConditions.push(`color: { eq: "${strapiColor}" }`);
    }
    
    if (search) {
      filterConditions.push(`name: { contains: "${search}" }`);
    }
    
    // Завжди фільтруємо тільки публіковані продукти
    filterConditions.push('publishedAt: { notNull: true }');
    
    // Додаємо пагінацію до GraphQL запиту, щоб отримати всі товари
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

    console.log('GraphQL query:', query);

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
      console.error('GraphQL error:', errorText);
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('GraphQL response:', data);

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const products = data.data.products || [];
    
    // Якщо pageSize великий (>= 1000), повертаємо всі товари без пагінації
    // Це потрібно для фільтрації на клієнті
    // pageSizeInt та pageInt вже оголошені вище
    
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

    console.log(`Returning ${paginatedProducts.length} products (total: ${total}, pageSize: ${pageSizeInt})`);

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
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// Create a new product (admin)
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 POST /api/products - Checking STRAPI_TOKEN:', STRAPI_TOKEN ? `Token present (${STRAPI_TOKEN.substring(0, 10)}...)` : 'Token missing');
    
    if (!STRAPI_TOKEN) {
      console.error('❌ STRAPI_API_TOKEN is not set in environment');
      return NextResponse.json(
        { 
          error: 'Missing STRAPI_API_TOKEN in environment. Please create a .env.local file in the frontend directory with STRAPI_API_TOKEN=your_token_here. See ENV_SETUP.md for instructions.' 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📦 POST /api/products - Request body:', JSON.stringify(body, null, 2));

    // Expecting body to be a flat payload from admin page; wrap for Strapi REST
    // Додаємо publishedAt для автоматичної публікації товару
    const strapiPayload = {
      data: {
        ...body,
        publishedAt: body.publishedAt || new Date().toISOString(), // Автоматично публікуємо товар
      },
    };

    console.log('🚀 POST /api/products - Sending to Strapi:', `${STRAPI_URL}/api/products`);
    console.log('📤 POST /api/products - Strapi payload:', JSON.stringify(strapiPayload, null, 2));
    
    const response = await fetch(`${STRAPI_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify(strapiPayload),
    });

    console.log('📥 POST /api/products - Strapi response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error creating product in Strapi:', errorText);
      
      // Спробуємо парсити помилку від Strapi
      let strapiError = `Failed to create product: ${response.status} ${response.statusText}`;
      if (errorText) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error) {
            strapiError = errorData.error.message || errorData.error || strapiError;
          } else if (errorData.message) {
            strapiError = errorData.message;
          }
        } catch (e) {
          // Якщо не JSON, використовуємо текст як є
          strapiError = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
        }
      }
      
      return NextResponse.json(
        { error: strapiError },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
