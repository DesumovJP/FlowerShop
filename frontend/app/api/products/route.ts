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
    let filters = '';
    const filterConditions = [];
    
    if (productType) {
      filterConditions.push(`productType: { eq: "${productType}" }`);
    }
    
    if (variety) {
      filterConditions.push(`varieties: { name: { eq: "${variety}" } }`);
    }
    
    if (color) {
      // Переводимо український колір в латинський для фільтрації
      const colorMapping: Record<string, string> = {
        'Червоний': 'red',
        'Рожевий': 'pink',
        'Білий': 'white',
        'Жовтий': 'yellow',
        'Фіолетовий': 'purple',
        'Синій': 'blue',
        'Зелений': 'green',
        'Оранжевий': 'orange',
        'Кремовий': 'cream',
        'Персиковий': 'peach'
      };
      const latinColor = colorMapping[color] || color;
      filterConditions.push(`color: { eq: "${latinColor}" }`);
    }
    
    if (search) {
      filterConditions.push(`name: { contains: "${search}" }`);
    }
    
    // Завжди фільтруємо тільки публіковані продукти
    filterConditions.push('publishedAt: { notNull: true }');
    
    if (filterConditions.length > 0) {
      filters = `(filters: { ${filterConditions.join(', ')} })`;
    }

    const query = `
          query GetAllProducts {
            products${filters} {
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
    
    // Простий пагінація на фронтенді
    const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedProducts = products.slice(startIndex, endIndex);
    const total = products.length;
    const pageCount = Math.ceil(total / parseInt(pageSize));

    return NextResponse.json({
      data: paginatedProducts,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
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
    if (!STRAPI_TOKEN) {
      return NextResponse.json(
        { error: 'Missing STRAPI_API_TOKEN in environment' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Expecting body to be a flat payload from admin page; wrap for Strapi REST
    const strapiPayload = {
      data: body,
    };

    const response = await fetch(`${STRAPI_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
      body: JSON.stringify(strapiPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error creating product in Strapi:', errorText);
      return NextResponse.json(
        { error: `Failed to create product: ${response.status} ${response.statusText}` },
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
