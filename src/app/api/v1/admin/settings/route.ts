import { NextRequest, NextResponse } from 'next/server';
import { setConfig, getConfig, clearConfigCache } from '@/lib/config.service';
import { z } from 'zod';

const paymentConfigSchema = z.object({
  provider: z.enum(['CASHFREE', 'RAZORPAY', 'STRIPE']),
  credentials: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    keyId: z.string().optional(),
    keySecret: z.string().optional(),
    secretKey: z.string().optional(),
  }),
});

const storageConfigSchema = z.object({
  provider: z.enum(['SUPABASE', 'AWS_S3', 'CLOUDINARY', 'BACKBLAZE']),
  credentials: z.object({
    url: z.string().optional(),
    bucket: z.string().optional(),
    serviceKey: z.string().optional(),
    accessKey: z.string().optional(),
    secretKey: z.string().optional(),
    cloudName: z.string().optional(),
    uploadPreset: z.string().optional(),
  }),
});

const smsConfigSchema = z.object({
  provider: z.enum(['MSG91', 'TWILIO', 'FAST2SMS']),
  credentials: z.object({
    authKey: z.string().optional(),
    templateId: z.string().optional(),
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    phoneNumber: z.string().optional(),
    apiKey: z.string().optional(),
    senderId: z.string().optional(),
  }),
});

const emailConfigSchema = z.object({
  provider: z.enum(['RESEND', 'SENDGRID', 'SMTP']),
  credentials: z.object({
    apiKey: z.string().optional(),
    fromEmail: z.string().optional(),
    host: z.string().optional(),
    port: z.number().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    const paymentConfig = await getConfig('active_payment_gateway', 'PAYMENT');
    const storageConfig = await getConfig('active_storage_provider', 'STORAGE');
    const smsConfig = await getConfig('active_sms_provider', 'SMS');
    const emailConfig = await getConfig('active_email_provider', 'EMAIL');
    const shippingConfig = await getConfig('active_shipping_provider', 'SHIPPING');
    const searchConfig = await getConfig('active_search_engine', 'SEARCH');

    const maskCredentials = (config: any) => {
      if (!config) return null;
      return {
        provider: config.provider,
        credentials: Object.keys(config.credentials || {}).reduce((acc, key) => {
          acc[key] = '***masked***';
          return acc;
        }, {} as any),
      };
    };

    return NextResponse.json({
      payment: maskCredentials(paymentConfig),
      storage: maskCredentials(storageConfig),
      sms: maskCredentials(smsConfig),
      email: maskCredentials(emailConfig),
      shipping: maskCredentials(shippingConfig),
      search: maskCredentials(searchConfig),
    });
  } catch (error: any) {
    console.error('Get Settings Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const body = await request.json();
    const { category, config } = body;

    switch (category) {
      case 'PAYMENT':
        const paymentData = paymentConfigSchema.parse(config);
        await setConfig('active_payment_gateway', paymentData, 'PAYMENT', {
          label: 'Active Payment Gateway',
          description: `Payment provider: ${paymentData.provider}`,
          isEncrypted: true,
          updatedBy: userId || undefined,
        });
        break;

      case 'STORAGE':
        const storageData = storageConfigSchema.parse(config);
        await setConfig('active_storage_provider', storageData, 'STORAGE', {
          label: 'Active Storage Provider',
          description: `Storage provider: ${storageData.provider}`,
          isEncrypted: true,
          updatedBy: userId || undefined,
        });
        break;

      case 'SMS':
        const smsData = smsConfigSchema.parse(config);
        await setConfig('active_sms_provider', smsData, 'SMS', {
          label: 'Active SMS Provider',
          description: `SMS provider: ${smsData.provider}`,
          isEncrypted: true,
          updatedBy: userId || undefined,
        });
        break;

      case 'EMAIL':
        const emailData = emailConfigSchema.parse(config);
        await setConfig('active_email_provider', emailData, 'EMAIL', {
          label: 'Active Email Provider',
          description: `Email provider: ${emailData.provider}`,
          isEncrypted: true,
          updatedBy: userId || undefined,
        });
        break;

      case 'SHIPPING':
        await setConfig('active_shipping_provider', config, 'SHIPPING', {
          label: 'Active Shipping Provider',
          isEncrypted: true,
          updatedBy: userId || undefined,
        });
        break;

      case 'SEARCH':
        await setConfig('active_search_engine', config, 'SEARCH', {
          label: 'Active Search Engine',
          isEncrypted: true,
          updatedBy: userId || undefined,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
    }

    clearConfigCache();

    return NextResponse.json({
      success: true,
      message: `${category} configuration updated successfully`,
    });
  } catch (error: any) {
    console.error('Update Settings Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 400 }
    );
  }
}
