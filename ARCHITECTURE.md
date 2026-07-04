# OneMartGo - System Architecture

## 🏛️ Architecture Overview

OneMartGo follows a **Modular Monolith** architecture pattern, designed for ease of development while maintaining the flexibility to extract microservices as the platform scales.

## 🎯 Core Design Principles

### 1. **Runtime Configuration**
The platform's most unique architectural feature is the **Dynamic Provider Configuration System**.

```
┌─────────────────────────────────────────────────┐
│         Admin Panel UI (React)                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Payment: [Cashfree ▼] │ [Save]         │   │
│  │  Client ID: [_______]                    │   │
│  │  Secret:    [_______]                    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────┘
                  │ POST /api/v1/admin/settings
                  ↓
┌─────────────────────────────────────────────────┐
│         Config Service (lib/config.service.ts)  │
│  • Encrypts credentials (AES-256)              │
│  • Stores in system_configs table              │
│  • Clears cache                                │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────┐
│         Database (PostgreSQL)                   │
│  system_configs:                                │
│    key: 'active_payment_gateway'                │
│    value: '{encrypted JSON}'                    │
│    category: 'PAYMENT'                          │
│    isEncrypted: true                            │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓ (Runtime read)
┌─────────────────────────────────────────────────┐
│    Payment Service (lib/payment.service.ts)     │
│  • Reads config from DB/cache                   │
│  • Decrypts credentials                         │
│  • Routes to correct provider                   │
│  • Returns unified response                     │
└─────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Zero downtime provider switching
- ✅ No code changes required
- ✅ No redeployment needed
- ✅ Instant activation
- ✅ Encrypted credential storage
- ✅ Audit trail of all changes

### 2. **Service Abstraction Pattern**

All external services follow the same abstraction pattern:

```typescript
// Abstract interface
class PaymentService {
  static async createOrder(order) {
    const provider = await getActivePaymentGateway();
    
    switch (provider.provider) {
      case 'CASHFREE':
        return this.createCashfreeOrder(order, provider.credentials);
      case 'RAZORPAY':
        return this.createRazorpayOrder(order, provider.credentials);
      case 'STRIPE':
        return this.createStripeOrder(order, provider.credentials);
    }
  }
  
  private static async createCashfreeOrder(order, creds) { }
  private static async createRazorpayOrder(order, creds) { }
  private static async createStripeOrder(order, creds) { }
}
```

**Applied to:**
- Payment (Cashfree, Razorpay, Stripe)
- SMS (MSG91, Twilio, Fast2SMS)
- Email (Resend, SendGrid, SMTP)
- Storage (Supabase, S3, Cloudinary, Backblaze)
- Shipping (Shiprocket, Delhivery, BlueDart)
- Search (Algolia, Elasticsearch)

### 3. **Security Layers**

```
┌────────────────────────────────────────────────┐
│  Client (Browser/Mobile)                       │
└───────────────┬────────────────────────────────┘
                │ HTTPS
                ↓
┌────────────────────────────────────────────────┐
│  API Gateway / Middleware                      │
│  • CORS validation                             │
│  • Rate limiting                               │
│  • JWT verification                            │
│  • Role-based access control (RBAC)            │
└───────────────┬────────────────────────────────┘
                │
                ↓
┌────────────────────────────────────────────────┐
│  API Routes                                    │
│  • Input validation (Zod)                      │
│  • Business logic                              │
│  • Database operations                         │
└───────────────┬────────────────────────────────┘
                │
                ↓
┌────────────────────────────────────────────────┐
│  Database Layer (Drizzle ORM)                  │
│  • SQL injection prevention                    │
│  • Prepared statements                         │
│  • Transaction management                      │
└────────────────────────────────────────────────┘
```

## 🗄️ Database Architecture

### Schema Design Philosophy

**54 Tables** organized into logical domains:

#### 1. **Identity & Access Management (IAM)**
```sql
users              -- Core user table with RBAC
├── sessions       -- Active user sessions
├── otpTokens      -- OTP verification
└── addresses      -- User shipping addresses
```

#### 2. **Vendor Management**
```sql
vendors            -- Vendor profiles
├── vendorDocuments     -- KYC documents
├── vendorAnalytics     -- Performance metrics
└── products            -- Vendor products
    ├── productVariants
    ├── productMedia
    ├── productAttributes
    └── productTags
