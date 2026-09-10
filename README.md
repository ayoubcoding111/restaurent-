# 🍕 Delicious Restaurant — Food Ordering Platform

A complete full-stack restaurant web application with customer ordering, WhatsApp integration, staff order management, and a full admin dashboard.

## Features

### Customer (Public)
- Modern landing page with hero, about cards, and contact info
- Menu browsing with category filtering (Pizzas, Tacos, Drinks, Family Pack) and search
- Shopping cart with quantity controls (localStorage-backed)
- Checkout form → order saved to database + WhatsApp message sent
- Dark/light theme toggle (persistent)
- Fully responsive design

### Staff Dashboard (`#staff`)
- Welcome header with logout
- Live order list with status badges (Pending / Confirmed / Delivered)
- Filter orders by status
- Update order status: Pending → Confirmed → Delivered

### Admin Dashboard (`#admin`)
Three-tab interface:

| Tab | Features |
|-----|----------|
| **Staff** | Create new staff accounts (username, password, name, role), list all staff, delete accounts |
| **Orders** | Master view of all orders with status filtering, update any order status |
| **Menu Items** | Add new items (name, price, category, image upload), toggle availability, delete items |

### Auth
- Role-based authentication (Admin / Staff) via token-based sessions
- Footer login button → login modal
- Automatic redirect to appropriate dashboard after login
- Default admin: `admin` / `admin123`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js + Express.js |
| Database | MySQL (mysql2 driver) |
| Auth | bcryptjs + in-memory token sessions |
| File Uploads | Multer |

## Project Structure

```
Project2/
├── client/                  # Frontend (served by Express)
│   ├── index.html           # SPA entry point
│   ├── styles.css           # All styles (themes, dashboard, responsive)
│   ├── app.js               # Core app: router, menu, cart, checkout, init
│   ├── cart.js              # Cart module (localStorage)
│   ├── auth.js              # Auth module (token, role, footer login)
│   ├── staff.js             # Staff dashboard (order management)
│   ├── admin.js             # Admin dashboard (staff/orders/menu tabs)
│   └── imgs/                # Static images (hero, sample food)
├── server/
│   ├── server.js            # Express server + all API routes
│   ├── config/db.js         # MySQL connection pool
│   ├── database.sql         # DB schema + sample data
│   ├── uploads/             # Uploaded menu item images
│   ├── .env                 # Environment config (git-ignored)
│   └── package.json
├── .gitignore
└── README.md
```

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all menu items |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (returns token + role) |
| POST | `/api/auth/logout` | Logout (invalidate token) |
| GET | `/api/auth/me` | Get current user info |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | No | Place a new order |
| GET | `/api/orders` | Yes | Get all orders (staff/admin) |
| PATCH | `/api/orders/:id/status` | Yes | Update order status |

### Staff Management (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/staff` | List all staff accounts |
| POST | `/api/staff` | Create a staff account |
| DELETE | `/api/staff/:id` | Delete a staff account |

### Menu Items
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/items` | No | Get all items |
| GET | `/api/items/:id` | No | Get single item |
| POST | `/api/items` | Admin | Add new item (multipart) |
| PATCH | `/api/items/:id/availability` | Admin | Toggle availability |
| DELETE | `/api/items/:id` | Admin | Delete item |

## Setup

### 1. Install dependencies
```bash
cd server
npm install
```

### 2. Configure database
```bash
# Edit server/.env with your MySQL credentials
# Then run the schema:
mysql -u root -p < database.sql
```

### 3. Start the server
```bash
npm start
# or for development:
npm run dev
```

### 4. Open the app
- **URL**: http://localhost:3000
- **Admin login**: `admin` / `admin123`

## Environment Variables

Create `server/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=restaurant_db
PORT=3000
```

## Database Schema

```sql
items:      id, name, price, category, image_url, is_available, created_at, updated_at
staff:      id, username, password (bcrypt), full_name, role, created_at
orders:     id, customer_name, customer_phone, customer_address, items (JSON), total, status, created_at, updated_at
```

## License

Open source — free to modify and distribute.
