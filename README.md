# Fieldhouse

Fieldhouse is a sports goods marketplace built as a full stack portfolio project. Customers can browse and search approved products. Sellers can manage a store and submit products for review. Admin routes cover seller, store, and product approval.

## Stack

- **Client:** React, Vite, JavaScript
- **API:** Node.js, Express 5, MongoDB, Mongoose
- **Authentication:** JWT access and refresh tokens, role based authorization
- **Product images:** Cloudflare R2 using short lived presigned URLs (optional for local browsing)

## Run locally

Requirements: Node.js 20.19+ (or 22.12+), MongoDB, and npm.

1. Configure the API environment:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

   Set `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in `server/.env`. `CLIENT_URL` defaults to the Vite address shown in the example. R2 values are optional until uploading product images.

2. Install and start the API:

   ```powershell
   cd server
   npm install
   npm run seed
   npm run dev
   ```

   The seed command is safe to rerun: it adds missing demo records and keeps existing records. API health check: `http://localhost:5000/api/v1/health`.

3. In another terminal, install and start the client:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

   Open the local URL printed by Vite. Set `VITE_API_URL` in `client/.env.local` only when the API is not at `http://localhost:5000/api/v1`.

## Demo accounts

The seed creates one admin and two sellers. Their shared password is `Password123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@fieldhouse.local` |
| Seller | `nike@fieldhouse.local` |
| Seller | `adidas@fieldhouse.local` |

These accounts and credentials are for local development only. Do not reuse them in a deployed environment.

## Main API routes

All routes use the `/api/v1` prefix. Public routes include `GET /products`, `GET /products/:id`, `GET /categories`, and `GET /health`. Authentication is under `/auth`; seller store and product routes are under `/stores` and `/products`; admin review routes are under `/admin`.

## Current scope

The storefront includes product discovery, filtering, sorting, pagination, a product detail dialog, and a browser-local demo cart count. The API includes customer registration and login, seller applications, seller stores and products, image upload, and admin approval flows. Checkout, payment processing, and order fulfillment are not implemented.