```

#### 3. **Reseller Ecosystem**
```sql
resellers               -- Reseller profiles
├── resellerBankDetails -- Payout information
├── resellerLinks       -- Generated product links
├── resellerLinkClicks  -- Click tracking
└── resellerOrders      -- Commission tracking
```

#### 4. **Commerce Engine**
```sql
products
├── categories
│   └── categoryAttributes
├── carts
│   └── cartItems
├── wishlists
│   └── wishlistItems
├── orders
│   ├── orderItems
│   └── orderStatusHistory
├── payments
│   └── refunds
└── reviews
```

#### 5. **System Configuration**
```sql
systemConfigs      -- THE CRITICAL TABLE
├── adminConfig    -- Admin panel settings
├── adminAuditLogs -- All admin actions
└── adminLoginAttempts
```

### Indexing Strategy

**Primary Indexes:**
- All UUID primary keys
- Unique indexes on email, phone, slug fields
- Composite indexes on foreign keys

**Performance Indexes:**
```sql
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reseller_links_code ON reseller_links(short_code);
```

### Data Encryption

**At Rest:**
- System config credentials: AES-256
- Bank account numbers: AES-256
- Passwords: bcrypt (cost 12+)

**In Transit:**
- All API communication: HTTPS/TLS 1.3
- Database connections: SSL/TLS

## 🔐 Authentication & Authorization

### Token System

```
┌──────────────────────────────────────────────┐
│  Token Types                                 │
├──────────────────────────────────────────────┤
│  1. Access Token  (15 min)  - API access     │
│  2. Refresh Token (30 days) - Token renewal  │
│  3. Admin Token   (8 hours) - Admin actions  │
└──────────────────────────────────────────────┘
```

### RBAC Matrix

| Role         | Products | Orders | Vendors | Admin Panel |
|--------------|----------|--------|---------|-------------|
| CUSTOMER     | View     | Own    | -       | -           |
| RESELLER     | View     | Own    | -       | -           |
| VENDOR       | Own      | Own    | Own     | -           |
| ADMIN        | All      | All    | Approve | Limited     |
| SUPER_ADMIN  | All      | All    | All     | Full        |

### Admin Security

```
┌─────────────────────────────────────────┐
│  Multi-Layer Admin Protection          │
├─────────────────────────────────────────┤
│  Layer 1: Secret URL (48-char random)   │
│  Layer 2: Password (bcrypt)             │
│  Layer 3: 2FA (TOTP)                    │
│  Layer 4: IP Whitelist (optional)       │
│  Layer 5: Brute Force Protection        │
│  Layer 6: Session Management            │
│  Layer 7: Audit Logging                 │
└─────────────────────────────────────────┘
```

## 🔄 Request Flow

### Customer Order Flow

```
User Action: Add to Cart
    ↓
API: POST /api/v1/cart
    ↓
Middleware: Verify JWT
    ↓
Handler: Validate product exists
    ↓
    Check stock availability
    ↓
    Create/Update cart
    ↓
    Calculate totals (tax, shipping)
    ↓
Response: Cart updated
```

### Payment Flow

```
User: Checkout → Select Payment Method
    ↓
API: POST /api/v1/orders/create
    ↓
1. Create order (status: PAYMENT_PENDING)
    ↓
2. ConfigService.getActivePaymentGateway()
    ↓
3. PaymentService.createOrder()
   ├─→ Cashfree API (if active)
   ├─→ Razorpay API (if active)
   └─→ Stripe API (if active)
    ↓
4. Return gateway order ID to frontend
    ↓
Frontend: Open payment UI (SDK)
    ↓
User: Complete payment on gateway
    ↓
Gateway: POST /api/v1/payments/webhook/[provider]
    ↓
Webhook Handler:
    1. Verify signature
    2. Validate payment
    3. Update order status → CONFIRMED
    4. Deduct inventory
    5. Send notifications (SMS + Email)
    6. Credit loyalty coins
    7. Record reseller commission (if applicable)
```

## 🔗 Reseller System Architecture

### Link Generation

```
Reseller selects product + sets margin
    ↓
Generate unique shortCode (10 chars)
    ↓
Create URL: onemartgo.com/r/{shortCode}
    ↓
Store in reseller_links:
    - resellerId
    - productId
    - marginType (PERCENTAGE | FLAT)
    - marginValue
    - sellingPrice (basePrice + margin)
    - shortCode
```

### Click Tracking

```
Customer clicks: onemartgo.com/r/abc123
    ↓
Route: /r/[shortCode]/route.ts
    ↓
1. Find link by shortCode
    ↓
2. Record click in reseller_link_clicks:
   - ipAddress
   - userAgent
   - deviceType
   - country
    ↓
3. Increment link.clicks
    ↓
4. Increment reseller.totalClicks
    ↓
5. Redirect to: /products/{slug}?ref={shortCode}
```

### White-Label Shipping

```
Order placed via reseller link
    ↓
Mark as: isResellerOrder = true
    ↓
Create shipping label:
    FROM: Reseller's Business Name
    TO: Customer's Address
    (Vendor details hidden)
    ↓
Ship directly to customer
    ↓
On delivery:
    1. Calculate reseller commission
    2. Add to pendingEarnings
    3. After 7-day hold → availableToWithdraw
```

## 📊 Analytics Pipeline

### Real-Time Analytics

```
Order Event (Created/Updated/Delivered)
    ↓
Trigger Analytics Update:
    ↓
    ├─→ Platform Analytics (GMV, Revenue, Orders)
    ├─→ Vendor Analytics (Sales, Returns, Customers)
    └─→ Reseller Analytics (Conversions, Earnings)
    ↓
