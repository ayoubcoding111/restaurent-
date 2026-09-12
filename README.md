# 🍕 Delicious Restaurant — Food Ordering Platform

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-ISC-blue)

A full-stack food ordering and delivery platform: customers browse the menu and place
orders directly (Algerian phone validation), staff run a **live kitchen dashboard**
with new-order alerts and click-to-copy phone numbers, and admins get
**analytics, staff/menu management, email login and password reset** — in
**English, French and Arabic (RTL)**. No frontend frameworks, no build step.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [User Guide](#user-guide)
- [Design Decisions](#design-decisions)
- [Roadmap](#roadmap)
- [License](#license)

## Features

### 🛍️ Customer ordering
- Responsive landing page with hero section, opening hours and contact info
- Menu browsing with category filters and real-time search
- **Customizable items** — click any dish to open its options: extra ingredients
  (multi-pick, pizzas/tacos) and drink sizes 30cl / 1L / 2L (single-pick),
  each adding its price, with live total. Option names/groups in EN/FR/AR.
  *Order Now* jumps straight into customization.
- Shopping cart with quantity controls, persisted in `localStorage`, **fly-to-cart animation**
  (combos with different options stay on separate lines)
- Direct checkout saved to MySQL with **Algerian phone validation**
  (`05` / `06` / `07` — 10 digits — or `+213…`, spaces/dashes allowed),
  validated in both frontend and backend, with a confirmation page + order number
- Click-to-copy customer phone in staff/admin order cards (clipboard + toast)
- Rate-limited public endpoints (`express-rate-limit`): orders, login, password reset
- Dark / light theme toggle (persisted)

### 🔔 Staff dashboard — live kitchen view
- Order list with status badges (`pending` / `confirmed` / `delivered`) and status filters
- One-click status flow: Pending → Confirmed → Delivered
- **Live alerts**: auto-refresh every 15 s, chime + flashing NEW highlight on new orders
- Optional **browser notifications** (works even in another tab), persisted sound toggle
- Polling pauses automatically when the tab is hidden or you leave the dashboard

### 🛠️ Admin dashboard
- **Staff management** — create accounts (username + email + role), **edit infos/credentials**
  (incl. password reset), list, delete
- **My Account panel** — admin edits own profile and changes password (current-password check)
- **Order oversight** — master view of all orders, same live refresh and alerts as staff
- **Menu management** — add items with image upload, **edit any item (details + photo +
  priced options/ingredients/sizes)**, toggle availability, delete items
- **Analytics tab** — all-time + delivered-only revenue cards, 7/14/30-day ranges with
  previous-period comparison deltas, SVG revenue bar chart and orders-vs-delivered line
  chart per day, status breakdown, top items, one-click **orders CSV export**.
  Orders (including delivered) are never deleted, so history only grows.
- Full-height **sidebar navigation** pinned to the screen edge (top-anchored circular
  hamburger, drawer + overlay on mobile), icon chips, smooth slide, across all panels
  (Staff, Orders, Menu, Analytics, My Account)
- Inline form errors/success, toast notifications and a custom confirm dialog — no `alert()` popups

### 🔐 Authentication & accounts
- Role-based access control (`admin` / `staff`), token-based sessions, bcrypt hashing
- Login with **username or email**
- **Password reset via real email**: time-limited (1 h) token link, powered by Nodemailer/SMTP
- Accounts without an email on file get a clear error instead of a silent failure
- dev-friendly: without SMTP configured, the reset link is shown in the UI/server logs for testing
- Self-healing sessions: expired tokens auto-redirect to login with a clear message instead
  of failing every action (note: sessions live in server memory, so a server restart logs
  everyone out — see Roadmap for persistent sessions)

### 🌍 Languages & polish
- **English / French / Arabic** globe-menu in the navbar (🇬🇧 / 🇫🇷 / 🇩🇿 flags inside,
  persisted, full RTL layout for Arabic)
- Modern SVG icon set throughout (no emoji icons), fly-to-cart animation, dark/light themes
- Scroll-reveal animations, smooth scrolling, panel entrance transitions,
  responsive mobile nav, empty/loading/error states everywhere

## Quick Start

**Prerequisites:** Node.js 18+, MySQL 8, npm.

```bash
# 1. Install dependencies
cd server
npm install

# 2. Create the database (schema + sample menu + default admin)
mysql -u root -p < database.sql

# 3. Configure environment (see Configuration below)
cp .env.example .env   # then edit .env

# 4. Start the server
npm start               # or: npm run dev (auto-reload with nodemon)

# 5. Open http://localhost:3000
```

> Fresh installs seed a default admin (`admin` / `admin123`). Sign in and change the
> password immediately — or pre-seed credentials via `ADMIN_*` in `.env`.

## Configuration

All settings live in `server/.env` (git-ignored — see `server/.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Yes | — | MySQL connection |
| `PORT` | No | `3000` | HTTP port |
| `APP_URL` | No | `http://localhost:PORT` | Base URL used in password-reset links |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | No | `admin` / `admin@…` / `admin123` | First-boot admin seed only — **never overwrites existing accounts** |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | For email | — | e.g. `smtp.gmail.com` / `587` / `false` |
| `SMTP_USER` / `SMTP_PASS` | For email | — | SMTP login — for Gmail use an **App Password** |
| `MAIL_FROM` | No | `SMTP_USER` | `From:` header for reset emails |

### Enabling real password-reset emails (Gmail)

1. Enable 2-Step Verification on the Google account
   (`myaccount.google.com/signinoptions/two-step-verification`).
2. Create an App Password (`myaccount.google.com/apppasswords`), name it e.g. `Restaurant`,
   and copy the 16-letter code — **this is your `SMTP_PASS`** (your normal Gmail password won't work).
3. Add to `server/.env`:
   ```env
   APP_URL=http://localhost:3000
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=you@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   MAIL_FROM=Delicious Restaurant <you@gmail.com>
   ```
4. Restart the server (`dotenv` loads at boot).

## Project Structure

```
Project2/
├── client/                      # Frontend (static, served by Express — no build step)
│   ├── index.html               # SPA entry point (nav, hero, menu, cart, dashboards, modals)
│   ├── styles.css               # Themes, dashboards, charts, responsive, RTL
│   ├── i18n.js                  # EN/FR/AR dictionaries, globe-menu switcher, RTL handling
│   ├── icons.js                 # Shared inline-SVG icon set (cart, globe, status, actions…)
│   ├── app.js                   # Hash router, menu display, cart page, checkout, modal wiring
│   ├── cart.js                  # localStorage-backed shopping cart
│   ├── auth.js                  # Login, logout, forgot/reset password API + modals
│   ├── staff.js                 # Staff dashboard + shared KitchenAlerts live watcher
│   ├── admin.js                 # Admin dashboard: staff / orders / menu / analytics tabs
│   └── imgs/                    # Static images
├── server/
│   ├── server.js                # Express app: auth, staff, orders, items, analytics routes
│   ├── config/
│   │   ├── db.js                # MySQL connection pool (mysql2)
│   │   └── mailer.js            # Nodemailer SMTP sender + dev fallback
│   ├── database.sql             # Schema, sample menu, default admin seed
│   ├── uploads/                 # Uploaded menu-item images (git-ignored)
│   ├── .env                     # Local config (git-ignored)
│   ├── .env.example             # Documented config template
│   └── package.json
├── .gitignore
└── README.md
```

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/items` | — | List all menu items |
| GET | `/api/items/:id` | — | Get one menu item |
| POST | `/api/items` | Admin | Add item (`multipart/form-data`: name, price, category, description, image) |
| PUT | `/api/items/:id` | Admin | Edit item (image optional — kept if omitted) |
| PUT | `/api/items/:id/options` | Admin | Replace customization options (`[{group_name, group_fr, group_ar, name, name_fr, name_ar, price_delta, choice}]`) |
| PATCH | `/api/items/:id/availability` | Admin | Toggle `is_available` |
| DELETE | `/api/items/:id` | Admin | Delete item (removes image file too) |
| POST | `/api/auth/login` | — | Login with username **or** email → `{ token, role, … }` |
| POST | `/api/auth/logout` | User | Invalidate current token |
| GET | `/api/auth/me` | User | Current session info |
| POST | `/api/auth/forgot-password` | — | Email (or username) → reset link emailed; generic response for unknown accounts |
| POST | `/api/auth/reset-password` | — | `{ token, password }` — 1-hour expiry, min 6 chars, kills old sessions |
| PATCH | `/api/auth/profile` | User | Edit own username / email / full name |
| POST | `/api/auth/change-password` | User | Change own password (current-password check, other sessions dropped) |
| POST | `/api/orders` | — | Place order (customer name/phone/address, items JSON, `zone_id` optional — fee computed server-side) |
| GET | `/api/orders` | User | All orders, newest first (includes `zone_name`, `subtotal`, `delivery_fee`, `assigned_to`/`assigned_name`) |
| PATCH | `/api/orders/:id/status` | User | Set `pending` / `confirmed` / `preparing` / `ready` / `on_way` / `delivered` |
| PATCH | `/api/orders/:id/assign` | User | Assign/unassign order (`{ staff_id }` or null) |
| GET | `/api/zones` | — | Public active delivery zones (fee, `free_over`, `eta_min`) |
| GET | `/api/zones?all=1` | Admin | All zones incl. inactive |
| POST | `/api/zones` | Admin | Create zone (name, fee, free_over, eta_min) |
| PATCH | `/api/zones/:id` | Admin | Edit zone / enable-disable |
| DELETE | `/api/zones/:id` | Admin | Delete zone (old orders keep totals) |
| GET | `/api/items/:id/reviews` | — | Approved reviews for one item |
| POST | `/api/items/:id/reviews` | — | Submit review (moderation queue) |
| GET | `/api/reviews` | Admin | All reviews (`?pending=1` for queue) |
| PATCH | `/api/reviews/:id` | Admin | Approve/hide (`{ is_approved }`) |
| DELETE | `/api/reviews/:id` | Admin | Delete review |
| GET | `/api/staff/names` | User | Lightweight id/name list (assignment dropdown) |
| GET | `/api/analytics?days=14` | Admin | Totals + delivered revenue, daily series (7–90 days), prev-period comparison, top-8 items |
| GET | `/api/staff` | Admin | List accounts (no password hashes) |
| POST | `/api/staff` | Admin | Create account (username, email, password ≥ 6, full name, role) |
| PATCH | `/api/staff/:id` | Admin | Edit infos / role / credentials (blank password = keep; can't change own role) |
| DELETE | `/api/staff/:id` | Admin | Delete account (can't delete yourself) |

Auth uses `Authorization: Bearer <token>`. Unknown forgot-password identifiers still return
success so attackers can't enumerate accounts.

## Database Schema

```sql
items   → id, name, price, category(pizzas|tacos|drinks|familypack),
          description, image_url, is_available, created_at, updated_at
item_options → id, item_id → items(id) ON DELETE CASCADE,
          group_name (+ group_fr / group_ar), name (+ name_fr / name_ar),
          price_delta (added to base price), choice(single|multi), sort_order
staff   → id, username UNIQUE, email UNIQUE, password (bcrypt),
          full_name, role(admin|staff), reset_token, reset_expires, created_at
orders  → id, customer_name, customer_phone, customer_address,
          items JSON, total, status(pending|confirmed|preparing|ready|on_way|delivered),
          zone_id, subtotal, delivery_fee, assigned_to → staff(id) ON DELETE SET NULL,
          created_at, updated_at
reviews → id, item_id → items(id) ON DELETE CASCADE, rater_name,
          rating(1–5), comment, is_approved, created_at
delivery_zones → id, name (+ name_fr / name_ar), fee,
          free_over (free delivery threshold), eta_min, is_active, sort_order
```

On boot the server auto-migrates missing columns (`items.description`, `staff.email`,
`staff.reset_token`, `staff.reset_expires`, `item_options.*_fr/_ar`,
`orders.zone_id/subtotal/delivery_fee/assigned_to`, extended order `status` enum),
creates the `item_options`, `reviews` and `delivery_zones` tables with samples,
backfills FR/AR option names, and seeds an admin
only if none exists — safe to restart or re-run `database.sql` on a fresh DB.

## User Guide

- **Customer:** browse `#menu` → click a dish to customize (ingredients/sizes, live total)
  or *Add to Cart* directly → `#cart` (combos show their options, qty controls) →
  *Order Now* → pick a delivery zone (fee auto-computed, free over threshold) + fill details
  (Algerian mobile required: `05`/`06`/`07` or `+213…`) →
  order is stored and a confirmation page shows the order number.
  Leave a star rating + comment per dish (approved by admin before it shows).
- **Staff:** *Staff / Admin Login* (footer) → `#staff` → watch the Live feed, click
  *Notify* for background alerts, click a customer phone number to copy it,
  confirm and deliver orders as they come in.
- **Admin:** log in → `#admin` → manage staff (email required for password resets,
  edit any account incl. credentials), curate the menu (details, photos, priced
  EN/FR/AR options), manage **delivery zones** (fees, free-over thresholds, ETAs),
  moderate **reviews** (approve/hide/delete), check *Analytics* (export CSV for bookkeeping),
  and update your own profile under *My Account*.
- **Forgot password:** *Login → Forgot password?* → enter email/username → open the emailed
  `#reset-password?token=…` link within 1 hour → set a new password → log in.
- **Language:** EN/FR/AR globe menu in the navbar (flags inside); Arabic flips the whole
  layout to RTL, including dishes and option names.

## Design Decisions

- **No frameworks, no build** — vanilla HTML/CSS/JS to demonstrate web fundamentals;
  hash routing gives SPA navigation with zero tooling.
- **CSS variables** — dark/light themes plus shared dashboard/chart styling from one switch.
- **Token sessions in memory** — simple deploy story; reset-password rotates credentials by
  wiping the user's sessions.
- **Anti-enumeration responses** — forgot-password never reveals whether an account exists.
- **Dependency-free charts/alerts/icons** — hand-rolled SVG analytics charts, WebAudio
  kitchen chime and a shared inline-SVG icon set need no extra libraries; the only
  runtime additions are `mysql2`, `nodemailer`, `multer`.

## Roadmap

- [ ] Online payments (e.g. CIB / EDAHABIA via a local gateway)
- [ ] Customer order tracking page (live status by phone/order id)
- [ ] Order-ready SMS/push notifications
- [ ] Promo codes
- [ ] Persistent sessions (DB/Redis) for multi-instance deploys
- [ ] Login rate-limiting and audit log

## License

ISC — see `server/package.json`. Built by Omar Ayoub Benkreira.
