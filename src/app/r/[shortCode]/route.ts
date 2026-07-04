import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resellerLinks, resellerLinkClicks, resellers, products } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  try {
    const { shortCode } = await params;

    const [link] = await db
      .select()
      .from(resellerLinks)
      .where(eq(resellerLinks.shortCode, shortCode))
      .limit(1);

    if (!link) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    await db.insert(resellerLinkClicks).values({
      linkId: link.id,
      ipAddress,
      userAgent,
      deviceType: userAgent.includes('Mobile') ? 'mobile' : 'desktop',
    });

    await db.update(resellerLinks)
      .set({ clicks: (link.clicks || 0) + 1 })
      .where(eq(resellerLinks.id, link.id));

    await db.update(resellers)
      .set({ totalClicks: (await db.select().from(resellers).where(eq(resellers.id, link.resellerId)).limit(1))[0].totalClicks || 0 + 1 })
      .where(eq(resellers.id, link.resellerId));

    const [product] = await db.select().from(products).where(eq(products.id, link.productId));

    if (product) {
      return NextResponse.redirect(new URL(`/products/${product.slug}?ref=${shortCode}`, request.url));
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Reseller Link Redirect Error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
