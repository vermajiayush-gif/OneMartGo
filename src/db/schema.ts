import { pgTable, text, varchar, timestamp, boolean, integer, decimal, jsonb, uuid, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['SUPER_ADMIN', 'ADMIN', 'VENDOR', 'RESELLER', 'CUSTOMER']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'SUSPENDED', 'DELETED']);
export const vendorStatusEnum = pgEnum('vendor_status', ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']);
export const productStatusEnum = pgEnum('product_status', ['DRAFT', 'ACTIVE', 'INACTIVE', 'REJECTED']);
export const orderStatusEnum = pgEnum('order_status', [
  'PAYMENT_PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 
  'RETURN_APPROVED', 'RETURN_PICKED', 'RETURNED', 'REFUNDED'
]);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND']);
export const paymentMethodEnum = pgEnum('payment_method', ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'COD', 'EMI']);
export const payoutStatusEnum = pgEnum('payout_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);
export const transactionTypeEnum = pgEnum('transaction_type', ['CREDIT', 'DEBIT']);
export const loyaltyTransactionTypeEnum = pgEnum('loyalty_transaction_type', ['EARN', 'REDEEM', 'EXPIRE', 'BONUS']);
export const mediaTypeEnum = pgEnum('media_type', ['IMAGE', 'VIDEO', 'REEL']);
export const addressTypeEnum = pgEnum('address_type', ['HOME', 'WORK', 'OTHER']);
export const disputeStatusEnum = pgEnum('dispute_status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);
export const reviewStatusEnum = pgEnum('review_status', ['PENDING', 'APPROVED', 'REJECTED']);
export const documentStatusEnum = pgEnum('document_status', ['PENDING', 'APPROVED', 'REJECTED']);
export const configCategoryEnum = pgEnum('config_category', ['PAYMENT', 'STORAGE', 'SMS', 'EMAIL', 'SHIPPING', 'SEARCH', 'GENERAL']);

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  passwordHash: text('password_hash'),
  role: userRoleEnum('role').notNull().default('CUSTOMER'),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  displayName: varchar('display_name', { length: 200 }),
  avatarUrl: text('avatar_url'),
  
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  
  isEmailVerified: boolean('is_email_verified').default(false),
  isPhoneVerified: boolean('is_phone_verified').default(false),
  isTwoFactorEnabled: boolean('is_two_factor_enabled').default(false),
  
  loyaltyCoins: integer('loyalty_coins').default(0),
  walletBalance: decimal('wallet_balance', { precision: 10, scale: 2 }).default('0.00'),
  
  referralCode: varchar('referral_code', { length: 20 }),
  referredByUserId: uuid('referred_by_user_id'),
  
  googleId: varchar('google_id', { length: 255 }),
  appleId: varchar('apple_id', { length: 255 }),
  
  lastLoginAt: timestamp('last_login_at'),
  lastLoginIp: varchar('last_login_ip', { length: 45 }),
  deviceTokens: jsonb('device_tokens').$type<string[]>().default([]),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  phoneIdx: uniqueIndex('users_phone_idx').on(table.phone),
  referralCodeIdx: uniqueIndex('users_referral_code_idx').on(table.referralCode),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  deviceInfo: text('device_info'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  tokenIdx: uniqueIndex('sessions_token_idx').on(table.token),
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
}));

export const otpTokens = pgTable('otp_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  otpHash: text('otp_hash').notNull(),
  purpose: varchar('purpose', { length: 50 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false),
  attempts: integer('attempts').default(0),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  identifierIdx: index('otp_tokens_identifier_idx').on(table.identifier),
}));

export const addresses = pgTable('addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: addressTypeEnum('type').default('HOME'),
  
  fullName: varchar('full_name', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  landmark: varchar('landmark', { length: 255 }),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  country: varchar('country', { length: 100 }).default('India'),
  
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('addresses_user_id_idx').on(table.userId),
}));

// ============================================================================
// VENDORS
// ============================================================================

