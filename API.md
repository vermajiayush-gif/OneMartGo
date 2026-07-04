# OneMartGo - API Documentation

## 📡 API Overview

**Base URL:** `/api/v1`  
**Authentication:** Bearer Token (JWT)  
**Content-Type:** `application/json`  
**Response Format:** JSON  

---

## 🔐 Authentication APIs

### Send OTP

Send OTP to phone or email for login/registration.

**Endpoint:** `POST /api/v1/auth/send-otp`  
**Auth Required:** No  

**Request:**
```json
{
  "identifier": "+919876543210",
  "type": "phone",
  "purpose": "login"
}
```

**Parameters:**
- `identifier` (string, required) - Phone number or email
- `type` (enum, required) - "phone" or "email"
- `purpose` (enum, required) - "login" | "register" | "verify"

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresAt": "2024-01-01T12:35:00.000Z"
}
```

---

### Verify OTP

Verify OTP and get access token.

**Endpoint:** `POST /api/v1/auth/verify-otp`  
**Auth Required:** No  

**Request:**
```json
{
  "identifier": "+919876543210",
  "otp": "123456",
  "purpose": "login"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": null,
    "phone": "+919876543210",
    "role": "CUSTOMER",
    "displayName": null,
    "avatarUrl": null
  }
}
```

---

### Get Current User

Get authenticated user's information.

**Endpoint:** `GET /api/v1/auth/me`  
**Auth Required:** Yes  

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "phone": "+919876543210",
    "role": "CUSTOMER",
    "displayName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "avatarUrl": "https://...",
    "loyaltyCoins": 500,
    "walletBalance": "1500.00",
    "referralCode": "ABC123XYZ"
  }
}
```

---

## 🛍️ Product APIs

### Get Products

Get paginated list of products with filters.

**Endpoint:** `GET /api/v1/products`  
**Auth Required:** No  

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `categoryId` (uuid, optional)
- `search` (string, optional)
- `minPrice` (number, optional)
- `maxPrice` (number, optional)
- `sortBy` (string, default: "createdAt")
- `sortOrder` (enum, default: "desc") - "asc" | "desc"

**Example:**
```
GET /api/v1/products?page=1&limit=20&search=shirt&minPrice=500&maxPrice=2000
```

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Cotton Shirt",
      "slug": "cotton-shirt",
      "description": "Comfortable cotton shirt",
      "basePrice": "999.00",
      "sellingPrice": "799.00",
      "averageRating": "4.5",
      "reviewCount": 128,
      "isFeatured": true,
      "isTrending": false
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 150
}
```

---

### Get Product by Slug

Get detailed product information.

**Endpoint:** `GET /api/v1/products/{slug}`  
**Auth Required:** No  

**Response:**
```json
{
  "product": {
    "id": "uuid",
    "name": "Product Name",
    "slug": "product-name",
    "shortDescription": "Short desc",
    "description": "Full description",
    "basePrice": "999.00",
    "sellingPrice": "799.00",
    "taxRate": "18.00",
    "status": "ACTIVE",
    "isResellingAllowed": true,
    "minResellerMargin": "5.00",
    "maxResellerMargin": "20.00",
    "averageRating": "4.5",
    "reviewCount": 128,
    "variants": [...],
    "media": [...],
    "attributes": [...],
    "tags": [...]
  }
}
```

---

## 📂 Category APIs

### Get Categories

Get hierarchical category tree.

**Endpoint:** `GET /api/v1/categories`  
**Auth Required:** No  

**Response:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic items",
      "imageUrl": "https://...",
      "isActive": true,
      "isFeatured": true,
      "children": [
        {
          "id": "uuid",
          "name": "Smartphones",
          "slug": "smartphones",
          ...
        }
      ]
    }
  ]
}
```

---

## 🛒 Cart APIs

### Get Cart

Get current user's cart.

**Endpoint:** `GET /api/v1/cart`  
**Auth Required:** Yes  

**Response:**
```json
{
  "cart": {
    "id": "uuid",
    "subtotal": "1500.00",
    "discount": "100.00",
    "tax": "270.00",
    "shipping": "50.00",
    "total": "1720.00",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "productName": "Product Name",
        "quantity": 2,
        "price": "750.00",
        "total": 1500.00
      }
    ]
  }
}
```

