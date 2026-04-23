# 🧾 QuickBill POS — Backend API

A **REST API** for the QuickBill Restaurant Point-of-Sale system. Built with **Node.js**, **Express**, and **MongoDB (Atlas)**.

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # JWT protect + role authorize
├── models/
│   ├── user.js            # User schema (admin / staff)
│   ├── menuItem.js        # Menu item schema (with variants)
│   ├── order.js           # Order schema
│   ├── profile.js         # Restaurant profile schema
│   └── log.js             # Client-side log schema
├── routes/
│   ├── auth.js            # POST /api/auth/login
│   ├── menu.js            # CRUD for menu items
│   ├── orders.js          # CRUD for orders
│   ├── profile.js         # Restaurant profile
│   ├── logs.js            # Log ingestion
│   └── admin.js           # Admin-only routes
├── .env                   # Environment variables (DO NOT commit)
├── server.js              # Entry point
└── package.json
```

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- A MongoDB Atlas cluster (or local MongoDB)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory (already exists — do **not** commit it):

```env
# MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority

# Server port
PORT=5000

# JWT settings — CHANGE these in production!
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Default admin credentials (used only once on first startup)
ADMIN_USERNAME=bunty
ADMIN_PASSWORD=buntyP@ss1234
```

> **⚠️ Security:** Always use a long, random `JWT_SECRET` in production. Never use a simple word.

### 3. Run the Server

```bash
# Development (with hot-reload via nodemon)
npm run dev

# Production
npm start
```

The server starts at: **`http://localhost:5000`**

On the very first start, if no admin user exists in the database, one is automatically created using `ADMIN_USERNAME` and `ADMIN_PASSWORD` from your `.env`.

---

## 🔐 Authentication

This API uses **JWT (JSON Web Tokens)** for authentication.

1. Call `POST /api/auth/login` with your credentials.
2. You'll receive a `token` in the response.
3. For all protected routes, send the token in the `Authorization` header:

```
Authorization: Bearer <your_token_here>
```

### Roles

| Role    | Description                                     |
|---------|-------------------------------------------------|
| `admin` | Full access — users, orders, menu, logs, stats  |
| `staff` | Can manage their own menu, orders, and profile  |

---

## 📡 API Reference

> **Base URL:** `http://localhost:5000/api`
> All request/response bodies are `application/json`.

---

### 🔑 Auth

#### `POST /api/auth/login`
Login and receive a JWT token.

**Auth required:** ❌ No

**Request Body:**
```json
{
  "username": "bunty",
  "password": "buntyP@ss1234"
}
```

**Success Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "bunty",
    "role": "admin",
    "createdAt": "2026-04-23T15:35:44.000Z",
    "id": "6628b..."
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Please provide a username and password |
| `401` | Invalid credentials |

---

### 🍽️ Menu

All routes require authentication. `admin` and `staff` can both manage their **own** menu items.

#### `GET /api/menu`
Get paginated menu items for the logged-in user.

**Auth required:** ✅ Yes (any role)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `12` | Items per page |
| `search` | string | `''` | Filter by name (case-insensitive) |
| `sortBy` | string | `createdAt` | Sort field (`createdAt`, `name`, `price`) |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Example:** `GET /api/menu?page=1&limit=12&search=paneer&sortBy=name&sortOrder=asc`

**Success Response `200 OK`:**
```json
{
  "data": [
    {
      "name": "Paneer Tikka",
      "variants": [
        { "name": "Half", "price": 180 },
        { "name": "Full", "price": 320 }
      ],
      "imageUrl": "https://example.com/paneer.jpg",
      "userId": "6628b...",
      "createdAt": "2026-04-23T15:35:44.000Z",
      "updatedAt": "2026-04-23T15:35:44.000Z",
      "id": "6628c..."
    }
  ],
  "page": 1,
  "totalPages": 3,
  "total": 30
}
```

---

#### `POST /api/menu`
Add a new menu item.

**Auth required:** ✅ Yes (admin or staff)

**Request Body:**
```json
{
  "name": "Paneer Tikka",
  "imageUrl": "https://example.com/paneer.jpg",
  "variants": [
    { "name": "Half", "price": 180 },
    { "name": "Full", "price": 320 }
  ]
}
```