export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  businessName: varchar('business_name', { length: 255 }).notNull(),
  brandName: varchar('brand_name', { length: 255 }),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  
  businessEmail: varchar('business_email', { length: 255 }),
  businessPhone: varchar('business_phone', { length: 20 }),
  
  gstNumber: varchar('gst_number', { length: 20 }),
  panNumber: varchar('pan_number', { length: 20 }),
  msmeNumber: varchar('msme_number', { length: 50 }),
  
  bankAccountNumber: text('bank_account_number'),
  bankIfscCode: varchar('bank_ifsc_code', { length: 20 }),
  
  status: vendorStatusEnum('status').default('PENDING'),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('10.00'),
  returnWindowDays: integer('return_window_days').default(7),
  
  totalSales: decimal('total_sales', { precision: 12, scale: 2 }).default('0.00'),
  totalOrders: integer('total_orders').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0.00'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('vendors_slug_idx').on(table.slug),
  userIdIdx: uniqueIndex('vendors_user_id_idx').on(table.userId),
}));

export const vendorDocuments = pgTable('vendor_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  documentType: varchar('document_type', { length: 50 }).notNull(),
  fileUrl: text('file_url').notNull(),
  status: documentStatusEnum('status').default('PENDING'),
  adminNotes: text('admin_notes'),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
}, (table) => ({
  vendorIdIdx: index('vendor_documents_vendor_id_idx').on(table.vendorId),
}));

// ============================================================================
// RESELLERS
// ============================================================================

export const resellers = pgTable('resellers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  displayName: varchar('display_name', { length: 200 }),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  telegramUsername: varchar('telegram_username', { length: 100 }),
  instagramHandle: varchar('instagram_handle', { length: 100 }),
  
  totalEarnings: decimal('total_earnings', { precision: 12, scale: 2 }).default('0.00'),
  pendingEarnings: decimal('pending_earnings', { precision: 12, scale: 2 }).default('0.00'),
  withdrawnAmount: decimal('withdrawn_amount', { precision: 12, scale: 2 }).default('0.00'),
  
  totalLinks: integer('total_links').default(0),
  totalClicks: integer('total_clicks').default(0),
  totalOrders: integer('total_orders').default(0),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }).default('0.00'),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex('resellers_user_id_idx').on(table.userId),
}));

export const resellerBankDetails = pgTable('reseller_bank_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  resellerId: uuid('reseller_id').notNull().references(() => resellers.id, { onDelete: 'cascade' }),
  
  accountHolderName: varchar('account_holder_name', { length: 200 }).notNull(),
  accountNumber: text('account_number').notNull(),
  ifscCode: varchar('ifsc_code', { length: 20 }).notNull(),
  bankName: varchar('bank_name', { length: 200 }),
  upiId: varchar('upi_id', { length: 100 }),
  
  isVerified: boolean('is_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  resellerIdIdx: uniqueIndex('reseller_bank_details_reseller_id_idx').on(table.resellerId),
}));

export const resellerLinks = pgTable('reseller_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  resellerId: uuid('reseller_id').notNull().references(() => resellers.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull(),
  
  marginType: varchar('margin_type', { length: 20 }).notNull(),
  marginValue: decimal('margin_value', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  
  shortCode: varchar('short_code', { length: 20 }).notNull(),
  fullUrl: text('full_url').notNull(),
  
  clicks: integer('clicks').default(0),
  uniqueClicks: integer('unique_clicks').default(0),
  conversions: integer('conversions').default(0),
  revenue: decimal('revenue', { precision: 12, scale: 2 }).default('0.00'),
  
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  shortCodeIdx: uniqueIndex('reseller_links_short_code_idx').on(table.shortCode),
  resellerIdIdx: index('reseller_links_reseller_id_idx').on(table.resellerId),
  productIdIdx: index('reseller_links_product_id_idx').on(table.productId),
}));

export const resellerLinkClicks = pgTable('reseller_link_clicks', {
  id: uuid('id').defaultRandom().primaryKey(),
  linkId: uuid('link_id').notNull().references(() => resellerLinks.id, { onDelete: 'cascade' }),
  
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  deviceType: varchar('device_type', { length: 50 }),
  country: varchar('country', { length: 100 }),
  
  clickedAt: timestamp('clicked_at').defaultNow(),
}, (table) => ({
  linkIdIdx: index('reseller_link_clicks_link_id_idx').on(table.linkId),
}));

