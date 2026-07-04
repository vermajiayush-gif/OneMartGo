# OneMartGo - B2C + B2B2C Marketplace Platform

**Version:** 1.0  
**Budget:** ₹50 Lakh Production-Grade Platform  
**Market:** India (Hindi + English)  

## 🚀 Overview

OneMartGo is a comprehensive ecommerce platform combining the best features of **Myntra** (B2C shopping) and **Meesho** (B2B2C reselling). It's a production-ready, launch-grade marketplace built with Next.js 14, PostgreSQL, and advanced architecture patterns.

## ⚡ Unique Selling Point

### **Runtime-Configurable Providers**

The platform's most critical feature is the ability to **change payment gateways, storage providers, SMS, email, shipping partners, and search engines** directly from the Admin Panel UI **without touching any code or redeploying**.

All provider credentials are:
- ✅ AES-256 encrypted in the database
- ✅ Cached in-memory for performance (5-minute TTL)
- ✅ Instantly active upon saving
- ✅ Fully abstracted through service layers

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Framer Motion (animations)
- Zustand (state management)

**Backend:**
- Next.js API Routes
- Drizzle ORM
- PostgreSQL
- Modular Monolith Architecture

**Authentication:**
- Custom JWT (Access + Refresh + Admin tokens)
- Phone OTP via MSG91/Twilio/Fast2SMS
- Email OTP via Resend/SendGrid
- Google OAuth & Apple Sign In

**Services (All Switchable):**
- **Payment:** Cashfree / Razorpay / Stripe
- **Storage:** Supabase / AWS S3 / Cloudinary / Backblaze B2
- **SMS:** MSG91 / Twilio / Fast2SMS
- **Email:** Resend / SendGrid / SMTP
- **Shipping:** Shiprocket / Delhivery / BlueDart
- **Search:** Algolia / Elasticsearch

## 📊 Database Schema

**54 Tables** covering all aspects of the marketplace:

### Core Entities
- Users (with RBAC: SUPER_ADMIN, ADMIN, VENDOR, RESELLER, CUSTOMER)
- Vendors (onboarding, KYC, commission management)
- Resellers (link generation, margin engine, payouts)
- Products (variants, media, attributes, tags)
- Categories (hierarchical, with custom attributes)

### Commerce
- Carts & Wishlists
- Orders (full lifecycle tracking)
- Payments (multi-gateway support)
- Refunds & Payouts
- Coupons & Promotions
- Flash Sales
- Bundles

### Features
- Reviews & Ratings
- Disputes & Resolutions
- Notifications
- Loyalty Coins
- Wallet Transactions
- Shoppable Reels
- AI Size Recommender (Body Profiles)

### System
- **system_configs** - THE MOST CRITICAL TABLE
  - Stores all provider configurations
  - Encrypted credentials
  - Runtime-switchable settings
- Admin Config (secret URL, 2FA, IP whitelist)
- Admin Audit Logs
- Search History
- Analytics (Platform & Vendor)

## 🎯 Key Features

### 1. Customer App (Myntra-style)
- AI-powered personalized product feed
- Advanced search with Algolia
- Dynamic filters (price, category, brand, rating)
- Product detail pages with zoom gallery
- Size chart with AI recommendations
- Shopping cart with multi-vendor support
- Multiple payment methods (UPI, Cards, Wallets, EMI, COD)
- Order tracking with real-time updates
- Reviews & ratings
- Wishlist
- Loyalty coins system
- Refer & earn

### 2. Reseller Ecosystem (Meesho-style)
- One-click reseller activation
- **Margin Engine:**
  - Set custom margin (percentage or flat)
  - Preview selling price
  - Min/max limits enforced
- **Link Generation:**
  - Unique short links (e.g., onemartgo.com/r/abc123)
  - WhatsApp/Telegram/Instagram share buttons
  - QR code generation
  - Click tracking & analytics
- **White-Label Shipping:**
  - Orders ship directly to end customer
  - Reseller's name on shipping label
  - Original vendor details hidden
- **Dashboard:**
  - Earnings (total, pending, available)
  - Link performance analytics
  - Conversion tracking
  - Payout management (bank/UPI)

### 3. Vendor Dashboard
- Complete vendor onboarding with KYC
- Product catalog management
- Bulk product upload (CSV)
- Inventory management
- Order management
- Analytics & reporting
- Promotion creation
- Payout tracking

### 4. Super Admin Panel

**URL:** `/admin` (can be configured to any secret path)

**Key Sections:**

#### 📊 Analytics Dashboard
- GMV (Gross Merchandise Value)
- Revenue charts
- Order analytics
- User metrics
- Top products & vendors

#### ⚙️ Settings - RUNTIME PROVIDER SWITCHING

**Payment Gateway Tab:**
```typescript
Choose: Cashfree | Razorpay | Stripe
Enter credentials → Save → Active immediately
```