**Success Response `201 Created`:** Returns the created menu item object.

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Name, imageUrl, and at least one variant are required |
| `400` | Variant name is required / Variant price is required |

---

#### `PUT /api/menu/:id`
Update a menu item (only items belonging to the logged-in user).

**Auth required:** ✅ Yes (admin or staff)

**URL Params:** `:id` — Menu item MongoDB ObjectId

**Request Body** (all fields optional):
```json
{
  "name": "Paneer Tikka Special",
  "variants": [
    { "name": "Half", "price": 200 },
    { "name": "Full", "price": 360 }
  ]
}
```

**Success Response `200 OK`:** Returns the updated menu item.

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | At least one price variant is required |
| `404` | Menu item not found or you do not have permission |

---

#### `DELETE /api/menu/:id`
Delete a single menu item.

**Auth required:** ✅ Yes (admin or staff)

**Success Response `204 No Content`**

---

#### `POST /api/menu/delete-many`
Delete multiple menu items at once.

**Auth required:** ✅ Yes (admin or staff)

**Request Body:**
```json
{
  "ids": ["6628c...", "6628d...", "6628e..."]
}
```

**Success Response `204 No Content`**

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Item IDs are required |

---

### 📦 Orders

#### `GET /api/orders`
Get paginated orders for the logged-in user.

**Auth required:** ✅ Yes (any role)

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: `1`) |
| `limit` | number | Items per page (default: `20`). Use `0` to get **all** orders (for CSV export) |
| `search` | string | Search by customer name |
| `sortBy` | string | Sort field (default: `date`) |
| `sortOrder` | string | `asc` or `desc` (default: `desc`) |
| `paymentFilter` | string | Filter by payment: `cash`, `upi`, `card`, or `all` |
| `filterType` | string | Date filter: `today`, `single`, or `range` |
| `singleDate` | string | ISO date, used when `filterType=single` (e.g. `2026-04-23`) |
| `dateStart` | string | Start date, used when `filterType=range` |
| `dateEnd` | string | End date, used when `filterType=range` |

**Success Response `200 OK`:**
```json
{
  "data": [ /* array of order objects */ ],
  "page": 1,
  "totalPages": 5,
  "total": 94
}
```

---

#### `GET /api/orders/count`
Get the total order count for the logged-in user.

**Auth required:** ✅ Yes (any role)

**Success Response `200 OK`:**
```json
{ "count": 94 }
```

---

#### `POST /api/orders`
Create a new order.

**Auth required:** ✅ Yes (any role)

**Request Body:**
```json
{
  "customer": {
    "name": "Rahul Sharma",
    "mobile": "9876543210"
  },
  "items": [
    {
      "item": {
        "id": "6628c...",
        "name": "Paneer Tikka",
        "imageUrl": "https://example.com/paneer.jpg"
      },
      "quantity": 2,
      "selectedVariant": {
        "name": "Full",
        "price": 320
      }
    }
  ],
  "subtotal": 640,
  "tax": 115.20,
  "total": 755.20,
  "currency": {
    "code": "INR",
    "symbol": "₹",
    "rate": 1
  },
  "paymentMethod": "upi"
}
```

> `paymentMethod` must be one of: `cash`, `upi`, `card`

**Success Response `201 Created`:** Returns the created order object.

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Order must contain at least one item |
| `400` | subtotal, tax, and total are required |
| `400` | paymentMethod is required |
| `400` | currency (code, symbol, rate) is required |

---

### 👤 Profile

#### `GET /api/profile`
Get the restaurant profile for the logged-in user. Auto-creates one with defaults if it doesn't exist yet.

**Auth required:** ✅ Yes (any role)

**Success Response `200 OK`:**
```json
{
  "restaurantName": "QuickBill Restaurant",
  "address": "123 Foodie Lane, Gourmet City",
  "phone": "N/A",
  "logoUrl": "",
  "taxRate": 0.18,
  "userId": "6628b...",
  "id": "6628f..."
}
```

---

#### `PUT /api/profile`
Update the restaurant profile.

**Auth required:** ✅ Yes (admin or staff)