export const resellerOrders = pgTable('reseller_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  resellerId: uuid('reseller_id').notNull().references(() => resellers.id),
  orderId: uuid('order_id').notNull(),
  linkId: uuid('link_id').references(() => resellerLinks.id),
  
  marginAmount: decimal('margin_amount', { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('0.00'),
  
  shippingAddressId: uuid('shipping_address_id'),
  shippingLabel: text('shipping_label'),
  
  isPaid: boolean('is_paid').default(false),
  paidAt: timestamp('paid_at'),
  payoutId: uuid('payout_id'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  resellerIdIdx: index('reseller_orders_reseller_id_idx').on(table.resellerId),
  orderIdIdx: index('reseller_orders_order_id_idx').on(table.orderId),
}));

// ============================================================================
// CATEGORIES
// ============================================================================

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  
  parentId: uuid('parent_id'),
  level: integer('level').default(0),
  
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
  parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
}));

export const categoryAttributes = pgTable('category_attributes', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  options: jsonb('options'),
  
  isRequired: boolean('is_required').default(false),
  isFilterable: boolean('is_filterable').default(true),
  isVariant: boolean('is_variant').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  categoryIdIdx: index('category_attributes_category_id_idx').on(table.categoryId),
}));

// ============================================================================
// PRODUCTS
// ============================================================================

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id),
  
  name: varchar('name', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 600 }).notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  highlights: jsonb('highlights').$type<string[]>(),
  
  brand: varchar('brand', { length: 200 }),
  sku: varchar('sku', { length: 100 }),
  
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }).default('18.00'),
  hsnCode: varchar('hsn_code', { length: 20 }),
  
  status: productStatusEnum('status').default('DRAFT'),
  
  isResellingAllowed: boolean('is_reselling_allowed').default(true),
  minResellerMargin: decimal('min_reseller_margin', { precision: 5, scale: 2 }).default('5.00'),
  maxResellerMargin: decimal('max_reseller_margin', { precision: 5, scale: 2 }).default('50.00'),
  
  isFeatured: boolean('is_featured').default(false),
  isTrending: boolean('is_trending').default(false),
  
  weight: decimal('weight', { precision: 10, scale: 2 }),
  length: decimal('length', { precision: 10, scale: 2 }),
  width: decimal('width', { precision: 10, scale: 2 }),
  height: decimal('height', { precision: 10, scale: 2 }),
  
  returnWindowDays: integer('return_window_days').default(7),
  warrantyInfo: text('warranty_info'),
  
  viewCount: integer('view_count').default(0),
  wishlistCount: integer('wishlist_count').default(0),
  salesCount: integer('sales_count').default(0),
  
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0.00'),
  reviewCount: integer('review_count').default(0),
  
  algoliaObjectId: varchar('algolia_object_id', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
  vendorIdIdx: index('products_vendor_id_idx').on(table.vendorId),
  categoryIdIdx: index('products_category_id_idx').on(table.categoryId),
  statusIdx: index('products_status_idx').on(table.status),
}));

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  attributes: jsonb('attributes'),
  
  basePrice: decimal('base_price', { precision: 10, scale: 2 }),
  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }),
  comparePrice: decimal('compare_price', { precision: 10, scale: 2 }),
  
  stockQuantity: integer('stock_quantity').default(0),
  reservedStock: integer('reserved_stock').default(0),
  lowStockAlert: integer('low_stock_alert').default(10),
  
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('product_variants_product_id_idx').on(table.productId),
  skuIdx: index('product_variants_sku_idx').on(table.sku),
}));

export const productMedia = pgTable('product_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  
  type: mediaTypeEnum('type').default('IMAGE'),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  altText: varchar('alt_text', { length: 255 }),
  
  sortOrder: integer('sort_order').default(0),
  isPrimary: boolean('is_primary').default(false),
  duration: integer('duration'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('product_media_product_id_idx').on(table.productId),
}));

