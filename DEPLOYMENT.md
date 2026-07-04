# OneMartGo - Deployment & Operations Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database schema pushed (`npx drizzle-kit push`)
- [ ] All TypeScript errors resolved
- [ ] Production build successful (`npm run build`)
- [ ] Security audit passed (`npm audit`)
- [ ] Admin panel secret URL configured
- [ ] Super admin account created
- [ ] Payment gateway configured in admin panel
- [ ] SMS provider configured
- [ ] Email provider configured
- [ ] Storage provider configured

### Environment Variables

#### Required Variables

```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://onemartgo.com
NEXT_PUBLIC_APP_NAME=OneMartGo

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT Secrets (Use strong random values)
JWT_ACCESS_SECRET=<openssl rand -base64 64>
JWT_REFRESH_SECRET=<openssl rand -base64 64>
JWT_ADMIN_SECRET=<openssl rand -base64 64>

# Encryption (Use strong random value)
CONFIG_ENCRYPTION_KEY=<openssl rand -base64 32>
```

#### Generate Secrets

```bash
# Generate JWT secrets
openssl rand -base64 64

# Generate encryption key
openssl rand -base64 32

# Generate admin secret path
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

## 📦 Deployment Platforms

### Option 1: Vercel (Recommended)

#### Setup

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables
   - Redeploy

3. **Database Connection**
   - Use Supabase or Railway for PostgreSQL
   - Enable connection pooling for serverless

#### Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["bom1"]
}
```

### Option 2: Railway

1. **Create New Project**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Initialize
   railway init
   
   # Deploy
   railway up
   ```

2. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy DATABASE_URL to environment variables

3. **Configure Environment**
   - Add all required variables in Settings

### Option 3: Self-Hosted (Docker)

#### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/onemartgo
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=onemartgo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🗄️ Database Setup

### Supabase (Recommended)

1. **Create Project**
   - Go to https://supabase.com
   - Create new project
   - Copy connection string

2. **Apply Schema**
   ```bash
   # Update .env with Supabase URL
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
   
   # Push schema
   npx drizzle-kit push
   ```

3. **Enable Row Level Security (Optional)**
   - Supabase Dashboard → Database → RLS
   - Configure policies for sensitive tables

### AWS RDS

1. **Create PostgreSQL Instance**
   - Engine: PostgreSQL 16
   - Instance class: db.t3.medium (minimum)
   - Storage: 100GB SSD
   - Multi-AZ: Yes (for production)

2. **Configure Security Group**
   - Allow inbound on port 5432 from application servers
   - Restrict access to specific IPs

3. **Apply Schema**
   ```bash
   DATABASE_URL=postgresql://admin:password@instance.region.rds.amazonaws.com:5432/onemartgo
   npx drizzle-kit push
   ```

## 🔧 Initial Configuration

### 1. Create Super Admin

Run migration script:

```typescript
// scripts/create-admin.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const hash = await bcrypt.hash(password, 12);

await db.insert(users).values({
  email,
  passwordHash: hash,
  role: 'SUPER_ADMIN',
  isEmailVerified: true,
  displayName: 'Super Admin',
});
```

### 2. Configure Admin Panel

1. Access admin panel: `https://yourdomain.com/admin`
2. Login with super admin credentials
3. Go to Settings → Security
4. Change secret admin path (optional)
5. Enable 2FA
6. Add IP whitelist (optional)

### 3. Configure Providers

#### Payment Gateway

1. Settings → Payment
2. Select provider (Cashfree/Razorpay/Stripe)
3. Enter credentials:
   - Cashfree: Client ID, Client Secret
   - Razorpay: Key ID, Key Secret
   - Stripe: Secret Key
4. Select Environment (Sandbox/Production)
5. Click "Save"

#### Storage Provider

1. Settings → Storage
2. Select provider
3. Enter credentials
4. Test upload
5. Save

#### SMS Provider

1. Settings → SMS
2. Select provider
3. Enter credentials
4. Send test SMS
5. Save

#### Email Provider

1. Settings → Email
2. Select provider
3. Enter credentials
4. Send test email
5. Save

## 📊 Monitoring & Observability

### Sentry Setup

1. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure**
   ```javascript
   // sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

3. **Environment Variable**
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   ```

### Application Monitoring

#### Key Metrics to Track

1. **Performance**
   - API response times
   - Database query times
   - Page load times
   - Cache hit rates

2. **Business Metrics**
   - Orders per hour
   - Revenue per hour
   - Conversion rate
   - Cart abandonment rate

3. **Errors**
   - 5xx errors
   - Failed payments
   - Failed OTP deliveries
   - Webhook failures

