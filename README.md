# Fundsroom - Mini ERP & CRM Operations Portal

A full-stack ERP and CRM system for a wholesale/distribution company, built to manage customers, inventory, and sales challans with role-based access control.

## 1. Project Overview
This project is a minimal but complete ERP + CRM portal designed for internal company teams (Admin, Sales, Warehouse, Accounts). It supports a complete business flow: tracking leads/customers, managing product inventory (including IN/OUT stock logs), and generating sales challans that automatically deduct stock safely using database transactions.

## 2. Features/Modules
* **Authentication and Roles:** JWT-based login with RBAC (Admin, Sales, Warehouse, Accounts).
* **Customer CRM:** Manage leads, active customers, business info, and follow-up schedules.
* **Product and Inventory:** Track products, SKUs, min stock alerts, and a comprehensive stock movement history.
* **Sales Challan:** Generate multi-product sales orders (Draft/Confirmed/Cancelled) with atomic stock deduction and insufficient-stock protection.
* **Dashboard:** A unified operational overview showing key metrics and low-stock alerts.

## 3. Tech Stack
* **Frontend:** React, TypeScript, Vite, TailwindCSS (Lucide Icons)
* **Backend:** Node.js, Express.js, TypeScript
* **Database:** PostgreSQL (using Neon DB)
* **ORM:** Prisma Client

## 4. Architecture Explanation
The application follows a standard decoupled Client-Server architecture:
* **Client (Frontend):** A React SPA providing an admin-style interface. It uses React Router for navigation and custom Axios instances (with JWT interceptors) to communicate with the backend. Routes and UI elements are dynamically protected based on the authenticated user's role.
* **Server (Backend):** A RESTful API built with Express and TypeScript. It utilizes `express-validator` for request validation and a custom JWT middleware for authentication and authorization. 
* **Data Access (Prisma):** Prisma acts as the ORM, abstracting raw SQL queries. Critical operations, like confirming a Sales Challan, utilize Prisma's `$transaction` API to ensure ACID compliance (preventing race conditions and negative stock balances).

## 5. Directory Structure
```
/
├── backend/
│   ├── prisma/             # Prisma schema, migrations, and seed scripts
│   ├── src/
│   │   ├── controllers/    # API business logic
│   │   ├── middleware/     # Auth and validation guards
│   │   ├── routes/         # Express route definitions
│   │   └── config/         # Database and env configs
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI components (Navbar, Modals, RoleRoute)
    │   ├── pages/          # Full page views (Dashboard, Customers, Inventory, Challans)
    │   └── services/       # API client configuration
    ├── .env.example
    └── package.json
```

## 6. Local Setup Instructions
Prerequisites: Node.js (v18+) and npm.

1. Clone the repository.
2. Open two terminal instances: one for `/backend` and one for `/frontend`.
3. In both directories, run `npm install` to install dependencies.

## 7. Environment Variables
You must set up environment variables before running the application.

**Backend (`/backend/.env`):**
Copy `backend/.env.example` to `backend/.env` and update:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/fundsroom_db"
JWT_SECRET="your_jwt_secret_key_here"
```

**Frontend (`/frontend/.env`):**
Copy `frontend/.env.example` to `frontend/.env` and update:
```env
VITE_API_URL="http://localhost:5000/api"
```

## 8. Database Setup / Migrations
This project uses Prisma with PostgreSQL.
1. Ensure your `DATABASE_URL` in `backend/.env` points to a valid PostgreSQL instance.
2. In the `backend` directory, run:
   ```bash
   npx prisma db push
   ```
   *This pushes the schema to the database without needing a full migration history.*
3. Seed the database with the required roles, users, and dummy data:
   ```bash
   npx prisma db seed
   ```

## 9. How to run Backend
From the `/backend` directory:
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

## 10. How to run Frontend
From the `/frontend` directory:
```bash
npm run dev
```
The UI will be accessible at `http://localhost:5173`.

## 11. API Overview
A fully documented Postman Collection (`Fundsroom_API.postman_collection.json`) is included in the root directory. You can import it directly into Postman to test the APIs.

**Core Endpoints:**
* `POST /api/auth/login` - Authenticate and receive JWT.
* `GET /api/dashboard/summary` - Retrieve system metrics.
* `GET, POST, PUT /api/customers` - Manage customers.
* `POST /api/customers/:id/followups` - Add CRM follow-up notes.
* `GET, POST, PUT /api/products` - Manage inventory.
* `GET, POST /api/stock/movements` - View or manually adjust stock.
* `GET, POST, PUT /api/challans` - Manage sales orders.
* `POST /api/challans/:id/confirm` - Atomically confirm an order and deduct stock.

## 12. Test Login Credentials
The following accounts are created automatically via the database seeder:

| Role       | Email                      | Password    |
|------------|----------------------------|-------------|
| **Admin**  | `admin@fundsroom.com`      | password123 |
| **Sales**  | `sales@fundsroom.com`      | password123 |
| **Warehouse**| `warehouse@fundsroom.com`| password123 |
| **Accounts**| `accounts@fundsroom.com`  | password123 |

## 13. Role / Permission Summary
* **Admin:** Full access to all modules.
* **Sales:** Can view, create, and edit Customers and Sales Challans. Cannot modify Inventory products.
* **Warehouse:** Can view, create, and edit Products, and log Stock Movements. Cannot manage Customers or Challans.
* **Accounts:** Read-only access to Customers and Challans for reporting/invoice generation.

## 14. Testing Commands
To verify the core business logic, automated test scripts have been provided in the backend. 
From the `/backend` directory, run:
```bash
node test_phase4.js
```
*This verifies the critical Challan Confirmation logic, confirming that atomic transactions successfully prevent stock from dropping below zero during concurrent requests.*

## 15. Assumptions
* A "Sales Challan" represents a localized B2B sales order.
* Stock must be verified and deducted atomically at the exact moment a Challan transitions from "Draft" to "Confirmed".
* Canceled challans do not release stock (since stock is only deducted on Confirmation, not while in Draft).
* Authentication is handled via stateless JWTs stored in browser `localStorage`.

## 16. Known Limitations
* The application does not currently support PDF generation/exporting for invoices (Bonus feature omitted).
* Pagination is implemented on the Customer endpoints, but the Product and Challan endpoints currently return full arrays. As the database scales, `page` and `limit` cursors will need to be added to these remaining lists.
* Profile pictures and AWS S3 product image uploads are not integrated.