**Storage Provider Tab:**
```typescript
Choose: Supabase | AWS S3 | Cloudinary | Backblaze
Enter credentials → Save → New uploads use new provider
```

**SMS Provider Tab:**
```typescript
Choose: MSG91 | Twilio | Fast2SMS
Enter credentials → Test → Save → OTPs use new provider
```

**Email Provider Tab:**
```typescript
Choose: Resend | SendGrid | SMTP
Enter credentials → Test → Save → Emails use new provider
```

**All changes:**
- ✅ Encrypted before storage (AES-256)
- ✅ Cached for performance
- ✅ Zero downtime
- ✅ No code changes
- ✅ No redeployment

#### Other Admin Features
- User management (suspend, change roles)
- Vendor approval/rejection
- Product moderation
- Order oversight
- Payout processing
- Dispute resolution
- CMS (banners, pages)
- Coupon management
- Flash sale creation
- Audit logs (every admin action tracked)

## 🔐 Security

- **Passwords:** bcrypt (cost factor 12+)
- **API Keys:** AES-256 encryption in database
- **JWT Tokens:** HS256 with strong secrets
- **Admin Access:**
  - Secret URL (48-character random path)
  - Password protection
  - 2FA (TOTP)
  - IP whitelist
  - Brute force protection (5 attempts → 30 min lockout)
- **CORS:** Whitelist production domains only
- **Rate Limiting:** All public APIs
- **Input Validation:** Zod schemas on all endpoints
- **SQL Injection:** Prevented via Drizzle ORM
- **Sensitive Data:** Bank accounts encrypted at rest

## 📁 Project Structure

```
src/
├── app/
│   ├── (customer)/           # Customer-facing pages
│   ├── admin/                # Admin panel
│   ├── api/
│   │   └── v1/
│   │       ├── auth/         # Authentication APIs
│   │       ├── products/     # Product APIs
│   │       ├── cart/         # Cart APIs
│   │       ├── orders/       # Order APIs
│   │       ├── reseller/     # Reseller APIs
│   │       ├── vendor/       # Vendor APIs
│   │       └── admin/        # Admin APIs
│   └── r/[shortCode]/        # Reseller link redirect
├── db/
│   ├── index.ts              # Database connection
│   └── schema.ts             # All 54 tables
├── lib/
│   ├── crypto.ts             # AES encryption/decryption
│   ├── jwt.ts                # JWT generation/verification
│   ├── otp.ts                # OTP generation/verification
│   ├── config.service.ts     # Dynamic config management ⭐
│   ├── payment.service.ts    # Payment gateway abstraction
│   ├── sms.service.ts        # SMS provider abstraction
│   ├── email.service.ts      # Email provider abstraction
│   └── storage.service.ts    # Storage provider abstraction
└── middleware.ts             # Route protection (RBAC)
```

## 🚀 Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
JWT_ADMIN_SECRET=your-secret
CONFIG_ENCRYPTION_KEY=your-encryption-key

# Note: Payment, SMS, Email, Storage credentials
# are configured in Admin Panel, not here!
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Push Database Schema

```bash
npx drizzle-kit push
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Access Application

- **Customer App:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin

## 🔧 Admin Panel Configuration

### First Time Setup

1. Access `/admin`
2. Login with super admin credentials
3. Go to **Settings** tab
4. Configure each provider:

#### Payment Gateway Example (Cashfree)
```
Provider: Cashfree
Client ID: CF123456789
Client Secret: ••••••••••••
Environment: Production
```

**Save** → Gateway is now active. All future payments use Cashfree.

To switch to Razorpay later:
```
Provider: Razorpay
Key ID: rzp_live_123456
Key Secret: ••••••••••••
```

**Save** → Razorpay is now active immediately. No code change. No deployment.

## 🎨 UI/UX Design

### Customer App
- **Colors:** White + Vibrant Pink/Purple gradients
- **Style:** Premium, clean like Myntra
- **Mobile-first** responsive design
- Loading skeletons (not spinners)
- Smooth transitions with Framer Motion
- Bottom navigation (mobile)

### Admin Panel
- **Colors:** Dark theme (gray-950 background)
- **Accent:** Violet/Purple (#7C3AED)
- Collapsible sidebar
- Real-time badge counts
- Charts with Recharts
- Toast notifications

## 📱 Mobile App (Future)

React Native with Expo Router planned for:
- Customer shopping experience
- Vendor product management
- Reseller link sharing
- Push notifications

## 🔄 Order Flow

1. **Customer** adds products to cart
2. Proceeds to checkout
3. Selects address and payment method
4. System reads active payment gateway from `system_configs`
5. Creates payment order with active gateway
6. Customer completes payment
7. Webhook confirms payment
8. Order status → CONFIRMED
9. Inventory deducted
10. Vendor notified
11. Customer receives confirmation (SMS + Email)
12. Loyalty coins credited
13. If reseller order → Commission recorded

## 🔗 Reseller Link Flow

1. **Reseller** browses products
2. Clicks "Sell This Product"
3. Sets margin (e.g., ₹100 or 15%)
4. System generates: `onemartgo.com/r/abc123`
5. Reseller shares on WhatsApp/Telegram
6. **Customer** clicks link → Tracked
7. Sees product at (Base Price + Margin)
8. Adds to cart → Checkout
9. Order placed → Marked as reseller order
10. Package ships to **customer** with **reseller's label**
11. On delivery → Reseller commission released
12. After hold period → Available for withdrawal

## 💳 Payment Split Logic

```
Product Price:     ₹1,000
Platform Fee (10%):   ₹100
Reseller Margin:      ₹150

