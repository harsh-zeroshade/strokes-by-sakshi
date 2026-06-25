<div align="center">
  <br/>
  <h1>🎨 Strokes by Sakshi</h1>
  <p><strong>Luxury Art E-Commerce Platform</strong></p>
  <p><em>Where Emotions Find Their Canvas</em></p>
  <br/>
</div>

A premium, conversion-focused luxury e-commerce website for **Strokes by Sakshi**, an art and custom portrait brand. Built with React 19, Tailwind CSS v4, Motion for React (Framer Motion), Three.js, and Laravel 12 with MySQL.

## ✨ Features

- **Cinematic Hero** — Three.js particle system with brushstroke effect
- **Premium Catalog** — Advanced filtering by category, medium, price, and orientation
- **Custom Commissions** — 3-step commission flow with drag-and-drop file uploads & live price estimation
- **Shopping Cart** — Guest support with session-based persistence
- **Secure Checkout** — Multiple payment methods with order tracking
- **User Accounts** — Profile management, order history, wishlist
- **Admin Panel** — Dashboard analytics, order management, product CRUD, user management
- **Reviews & Ratings** — Customer reviews with admin moderation
- **Responsive Design** — Mobile-first luxury editorial layout
- **Premium Animations** — Scroll reveals, staggered entrances with Motion
- **WhatsApp Integration** — Direct customer communication

## 🚀 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| Tailwind CSS v4 | CSS-first design system with custom luxury theme |
| Motion for React (Framer Motion v12) | Premium animations |
| Three.js | 3D hero effects |
| React Router DOM v7 | Client-side routing |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|------------|---------|
| Laravel 12 | PHP framework (API-first) |
| MySQL | Database |
| Sanctum | Token-based authentication |
| Spatie Permission | Role-based access control |

## 🏗️ Project Structure

```
strokes-by-sakshi/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/    # API Controllers
│   │   ├── Http/Middleware/         # AdminMiddleware
│   │   └── Models/                  # Eloquent Models
│   ├── database/
│   │   ├── migrations/              # Schema (10 migrations)
│   │   └── seeders/                 # Sample data
│   └── routes/api.php               # API route definitions
│
├── frontend/                   # React SPA
│   └── src/
│       ├── components/              # Reusable UI components
│       ├── context/                 # Auth, Cart, Theme state
│       ├── pages/                   # Page components
│       ├── config.js                # Site configuration
│       └── api.js                   # Axios API client
│
├── composer.json                # Root composer (Laravel deps)
├── package.json                 # Root package (shared deps)
└── README.md
```

## 📦 Installation

### Prerequisites
- PHP ^8.2
- Composer
- MySQL 8.0+
- Node.js 18+

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials:
# DB_DATABASE=strokesbysakshi
# DB_USERNAME=root
# DB_PASSWORD=

# Generate app key
php artisan key:generate

# Create storage symlink
php artisan storage:link

# Run migrations and seeders
php artisan migrate --seed

# Start backend server
php artisan serve
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Default Accounts

| Role     | Email                         | Password   |
|----------|-------------------------------|------------|
| Admin    | sakshi@strokesbysakshi.com    | admin123   |
| Customer | priya@example.com             | password   |

## 🔗 API Overview

### Public Endpoints
- `POST /api/register` — User registration
- `POST /api/login` — User login
- `GET /api/products` — Product catalog with filtering
- `GET /api/products/featured` — Featured products
- `GET /api/products/{slug}` — Product detail
- `GET /api/categories` — All categories
- `GET /api/collections` — All collections
- `GET /api/cart` — Get cart (guest + authenticated)
- `POST /api/cart/add` — Add to cart
- `POST /api/custom-orders` — Submit commission
- `POST /api/custom-orders/estimate` — Price estimate

### Authenticated Endpoints
- `POST /api/checkout` — Place order
- `GET /api/orders` — User orders
- `POST /api/wishlist/{product}` — Toggle wishlist
- `POST /api/reviews` — Submit review

### Admin Endpoints
- `GET /api/admin/dashboard` — Dashboard metrics
- `GET /api/admin/orders` — All orders
- `PUT /api/admin/orders/{id}/status` — Update order status
- `POST /api/admin/custom-orders/{id}/quote` — Send quote
- `GET/POST/PUT/DELETE /api/admin/products` — Product CRUD
- `GET /api/admin/analytics` — Sales analytics

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Ivory | `#FAF7F2` | Background |
| Cream | `#F0EBE3` | Section backgrounds |
| Charcoal | `#2C2C2C` | Primary text |
| Charcoal Muted | `#6B6B6B` | Secondary text |
| Terracotta | `#C7694F` | Primary accent |
| Gold | `#C9A94E` | Luxury accent |
| Sage | `#9CAF88` | Supporting |
| Blush | `#E8C4C4` | Supporting |

**Typography:** Playfair Display (serif/display) + Inter (sans-serif/body)

## 📊 Database Schema

- **users** — Customers & admin with roles
- **categories** — Product categories (hierarchical)
- **collections** — Curated art collections
- **products** — Artworks (original, print, limited edition)
- **product_images** — Multiple images per product
- **product_variants** — Size & framing options
- **carts & cart_items** — Shopping cart with guest session support
- **orders & order_items** — Order processing
- **custom_orders & custom_order_files** — Commission requests with file uploads
- **reviews** — Product reviews with moderation
- **wishlists** — User wishlist
- **coupons** — Discount codes
- **payments** — Payment gateway abstraction
- **shipping_addresses** — Address management
- **notifications** — Database notifications

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | Strokes by Sakshi | Application name |
| `APP_ENV` | production | Application environment |
| `APP_DEBUG` | false | Debug mode |
| `APP_URL` | http://localhost:8000 | Application URL |
| `DB_DATABASE` | strokesbysakshi | MySQL database name |
| `VITE_API_URL` | http://localhost:8000/api | Frontend API URL |

## 🧪 Running Tests

```bash
cd backend
php artisan test
```

## 📄 License

Copyright © 2024 Strokes by Sakshi. All rights reserved.

---

<div align="center">
  <p>Built with ❤️ using React, Laravel & Tailwind CSS</p>
</div>