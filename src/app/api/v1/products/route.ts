import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, ilike, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    let query = db.select().from(products).where(eq(products.status, 'ACTIVE'));

    const results = await query
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    const productsData = results.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.shortDescription,
      basePrice: p.basePrice,
      sellingPrice: p.sellingPrice,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      isFeatured: p.isFeatured,
      isTrending: p.isTrending,
    }));

    return NextResponse.json({
      products: productsData,
      page,
      limit,
      total: productsData.length,
    });
  } catch (error: any) {
    console.error('Get Products Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 400 }
    );
  }
}