export const productAttributes = pgTable('product_attributes', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 100 }).notNull(),
  value: text('value').notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('product_attributes_product_id_idx').on(table.productId),
}));

export const productTags = pgTable('product_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 100 }).notNull(),
}, (table) => ({
  productIdIdx: index('product_tags_product_id_idx').on(table.productId),
  tagIdx: index('product_tags_tag_idx').on(table.tag),
}));

export const productViews = pgTable('product_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  sessionId: varchar('session_id', { length: 255 }),
  deviceType: varchar('device_type', { length: 50 }),
  viewedAt: timestamp('viewed_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('product_views_product_id_idx').on(table.productId),
}));

export const inventoryLogs = pgTable('inventory_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id'),
  
  changeType: varchar('change_type', { length: 50 }).notNull(),
  quantity: integer('quantity').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('inventory_logs_product_id_idx').on(table.productId),
}));

// ============================================================================
// CART & WISHLIST
// ============================================================================

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  sessionId: varchar('session_id', { length: 255 }),
  
  couponId: uuid('coupon_id'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).default('0.00'),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0.00'),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0.00'),
  shipping: decimal('shipping', { precision: 10, scale: 2 }).default('0.00'),
  total: decimal('total', { precision: 10, scale: 2 }).default('0.00'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('carts_user_id_idx').on(table.userId),
  sessionIdIdx: index('carts_session_id_idx').on(table.sessionId),
}));

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id'),
  
  quantity: integer('quantity').notNull().default(1),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  cartIdIdx: index('cart_items_cart_id_idx').on(table.cartId),
}));

export const wishlists = pgTable('wishlists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex('wishlists_user_id_idx').on(table.userId),
}));

export const wishlistItems = pgTable('wishlist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  wishlistId: uuid('wishlist_id').notNull().references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  wishlistIdIdx: index('wishlist_items_wishlist_id_idx').on(table.wishlistId),
}));

// ============================================================================
// ORDERS
// ============================================================================

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 50 }).notNull(),
  
  userId: uuid('user_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  shippingAddressId: uuid('shipping_address_id').notNull().references(() => addresses.id),
  
  status: orderStatusEnum('status').default('PAYMENT_PENDING'),
  
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0.00'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).default('0.00'),
  shippingAmount: decimal('shipping_amount', { precision: 10, scale: 2 }).default('0.00'),
  coinsUsed: integer('coins_used').default(0),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  
  vendorAmount: decimal('vendor_amount', { precision: 10, scale: 2 }),
  platformCommission: decimal('platform_commission', { precision: 10, scale: 2 }),
  
  paymentStatus: paymentStatusEnum('payment_status').default('PENDING'),
  paymentMethod: paymentMethodEnum('payment_method'),
  
  trackingId: varchar('tracking_id', { length: 255 }),
  trackingUrl: text('tracking_url'),
  shippingProvider: varchar('shipping_provider', { length: 100 }),
  awbCode: varchar('awb_code', { length: 100 }),
  estimatedDelivery: timestamp('estimated_delivery'),
  
  returnReason: text('return_reason'),
  refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
  
  isResellerOrder: boolean('is_reseller_order').default(false),
  source: varchar('source', { length: 50 }).default('WEB'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orderNumberIdx: uniqueIndex('orders_order_number_idx').on(table.orderNumber),
  userIdIdx: index('orders_user_id_idx').on(table.userId),
  vendorIdIdx: index('orders_vendor_id_idx').on(table.vendorId),
  statusIdx: index('orders_status_idx').on(table.status),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  variantId: uuid('variant_id'),
  
  productName: varchar('product_name', { length: 500 }).notNull(),
  variantName: varchar('variant_name', { length: 255 }),
  sku: varchar('sku', { length: 100 }),
  
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 5, scale: 2 }),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0.00'),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  
  isReviewed: boolean('is_reviewed').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
}));

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  
  fromStatus: orderStatusEnum('from_status'),
  toStatus: orderStatusEnum('to_status').notNull(),
  note: text('note'),
  changedBy: uuid('changed_by'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('order_status_history_order_id_idx').on(table.orderId),
}));

