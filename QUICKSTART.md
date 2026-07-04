# OneMartGo - Quick Start Guide

Get OneMartGo running locally in **5 minutes**! 🚀

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 16+ installed and running
- Git installed
- Code editor (VS Code recommended)

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/your-org/onemartgo.git
cd onemartgo

# Install dependencies
npm install
```

## Step 2: Database Setup (1 minute)

```bash
# Create database
createdb onemartgo

# Or using psql
psql -c "CREATE DATABASE onemartgo;"

# Copy environment file
cp .env.example .env
```

Edit `.env`:
```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/onemartgo
```

## Step 3: Push Schema (1 minute)

```bash
# Push all 54 tables to database
npx drizzle-kit push
```

## Step 4: Run Development Server (30 seconds)

```bash
npm run dev
```

## Step 5: Access Application (30 seconds)

Open in browser:

- **Customer App:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin

---

## 🎉 You're Done!

The platform is now running locally with:

✅ 54 database tables created  
✅ Next.js development server running  
✅ Hot reload enabled  
✅ TypeScript compilation active  

---

## 🧪 Test the Platform

### 1. Test Authentication

```bash
# Send OTP to phone
curl -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+919876543210",
    "type": "phone",
    "purpose": "login"
  }'

# Check logs for OTP (in development, it's logged to console)
# Then verify OTP
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+919876543210",
    "otp": "123456",
    "purpose": "login"
  }'
```

### 2. Test Products API

```bash
# Get all products
curl http://localhost:3000/api/v1/products

# Get categories
curl http://localhost:3000/api/v1/categories
```

### 3. Test Provider Switching

1. Go to http://localhost:3000/admin
2. Navigate to Settings
3. Try changing payment gateway:
   - Select "Razorpay"
   - Enter dummy credentials
   - Click Save
   - ✅ Provider switched instantly!

---

## 📝 Create Sample Data

### Create Sample Admin User

```typescript
// Run in Node.js REPL or create a script
import { db } from './src/db';
import { users } from './src/db/schema';
import bcrypt from 'bcryptjs';

const hash = await bcrypt.hash('admin123', 12);

await db.insert(users).values({
  email: 'admin@onemartgo.com',
  passwordHash: hash,
  role: 'SUPER_ADMIN',
  isEmailVerified: true,
  displayName: 'Super Admin',
});
```

### Create Sample Category

```typescript
import { db } from './src/db';
import { categories } from './src/db/schema';

await db.insert(categories).values({
  name: 'Electronics',
  slug: 'electronics',
  description: 'Electronic items and gadgets',
  isActive: true,
  isFeatured: true,
  sortOrder: 1,
});
```

### Create Sample Product

```typescript
import { db } from './src/db';
import { products } from './src/db/schema';

// Assuming you have a vendor with ID: vendor-uuid
// and category with ID: category-uuid

await db.insert(products).values({
  vendorId: 'vendor-uuid',
  categoryId: 'category-uuid',
  name: 'Samsung Galaxy S24',
  slug: 'samsung-galaxy-s24',
  shortDescription: 'Latest flagship smartphone',
  description: 'Full product description here...',
  basePrice: '79999.00',
  sellingPrice: '74999.00',
  status: 'ACTIVE',
  isResellingAllowed: true,
  minResellerMargin: '5.00',
  maxResellerMargin: '20.00',
});
```

---

## 🔧 Development Tips

### Enable Debug Logging

```bash
# In .env
DEBUG=true
LOG_LEVEL=debug
```

### Database GUI

Use a database GUI to view tables:

```bash
# Install Drizzle Studio
npm install -g drizzle-kit

# Run studio
npx drizzle-kit studio
```

Or use:
- **pgAdmin**: https://www.pgadmin.org/
- **DBeaver**: https://dbeaver.io/
- **Postico** (Mac): https://eggerapps.at/postico/

### VS Code Extensions

Install these for best experience:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Extension Pack
- GitLens
- Error Lens

### TypeScript Type Checking

```bash
# Run type checker
npm run typecheck

# Watch mode
npx tsc --noEmit --watch
```

### Code Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

---

## 🎨 Customize the Platform

### Change Branding

Edit `src/app/page.tsx`:

```typescript
// Change platform name
const platformName = "OneMartGo";

// Change colors in tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#7C3AED', // Your brand color
      secondary: '#EC4899',
    }
  }
}
```

### Add New Provider

Example: Adding PayPal as payment provider

1. Edit `src/lib/payment.service.ts`:

```typescript
case 'PAYPAL':
  return this.createPayPalOrder(order, provider.credentials);
```

2. Implement PayPal-specific method:

```typescript
private static async createPayPalOrder(order, creds) {
  // PayPal API integration
}
```

3. Update Admin Panel dropdown:

```typescript
// src/app/admin/page.tsx
<option value="PAYPAL">PayPal</option>
```

4. That's it! No schema changes needed.

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
pg_isready

# Restart PostgreSQL
# macOS:
brew services restart postgresql

# Linux:
sudo systemctl restart postgresql

# Windows:
net start postgresql-x64-16
```

### Port Already in Use

```bash
# Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### TypeScript Errors

```bash
# Clean Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate types
npx next typegen
```

### Database Schema Mismatch

```bash
# Reset and re-push schema
dropdb onemartgo
createdb onemartgo
npx drizzle-kit push
```

---

## 📚 Next Steps

### Learn the Codebase

1. **Start with:** `src/db/schema.ts` - Understand the data model
2. **Then:** `src/lib/*.service.ts` - Service abstractions
3. **Then:** `src/app/api/v1/` - API routes
4. **Finally:** `src/app/` - Frontend pages

### Add Your First Feature

Example: Add "Recently Viewed" feature

1. Create table in `schema.ts`:
```typescript
export const recentlyViewed = pgTable('recently_viewed', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  productId: uuid('product_id').references(() => products.id),
  viewedAt: timestamp('viewed_at').defaultNow(),
});
```

2. Create API route:
```typescript
// src/app/api/v1/recently-viewed/route.ts
export async function GET(request) {
  // Implementation
}
```

3. Add to UI:
```typescript
// src/app/page.tsx
// Fetch and display recently viewed
```

### Deploy to Production

Follow `DEPLOYMENT.md` for complete production deployment guide.

Quick deploy to Vercel:

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 🎓 Learning Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Drizzle ORM:** https://orm.drizzle.team/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs

---

## 💬 Get Help

- **Documentation:** See `README.md`, `ARCHITECTURE.md`, `FEATURES.md`
- **Issues:** Check existing GitHub issues
- **Community:** Join Discord/Slack (if available)
- **Email:** support@onemartgo.com

---

## ✅ Checklist for Production

Before deploying to production:

- [ ] Change all default secrets in `.env`
- [ ] Set up production database (Supabase/AWS RDS)
- [ ] Configure real payment gateway credentials
- [ ] Set up SMS provider (MSG91/Twilio)
- [ ] Set up email provider (Resend/SendGrid)
- [ ] Configure storage (S3/Cloudinary)
- [ ] Enable 2FA for admin
- [ ] Set admin secret URL path
- [ ] Test all critical flows
- [ ] Set up monitoring (Sentry)
- [ ] Configure backups
- [ ] Review security settings
- [ ] Update Terms & Privacy pages
- [ ] Test payment webhooks
- [ ] Verify email/SMS delivery
- [ ] Load testing

---

**Happy Coding! 🚀**

If you get stuck, remember:
1. Check the logs
2. Read the error message
3. Search in documentation
4. Ask for help

OneMartGo is designed to be developer-friendly. You've got this! 💪