Aggregate by date
    ↓
Store in respective analytics tables
    ↓
Display in dashboards (cached for 5 min)
```

## 🚀 Performance Optimization

### Caching Strategy

```
┌────────────────────────────────────────┐
│  Cache Layers                          │
├────────────────────────────────────────┤
│  L1: In-Memory (Config, 5 min TTL)     │
│  L2: Redis (Sessions, 30 days)         │
│  L3: CDN (Static assets)               │
│  L4: Database Query Cache              │
└────────────────────────────────────────┘
```

### Database Optimization

- **Connection Pooling:** Max 20 connections
- **Query Optimization:** Indexed lookups
- **Pagination:** Limit/offset for large datasets
- **Soft Deletes:** Prevent data loss, archival
- **Read Replicas:** (Future) for analytics queries

### API Optimization

- **Rate Limiting:** 100 requests/min per user
- **Response Compression:** gzip
- **Lazy Loading:** Products, images
- **Infinite Scroll:** Product listings
- **Debouncing:** Search queries

## 🔍 Search Architecture

### Algolia Integration (Default)

```
Product Created/Updated
    ↓
Sync to Algolia:
    POST https://algolia.com/indexes/products
    {
      objectID: product.id,
      name: product.name,
      description: product.description,
      price: product.sellingPrice,
      category: category.name,
      brand: product.brand,
      tags: product.tags,
      rating: product.averageRating,
      reviews: product.reviewCount,
    }
    ↓
Store algoliaObjectId in products table
```

### Search Query Flow

```
User types: "red shirt"
    ↓
Frontend: Debounce 300ms
    ↓
API: GET /api/v1/products/search?q=red+shirt
    ↓
ConfigService: Get active search engine
    ↓
SearchService: Query Algolia/Elasticsearch
    ↓
    Apply filters (price, brand, rating)
    ↓
    Sort by relevance/price/newest
    ↓
Return results with facets
```

## 🛡️ Error Handling

### Global Error Strategy

```typescript
try {
  // Business logic
} catch (error) {
  // Log error (Sentry)
  console.error('Error:', error);
  
  // Return user-friendly message
  return NextResponse.json(
    { error: 'Something went wrong' },
    { status: 500 }
  );
}
```

### Payment Failure Recovery

```
Payment Failed
    ↓
1. Update order.paymentStatus = 'FAILED'
    ↓
2. Store gateway error in payments.failureReason
    ↓
3. Send notification to user
    ↓
4. Allow retry with same/different payment method
    ↓
5. Auto-cancel after 24 hours if not paid
```

## 🔄 Data Flow Diagrams

### Order Lifecycle

```
PAYMENT_PENDING
    ↓ (payment confirmed)
CONFIRMED
    ↓ (vendor accepts)
PROCESSING
    ↓ (items packed)
PACKED
    ↓ (shipped)
SHIPPED
    ↓ (out for delivery)
OUT_FOR_DELIVERY
    ↓ (delivered)
DELIVERED

Alternative flows:
CONFIRMED → CANCELLED (before shipping)
DELIVERED → RETURN_REQUESTED → RETURN_APPROVED → RETURNED → REFUNDED
```

## 📈 Scalability Considerations

### Horizontal Scaling

**Current (Monolith):**
```
Load Balancer
    ↓
[Next.js Instance 1] [Next.js Instance 2] [Next.js Instance 3]
    ↓
Database (PostgreSQL)
```

**Future (Microservices):**
```
API Gateway
    ├─→ Auth Service
    ├─→ Product Service
    ├─→ Order Service
    ├─→ Payment Service
    ├─→ Notification Service
    └─→ Analytics Service
```

### Database Sharding Strategy (Future)

- **Shard by:** vendor_id (vendor-specific data)
- **Global tables:** users, system_configs
- **Read replicas:** Analytics queries

## 🔧 Deployment Architecture

```
┌─────────────────────────────────────────┐
│  GitHub Repository                      │
└────────────┬────────────────────────────┘
             │ (push to main)
             ↓
┌─────────────────────────────────────────┐
│  GitHub Actions CI/CD                   │
│  1. Run tests                           │
│  2. Type check                          │
│  3. Build                               │
│  4. Deploy to Vercel                    │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Vercel Edge Network                    │
│  • Automatic HTTPS                      │
│  • Global CDN                           │
│  • Serverless Functions                 │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Production Database (Supabase)         │
│  • Automatic backups                    │
│  • Point-in-time recovery               │
│  • Connection pooling                   │
└─────────────────────────────────────────┘
```

## 🎯 Summary

OneMartGo's architecture is built on these core principles:

1. **Flexibility:** Change providers without code
2. **Security:** Multi-layer protection
3. **Performance:** Optimized at every layer
4. **Scalability:** Modular design for growth
5. **Maintainability:** Clean separation of concerns
6. **Reliability:** Error handling and monitoring
7. **Transparency:** Complete audit trails

The platform is production-ready, launch-grade, and built to scale from day one.
