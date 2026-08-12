# Fundsroom — Mini ERP & CRM Operations Portal

A full-stack ERP and CRM system for internal operations at a wholesale/distribution business, built to manage customers, inventory, and sales challans with strict role-based access control and transactional data integrity.

**GitHub Repository:** https://github.com/yashukd24/fundsroom-erp  
**Live Frontend:** https://fundsroom-erp-pi.vercel.app  
**Live Backend API:** https://fundsroom-erp-backend-01dc.onrender.com  
**Database:** Neon PostgreSQL  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Technology Stack](#3-technology-stack)
4. [Application Architecture](#4-application-architecture)
5. [Directory Structure](#5-directory-structure)
6. [Role & Permission Matrix](#6-role--permission-matrix)
7. [Data Model](#7-data-model)
8. [Sales Challan Transaction Safety](#8-sales-challan-transaction-safety)
9. [Sales Challan PDF & Print](#9-sales-challan-pdf--print)
10. [API Overview](#10-api-overview)
11. [Local Setup](#11-local-setup)
12. [Environment Variables](#12-environment-variables)
13. [Database Setup](#13-database-setup)
14. [Test Login Credentials](#14-test-login-credentials)
15. [Testing](#15-testing)
16. [Validation & Error Handling](#16-validation--error-handling)
17. [Security](#17-security)
18. [UI & Responsive Design](#18-ui--responsive-design)
19. [Deployment](#19-deployment)
20. [Known Limitations](#20-known-limitations)
21. [Case Study Compliance](#21-case-study-compliance)

---

## 1. Project Overview

Fundsroom Mini ERP & CRM Operations Portal is a full-stack internal business application for a wholesale/distribution company. It enables four distinct operational roles to manage day-to-day business functions through a single secured portal:

- **Customer Management (CRM):** Track leads, active customers, business information, GST numbers, and follow-up schedules.
- **Inventory Management:** Manage products with SKUs, current stock levels, minimum stock alerts, and location data.
- **Stock Movement History:** A complete audit log of every inventory IN/OUT movement with reasons, creators, and timestamps.
- **Sales Challan Management:** Generate multi-product sales challans, confirm orders with atomic stock deduction, download professional PDF documents, and track challan history.
- **Role-Based Access Control:** Every operation on every page is protected at both the frontend navigation level and the backend API level.
- **Operational Dashboard:** Role-aware summary metrics showing customers, products, challans, and low-stock alerts relevant to each user's role.

---

## 2. Features

### Authentication
- JWT-based login (24-hour token expiry)
- Passwords hashed with `bcryptjs`
- Token stored in `localStorage`, sent via `Authorization: Bearer` header
- Session persists across page refreshes
- Logout clears token and user data

### Role-Based Access Control (RBAC)
- Four user roles: **Admin**, **Sales**, **Warehouse**, **Accounts**
- Backend: `auth` middleware verifies JWT; `authorize(roles[])` checks role membership
- Frontend: `ProtectedRoute` redirects unauthenticated users to login; `RoleRoute` shows `Unauthorized` page for insufficient role
- Admin role bypasses all `RoleRoute` guards by design
- `401 Unauthorized` for missing/invalid token; `403 Forbidden` for insufficient role
- **Sales Product Read Access:** Sales users have read access (`GET /api/products` and `GET /api/products/:id`) to populate product options when creating/editing sales challans, while product write operations (`POST`, `PUT`, `DELETE`) remain strictly restricted to Admin and Warehouse.

### Role-Aware Navigation (Sidebar)
- Persistent sidebar shows only navigation items relevant to the authenticated user's role
- Role label displayed in menu header and profile footer
- Mobile-responsive: collapsible hamburger menu on small screens
- Profile dropdown shows name, email, role, and Logout button
- Active route highlighted automatically

### Dashboard
- `GET /api/dashboard/summary` returns role-filtered metrics
- **Admin / Sales:** customer count, challan count
- **Admin / Warehouse:** product count, low-stock count
- **Accounts:** challan count

### Customer CRM
- List all customers with search by name/mobile/email
- Pagination supported on the customer list endpoint
- Create customer with: name, mobile, email (optional), business name (optional), GST number (optional), type (Retail/Wholesale/Distributor), address (optional), status (Lead/Active/Inactive), follow-up date, notes
- Edit customer (inline modal)
- View customer detail page
- Add follow-up notes with date per customer
- View follow-up history per customer
- Zod validation for all create/update requests
- Full loading, empty, and error states

### Product & Inventory
- List all products with SKU, category, unit price, current stock, minimum stock alert, location
- Create and edit products (Admin / Warehouse only)
- Read product list and details (Admin, Warehouse, and Sales)
- Low-stock indicator when `currentStock <= minStockAlertQuantity`
- Stock movement history per product (or all products combined)

### Stock Movement History
- Full audit log: product, quantity changed, type (IN/OUT), reason, created-by user, timestamp
- Manual stock movements can be created (Admin / Warehouse only)
- Challan confirmation automatically records OUT movements

### Sales Challans
- Select a customer per challan
- Read and select products with individual quantities
- Automatic unique challan number generated on creation (`CHL-YYYYMMDD-XXXX`)
- **Draft:** editable by Sales/Admin, can be confirmed or cancelled
- **Confirmed:** stock deducted atomically, cannot be re-confirmed or edited
- **Cancelled:** final state; stock is not affected (stock is only deducted on confirmation)
- Atomic stock deduction via Prisma `$transaction`: all-or-nothing, with post-deduction negative stock fail-safe
- Insufficient stock blocks confirmation and rolls back entirely
- Duplicate confirmation protected (status checked inside transaction)
- `OUT` stock movement created per product on confirmation, referencing the challan number
- Product snapshot fields (`productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`) are captured at draft creation time — historical accuracy preserved even if the product catalog changes later
- Client-side PDF download and browser printing supported

---

## 3. Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| TypeScript | 6.0.3 | Type safety |
| Vite | 8.x | Build tool / dev server |
| React Router DOM | 7.x | Client-side routing |
| Axios | 1.x | HTTP client with JWT interceptor |
| Lucide React | 1.x | Icon library |
| jsPDF | 4.x | Client-side PDF generation |
| jspdf-autotable | 5.x | Product table rendering in PDF |
| Vanilla CSS | — | Styling (custom design system, no external CSS framework) |

> **Note:** This project does **not** use TailwindCSS or any external CSS utility framework. All styles are hand-written in `frontend/src/index.css` using CSS variables and a custom dark-mode design system.

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express.js | 5.x | REST API framework |
| TypeScript | 7.0.2 | Type safety |
| Prisma Client | 7.x | ORM / database access |
| PostgreSQL | — | Relational database (via Neon DB) |
| bcryptjs | 3.x | Password hashing |
| jsonwebtoken | 9.x | JWT signing and verification |
| Zod | 4.x | Request body validation |
| dotenv | — | Environment variable loading |
| cors | — | CORS handling |
| tsx | — | Development hot-reload |

---

## 4. Application Architecture

```
React + TypeScript + Vite
        ↓
      Vercel
        ↓ REST API / JWT
Node.js + Express + TypeScript
        ↓ Prisma
  Neon PostgreSQL
```

### Flow & Layer Breakdown

```
Browser (React SPA)
  │
  ├── React Router DOM
  │     ├── /login → Login page (public)
  │     └── /* → ProtectedRoute (checks localStorage token)
  │               └── RoleRoute (checks user.role from localStorage)
  │                     └── Layout (Sidebar + main content)
  │                           └── Page components
  │
  └── Axios (api.ts)
        │  Authorization: Bearer <JWT>
        │  Base URL: VITE_API_URL
        ▼
Express REST API (Node.js / TypeScript on Render)
  │
  ├── auth middleware  → verifies JWT → 401 if invalid
  ├── authorize([roles]) → checks role → 403 if unauthorized
  ├── Zod validation middleware → 400 if invalid body
  │
  ├── /api/auth        → login
  ├── /api/dashboard   → summary metrics
  ├── /api/customers   → CRM
  ├── /api/products    → inventory (READ: Admin/Warehouse/Sales, WRITE: Admin/Warehouse)
  ├── /api/stock       → stock movements (Admin/Warehouse)
  └── /api/challans    → sales challans (with $transaction on confirm)
        │
        ▼
Prisma Client
  │
  ▼
Neon PostgreSQL Database
```

---

## 5. Directory Structure

```
Fundsroom-ERP APP/
├── README.md
├── Fundsroom_API.postman_collection.json
├── .gitignore
│
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma.config.ts
│   ├── schema.sql
│   ├── test_phase4.js            # Integration test — atomic challan transactions
│   │
│   ├── prisma/
│   │   ├── schema.prisma         # Data models
│   │   └── seed.ts               # Seeds 4 test users
│   │
│   └── src/
│       ├── index.ts              # Express app entry point
│       ├── config/
│       │   └── db.ts             # Prisma client singleton
│       ├── middleware/
│       │   ├── authMiddleware.ts # JWT auth + role authorization
│       │   └── validateRequest.ts# Zod middleware
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── customerController.ts
│       │   ├── productController.ts
│       │   ├── stockController.ts
│       │   ├── challanController.ts
│       │   └── dashboardController.ts
│       ├── routes/
│       │   ├── authRoutes.ts
│       │   ├── customerRoutes.ts
│       │   ├── productRoutes.ts
│       │   ├── stockRoutes.ts
│       │   ├── challanRoutes.ts
│       │   └── dashboardRoutes.ts
│       └── validators/
│           ├── customerValidator.ts
│           ├── productValidator.ts
│           └── challanValidator.ts
│
└── frontend/
    ├── vercel.json               # Vercel SPA rewrite rule
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    │
    └── src/
        ├── App.tsx               # Routes, ProtectedRoute, RoleRoute
        ├── main.tsx
        ├── index.css             # Global design system (dark mode, CSS variables)
        ├── services/
        │   └── api.ts            # Axios instance with JWT interceptor
        ├── components/
        │   ├── Layout.tsx        # App shell: Sidebar + main content area
        │   └── Sidebar.tsx       # Role-aware navigation, profile, logout
        └── pages/
            ├── Auth/
            │   ├── Login.tsx
            │   └── Unauthorized.tsx
            ├── Dashboard/
            │   └── Dashboard.tsx
            ├── Customers/
            │   ├── CustomerList.tsx
            │   └── CustomerDetail.tsx
            ├── Inventory/
            │   ├── ProductList.tsx
            │   └── StockMovementHistory.tsx
            └── Sales/
                ├── ChallanList.tsx
                ├── ChallanForm.tsx
                └── ChallanDetail.tsx
```

---

## 6. Role & Permission Matrix

> Permissions are enforced at both the **frontend route guard** (`RoleRoute`) and **backend API middleware** (`authorize()`). Admin bypasses all frontend role guards and is included in all backend role arrays.

| Feature / Endpoint | Admin | Sales | Warehouse | Accounts |
|---|:---:|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| View Customers | ✅ | ✅ | ❌ | ✅ |
| Create / Edit Customer | ✅ | ✅ | ❌ | ❌ |
| Delete Customer | ✅ | ✅ | ❌ | ❌ |
| View Customer Follow-ups | ✅ | ✅ | ❌ | ✅ |
| Add Follow-up | ✅ | ✅ | ❌ | ❌ |
| View Products / Inventory (READ) | ✅ | ✅ | ✅ | ❌ |
| Create / Edit / Delete Product (WRITE) | ✅ | ❌ | ✅ | ❌ |
| View Product List Page in UI (`/products`) | ✅ | ❌ | ✅ | ❌ |
| View Stock Movement History | ✅ | ❌ | ✅ | ❌ |
| Create Manual Stock Movement | ✅ | ❌ | ✅ | ❌ |
| View Low Stock Alerts | ✅ | ❌ | ✅ | ❌ |
| View Sales Challans | ✅ | ✅ | ❌ | ✅ |
| Create / Edit Draft Challan | ✅ | ✅ | ❌ | ❌ |
| Confirm Challan (deduct stock) | ✅ | ✅ | ❌ | ❌ |
| Cancel Challan | ✅ | ✅ | ❌ | ❌ |
| Download Challan PDF | ✅ | ✅ | ❌ | ✅ |
| Print Challan | ✅ | ✅ | ❌ | ✅ |

---

## 7. Data Model

The following models are defined in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma):

```
User
  id, name, email, passwordHash, role (Admin/Sales/Warehouse/Accounts)
  → has many: FollowUp, StockMovement, SalesChallan

Customer
  id, name, mobile, email?, businessName?, gstNumber?
  type (Retail/Wholesale/Distributor), address?
  status (Lead/Active/Inactive), followUpDate?, notes?
  → has many: FollowUp, SalesChallan

FollowUp
  id, customerId → Customer, userId → User, notes, date

Product
  id, name, sku (unique), category?, unitPrice
  currentStock, minStockAlertQuantity, location?
  → has many: StockMovement, ChallanItem

StockMovement
  id, productId → Product, quantityChanged
  type (IN/OUT), reason?, createdBy → User, timestamp

SalesChallan
  id, challanNumber (unique), customerId → Customer
  totalQuantity, status (Draft/Confirmed/Cancelled)
  createdBy → User, createdDate
  → has many: ChallanItem (cascade delete)

ChallanItem
  id, challanId → SalesChallan, productId → Product
  productNameSnapshot, skuSnapshot, unitPriceSnapshot  ← historical snapshot
  quantity
```

### Product Snapshot Design

When a challan is created (in Draft status), the current product `name`, `sku`, and `unitPrice` are copied into `ChallanItem` as snapshot fields. This ensures that even if the product catalog changes after the challan is created, the challan document always reflects the exact prices and names at the time the order was placed — preserving historical accuracy for the PDF and records.

---

## 8. Sales Challan Transaction Safety

Challan confirmation is the most critical business operation in the system. It uses Prisma's `$transaction` API to guarantee all-or-nothing execution:

```
POST /api/challans/:id/confirm
  │
  └── prisma.$transaction(async tx => {
        1. Find challan — throw if not found
        2. Check status === 'Draft' — throw if already Confirmed/Cancelled
        3. Fetch all products referenced in challan items
        4. Validate sufficient stock for EVERY item before any changes
           → if ANY product has insufficient stock: throw (transaction aborts)
        5. For each item:
           a. Deduct stock (tx.product.update currentStock -= quantity)
           b. Post-deduction fail-safe: throw if currentStock < 0
           c. Create StockMovement record (type: OUT, reason: challan number)
        6. Update challan status to Confirmed
      })
```

**Guarantees enforced:**
- ✅ Insufficient stock rejects the entire confirmation — no partial deductions
- ✅ Negative stock is impossible (both pre-check and post-deduction fail-safe)
- ✅ Re-confirming an already-Confirmed challan is rejected inside the transaction
- ✅ Stock movements are recorded atomically with the stock deduction
- ✅ Cancellation of a Draft challan does not affect stock (stock was never deducted)
- ✅ Confirmed challans cannot be cancelled

---

## 9. Sales Challan PDF & Print

Each Challan Detail page includes **Download PDF** and **Print** buttons, available to all roles that can view challans (Admin, Sales, Accounts).

### Implementation

PDF generation is **client-side only**, using `jsPDF` and `jspdf-autotable`. The PDF is generated directly from the React component's in-memory state — no additional API calls are made.

### PDF Document Contents

| Section | Content |
|---|---|
| Header | FUNDSROOM branding, status badge (colour-coded) |
| Challan Metadata | Challan number, creation date, created-by user |
| Customer Information | Name, business name, mobile, email, GST number (if present), address (if present) |
| Product Table | #, Product Name, SKU, Quantity, Unit Price (INR), Total (INR) |
| Totals | Total Quantity, Total Amount |
| Footer | System-generated disclaimer, page number (e.g. Page 1 of 2) |

### Data Integrity

- Product name, SKU, and unit price shown in the PDF come from the **historical snapshot fields** stored in `ChallanItem`, not the live product catalog.
- An old challan PDF will always show the prices and names that were current when the challan was drafted.

### Read-Only Guarantee

> **Generating or downloading a PDF does not confirm a challan, deduct stock, modify challan status, or write to the database.**

This was verified by intercepting all network requests during PDF generation and confirming that zero `POST`, `PUT`, `PATCH`, or `DELETE` requests are made to the API.

---

## 10. API Overview

A complete Postman collection is included at the root of the repository:

**`Fundsroom_API.postman_collection.json`**

To use it: Open Postman → Import → select the file → all endpoints are pre-configured with example requests.

### Endpoint Summary

**Authentication**
```
POST   /api/auth/login                     → Returns JWT + user info
GET    /api/health                         → Health check
```

**Dashboard**
```
GET    /api/dashboard/summary              → Role-filtered metrics
```

**Customers** *(Auth required; read: Admin/Sales/Accounts; write: Admin/Sales)*
```
GET    /api/customers                      → List customers (with pagination: ?page=1&limit=20)
POST   /api/customers                      → Create customer
GET    /api/customers/:id                  → Get customer detail
PUT    /api/customers/:id                  → Update customer
DELETE /api/customers/:id                  → Delete customer
GET    /api/customers/:id/followups        → List follow-ups
POST   /api/customers/:id/followups        → Add follow-up note
```

**Products** *(Auth required)*
```
GET    /api/products                       → List all products (READ: Admin, Warehouse, Sales)
GET    /api/products/:id                   → Get product detail (READ: Admin, Warehouse, Sales)
POST   /api/products                       → Create product (WRITE: Admin, Warehouse)
PUT    /api/products/:id                   → Update product (WRITE: Admin, Warehouse)
DELETE /api/products/:id                   → Delete product (WRITE: Admin, Warehouse)
```

**Stock Movements** *(Auth required; Admin/Warehouse only)*
```
GET    /api/stock/movements                → Full stock movement history
POST   /api/stock/movements                → Create manual movement (IN/OUT)
GET    /api/stock/low-stock                → Products below minimum stock alert
```

**Sales Challans** *(Auth required; read: Admin/Sales/Accounts; write: Admin/Sales)*
```
GET    /api/challans                       → List all challans
POST   /api/challans                       → Create draft challan
GET    /api/challans/:id                   → Get challan detail (with items/customer/user)
PUT    /api/challans/:id                   → Update draft challan
POST   /api/challans/:id/confirm           → Confirm (atomic stock deduction)
POST   /api/challans/:id/cancel            → Cancel challan
```

---

## 11. Local Setup

### Prerequisites
- **Node.js** v18 or later
- **npm** v8 or later
- A **PostgreSQL** database (local or cloud, e.g. [Neon](https://neon.tech))

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/yashukd24/fundsroom-erp.git
cd fundsroom-erp
```

**2. Install backend dependencies**
```bash
cd backend
npm install
```

**3. Install frontend dependencies**
```bash
cd ../frontend
npm install
```

**4. Configure environment variables** — see [Section 12](#12-environment-variables)

**5. Set up the database** — see [Section 13](#13-database-setup)

**6. Start the backend** (from `backend/` directory)
```bash
npm run dev
```
API available at: `http://localhost:5000`

**7. Start the frontend** (from `frontend/` directory, in a separate terminal)
```bash
npm run dev
```
UI available at: `http://localhost:5173`

---

## 12. Environment Variables

### Backend — `backend/.env`

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
PORT=5000
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<database>?sslmode=require"
JWT_SECRET="<your-secure-random-secret>"
```

### Frontend — `frontend/.env`

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL="http://localhost:5000/api"
```

> **Security:** Both `.env` files are listed in `.gitignore` and are never committed to the repository.

---

## 13. Database Setup

This project uses **Prisma** with **PostgreSQL**.

**Push the schema to your database:**
```bash
cd backend
npx prisma db push
```

**Seed the database with the 4 test user accounts:**
```bash
npx prisma db seed
```

---

## 14. Test Login Credentials

The following accounts are created automatically by the database seeder:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@fundsroom.com` | `password123` |
| **Sales** | `sales@fundsroom.com` | `password123` |
| **Warehouse** | `warehouse@fundsroom.com` | `password123` |
| **Accounts** | `accounts@fundsroom.com` | `password123` |

---

## 15. Testing

### Verified Automated Builds & Tests

- **Backend Production Build (`npm run build`):** Verified with zero TypeScript errors.
- **Frontend Production Build (`npm run build`):** Verified with zero errors (2069 modules transformed).
- **Phase 4 Regression Test (`node test_phase4.js`):** Verified with 100% success (`ALL PHASE 4 TESTS PASSED SUCCESSFULLY!`).
- **Atomic Stock Rollback:** Tested and confirmed — insufficient stock rejects confirmation and rolls back completely without partial deductions.
- **Role-Based Access Control:** Verified across all four roles:
  - **Sales Role:** Verified `GET /api/products` returns `200 OK` (enabling product dropdowns on Challan creation), while product write operations (`POST`, `PUT`, `DELETE`) return `403 Forbidden`.
  - **Warehouse Role:** Verified product management and stock movements return `200/201`, while CRM and Challans return `403 Forbidden`.
  - **Accounts Role:** Verified read-only access returns `200 OK`, while customer/challan write operations return `403 Forbidden`.
  - **Admin Role:** Verified full system access across all modules.

---

## 16. Validation & Error Handling

### Request Validation (Zod)

All `POST` and `PUT` endpoints use Zod schemas validated through the `validateRequest` middleware:

- Customer: name, mobile required; email, gstNumber, type, status, followUpDate validated
- Product: name, sku, unitPrice, currentStock, minStockAlertQuantity validated
- Challan: customerId (UUID), items array (min 1), each item has productId (UUID) and positive integer quantity
- Follow-up: notes (string), date (datetime) required

### HTTP Response Codes

| Code | Meaning | When |
|---|---|---|
| `200` | OK | Successful GET / update |
| `201` | Created | Successful POST (new resource) |
| `400` | Bad Request | Validation failure, invalid state (e.g. confirming a non-Draft) |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Valid token but insufficient role |
| `404` | Not Found | Resource does not exist |
| `500` | Server Error | Unexpected backend error |

---

## 17. Security

- **JWT Authentication:** All protected API routes verify `Authorization: Bearer <token>` on every request. Tokens expire after 24 hours.
- **Password Hashing:** All user passwords are hashed using `bcryptjs` (10 salt rounds).
- **Role-Based Authorization:** The `authorize(roles[])` middleware enforces role requirements at the backend route level.
- **Environment Variables:** All secrets (`DATABASE_URL`, `JWT_SECRET`) are stored in `.env` files excluded from version control via `.gitignore`.
- **Frontend Route Protection:** `ProtectedRoute` redirects to `/login` if no token is in `localStorage`. `RoleRoute` renders the `Unauthorized` page for insufficient role.

---

## 18. UI & Responsive Design

- **Design System:** Custom dark-mode design system built in `index.css` using CSS custom properties (no external CSS framework).
- **Layout:** Fixed sidebar + scrollable main content area via `Layout.tsx`.
- **Responsive:** Sidebar collapses to a hamburger menu on screens narrower than 768px.
- **Loading States:** Spinner/loading text shown during all API fetches.
- **Empty States:** Illustrated empty-state messages when lists have no data.
- **Error States:** Inline error banners for API failures and validation errors.
- **Unauthorized Page:** Dedicated `Unauthorized.tsx` page for 403 scenarios with a Back button.
- **Status Badges:** Colour-coded badges for challan status (Draft/Confirmed/Cancelled) and customer status (Lead/Active/Inactive).

---

## 19. Deployment

The application is deployed across production cloud platforms:

- **Frontend:** Deployed on **Vercel**  
  URL: https://fundsroom-erp-pi.vercel.app
- **Backend API:** Deployed on **Render**  
  URL: https://fundsroom-erp-backend-01dc.onrender.com
- **Database:** Deployed on **Neon PostgreSQL**

### Production Environment Variables

**Frontend (Vercel):**
```env
VITE_API_URL=https://fundsroom-erp-backend-01dc.onrender.com/api
```

**Backend (Render):**
```env
DATABASE_URL=postgresql://<username>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=<production-jwt-secret>
```

| Component | Platform | URL |
|---|---|---|
| **Frontend UI** | Vercel | https://fundsroom-erp-pi.vercel.app |
| **Backend REST API** | Render | https://fundsroom-erp-backend-01dc.onrender.com |
| **Database** | Neon | PostgreSQL |
| **GitHub Repository** | GitHub | https://github.com/yashukd24/fundsroom-erp |

---

## 20. Known Limitations

- **Product List Pagination:** The `GET /api/products` endpoint currently returns all products. For large catalogs, `page` and `limit` query parameters should be added (similar to the Customers endpoint which already supports pagination).
- **Challan List Pagination:** The `GET /api/challans` endpoint similarly returns all challans. Cursor-based or offset pagination should be added as the dataset grows.
- **No Profile Picture / Image Uploads:** Product images and user profile photos are not supported. AWS S3 or equivalent object storage integration would be required.
- **No Concurrency Locking:** The atomic transaction prevents negative stock but does not implement database row-level locking (`SELECT FOR UPDATE`). Under extremely high concurrent load, rare race conditions could theoretically occur.
- **JWT in localStorage:** Tokens are stored in `localStorage`, which is sufficient for internal tools. HttpOnly cookies would be recommended for public-facing production applications.

---

## 21. Case Study Compliance

This project was developed against the **Fundsroom Full Stack Developer Case Study** specification. All required business modules and technical capabilities are implemented, verified, and deployed:

| Requirement | Status | Implementation Details |
|---|:---:|---|
| JWT Authentication + Login | ✅ Pass | bcrypt, 24h expiry, 4 roles |
| Admin Role | ✅ Pass | Full access to all modules |
| Sales Role | ✅ Pass | Customers CRM + Sales Challans (read/write), Products (read-only) |
| Warehouse Role | ✅ Pass | Products + Stock movements management |
| Accounts Role | ✅ Pass | Customers + Challans (read-only) |
| Customer CRM (16 fields) | ✅ Pass | Lead/Active/Inactive, Retail/Wholesale/Distributor, GST, Follow-ups |
| Customer Search | ✅ Pass | Filter by name, mobile, email, business name |
| Customer Follow-up Schedule | ✅ Pass | Notes + follow-up date tracking |
| Product Management & SKU | ✅ Pass | Name, SKU, category, price, current stock, location |
| Minimum Stock Alerts | ✅ Pass | Low-stock count on dashboard + inventory indicator |
| Stock Movement Audit Log | ✅ Pass | IN/OUT movements with timestamp, user, and reason |
| Sales Challan Creation | ✅ Pass | Customer selection, multi-product picker, quantity specification |
| Challan Number Auto-Gen | ✅ Pass | Unique format `CHL-YYYYMMDD-XXXX` |
| Draft / Confirmed / Cancelled | ✅ Pass | Complete status workflow |
| Atomic Stock Deduction | ✅ Pass | Prisma `$transaction` ensures all-or-nothing execution |
| Negative Stock Prevention | ✅ Pass | Pre-check + fail-safe rollback |
| Insufficient Stock Rejection | ✅ Pass | Blocks confirmation if stock is inadequate |
| Product Snapshot in Challan | ✅ Pass | Captures name, SKU, and unit price snapshot at draft creation |
| Sales Challan PDF & Print | ✅ Pass | jsPDF + jspdf-autotable client-side export |
| Backend RBAC Enforcement | ✅ Pass | `auth` + `authorize()` middleware on all API routes |
| Frontend Role Guards | ✅ Pass | `ProtectedRoute` + `RoleRoute` + role-aware Sidebar |
| Zod Request Validation | ✅ Pass | Input validation on all write endpoints |
| Production Cloud Deployment | ✅ Pass | Vercel (Frontend) + Render (Backend) + Neon (PostgreSQL) |
| Customer List Pagination | ✅ Pass | Supported via `page` and `limit` query parameters |
| Product & Challan Pagination | ⚠️ Partial | Array response; pagination can be added as data scales |
