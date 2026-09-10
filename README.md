# Delicious Restaurant — Food Ordering Platform

A full-stack food ordering and delivery web application with customer ordering, WhatsApp integration, staff order management, and a full admin dashboard.

## Live Demo

> Run locally: `cd server && npm install && npm start` → open `http://localhost:3000`

## Features

### Customer
- Responsive restaurant landing page with hero section and contact info
- Menu browsing with category filtering and real-time search
- Shopping cart with quantity controls and persistent storage
- Checkout → order saved to database + WhatsApp message sent to restaurant
- Dark/light theme toggle with persistent preference

### Staff Dashboard
- Live order list with status badges (Pending / Confirmed / Delivered)
- Filter orders by status
- Update order status: Pending → Confirmed → Delivered
- Welcome header with logout

### Admin Dashboard
- **Staff Management** — Create, list, and delete staff accounts with role assignment (Admin/Staff)
- **Order Oversight** — Master view of all orders with status filtering and updates
- **Menu Management** — Add menu items with image upload, toggle availability, delete items
- Three-tab interface for clean navigation between admin functions

### Authentication
- Role-based access control (Admin / Staff)
- Token-based sessions with bcrypt password hashing
- Footer login button with modal
- Automatic routing to appropriate dashboard after login

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | bcryptjs, token-based sessions |
| File Upload | Multer |
| Styling | Custom CSS with CSS Variables (dark/light themes) |

## Project Structure

```
Project2/
├── client/                  # Frontend (served by Express)
│   ├── index.html           # SPA entry point
│   ├── styles.css           # Themes, dashboard, responsive (1500+ lines)
│   ├── app.js               # Router, menu display, cart page, checkout
│   ├── cart.js              # Shopping cart (localStorage-backed)
│   ├── auth.js              # Authentication module
│   ├── staff.js             # Staff dashboard — order management
│   ├── admin.js             # Admin dashboard — staff/orders/menu tabs
│   └── imgs/                # Static images (hero, food samples)
├── server/
│   ├── server.js            # Express server with all API routes
│   ├── config/db.js         # MySQL connection pool
│   ├── database.sql         # Database schema + sample data
│   ├── uploads/             # Uploaded menu item images
│   ├── .env                 # Environment config (git-ignored)
│   └── package.json
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/items` | No | Get all menu items |
| POST | `/api/items` | Admin | Add new menu item |
| DELETE | `/api/items/:id` | Admin | Delete menu item |
| PATCH | `/api/items/:id/availability` | Admin | Toggle item availability |
| POST | `/api/auth/login` | No | Login (returns token + role) |
| POST | `/api/auth/logout` | Yes | Logout (invalidate token) |
| GET | `/api/auth/me` | Yes | Get current user info |
| POST | `/api/orders` | No | Place a new order |
| GET | `/api/orders` | Yes | Get all orders |
| PATCH | `/api/orders/:id/status` | Yes | Update order status |
| GET | `/api/staff` | Admin | List all staff accounts |
| POST | `/api/staff` | Admin | Create staff account |
| DELETE | `/api/staff/:id` | Admin | Delete staff account |

## Database Schema

```
items       → id, name, price, category, image_url, is_available, timestamps
staff       → id, username, password (bcrypt), full_name, role, created_at
orders      → id, customer_name, customer_phone, customer_address, items (JSON), total, status, timestamps
```

## Setup

```bash
# 1. Install dependencies
cd server
npm install

# 2. Configure database
mysql -u root -p < database.sql

# 3. Set environment variables (edit server/.env)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=restaurant_db
PORT=3000

# 4. Start the server
npm start

# 5. Open http://localhost:3000
#    Admin login: admin / admin123
```

## Design Decisions

- **No frameworks** — Pure vanilla JS to demonstrate core web fundamentals
- **Hash-based routing** — SPA navigation without React Router or build tools
- **CSS Variables** — Theme switching with a single data attribute
- **Token-based auth** — Secure role-based access without session cookies
- **Modular JS** — Each feature in its own file (cart, auth, staff, admin, app)