// ============================================================================
// PAYMENTS & PAYOUTS
// ============================================================================

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  
  gateway: varchar('gateway', { length: 50 }).notNull(),
  gatewayOrderId: varchar('gateway_order_id', { length: 255 }),
  gatewayPaymentId: varchar('gateway_payment_id', { length: 255 }),
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR'),
  refundedAmount: decimal('refunded_amount', { precision: 10, scale: 2 }).default('0.00'),
  
  status: paymentStatusEnum('status').default('PENDING'),
  method: paymentMethodEnum('method'),
  
  vendorAmount: decimal('vendor_amount', { precision: 10, scale: 2 }),
  platformAmount: decimal('platform_amount', { precision: 10, scale: 2 }),
  resellerAmount: decimal('reseller_amount', { precision: 10, scale: 2 }),
  
  gatewayResponse: jsonb('gateway_response'),
  failureReason: text('failure_reason'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('payments_order_id_idx').on(table.orderId),
  gatewayOrderIdIdx: index('payments_gateway_order_id_idx').on(table.gatewayOrderId),
}));

export const refunds = pgTable('refunds', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id),
  
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  status: varchar('status', { length: 50 }).default('PENDING'),
  
  gatewayRefundId: varchar('gateway_refund_id', { length: 255 }),
  processedAt: timestamp('processed_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  paymentIdIdx: index('refunds_payment_id_idx').on(table.paymentId),
}));

export const payouts = pgTable('payouts', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  vendorId: uuid('vendor_id').references(() => vendors.id),
  resellerId: uuid('reseller_id').references(() => resellers.id),
  
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR'),
  status: payoutStatusEnum('status').default('PENDING'),
  
  gateway: varchar('gateway', { length: 50 }),
  gatewayPayoutId: varchar('gateway_payout_id', { length: 255 }),
  
  accountName: varchar('account_name', { length: 200 }),
  accountNumber: text('account_number'),
  
  period: varchar('period', { length: 100 }),
  orderIds: jsonb('order_ids').$type<string[]>(),
  notes: text('notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  processedAt: timestamp('processed_at'),
}, (table) => ({
  vendorIdIdx: index('payouts_vendor_id_idx').on(table.vendorId),
  resellerIdIdx: index('payouts_reseller_id_idx').on(table.resellerId),
}));

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  type: transactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull(),
  
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  category: varchar('category', { length: 50 }),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('wallet_transactions_user_id_idx').on(table.userId),
}));

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  type: loyaltyTransactionTypeEnum('type').notNull(),
  coins: integer('coins').notNull(),
  balance: integer('balance').notNull(),
  
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('loyalty_transactions_user_id_idx').on(table.userId),
}));

// ============================================================================
// COUPONS & PROMOTIONS
// ============================================================================

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull(),
  
  type: varchar('type', { length: 50 }).notNull(),
  discountType: varchar('discount_type', { length: 50 }).notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  
  minOrderValue: decimal('min_order_value', { precision: 10, scale: 2 }),
  maxDiscountCap: decimal('max_discount_cap', { precision: 10, scale: 2 }),
  
  vendorId: uuid('vendor_id'),
  categoryId: uuid('category_id'),
  productIds: jsonb('product_ids').$type<string[]>(),
  
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').default(0),
  perUserLimit: integer('per_user_limit'),
  
  isActive: boolean('is_active').default(true),
  startsAt: timestamp('starts_at'),
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  codeIdx: uniqueIndex('coupons_code_idx').on(table.code),
}));