---

### Add to Cart

Add item to cart.

**Endpoint:** `POST /api/v1/cart`  
**Auth Required:** Yes  

**Request:**
```json
{
  "productId": "uuid",
  "variantId": "uuid",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added to cart"
}
```

---

## 📦 Order APIs

### Create Order

Create new order from cart.

**Endpoint:** `POST /api/v1/orders/create`  
**Auth Required:** Yes  

**Request:**
```json
{
  "addressId": "uuid",
  "paymentMethod": "UPI"
}
```

**Parameters:**
- `addressId` (uuid, required) - Shipping address
- `paymentMethod` (enum, required) - "UPI" | "CARD" | "NETBANKING" | "WALLET" | "COD" | "EMI"

**Response (COD):**
```json
{
  "success": true,
  "orderId": "uuid",
  "orderNumber": "OMG-2024-ABC123XYZ",
  "paymentRequired": false
}
```

**Response (Online Payment):**
```json
{
  "success": true,
  "orderId": "uuid",
  "orderNumber": "OMG-2024-ABC123XYZ",
  "paymentRequired": true,
  "paymentOrder": {
    "gatewayOrderId": "order_xyz123",
    "amount": 1720.00,
    "currency": "INR"
  }
}
```

---

### Get Orders

Get user's order history.

**Endpoint:** `GET /api/v1/orders`  
**Auth Required:** Yes  

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (enum, optional)

**Response:**
```json
{
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "OMG-2024-ABC123XYZ",
      "status": "DELIVERED",
      "totalAmount": "1720.00",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "items": [...]
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 25
}
```

---

## 🔗 Reseller APIs

### Create Reseller Link

Generate product link with custom margin.

**Endpoint:** `POST /api/v1/reseller/links/create`  
**Auth Required:** Yes (Reseller)  

**Request:**
```json
{
  "productId": "uuid",
  "marginType": "PERCENTAGE",
  "marginValue": 15
}
```

**Parameters:**
- `productId` (uuid, required)
- `marginType` (enum, required) - "PERCENTAGE" | "FLAT"
- `marginValue` (number, required) - Must be within product's min/max margin

**Response:**
```json
{
  "success": true,
  "link": {
    "id": "uuid",
    "shortCode": "abc123xyz",
    "fullUrl": "https://onemartgo.com/r/abc123xyz",
    "basePrice": 1000.00,
    "sellingPrice": 1150.00,
    "margin": 15,
    "marginType": "PERCENTAGE"
  }
}
```

---

### Get Reseller Dashboard

Get reseller analytics and earnings.

**Endpoint:** `GET /api/v1/reseller/dashboard`  
**Auth Required:** Yes (Reseller)  

**Response:**
```json
{
  "stats": {
    "totalEarnings": "50000.00",
    "pendingEarnings": "5000.00",
    "availableToWithdraw": "45000.00",
    "totalLinks": 150,
    "totalClicks": 5000,
    "totalOrders": 250,
    "conversionRate": "5.00"
  },
  "recentOrders": [...],
  "topLinks": [...]
}
```

---

## 👤 Admin APIs

### Get Settings

Get current provider configurations (masked).

**Endpoint:** `GET /api/v1/admin/settings`  
**Auth Required:** Yes (Admin)  

**Response:**
```json
{
  "payment": {
    "provider": "CASHFREE",
    "credentials": {
      "clientId": "***masked***",
      "clientSecret": "***masked***"
    }
  },
  "storage": {
    "provider": "SUPABASE",
    "credentials": {
      "url": "***masked***",
      "bucket": "***masked***"
    }
  },
  "sms": {...},
  "email": {...}
}
```

---

### Update Settings

**⭐ THE MOST CRITICAL API - Runtime Provider Switching**

Update provider configuration without code changes.

**Endpoint:** `POST /api/v1/admin/settings`  
**Auth Required:** Yes (Admin)  

