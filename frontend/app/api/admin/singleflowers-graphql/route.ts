import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// GraphQL query для singleflowers
const GET_SINGLEFLOWERS_QUERY = `
  query GetSingleflowers($pagination: PaginationArg, $filters: SingleflowerFiltersInput, $sort: [String]) {
    singleflowers(pagination: $pagination, filters: $filters, sort: $sort) {
      documentId
      name
      slug
      price
      description
      cardType
      color
      collection
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

const DELETE_SINGLEFLOWER_MUTATION = `
  mutation DeleteSingleflower($documentId: ID!) {
    deleteSingleflower(documentId: $documentId) {
      documentId
    }
  }
`;

// GET - Отримати singleflowers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    const variables = {
      pagination: {
        page,
        pageSize
      },
      filters: {},
      sort: ['createdAt:desc']
    };
    
    console.log('Singleflowers GraphQL - GET request variables:', variables);
    console.log('Singleflowers GraphQL - STRAPI_URL:', STRAPI_URL);
    console.log('Singleflowers GraphQL - STRAPI_TOKEN exists:', !!STRAPI_TOKEN);

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_SINGLEFLOWERS_QUERY,
        variables
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Singleflowers GraphQL query error:', errorText);
      throw new Error(`Singleflowers GraphQL query failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('Singleflowers GraphQL - Full response:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('Singleflowers GraphQL errors:', result.errors);
      throw new Error(`Singleflowers GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    const singleflowers = result.data.singleflowers || [];
    const pagination = { page: 1, pageSize: 10, pageCount: 1, total: singleflowers.length };

    return NextResponse.json({
      data: singleflowers,
      pagination
    });

  } catch (error) {
    console.error('Singleflowers GraphQL error:', error);
    return NextResponse.json(
      { error: `Failed to fetch singleflowers: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// GraphQL mutation для створення singleflower
const CREATE_SINGLEFLOWER_MUTATION = `
  mutation CreateSingleflower($name: String!, $slug: String!, $price: Long!, $description: JSON, $color: ENUM_SINGLEFLOWER_COLOR!, $collection: ENUM_SINGLEFLOWER_COLLECTION!, $cardType: ENUM_SINGLEFLOWER_CARDTYPE!) {
    createSingleflower(data: {
      name: $name
      slug: $slug
      price: $price
      description: $description
      color: $color
      collection: $collection
      cardType: $cardType
    }) {
      documentId
      name
      price
      description
      color
      collection
      cardType
      slug
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

// GraphQL mutation для оновлення singleflower
const UPDATE_SINGLEFLOWER_MUTATION = `
  mutation UpdateSingleflower($documentId: ID!, $name: String!, $slug: String!, $price: Long!, $description: JSON, $color: ENUM_SINGLEFLOWER_COLOR!, $collection: ENUM_SINGLEFLOWER_COLLECTION!, $cardType: ENUM_SINGLEFLOWER_CARDTYPE!) {
    updateSingleflower(documentId: $documentId, data: {
      name: $name
      slug: $slug
      price: $price
      description: $description
      color: $color
      collection: $collection
      cardType: $cardType
    }) {
      documentId
      name
      price
      description
      color
      collection
      cardType
      slug
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

// POST - Створити або оновити singleflower
export async function POST(request: NextRequest) {
  let isUpdate = false;
  
  try {
    const body = await request.json();
    const { documentId, ...updateData } = body;
    
    const singleflowerDocumentId = documentId;
    isUpdate = !!singleflowerDocumentId;
    
    console.log('🌸 Singleflower GraphQL - Processing POST request');
    console.log('🌸 Singleflower GraphQL - documentId:', singleflowerDocumentId);
    console.log('🌸 Singleflower GraphQL - isUpdate:', isUpdate);
    
    const singleflowerData = {
      name: updateData.name,
      slug: updateData.slug,
      price: updateData.price,
      description: updateData.description,
      color: updateData.color,
      collection: updateData.collection,
      cardType: updateData.cardType,
    };
    
    console.log('🌸 Singleflower GraphQL - singleflowerData:', singleflowerData);
    
    // Execute GraphQL mutation
    const mutation = isUpdate ? UPDATE_SINGLEFLOWER_MUTATION : CREATE_SINGLEFLOWER_MUTATION;
    const variables = isUpdate 
      ? { 
          documentId: singleflowerDocumentId, 
          ...singleflowerData
        }
      : singleflowerData;
    
    console.log('🌸 Singleflower GraphQL - Executing mutation:', isUpdate ? 'UPDATE' : 'CREATE');
    console.log('🌸 Singleflower GraphQL - Variables:', JSON.stringify(variables, null, 2));
    console.log('🌸 Singleflower GraphQL - Mutation query:', mutation.substring(0, 200) + '...');

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
      console.error('Singleflower GraphQL mutation error:', errorText);
      throw new Error(`Singleflower GraphQL mutation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('Singleflower GraphQL - POST response:', JSON.stringify(result, null, 2));
    
    if (result.errors) {
      console.error('Singleflower GraphQL errors:', result.errors);
      throw new Error(`Singleflower GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    // Отримуємо результат залежно від типу мутації
    let singleflower = isUpdate ? result.data.updateSingleflower : result.data.createSingleflower;
    
    console.log('🌸 Singleflower object:', singleflower);
    console.log('🌸 isUpdate:', isUpdate);
    console.log('🌸 result.data:', result.data);
    
    if (!singleflower) {
      console.error('🌸 Singleflower is null/undefined');
      console.error('🌸 isUpdate:', isUpdate);
      console.error('🌸 result.data:', result.data);
      throw new Error(`Failed to ${isUpdate ? 'update' : 'create'} singleflower: GraphQL returned null`);
    }
    
    console.log('🌸 Singleflower created/updated successfully:', singleflower.documentId);
    
    return NextResponse.json({
      data: singleflower,
      message: isUpdate ? 'Singleflower updated successfully' : 'Singleflower created successfully'
    });

  } catch (error) {
    console.error('Error in GraphQL singleflower operation:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { error: `Failed to ${isUpdate ? 'update' : 'create'} singleflower: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - Видалити singleflower
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

    console.log('GraphQL - Deleting singleflower with documentId:', documentId);

    const response = await fetch(`${STRAPI_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DELETE_SINGLEFLOWER_MUTATION,
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
      data: result.data.deleteSingleflower,
      message: 'Singleflower deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting singleflower:', error);
    
    return NextResponse.json(
      { error: `Failed to delete singleflower: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
