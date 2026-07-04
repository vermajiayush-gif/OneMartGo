import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carts, cartItems, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (!cart) {
      return NextResponse.json({
        cart: null,
        items: [],
        total: 0,
      });
    }

    const items = await db
      .select({
        item: cartItems,
        product: products,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    const cartData = {
      id: cart.id,
      subtotal: cart.subtotal,
      discount: cart.discount,
      tax: cart.tax,
      shipping: cart.shipping,
      total: cart.total,
      items: items.map(({ item, product }) => ({
        id: item.id,
        productId: item.productId,
        productName: product?.name,
        quantity: item.quantity,
        price: item.price,
        total: parseFloat(item.price) * item.quantity,
      })),
    };

    return NextResponse.json({ cart: cartData });
  } catch (error: any) {
    console.error('Get Cart Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch cart' },
      { status: 400 }
    );
  }
}

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).default(1),
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
    const { productId, variantId, quantity } = addToCartSchema.parse(body);

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    let cart = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (cart.length === 0) {
      const [newCart] = await db.insert(carts).values({
        userId,
        subtotal: '0',
        total: '0',
      }).returning();
      cart = [newCart];
    }

    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart[0].id),
          eq(cartItems.productId, productId)
        )
      )
      .limit(1);

    if (existingItem.length > 0) {
      await db
        .update(cartItems)
        .set({ quantity: existingItem[0].quantity + quantity })
        .where(eq(cartItems.id, existingItem[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart[0].id,
        productId,
        variantId: variantId || null,
        quantity,
        price: product.sellingPrice,
      });
    }

    const allItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart[0].id));

    const subtotal = allItems.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);

    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    await db
      .update(carts)
      .set({
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(carts.id, cart[0].id));

    return NextResponse.json({
      success: true,
      message: 'Item added to cart',
    });
  } catch (error: any) {
    console.error('Add to Cart Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add to cart' },
      { status: 400 }
    );
  }
}
