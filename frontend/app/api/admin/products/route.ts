import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// GraphQL query для всіх продуктів (букети + одиночні квіти)
const GET_ALL_PRODUCTS_QUERY = `
  query GetAllProducts {
    products(pagination: { pageSize: 1000 }, sort: ["createdAt:desc"]) {
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

// GET - Отримати всі продукти для адмінки
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '1000');
    const productType = searchParams.get('productType');
    const search = searchParams.get('search');
    
    console.log('🛒 Admin API: Fetching products with params:', {
      page,
      pageSize,
      productType,
      search
    });

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_ALL_PRODUCTS_QUERY,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GraphQL error:', errorText);
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    let products = result.data.products || [];
    
    // Фільтрація за типом продукту
    if (productType && productType !== 'all') {
      products = products.filter((product: any) => product.productType === productType);
    }
    
    // Фільтрація за пошуком
    if (search) {
      products = products.filter((product: any) => 
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Простий пагінація на фронтенді
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);
    const total = products.length;
    const pageCount = Math.ceil(total / pageSize);

    console.log('🛒 Admin API: Returning products:', {
      total,
      returned: paginatedProducts.length,
      page,
      pageCount
    });

    return NextResponse.json({
      data: paginatedProducts,
      pagination: {
        page,
        pageSize,
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
