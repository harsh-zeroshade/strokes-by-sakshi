<div align="center">
  <h1>🎨 Strokes by Sakshi — Backend API</h1>
  <p>Laravel 12 REST API for the luxury art e-commerce platform</p>
</div>

## Overview

This is the backend API for **Strokes by Sakshi**, a premium art e-commerce platform. It provides a comprehensive REST API built with Laravel 12, featuring authentication, product management, cart & checkout, custom order commissions, reviews, wishlists, and an admin dashboard.

## Tech Stack

- **Laravel 12** — PHP framework
- **MySQL** — Relational database
- **Sanctum** — Token-based API authentication
- **Spatie Permission** — Role-based access control (admin only)

## Requirements

- PHP ^8.2
- Composer
- MySQL 8.0+
- Node.js & NPM (for frontend)

## Installation

```bash
# Install dependencies
composer install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Generate application key
php artisan key:generate

# Create storage link
php artisan storage:link

# Run migrations and seeders
php artisan migrate --seed

# Start development server
php artisan serve
```

## Default Accounts

| Role     | Email                         | Password   |
|----------|-------------------------------|------------|
| Admin    | sakshi@strokesbysakshi.com    | admin123   |
| Customer | priya@example.com             | password   |

## API Endpoints

### Public

| Method | Endpoint                        | Description               |
|--------|--------------------------------|---------------------------|
| POST   | `/api/register`                | User registration         |
| POST   | `/api/login`                   | User login                |
| GET    | `/api/products`                | Product catalog           |
| GET    | `/api/products/featured`       | Featured products         |
| GET    | `/api/products/{slug}`         | Product detail            |
| GET    | `/api/categories`              | All categories            |
| GET    | `/api/collections`             | All collections           |
| GET    | `/api/cart`                    | Get cart                  |
| POST   | `/api/cart/add`                | Add to cart               |
| POST   | `/api/custom-orders`           | Submit commission         |     |

### Authenticated

| Method | Endpoint                                   | Description            |
|--------|-------------------------------------------|------------------------|
| POST   | `/api/checkout`                           | Place order            |
| GET    | `/api/orders`                             | User orders            |
| POST   | `/api/wishlist/{product}`                 | Toggle wishlist        |
| POST   | `/api/reviews`                            | Submit review          |

### Admin

| Method | Endpoint                                          | Description              |
|--------|--------------------------------------------------|--------------------------|
| GET    | `/api/admin/dashboard`                           | Dashboard metrics        |
| GET    | `/api/admin/orders`                              | All orders               |
| PUT    | `/api/admin/orders/{id}/status`                  | Update order status      |
| POST   | `/api/admin/custom-orders/{id}/quote`            | Send quote               |
| GET    | `/api/admin/products`                            | Products management      |
| POST   | `/api/admin/products`                            | Create product           |
| GET    | `/api/admin/analytics`                           | Sales analytics          |

## Development

```bash
# Run tests
php artisan test

# Run both backend & frontend dev servers
composer dev
```

## License

Copyright © 2024 Strokes by Sakshi. All rights reserved.