export const couponUsages = pgTable('coupon_usages', {
  id: uuid('id').defaultRandom().primaryKey(),
  couponId: uuid('coupon_id').notNull().references(() => coupons.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  
  usedAt: timestamp('used_at').defaultNow(),
}, (table) => ({
  couponIdIdx: index('coupon_usages_coupon_id_idx').on(table.couponId),
  userIdIdx: index('coupon_usages_user_id_idx').on(table.userId),
}));

export const promotions = pgTable('promotions', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  bannerImageUrl: text('banner_image_url'),
  
  discountType: varchar('discount_type', { length: 50 }),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }),
  
  productIds: jsonb('product_ids').$type<string[]>(),
  categoryIds: jsonb('category_ids').$type<string[]>(),
  
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  
  isActive: boolean('is_active').default(true),
  isApproved: boolean('is_approved').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const flashSales = pgTable('flash_sales', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  bannerUrl: text('banner_url'),
  
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const flashSaleItems = pgTable('flash_sale_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  flashSaleId: uuid('flash_sale_id').notNull().references(() => flashSales.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  
  salePrice: decimal('sale_price', { precision: 10, scale: 2 }).notNull(),
  stockLimit: integer('stock_limit'),
  soldCount: integer('sold_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  flashSaleIdIdx: index('flash_sale_items_flash_sale_id_idx').on(table.flashSaleId),
}));

// ============================================================================
// REVIEWS & DISPUTES
// ============================================================================

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  orderId: uuid('order_id').references(() => orders.id),
  
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 255 }),
  comment: text('comment'),
  
  images: jsonb('images').$type<string[]>(),
  videoUrl: text('video_url'),
  
  sizeReview: varchar('size_review', { length: 50 }),
  qualityRating: integer('quality_rating'),
  
  status: reviewStatusEnum('status').default('PENDING'),
  isVerifiedPurchase: boolean('is_verified_purchase').default(false),
  helpfulCount: integer('helpful_count').default(0),
  
  vendorResponse: text('vendor_response'),
  respondedAt: timestamp('responded_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('reviews_product_id_idx').on(table.productId),
  userIdIdx: index('reviews_user_id_idx').on(table.userId),
}));

export const disputes = pgTable('disputes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id),
  
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
  evidenceUrls: jsonb('evidence_urls').$type<string[]>(),
  
  status: disputeStatusEnum('status').default('OPEN'),
  resolution: text('resolution'),
  
  resolvedBy: uuid('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  orderIdIdx: index('disputes_order_id_idx').on(table.orderId),
  userIdIdx: index('disputes_user_id_idx').on(table.userId),
}));

export const disputeMessages = pgTable('dispute_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  disputeId: uuid('dispute_id').notNull().references(() => disputes.id, { onDelete: 'cascade' }),
  
  senderId: uuid('sender_id').notNull(),
  senderRole: varchar('sender_role', { length: 50 }).notNull(),
  
  message: text('message').notNull(),
  attachments: jsonb('attachments').$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  disputeIdIdx: index('dispute_messages_dispute_id_idx').on(table.disputeId),
}));

// ============================================================================
// NOTIFICATIONS & CMS
// ============================================================================

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  
  imageUrl: text('image_url'),
  actionUrl: text('action_url'),
  data: jsonb('data'),
  
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
}));

export const cmsBanners = pgTable('cms_banners', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  title: varchar('title', { length: 255 }).notNull(),
  imageUrl: text('image_url').notNull(),
  mobileImageUrl: text('mobile_image_url'),
  linkUrl: text('link_url'),
  
  position: varchar('position', { length: 50 }),
  sortOrder: integer('sort_order').default(0),
  
  isActive: boolean('is_active').default(true),
  targetAudience: varchar('target_audience', { length: 50 }),
  
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cmsPages = pgTable('cms_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  content: text('content'),
  
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDesc: text('meta_desc'),
  
  isPublished: boolean('is_published').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('cms_pages_slug_idx').on(table.slug),
}));

export const searchHistory = pgTable('search_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  sessionId: varchar('session_id', { length: 255 }),
  
  query: varchar('query', { length: 500 }).notNull(),
  results: integer('results'),
  clicked: boolean('clicked').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('search_history_user_id_idx').on(table.userId),
}));

// ============================================================================
// ANALYTICS
// ============================================================================

