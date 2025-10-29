import { NextResponse } from 'next/server';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
    }

    let url = `${STRAPI_URL}/api/inventory-records`;
    const params = new URLSearchParams();
    
    if (date) {
      params.append('date', date);
    }
    
    if (dateFrom && dateTo) {
      params.append('dateFrom', dateFrom);
      params.append('dateTo', dateTo);
    }
    
    if (month && year) {
      params.append('month', month);
      params.append('year', year);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Strapi API error', details: text }, { status: 500 });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
    }

    const res = await fetch(`${STRAPI_URL}/api/inventory-records`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: body }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Strapi API error', details: text }, { status: 500 });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
    }

    const res = await fetch(`${STRAPI_URL}/api/inventory-records/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ data }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Strapi API error', details: text }, { status: 500 });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required for deletion' }, { status: 400 });
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (STRAPI_TOKEN) {
      headers.Authorization = `Bearer ${STRAPI_TOKEN}`;
    }

    const res = await fetch(`${STRAPI_URL}/api/inventory-records/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Strapi API error', details: text }, { status: 500 });
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