### Logging Strategy

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString(),
    }));
  },
  
  error: (message: string, error: any, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      meta,
      timestamp: new Date().toISOString(),
    }));
  },
};
```

## 🔐 Security Hardening

### SSL/TLS

- ✅ Enforce HTTPS (automatic on Vercel)
- ✅ Use TLS 1.3
- ✅ Enable HSTS headers
- ✅ Configure CAA records

### Headers

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

### Rate Limiting

```typescript
// middleware.ts
import { ratelimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}
```

### Database Security

1. **Enable SSL for connections**
   ```
   DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
   ```

2. **Use connection pooling**
3. **Regular backups** (automated)
4. **Point-in-time recovery** enabled
5. **Encryption at rest** enabled

## 📈 Performance Optimization

### Database Optimization

1. **Indexes**
   - All foreign keys indexed
   - Frequently queried columns indexed
   - Composite indexes for complex queries

2. **Query Optimization**
   ```sql
   -- Use EXPLAIN to analyze queries
   EXPLAIN ANALYZE SELECT * FROM products WHERE status = 'ACTIVE';
   
   -- Add indexes based on results
   CREATE INDEX idx_products_status ON products(status);
   ```

3. **Connection Pooling**
   - Max connections: 20
   - Idle timeout: 30s
   - Connection lifetime: 30m

### Caching Strategy

1. **Config Cache** (in-memory, 5 min TTL)
2. **API Response Cache** (Redis, varies)
3. **Static Assets** (CDN, 1 year)
4. **Image Optimization** (Next.js automatic)

### CDN Configuration

- Use Vercel Edge Network (automatic)
- Or configure Cloudflare:
  - Cache static assets
  - Image optimization
  - DDoS protection
  - Web Application Firewall

## 🔄 Backup & Recovery

### Database Backups

#### Automated (Supabase)

- Daily automatic backups (7 days retention)
- Point-in-time recovery (last 7 days)

#### Manual Backup

```bash
# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240101.sql
```

### Disaster Recovery Plan

1. **Database Failure**
   - Restore from most recent backup
   - Point-in-time recovery if available
   - Estimated RTO: 15 minutes

2. **Application Failure**
   - Redeploy from Git
   - Estimated RTO: 5 minutes

3. **Provider Outage**
   - Switch provider via Admin Panel
   - No downtime (configuration change only)

## 🚨 Incident Response

### On-Call Checklist

1. **Payment Gateway Down**
   - Admin Panel → Settings → Payment
   - Switch to backup provider
   - Notify users if needed

2. **Database Slow**
   - Check connection pool
   - Analyze slow queries
   - Add missing indexes
   - Scale up if needed

3. **OTP Not Sending**
   - Check SMS provider status
   - Switch provider if needed
   - Verify credentials in admin panel

4. **High Error Rate**
   - Check Sentry for error details
   - Review recent deployments
   - Rollback if needed

## 📊 Operational Metrics

### Daily Checks

- [ ] System health (all services up)
- [ ] Error rate < 0.1%
- [ ] Payment success rate > 95%
- [ ] OTP delivery rate > 98%
- [ ] Average response time < 500ms

### Weekly Reviews

- [ ] Database performance
- [ ] Disk usage trends
- [ ] Security audit logs
- [ ] Failed payment investigations
- [ ] User feedback review

### Monthly Tasks

- [ ] Database optimization
- [ ] Security updates
- [ ] Cost optimization
- [ ] Feature usage analytics
- [ ] Provider cost comparison

## 🔧 Troubleshooting

### Common Issues

#### 1. Payment Webhook Failures

**Symptoms:** Orders stuck in PAYMENT_PENDING

**Solution:**
```bash
# Check webhook logs
# Verify webhook URL configured in payment gateway
# Ensure signature verification is correct
# Manually verify payment and update order
```

#### 2. OTP Not Received

**Symptoms:** Users can't login

**Solution:**
1. Check SMS provider status
2. Verify credentials in system_configs
3. Check rate limits
4. Switch to backup provider if needed

#### 3. Slow Database Queries

**Symptoms:** High response times

**Solution:**
```sql
-- Find slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Add missing indexes
```

## 📱 Mobile App Deployment (Future)

### React Native (Expo)

```bash
# Build for production
eas build --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android

# OTA Updates
eas update --branch production
```

## 🎯 Launch Checklist

### Pre-Launch

- [ ] All features tested
- [ ] Payment gateway in production mode
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Error tracking active
- [ ] Customer support ready
- [ ] Legal pages published (Terms, Privacy)
- [ ] Marketing website live
- [ ] Social media accounts created

### Launch Day

- [ ] Monitor error rates
- [ ] Watch payment success rates
- [ ] Track order creation
- [ ] Monitor server load
- [ ] Be ready to scale

### Post-Launch

- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Optimize based on real usage
- [ ] Plan next sprint

## 🎓 Training

### For Admins

1. Admin panel navigation
2. Provider switching
3. User management
4. Vendor approval process
5. Payout processing
6. Dispute resolution

### For Vendors

1. Product listing
2. Order management
3. Inventory updates
4. Analytics dashboard
5. Payout tracking

### For Resellers

1. Link generation
2. Margin setting
3. Link sharing
4. Earnings tracking
5. Withdrawal process

## 📞 Support

### Emergency Contacts

- **Database Issues:** DBA team
- **Payment Issues:** Payment gateway support
- **Infrastructure:** DevOps team
- **Security Issues:** Security team

### Documentation

- Technical Docs: `/docs`
- API Reference: `/api-docs`
- Admin Guide: `/admin-guide`
- User FAQs: `/help`

---

**OneMartGo** is now ready for production deployment! 🚀

For questions: devops@onemartgo.com
