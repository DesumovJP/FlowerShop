import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

// Використовуємо REST API замість GraphQL

// GET - Отримати всі букети
export async function GET(request: NextRequest) {
  try {
    // Перевірка змінних середовища
    if (!STRAPI_URL) {
      throw new Error('STRAPI_URL не налаштовано в змінних середовища');
    }
    
    if (!STRAPI_TOKEN) {
      throw new Error('STRAPI_API_TOKEN не налаштовано в змінних середовища. Дивіться ENV_SETUP.md для інструкцій.');
    }
    
    console.log('Strapi URL:', STRAPI_URL);
    console.log('Strapi Token:', STRAPI_TOKEN ? 'Налаштовано' : 'Не налаштовано');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const color = searchParams.get('color') || '';
    const collection = searchParams.get('collection') || '';
    const variety = searchParams.get('variety') || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
    }

    // Завантажуємо всі товари (без фільтрів на сервері)
    const url = new URL(`${STRAPI_URL}/api/bouquets`);
    url.searchParams.set('populate[image]', 'true');
    url.searchParams.set('populate[varieties]', 'true');
    url.searchParams.set('pagination[pageSize]', '1000');
    url.searchParams.set('sort[0]', 'createdAt:desc');

    const response = await fetch(url.toString(), {
      headers,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Strapi connection error:', {
        status: response.status,
        statusText: response.statusText,
        url: url.toString(),
        text
      });
      throw new Error(`Strapi REST API error: ${response.status} - ${text}`);
    }

    const data = await response.json();
    
    // Перетворюємо дані з REST API формату
    let allBouquets = data.data?.map((item: any) => ({
      documentId: item.documentId,
      name: item.name,
      slug: item.slug,
      price: item.price,
      description: item.description,
      cardType: item.cardType,
      color: item.color,
      collection: item.collection,
      image: item.image || [],
      varieties: item.varieties?.data || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      publishedAt: item.publishedAt,
    })) || [];
    
    // Фільтруємо на клієнті
    if (search) {
      allBouquets = allBouquets.filter((bouquet: any) => 
        bouquet.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (color && color !== 'Всі кольори') {
      allBouquets = allBouquets.filter((bouquet: any) => 
        bouquet.color === color
      );
    }
    
    if (collection && collection !== 'Всі колекції') {
      allBouquets = allBouquets.filter((bouquet: any) => 
        bouquet.collection === collection
      );
    }
    
    if (variety && variety !== 'Всі сорти') {
      allBouquets = allBouquets.filter((bouquet: any) => 
        bouquet.varieties && bouquet.varieties.some((v: any) => v.name === variety)
      );
    }

    // Пагінація після фільтрації
    const totalCount = allBouquets.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedBouquets = allBouquets.slice(startIndex, endIndex);
    
    const pageCount = Math.ceil(totalCount / pageSize);
    
    return NextResponse.json({
      data: paginatedBouquets,
      pagination: {
        page,
        pageSize,
        pageCount,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching bouquets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bouquets' },
      { status: 500 }
    );
  }
}

// POST - Створити новий букет
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let bouquetData: any;
    let images: File[] = [];
    let imagesToRemove: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData for file uploads
      const formData = await request.formData();
      
      console.log('POST - Received FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      const varietiesData = formData.get('varieties');
      const varietiesArray = JSON.parse(varietiesData as string || '[]');
      // For manyToMany relations in Strapi v5, we need to use connect operation
      const varietiesConnect = varietiesArray.map((id: string) => ({ id }));
      
      bouquetData = {
        data: {
          name: formData.get('name'),
          price: parseFloat(formData.get('price') as string),
          description: formData.get('description'),
          color: formData.get('color'),
          collection: formData.get('collection'),
          cardType: formData.get('cardType'),
          varieties: {
            connect: varietiesConnect
          },
          publishedAt: new Date().toISOString(),
        }
      };

      // Get image files
      const imageFiles = formData.getAll('images') as File[];
      images = imageFiles.filter(file => file.size > 0);
      
      // Get images to remove
      const removeData = formData.get('imagesToRemove');
      if (removeData) {
        imagesToRemove = JSON.parse(removeData as string);
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      
      // For manyToMany relations in Strapi v5, we need to use connect operation
      const varietiesConnect = body.varieties.map((id: string) => ({ id }));
      
      bouquetData = {
        data: {
          name: body.name,
          price: parseFloat(body.price),
          description: body.description,
          color: body.color,
          collection: body.collection,
          cardType: body.cardType,
          varieties: {
            connect: varietiesConnect
          },
          publishedAt: new Date().toISOString(),
        }
      };
    }

    // First create the bouquet
    const response = await fetch(`${STRAPI_URL}/api/bouquets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bouquetData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strapi API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const bouquetId = data.data.documentId;

    // Handle image uploads if any
    if (images.length > 0) {
      console.log('Uploading images:', images.length);
      
      // Try uploading files one by one to avoid issues
      for (const imageFile of images) {
        const uploadFormData = new FormData();
        uploadFormData.append('files', imageFile);
        uploadFormData.append('ref', 'api::bouquet.bouquet');
        uploadFormData.append('refId', bouquetId);
        uploadFormData.append('field', 'image');
        
        console.log('Uploading single file:', imageFile.name);

        const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRAPI_TOKEN}`,
          },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Error uploading image:', errorText);
          // Don't throw error, just log it and continue
          console.warn(`Failed to upload ${imageFile.name}, continuing with other files`);
        } else {
          const uploadResult = await uploadResponse.json();
          console.log('Successfully uploaded image:', uploadResult);
        }
      }
    }

    // Handle image removal if any (for updates)
    if (imagesToRemove.length > 0) {
      // Get current bouquet to see existing images
      const currentBouquetResponse = await fetch(`${STRAPI_URL}/api/bouquets/${bouquetId}?populate[image]=true`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
        },
      });

      if (currentBouquetResponse.ok) {
        const currentBouquet = await currentBouquetResponse.json();
        const currentImages = currentBouquet.data.image || [];
        
        // Filter out images to remove
        const remainingImages = currentImages.filter((img: any) => 
          !imagesToRemove.includes(img.documentId)
        );

        // Update bouquet with remaining images
        const updateImageResponse = await fetch(`${STRAPI_URL}/api/bouquets/${bouquetId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${STRAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              image: remainingImages.map((img: any) => img.documentId)
            }
          }),
        });

        if (!updateImageResponse.ok) {
          console.error('Error updating bouquet images:', await updateImageResponse.text());
        }
      }
    }
    
    return NextResponse.json({
      data: data.data,
      message: 'Bouquet created successfully'
    });
  } catch (error) {
    console.error('Error creating bouquet:', error);
    return NextResponse.json(
      { error: `Failed to create bouquet: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PUT - Оновити букет
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    let bouquetData: any;
    let images: File[] = [];
    let imagesToRemove: string[] = [];
    let id: string;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData for file uploads
      const formData = await request.formData();
      
      console.log('PUT - Received FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      id = formData.get('id') as string;
      if (!id) {
        return NextResponse.json(
          { error: 'Bouquet ID is required' },
          { status: 400 }
        );
      }

      const varietiesData = formData.get('varieties');
      console.log('PUT - Varieties raw data:', varietiesData);
      const varietiesArray = JSON.parse(varietiesData as string || '[]');
      console.log('PUT - Varieties parsed:', varietiesArray);
      
      // For manyToMany relations in Strapi v5, we need to use connect operation
      const varietiesConnect = varietiesArray.map((id: string) => ({ id }));
      console.log('PUT - Varieties with connect:', varietiesConnect);
      
      bouquetData = {
        data: {
          name: formData.get('name'),
          price: parseFloat(formData.get('price') as string),
          description: formData.get('description'),
          color: formData.get('color'),
          collection: formData.get('collection'),
          cardType: formData.get('cardType'),
          varieties: {
            connect: varietiesConnect
          },
        }
      };

      // Get image files
      const imageFiles = formData.getAll('images') as File[];
      images = imageFiles.filter(file => file.size > 0);
      console.log('PUT - Image files received:', images.length, images.map(f => ({ name: f.name, size: f.size })));
      
      // Get images to remove
      const removeData = formData.get('imagesToRemove');
      if (removeData) {
        imagesToRemove = JSON.parse(removeData as string);
        console.log('PUT - Images to remove:', imagesToRemove);
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      const { id: bouquetId, ...updateData } = body;
      
      id = bouquetId;
      if (!id) {
        return NextResponse.json(
          { error: 'Bouquet ID is required' },
          { status: 400 }
        );
      }

      // For manyToMany relations in Strapi v5, we need to use connect operation
      const varietiesConnect = updateData.varieties.map((id: string) => ({ id }));
      
      bouquetData = {
        data: {
          name: updateData.name,
          price: parseFloat(updateData.price),
          description: updateData.description,
          color: updateData.color,
          collection: updateData.collection,
          cardType: updateData.cardType,
          varieties: {
            connect: varietiesConnect
          },
        }
      };
    }

    // First update the bouquet
    console.log('Updating bouquet with data:', JSON.stringify(bouquetData, null, 2));
    console.log('Varieties type:', typeof bouquetData.data.varieties, 'Value:', bouquetData.data.varieties);
    console.log('CardType type:', typeof bouquetData.data.cardType, 'Value:', bouquetData.data.cardType);
    console.log('Full bouquet data being sent to Strapi:', bouquetData);
    
    const response = await fetch(`${STRAPI_URL}/api/bouquets/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bouquetData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Strapi API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        url: `${STRAPI_URL}/api/bouquets/${id}`,
        requestData: bouquetData
      });
      throw new Error(`Strapi API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Handle image uploads if any
    if (images.length > 0) {
      console.log('Uploading images:', images.length);
      
      // Try uploading files one by one to avoid issues
      for (const imageFile of images) {
        const uploadFormData = new FormData();
        uploadFormData.append('files', imageFile);
        uploadFormData.append('ref', 'api::bouquet.bouquet');
        uploadFormData.append('refId', id);
        uploadFormData.append('field', 'image');
        
        console.log('PUT Uploading single file:', imageFile.name);

        const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRAPI_TOKEN}`,
          },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Error uploading image:', errorText);
          // Don't throw error, just log it and continue
          console.warn(`Failed to upload ${imageFile.name}, continuing with other files`);
        } else {
          const uploadResult = await uploadResponse.json();
          console.log('Successfully uploaded image:', uploadResult);
        }
      }
    }

    // Handle image removal if any
    if (imagesToRemove.length > 0) {
      console.log('Removing images:', imagesToRemove);
      
      // Get current bouquet to see existing images
      const currentBouquetResponse = await fetch(`${STRAPI_URL}/api/bouquets/${id}?populate[image]=true`, {
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
        },
      });

      if (currentBouquetResponse.ok) {
        const currentBouquet = await currentBouquetResponse.json();
        const currentImages = currentBouquet.data.image || [];
        console.log('Current images:', currentImages.map((img: any) => img.documentId));
        
        // Filter out images to remove
        const remainingImages = currentImages.filter((img: any) => 
          !imagesToRemove.includes(img.documentId)
        );
        console.log('Remaining images:', remainingImages.map((img: any) => img.documentId));

        // Update bouquet with remaining images
        const updateImageResponse = await fetch(`${STRAPI_URL}/api/bouquets/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${STRAPI_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              image: remainingImages.map((img: any) => img.documentId)
            }
          }),
        });

        if (!updateImageResponse.ok) {
          const errorText = await updateImageResponse.text();
          console.error('Error updating bouquet images:', errorText);
          throw new Error(`Failed to remove images: ${errorText}`);
        } else {
          console.log('Successfully updated bouquet images');
        }
      } else {
        console.error('Failed to fetch current bouquet for image removal');
      }
    }
    
    return NextResponse.json({
      data: data.data,
      message: 'Bouquet updated successfully'
    });
  } catch (error) {
    console.error('Error updating bouquet:', error);
    return NextResponse.json(
      { error: `Failed to update bouquet: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// DELETE - Видалити букет
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Bouquet ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${STRAPI_URL}/api/bouquets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Strapi API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    return NextResponse.json({
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