export const vendorAnalytics = pgTable('vendor_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  
  date: timestamp('date').notNull(),
  revenue: decimal('revenue', { precision: 12, scale: 2 }).default('0.00'),
  orders: integer('orders').default(0),
  returns: integer('returns').default(0),
  newCustomers: integer('new_customers').default(0),
  views: integer('views').default(0),
  conversionRate: decimal('conversion_rate', { precision: 5, scale: 2 }).default('0.00'),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  vendorDateIdx: index('vendor_analytics_vendor_date_idx').on(table.vendorId, table.date),
}));

export const platformAnalytics = pgTable('platform_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  date: timestamp('date').notNull(),
  gmv: decimal('gmv', { precision: 15, scale: 2 }).default('0.00'),
  revenue: decimal('revenue', { precision: 12, scale: 2 }).default('0.00'),
  orders: integer('orders').default(0),
  newUsers: integer('new_users').default(0),
  activeVendors: integer('active_vendors').default(0),
  activeResellers: integer('active_resellers').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  dateIdx: uniqueIndex('platform_analytics_date_idx').on(table.date),
}));

export const shoppableReels = pgTable('shoppable_reels', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration'),
  
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  
  isActive: boolean('is_active').default(true),
  isFeatured: boolean('is_featured').default(false),
  
  productIds: jsonb('product_ids').$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userBodyProfiles = pgTable('user_body_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  height: decimal('height', { precision: 5, scale: 2 }),
  weight: decimal('weight', { precision: 5, scale: 2 }),
  chest: decimal('chest', { precision: 5, scale: 2 }),
  waist: decimal('waist', { precision: 5, scale: 2 }),
  hips: decimal('hips', { precision: 5, scale: 2 }),
  shoulders: decimal('shoulders', { precision: 5, scale: 2 }),
  
  fitPreference: varchar('fit_preference', { length: 50 }),
  skinTone: varchar('skin_tone', { length: 50 }),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: uniqueIndex('user_body_profiles_user_id_idx').on(table.userId),
}));

// ============================================================================
// SYSTEM CONFIGS (MOST CRITICAL TABLE)
// ============================================================================

export const systemConfigs = pgTable('system_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value').notNull(),
  
  category: configCategoryEnum('category').notNull(),
  label: varchar('label', { length: 255 }),
  description: text('description'),
  
  isEncrypted: boolean('is_encrypted').default(false),
  isActive: boolean('is_active').default(true),
  
  updatedBy: uuid('updated_by'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  keyIdx: uniqueIndex('system_configs_key_idx').on(table.key),
  categoryIdx: index('system_configs_category_idx').on(table.category),
}));

// ============================================================================
// ADMIN
// ============================================================================

export const adminConfig = pgTable('admin_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  secretAdminPath: varchar('secret_admin_path', { length: 255 }).notNull(),
  adminPassword: text('admin_password').notNull(),
  
  allowedIPs: jsonb('allowed_ips').$type<string[]>(),
  isTwoFactorEnabled: boolean('is_two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'),
  
  sessionDuration: integer('session_duration').default(28800),
  maxLoginAttempts: integer('max_login_attempts').default(5),
  lockoutDuration: integer('lockout_duration').default(1800),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').notNull().references(() => users.id),
  
  action: varchar('action', { length: 100 }).notNull(),
  module: varchar('module', { length: 100 }).notNull(),
  details: jsonb('details'),
  
  ipAddress: varchar('ip_address', { length: 45 }),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  adminIdIdx: index('admin_audit_logs_admin_id_idx').on(table.adminId),
  actionIdx: index('admin_audit_logs_action_idx').on(table.action),
}));

export const adminLoginAttempts = pgTable('admin_login_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  success: boolean('success').notNull(),
  
  attemptedAt: timestamp('attempted_at').defaultNow(),
}, (table) => ({
  ipIdx: index('admin_login_attempts_ip_idx').on(table.ipAddress),
}));

// ============================================================================
// BUNDLES
// ============================================================================

export const bundles = pgTable('bundles', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  
  bundlePrice: decimal('bundle_price', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const bundleItems = pgTable('bundle_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  bundleId: uuid('bundle_id').notNull().references(() => bundles.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id),
  
  quantity: integer('quantity').default(1),
  
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  bundleIdIdx: index('bundle_items_bundle_id_idx').on(table.bundleId),
}));
