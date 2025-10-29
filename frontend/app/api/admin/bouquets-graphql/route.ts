import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// GraphQL mutations
const CREATE_BOUQUET_MUTATION = `
  mutation CreateBouquet($name: String!, $slug: String!, $price: Long!, $description: JSON, $color: ENUM_BOUQUET_COLOR!, $collection: ENUM_BOUQUET_COLLECTION!, $cardType: ENUM_BOUQUET_CARDTYPE!, $varieties: [ID]) {
    createBouquet(data: {
      name: $name
      slug: $slug
      price: $price
      description: $description
      color: $color
      collection: $collection
      cardType: $cardType
      varieties: $varieties
    }) {
      documentId
      name
      price
      description
      color
      collection
      cardType
      slug
      varieties {
        documentId
        name
        slug
      }
      image {
        documentId
        url
        name
        mime
        size
      }
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

const UPDATE_BOUQUET_MUTATION = `
  mutation UpdateBouquet($documentId: ID!, $name: String!, $slug: String!, $price: Long!, $description: JSON, $color: ENUM_BOUQUET_COLOR!, $collection: ENUM_BOUQUET_COLLECTION!, $cardType: ENUM_BOUQUET_CARDTYPE!, $varieties: [ID]) {
    updateBouquet(documentId: $documentId, data: {
      name: $name
      slug: $slug
      price: $price
      description: $description
      color: $color
      collection: $collection
      cardType: $cardType
      varieties: $varieties
    }) {
      documentId
      name
      price
      description
      color
      collection
      cardType
      slug
      varieties {
        documentId
        name
        slug
      }
      image {
        documentId
        url
        name
        mime
        size
      }
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

const DELETE_BOUQUET_MUTATION = `
  mutation DeleteBouquet($documentId: ID!) {
    deleteBouquet(documentId: $documentId) {
      documentId
    }
  }
`;

const GET_BOUQUETS_QUERY = `
  query GetBouquets($pagination: PaginationArg, $filters: BouquetFiltersInput, $sort: [String]) {
    bouquets(pagination: $pagination, filters: $filters, sort: $sort) {
      documentId
      name
      price
      description
      color
      collection
      cardType
      slug
      varieties {
        documentId
        name
        slug
      }
      image {
        documentId
        url
        name
        mime
        size
      }
      createdAt
      updatedAt
      publishedAt
    }
  }
`;

// POST - Створити або оновити букет
export async function POST(request: NextRequest) {
  let isUpdate = false;
  
  try {
    console.log('GraphQL - Processing POST request');
    
    // Handle JSON data for GraphQL
    const body = await request.json();
    const { documentId, ...updateData } = body;
    
    const bouquetDocumentId = documentId;
    isUpdate = !!bouquetDocumentId;
    
    const bouquetData = {
      name: updateData.name,
      slug: updateData.slug,
      price: updateData.price,
      description: updateData.description,
      color: updateData.color,
      collection: updateData.collection,
      cardType: updateData.cardType,
      varieties: updateData.varieties, // Pass as array of IDs
    };
    
    console.log('GraphQL - Received JSON data:', body);
    console.log('GraphQL - bouquetDocumentId:', bouquetDocumentId);
    console.log('GraphQL - isUpdate:', isUpdate);
    
    // Validate and log bouquetData
    console.log('GraphQL - bouquetData before mutation:', bouquetData);
    
    // Ensure collection is not null/undefined
    if (!bouquetData.collection) {
      console.error('GraphQL - collection is missing!');
      throw new Error('Collection is required');
    }
    
    // Execute GraphQL mutation
    const mutation = isUpdate ? UPDATE_BOUQUET_MUTATION : CREATE_BOUQUET_MUTATION;
    const variables = isUpdate 
      ? { 
          documentId: bouquetDocumentId, 
          name: bouquetData.name,
          slug: bouquetData.slug,
          price: bouquetData.price,
          description: bouquetData.description,
          color: bouquetData.color,
          collection: bouquetData.collection,
          cardType: bouquetData.cardType,
          varieties: bouquetData.varieties
        }
      : { 
          name: bouquetData.name,
          slug: bouquetData.slug,
          price: bouquetData.price,
          description: bouquetData.description,
          color: bouquetData.color,
          collection: bouquetData.collection,
          cardType: bouquetData.cardType,
          varieties: bouquetData.varieties
        };

    console.log('GraphQL - Executing mutation:', isUpdate ? 'UPDATE' : 'CREATE');
    console.log('GraphQL - Variables:', JSON.stringify(variables, null, 2));

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GraphQL mutation error:', errorText);
      throw new Error(`GraphQL mutation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('GraphQL - Full response:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const bouquet = isUpdate ? result.data.updateBouquet : result.data.createBouquet;
    
    console.log('GraphQL - Bouquet object:', bouquet);
    
    if (!bouquet) {
      console.error('GraphQL - Bouquet is null/undefined');
      console.error('GraphQL - isUpdate:', isUpdate);
      console.error('GraphQL - result.data:', result.data);
      throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} bouquet: GraphQL returned null`);
    }
    
    const finalBouquetDocumentId = bouquet.documentId;

    console.log('GraphQL - Bouquet created/updated successfully:', finalBouquetDocumentId);
    
    return NextResponse.json({
      data: bouquet,
      message: isUpdate ? 'Bouquet updated successfully' : 'Bouquet created successfully'
    });
  } catch (error) {
    console.error('Error in GraphQL bouquet operation:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { error: `Failed to ${isUpdate ? 'update' : 'create'} bouquet: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// GET - Отримати букети
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const productType = searchParams.get('productType');
    
    const variables = {
      pagination: {
        page,
        pageSize
      },
      filters: {},
      sort: ['createdAt:desc']
    };
    
    // Додаємо фільтр за типом продукту
    if (productType && productType !== 'Всі продукти') {
      if (productType === 'Букети') {
        // Фільтруємо тільки букети
        variables.filters = { ...variables.filters };
      } else if (productType === 'Квітка') {
        // Для singleflowers потрібно буде створити окремий API endpoint
        // Поки що повертаємо порожній результат
        return NextResponse.json({
          data: [],
          pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 }
        });
      }
    }
    
    console.log('GraphQL - GET request variables:', variables);
    console.log('GraphQL - STRAPI_URL:', STRAPI_URL);
    console.log('GraphQL - STRAPI_TOKEN exists:', !!STRAPI_TOKEN);

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_BOUQUETS_QUERY,
        variables
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GraphQL query error:', errorText);
      throw new Error(`GraphQL query failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('GraphQL - Full response:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const bouquets = result.data.bouquets || [];
    const pagination = { page: 1, pageSize: 10, pageCount: 1, total: bouquets.length };

    return NextResponse.json({
      data: bouquets,
      meta: {
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          pageCount: pagination.pageCount,
          total: pagination.total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bouquets:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Strapi server is not running. Please start the backend server.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to fetch bouquets: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - Видалити букет
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    console.log('GraphQL - Deleting bouquet with documentId:', documentId);

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DELETE_BOUQUET_MUTATION,
        variables: { documentId }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GraphQL delete error:', errorText);
      throw new Error(`GraphQL delete failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return NextResponse.json({
      data: result.data.deleteBouquet,
      message: 'Bouquet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bouquet:', error);
    return NextResponse.json(
      { error: 'Failed to delete bouquet' },
      { status: 500 }
    );
  }
}