**Request (Payment Gateway):**
```json
{
  "category": "PAYMENT",
  "config": {
    "provider": "RAZORPAY",
    "credentials": {
      "keyId": "rzp_live_abc123",
      "keySecret": "secret_xyz789"
    }
  }
}
```

**Request (Storage Provider):**
```json
{
  "category": "STORAGE",
  "config": {
    "provider": "AWS_S3",
    "credentials": {
      "accessKey": "AKIAIOSFODNN7EXAMPLE",
      "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "bucket": "onemartgo-media",
      "region": "ap-south-1"
    }
  }
}
```

**Request (SMS Provider):**
```json
{
  "category": "SMS",
  "config": {
    "provider": "TWILIO",
    "credentials": {
      "accountSid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "authToken": "your_auth_token",
      "phoneNumber": "+15551234567"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "PAYMENT configuration updated successfully"
}
```

**What Happens:**
1. ✅ Credentials are AES-256 encrypted
2. ✅ Stored in `system_configs` table
3. ✅ Cache is cleared
4. ✅ New provider is active immediately
5. ✅ No code change required
6. ✅ No redeployment needed
7. ✅ Zero downtime

---

## 🔄 Webhook APIs

### Payment Webhook (Cashfree)

**Endpoint:** `POST /api/v1/payments/webhook/cashfree`  
**Auth Required:** No (Signature verified)  

**Headers:**
```
x-webhook-signature: signature_value
```

**Request:** (Sent by Cashfree)
```json
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "order_xyz",
      "order_status": "PAID"
    },
    "payment": {
      "payment_status": "SUCCESS",
      "payment_amount": 1720.00
    }
  }
}
```

**Process:**
1. Verify webhook signature
2. Validate payment
3. Update order status → CONFIRMED
4. Deduct inventory
5. Send notifications
6. Credit loyalty coins
7. Record reseller commission

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (no token or invalid) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 🔒 Authentication

### Getting Access Token

1. Send OTP: `POST /api/v1/auth/send-otp`
2. Verify OTP: `POST /api/v1/auth/verify-otp`
3. Receive `accessToken` and `refreshToken`
4. Use `accessToken` for API calls

### Using Access Token

Include in all authenticated requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiry

- **Access Token:** 15 minutes
- **Refresh Token:** 30 days
- **Admin Token:** 8 hours

### Refreshing Token

When access token expires:
```
POST /api/v1/auth/refresh
Authorization: Bearer {refreshToken}
```

---

## ⚡ Rate Limiting

- **Public APIs:** 100 requests/minute per IP
- **Authenticated APIs:** 100 requests/minute per user
- **Admin APIs:** 200 requests/minute
- **Webhooks:** No limit

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 🐛 Error Handling

All errors follow this format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "validation error details"
  }
}
```

**Example Errors:**

**Validation Error:**
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "phone": "Phone number is required"
  }
}
```

**Authentication Error:**
```json
{
  "error": "Unauthorized",
  "code": "INVALID_TOKEN"
}
```

**Not Found:**
```json
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

## 📖 SDK Examples

### JavaScript/TypeScript

```typescript
// Initialize client
const client = {
  baseURL: 'https://api.onemartgo.com/api/v1',
  token: null,
  
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });
    
    return response.json();
  },
};

// Login
const { accessToken } = await client.request('/auth/verify-otp', {
  method: 'POST',
  body: JSON.stringify({
    identifier: '+919876543210',
    otp: '123456',
    purpose: 'login',
  }),
});

client.token = accessToken;

// Get products
const products = await client.request('/products?page=1&limit=20');

// Add to cart
await client.request('/cart', {
  method: 'POST',
  body: JSON.stringify({
    productId: 'uuid',
    quantity: 1,
  }),
});
```

---

## 🧪 Testing

### Postman Collection

Import this collection for testing:

```json
{
  "info": {
    "name": "OneMartGo API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Send OTP",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/v1/auth/send-otp",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"identifier\": \"+919876543210\",\n  \"type\": \"phone\",\n  \"purpose\": \"login\"\n}"
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## 📞 Support

- **Documentation:** See README.md
- **Issues:** GitHub Issues
- **Email:** api@onemartgo.com

---

**OneMartGo API v1** - Built for scale, designed for simplicity.
