import { db } from '@/db';
import { systemConfigs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from './crypto';

export type ConfigCategory = 'PAYMENT' | 'STORAGE' | 'SMS' | 'EMAIL' | 'SHIPPING' | 'SEARCH' | 'GENERAL';

interface ConfigCache {
  value: any;
  timestamp: number;
}

const cache = new Map<string, ConfigCache>();
const CACHE_TTL = 5 * 60 * 1000;

export async function getConfig(key: string, category?: ConfigCategory): Promise<any> {
  const cacheKey = category ? `${category}:${key}` : key;
  
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  let query = db.select().from(systemConfigs).where(eq(systemConfigs.key, key));
  
  if (category) {
    query = db.select().from(systemConfigs).where(
      and(eq(systemConfigs.key, key), eq(systemConfigs.category, category))
    );
  }

  const [config] = await query;

  if (!config) {
    return null;
  }

  let value = config.value;
  
  if (config.isEncrypted) {
    try {
      value = decrypt(value);
    } catch (error) {
      console.error('Failed to decrypt config:', key, error);
      return null;
    }
  }

  try {
    value = JSON.parse(value);
  } catch {
    // Value is not JSON, keep as string
  }

  cache.set(cacheKey, { value, timestamp: Date.now() });
  
  return value;
}

export async function setConfig(
  key: string,
  value: any,
  category: ConfigCategory,
  options: {
    label?: string;
    description?: string;
    isEncrypted?: boolean;
    updatedBy?: string;
  } = {}
): Promise<void> {
  const { encrypt } = await import('./crypto');
  
  let valueStr = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (options.isEncrypted) {
    valueStr = encrypt(valueStr);
  }

  const existing = await db.select().from(systemConfigs).where(eq(systemConfigs.key, key));

  if (existing.length > 0) {
    await db.update(systemConfigs)
      .set({
        value: valueStr,
        category,
        label: options.label,
        description: options.description,
        isEncrypted: options.isEncrypted || false,
        updatedBy: options.updatedBy,
        updatedAt: new Date(),
      })
      .where(eq(systemConfigs.key, key));
  } else {
    await db.insert(systemConfigs).values({
      key,
      value: valueStr,
      category,
      label: options.label,
      description: options.description,
      isEncrypted: options.isEncrypted || false,
      updatedBy: options.updatedBy,
    });
  }

  const cacheKey = `${category}:${key}`;
  cache.delete(cacheKey);
  cache.delete(key);
}

export function clearConfigCache(key?: string): void {
  if (key) {
    const keysToDelete = Array.from(cache.keys()).filter(k => k.includes(key));
    keysToDelete.forEach(k => cache.delete(k));
  } else {
    cache.clear();
  }
}

export async function getActivePaymentGateway(): Promise<any> {
  const gateway = await getConfig('active_payment_gateway', 'PAYMENT');
  if (!gateway) {
    return { provider: 'CASHFREE', credentials: {} };
  }
  return gateway;
}

export async function getActiveStorageProvider(): Promise<any> {
  const storage = await getConfig('active_storage_provider', 'STORAGE');
  if (!storage) {
    return { provider: 'SUPABASE', credentials: {} };
  }
  return storage;
}

export async function getActiveSMSProvider(): Promise<any> {
  const sms = await getConfig('active_sms_provider', 'SMS');
  if (!sms) {
    return { provider: 'MSG91', credentials: {} };
  }
  return sms;
}

export async function getActiveEmailProvider(): Promise<any> {
  const email = await getConfig('active_email_provider', 'EMAIL');
  if (!email) {
    return { provider: 'RESEND', credentials: {} };
  }
  return email;
}

export async function getActiveShippingProvider(): Promise<any> {
  const shipping = await getConfig('active_shipping_provider', 'SHIPPING');
  if (!shipping) {
    return { provider: 'SHIPROCKET', credentials: {} };
  }
  return shipping;
}

export async function getActiveSearchEngine(): Promise<any> {
  const search = await getConfig('active_search_engine', 'SEARCH');
  if (!search) {
    return { provider: 'ALGOLIA', credentials: {} };
  }
  return search;
}
