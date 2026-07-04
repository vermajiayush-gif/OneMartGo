import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resellerLinks, resellers, products, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateShortCode } from '@/lib/otp';
import { z } from 'zod';

const schema = z.object({
  productId: z.string().uuid(),
  marginType: z.enum(['PERCENTAGE', 'FLAT']),
  marginValue: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, marginType, marginValue } = schema.parse(body);

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || user.role !== 'RESELLER') {
      return NextResponse.json(
        { error: 'User is not a reseller' },
        { status: 403 }
      );
    }

    const [reseller] = await db.select().from(resellers).where(eq(resellers.userId, userId));
    
    if (!reseller) {
      return NextResponse.json(
        { error: 'Reseller profile not found' },
        { status: 404 }
      );
    }

    const [product] = await db.select().from(products).where(eq(products.id, productId));
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.isResellingAllowed) {
      return NextResponse.json(
        { error: 'Reselling not allowed for this product' },
        { status: 400 }
      );
    }

    const minMargin = parseFloat(product.minResellerMargin || '0');
    const maxMargin = parseFloat(product.maxResellerMargin || '100');

    if (marginType === 'PERCENTAGE' && (marginValue < minMargin || marginValue > maxMargin)) {
      return NextResponse.json(
        { error: `Margin must be between ${minMargin}% and ${maxMargin}%` },
        { status: 400 }
      );
    }

    const basePrice = parseFloat(product.sellingPrice);
    let sellingPrice = basePrice;

    if (marginType === 'PERCENTAGE') {
      sellingPrice = basePrice * (1 + marginValue / 100);
    } else {
      sellingPrice = basePrice + marginValue;
    }

    const shortCode = generateShortCode(10);
    const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/r/${shortCode}`;

    const [link] = await db.insert(resellerLinks).values({
      resellerId: reseller.id,
      productId,
      marginType,
      marginValue: marginValue.toString(),
      sellingPrice: sellingPrice.toString(),
      shortCode,
      fullUrl,
    }).returning();

    await db.update(resellers)
      .set({ totalLinks: (reseller.totalLinks || 0) + 1 })
      .where(eq(resellers.id, reseller.id));

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        shortCode: link.shortCode,
        fullUrl: link.fullUrl,
        basePrice,
        sellingPrice,
        margin: marginValue,
        marginType,
      },
    });
  } catch (error: any) {
    console.error('Create Reseller Link Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create reseller link' },
      { status: 400 }
    );
  }
}
