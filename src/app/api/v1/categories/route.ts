import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const rootCategories = await db
      .select()
      .from(categories)
      .where(and(isNull(categories.parentId), eq(categories.isActive, true)))
      .orderBy(categories.sortOrder);

    const categoriesWithChildren = await Promise.all(
      rootCategories.map(async (category) => {
        const children = await db
          .select()
          .from(categories)
          .where(and(eq(categories.parentId, category.id), eq(categories.isActive, true)))
          .orderBy(categories.sortOrder);

        return {
          ...category,
          children,
        };
      })
    );

    return NextResponse.json({
      categories: categoriesWithChildren,
    });
  } catch (error: any) {
    console.error('Get Categories Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 400 }
    );
  }
}