Customer Pays:     ₹1,150
Vendor Gets:         ₹750
Platform Gets:       ₹100
Reseller Gets:       ₹150
```

## 📊 Analytics

### Platform Analytics
- Daily GMV, Revenue, Orders
- New users, active vendors
- Top products, categories
- Payment method distribution
- Geographic insights

### Vendor Analytics
- Revenue trends
- Order volume
- Return rate
- Customer demographics
- Traffic sources

### Reseller Analytics
- Link performance
- Click-to-conversion rate
- Earnings trends
- Best performing products

## 🔍 Search & Discovery

- **Algolia-powered** instant search
- Typo-tolerant results
- Faceted filters (price, brand, rating, etc.)
- Search suggestions
- Voice search (mobile)
- Search history
- Recently viewed products

## 🎁 Loyalty & Rewards

- Earn coins on every purchase
- Redeem coins for discounts
- Bonus coins on milestones
- Referral rewards
- Expiry management

## 🛡️ Compliance

- **GST:** Automatic calculation and invoicing
- **PAN/AADHAAR:** Vendor KYC verification
- **GDPR:** Soft delete, data export
- **Payment Security:** PCI-DSS compliant gateways
- **Data Encryption:** At rest and in transit

## 📈 Scalability

- **Modular Monolith:** Easy to extract microservices
- **Database:** Indexed for performance
- **Caching:** In-memory config cache
- **CDN-ready:** Static assets
- **Horizontal Scaling:** Stateless API design

## 🚢 Deployment

### Recommended Stack

- **Web:** Vercel
- **Database:** Supabase / AWS RDS PostgreSQL
- **Cache:** Redis (Upstash)
- **Storage:** Configured in Admin Panel
- **Monitoring:** Sentry

### CI/CD

GitHub Actions workflow included for:
- Automated testing
- Type checking
- Build verification
- Deployment to Vercel

## 📚 API Documentation

All APIs follow RESTful conventions:

### Base URL
```
/api/v1/
```

### Authentication
```http
Authorization: Bearer {access_token}
```

### Example Endpoints

#### Products
```http
GET /api/v1/products?page=1&limit=20
GET /api/v1/products/{slug}
POST /api/v1/products (Vendor)
```

#### Cart
```http
GET /api/v1/cart
POST /api/v1/cart (Add item)
DELETE /api/v1/cart/{itemId}
```

#### Orders
```http
POST /api/v1/orders/create
GET /api/v1/orders
GET /api/v1/orders/{id}
```

#### Reseller
```http
POST /api/v1/reseller/links/create
GET /api/v1/reseller/dashboard
```

#### Admin
```http
GET /api/v1/admin/analytics
GET /api/v1/admin/settings
POST /api/v1/admin/settings (Update providers)
```

## 🎯 Roadmap

### Phase 1 (Current)
✅ Core marketplace features  
✅ Reseller ecosystem  
✅ Admin panel with dynamic config  
✅ Payment integration  
✅ Order management  

### Phase 2
- [ ] Mobile app (React Native)
- [ ] Shoppable reels (TikTok-style)
- [ ] AI size recommender
- [ ] Virtual try-on
- [ ] Voice search
- [ ] Multi-language support

### Phase 3
- [ ] B2B wholesale module
- [ ] Franchise management
- [ ] Subscription boxes
- [ ] Live shopping
- [ ] Social commerce integration

## 🤝 Contributing

This is a production-grade platform. For contributions:

1. Follow TypeScript strict mode
2. Write complete code (no TODOs)
3. Add tests for new features
4. Update documentation
5. Follow existing patterns

## 📄 License

Proprietary - OneMartGo Platform  
Budget: ₹50 Lakh  
Market: India  

## 🙏 Acknowledgments

Built with cutting-edge technologies and best practices from:
- Next.js team
- Drizzle ORM
- Tailwind CSS
- And the amazing open-source community

---

**OneMartGo** - Shop, Sell & Resell  
*India's Smartest B2C + B2B2C Marketplace*

For support: support@onemartgo.com  
For partnerships: partners@onemartgo.com
