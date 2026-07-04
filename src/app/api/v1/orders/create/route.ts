import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, cartItems, carts, addresses, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { PaymentService } from '@/lib/payment.service';

const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.enum(['UPI', 'CARD', 'NETBANKING', 'WALLET', 'COD', 'EMI']),
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
    const { addressId, paymentMethod } = createOrderSchema.parse(body);

    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    const items = await db
      .select({
        item: cartItems,
        product: products,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    const [address] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, addressId))
      .limit(1);

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    const orderNumber = `OMG-${new Date().getFullYear()}-${nanoid(10).toUpperCase()}`;

    const vendorId = items[0].product?.vendorId;
    if (!vendorId) {
      return NextResponse.json(
        { error: 'Invalid product vendor' },
        { status: 400 }
      );
    }

    const subtotal = parseFloat(cart.subtotal || '0');
    const taxAmount = parseFloat(cart.tax || '0');
    const shippingAmount = parseFloat(cart.shipping || '0');
    const totalAmount = parseFloat(cart.total || '0');

    const platformCommission = subtotal * 0.10;
    const vendorAmount = subtotal - platformCommission;

    const [order] = await db.insert(orders).values({
      orderNumber,
      userId,
      vendorId,
      shippingAddressId: addressId,
      status: 'PAYMENT_PENDING',
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      shippingAmount: shippingAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      vendorAmount: vendorAmount.toFixed(2),
      platformCommission: platformCommission.toFixed(2),
      paymentStatus: 'PENDING',
      paymentMethod,
    }).returning();

    for (const { item, product } of items) {
      if (!product) continue;

      await db.insert(orderItems).values({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: product.name,
        sku: product.sku || '',
        quantity: item.quantity,
        unitPrice: item.price,
        taxRate: product.taxRate || '18.00',
        taxAmount: (parseFloat(item.price) * item.quantity * 0.18).toFixed(2),
        totalPrice: (parseFloat(item.price) * item.quantity).toFixed(2),
      });
    }

    if (paymentMethod !== 'COD') {
      const paymentOrder = await PaymentService.createOrder({
        orderId: order.id,
        amount: totalAmount,
        currency: 'INR',
        customerName: address.fullName,
        customerEmail: 'customer@email.com',
        customerPhone: address.phone,
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentRequired: true,
        paymentOrder,
      });
    } else {
      await db.update(orders)
        .set({ 
          status: 'CONFIRMED',
          paymentStatus: 'PENDING',
        })
        .where(eq(orders.id, order.id));

      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await db.delete(carts).where(eq(carts.id, cart.id));

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentRequired: false,
      });
    }
  } catch (error: any) {
    console.error('Create Order Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 400 }
    );
  }
}