**Request Body** (all fields optional — send only what you want to update):
```json
{
  "restaurantName": "Spice Garden",
  "address": "42 MG Road, Bengaluru",
  "phone": "080-12345678",
  "logoUrl": "https://example.com/logo.png",
  "taxRate": 0.12
}
```

> `taxRate` must be between `0` and `1` (e.g., `0.18` = 18%)

**Success Response `200 OK`:** Returns the updated profile.

---

### 📝 Logs

#### `POST /api/logs`
Save a client-side log entry to the database.

**Auth required:** ✅ Yes (any role)

**Request Body:**
```json
{
  "level": "info",
  "message": "User opened billing screen",
  "meta": {
    "browser": "Chrome",
    "screen": "billing"
  }
}
```

> `level` must be one of: `info`, `warn`, `error`

**Success Response `201 Created`:**
```json
{ "success": true }
```

---

### 🛡️ Admin

> All admin routes require the logged-in user to have `role: "admin"`.

#### `GET /api/admin/stats`
Get dashboard statistics.

**Success Response `200 OK`:**
```json
{
  "userCount": 3,
  "orderCount": 94,
  "menuCount": 24,
  "totalRevenue": 187450.50,
  "recentOrders": [ /* last 5 orders with username populated */ ]
}
```

---

#### `GET /api/admin/users`
Get all users (passwords excluded).

---

#### `POST /api/admin/users`
Create a new **staff** user.

**Request Body:**
```json
{
  "username": "staff_member1",
  "password": "securepass123"
}
```

**Success Response `201 Created`:** Returns the new user (without password).

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Username and password are required |
| `400` | User already exists |

---

#### `PUT /api/admin/users/:id/reset-password`
Reset a staff user's password. Cannot reset an admin's password.

**Request Body:**
```json
{
  "password": "newSecurePassword456"
}
```

**Success Response `200 OK`:**
```json
{ "message": "Password for staff_member1 has been reset." }
```

---

#### `GET /api/admin/orders`
Get all orders from all users.

**Query Parameters:**
| Param | Description |
|-------|-------------|
| `userId` | (optional) Filter orders by a specific user ID |

---

#### `GET /api/admin/menu`
Get all menu items from all users (with username populated).

---

#### `POST /api/admin/menu`
Add a menu item for a specific user.

**Request Body:**
```json
{
  "name": "Dal Makhani",
  "price": 250,
  "imageUrl": "https://example.com/dal.jpg",
  "userId": "6628b..."
}
```

> Note: `price` here creates a default variant automatically.

---

#### `GET /api/admin/logs`
Get the latest 200 log entries (most recent first).

**Query Parameters:**
| Param | Description |
|-------|-------------|
| `userId` | (optional) Filter logs by a specific user ID |

---

## ⚠️ Common Error Response Format

All errors are returned as JSON:

```json
{
  "message": "Description of what went wrong"
}
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad Request — missing or invalid fields |
| `401` | Unauthorized — missing, invalid, or expired token |
| `403` | Forbidden — authenticated but insufficient role |
| `404` | Not Found — resource or route doesn't exist |
| `500` | Internal Server Error |

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.19 | Web framework |
| `mongoose` | ^8.4 | MongoDB ODM |
| `dotenv` | ^16.4 | Environment variables |
| `jsonwebtoken` | ^9.0 | JWT auth |
| `bcryptjs` | ^2.4 | Password hashing |
| `cors` | ^2.8 | Cross-Origin Resource Sharing |
| `nodemon` | ^3.1 | Dev auto-restart (devDependency) |

---

## 🌐 CORS

The server allows requests from:
- `http://localhost:5173` (local frontend dev)
- `https://quickbill-restaurant-pos.vercel.app` (production frontend)

To add more origins, update the `cors` config in `server.js`.

---

## 🔒 Security Notes

1. **Never commit `.env`** — add it to `.gitignore`
2. **Change `JWT_SECRET`** to a long random string before deploying
3. **Change default admin credentials** in production
4. Passwords are hashed with **bcrypt** (salt rounds: 10) and never returned in responses
5. All protected routes validate the JWT on every request

---

## 🧪 Quick Test (curl)

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bunty","password":"buntyP@ss1234"}'

# Get profile (replace <token> with token from above)
curl http://localhost:5000/api/profile \
  -H "Authorization: Bearer <token>"
```
