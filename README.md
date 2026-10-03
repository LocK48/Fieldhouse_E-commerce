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

   Set `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in `server/.env`. For email OTP registration, also configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` with your email provider's SMTP details. Set a private `OTP_HASH_SECRET` for hashing verification codes. `CLIENT_URL` defaults to the Vite address shown in the example. R2 values are optional until uploading product images.

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

## Run with Docker Compose

Docker Compose runs MongoDB, the API, and the static frontend together. The frontend proxy keeps API and Socket.IO traffic on the same origin; only the web port is published, and MongoDB data is stored in the `mongo_data` volume.

1. Copy `docker.env.example` to `.env`. Set long, independent values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OTP_HASH_SECRET`, and `MONGO_ROOT_PASSWORD`. Keep the Mongo password alphanumeric because Compose inserts it into the MongoDB URI.
2. Set `CLIENT_URL` to the exact public site origin (for example, `https://shop.example.com`). Configure the SMTP variables to enable registration OTP email delivery. R2 settings are optional until image uploads are needed.
3. Start the stack from the project root:

   ```powershell
   docker compose up --build -d
   ```

   The site is available at `http://localhost:8080` by default. Set `APP_PORT` to change the host port. To load the demo catalog for local review, run `docker compose exec api npm run seed`; demo accounts use the credentials listed above and must not be used on a public deployment.

The Compose file serves HTTP. Put it behind a TLS enabled reverse proxy before using a public domain. `docker compose down` keeps the database volume; `docker compose down -v` deletes it.

## Demo accounts

The seed creates one admin and two sellers. Their shared password is `Password123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@fieldhouse.local` |
| Seller | `nike@fieldhouse.local` |
| Seller | `adidas@fieldhouse.local` |

These accounts and credentials are for local development only. Do not reuse them in a deployed environment.

## Main API routes

All routes use the `/api/v1` prefix. Public routes include `GET /products`, `GET /products/:id`, `GET /categories`, and `GET /health`. Authentication is under `/auth`; registration requests an OTP at `POST /auth/register/request-otp` and creates the account at `POST /auth/register/verify-otp`. Seller store and product routes are under `/stores` and `/products`; admin review routes are under `/admin`.

### Cart and COD orders

All cart and order routes require `Authorization: Bearer <accessToken>`.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/cart` | Read the signed-in user's cart and current item availability |
| `POST` | `/cart/items` | Add `{ "productId": "...", "variantId": "...", "quantity": 1 }` |
| `PATCH` | `/cart/items` | Set quantity with the same `productId`, `variantId`, and `quantity` fields |
| `DELETE` | `/cart/items` | Remove by `{ "productId": "...", "variantId": "..." }`; omit `variantId` to remove all variants of that product |
| `DELETE` | `/cart` | Empty the cart |
| `POST` | `/orders` | Place a COD order from the cart |
| `GET` | `/orders` | List the signed-in user's orders (`page`, `limit`) |
| `GET` | `/orders/:id` | Read one of the signed-in user's orders |

Place an order with `{ "shippingAddress": { "recipientName": "...", "phone": "...", "addressLine": "...", "ward": "...", "district": "...", "city": "...", "country": "Vietnam" } }`. Product prices and stock are read from MongoDB; the API ignores client-supplied totals. Checkout reserves stock, creates the order and COD payment record, and clears the cart in a MongoDB transaction. Shipping costs 30,000₫ below 1,500,000₫ and is free at or above that subtotal.

## Current scope

The storefront includes product discovery, filtering, sorting, pagination, account registration and sign-in, a persistent cart, COD checkout, and customer order history. COD orders reserve stock and create a pending payment record; online payment gateways and order fulfillment/status management are not implemented yet.
