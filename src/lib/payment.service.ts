import { getActivePaymentGateway } from './config.service';

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
}

export interface PaymentResponse {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  status: string;
}

export class PaymentService {
  private static async getProvider() {
    return await getActivePaymentGateway();
  }

  static async createOrder(order: PaymentOrder): Promise<any> {
    const provider = await this.getProvider();

    switch (provider.provider) {
      case 'CASHFREE':
        return this.createCashfreeOrder(order, provider.credentials);
      case 'RAZORPAY':
        return this.createRazorpayOrder(order, provider.credentials);
      case 'STRIPE':
        return this.createStripeOrder(order, provider.credentials);
      default:
        throw new Error(`Unsupported payment provider: ${provider.provider}`);
    }
  }

  static async verifyPayment(gatewayOrderId: string, gatewayPaymentId: string): Promise<boolean> {
    const provider = await this.getProvider();

    switch (provider.provider) {
      case 'CASHFREE':
        return this.verifyCashfreePayment(gatewayOrderId, provider.credentials);
      case 'RAZORPAY':
        return this.verifyRazorpayPayment(gatewayPaymentId, provider.credentials);
      case 'STRIPE':
        return this.verifyStripePayment(gatewayPaymentId, provider.credentials);
      default:
        return false;
    }
  }

  private static async createCashfreeOrder(order: PaymentOrder, credentials: any) {
    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': credentials.clientId,
        'x-client-secret': credentials.clientSecret,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        order_id: order.orderId,
        order_amount: order.amount,
        order_currency: order.currency,
        customer_details: {
          customer_id: order.orderId,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone,
        },
      }),
    });

    return response.json();
  }

  private static async createRazorpayOrder(order: PaymentOrder, credentials: any) {
    const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        receipt: order.orderId,
      }),
    });

    return response.json();
  }

  private static async createStripeOrder(order: PaymentOrder, credentials: any) {
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${credentials.secretKey}`,
      },
      body: new URLSearchParams({
        amount: Math.round(order.amount * 100).toString(),
        currency: order.currency.toLowerCase(),
        'metadata[order_id]': order.orderId,
      }),
    });

    return response.json();
  }

  private static async verifyCashfreePayment(orderId: string, credentials: any): Promise<boolean> {
    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      headers: {
        'x-client-id': credentials.clientId,
        'x-client-secret': credentials.clientSecret,
        'x-api-version': '2023-08-01',
      },
    });

    const data = await response.json();
    return data.order_status === 'PAID';
  }

  private static async verifyRazorpayPayment(paymentId: string, credentials: any): Promise<boolean> {
    const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.status === 'captured';
  }

  private static async verifyStripePayment(paymentIntentId: string, credentials: any): Promise<boolean> {
    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      headers: {
        'Authorization': `Bearer ${credentials.secretKey}`,
      },
    });

    const data = await response.json();
    return data.status === 'succeeded';
  }

  static async createRefund(paymentId: string, amount: number): Promise<any> {
    const provider = await this.getProvider();

    switch (provider.provider) {
      case 'CASHFREE':
        return this.createCashfreeRefund(paymentId, amount, provider.credentials);
      case 'RAZORPAY':
        return this.createRazorpayRefund(paymentId, amount, provider.credentials);
      case 'STRIPE':
        return this.createStripeRefund(paymentId, amount, provider.credentials);
      default:
        throw new Error(`Unsupported payment provider: ${provider.provider}`);
    }
  }

  private static async createCashfreeRefund(orderId: string, amount: number, credentials: any) {
    const response = await fetch('https://api.cashfree.com/pg/orders/' + orderId + '/refunds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': credentials.clientId,
        'x-client-secret': credentials.clientSecret,
        'x-api-version': '2023-08-01',
      },
      body: JSON.stringify({
        refund_amount: amount,
      }),
    });

    return response.json();
  }

  private static async createRazorpayRefund(paymentId: string, amount: number, credentials: any) {
    const auth = Buffer.from(`${credentials.keyId}:${credentials.keySecret}`).toString('base64');

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
      }),
    });

    return response.json();
  }

  private static async createStripeRefund(paymentIntentId: string, amount: number, credentials: any) {
    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${credentials.secretKey}`,
      },
      body: new URLSearchParams({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100).toString(),
      }),
    });

    return response.json();
  }
}
