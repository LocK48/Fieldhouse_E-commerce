# Fieldhouse

Fieldhouse is a full-stack sports goods marketplace built as a portfolio project. Customers can discover products, place cash-on-delivery (COD) orders, and contact stores or support. Sellers manage their storefront, products, orders, and payment confirmations. Administrators review sellers, stores, and products and manage order fulfillment.

**Documentation:** [Tiếng Việt](docs/README.md)

## Features

- Product catalog with search, category filters, sorting, pagination, and product details.
- Customer accounts with email OTP registration, sign-in, profile, saved addresses, cart, and wishlist.
- COD checkout, customer order history and cancellation, and product reviews for delivered orders.
- Seller storefront and product management, seller order inbox, and COD payment confirmation after delivery.
- Admin tools for seller/store/product review and order status management.
- Real-time customer, seller, and admin support chat using Socket.IO.
- Cloudflare R2 image uploads through short-lived presigned URLs.

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Zustand, Tailwind CSS, custom CSS |
| Backend | Node.js, Express 5, Socket.IO |
| Database | MongoDB, Mongoose |
| Authentication | JWT access and refresh tokens, role-based authorization, email OTP |
| Image storage | Cloudflare R2, S3-compatible API |
| Containers | Docker, Docker Compose, Nginx |

## Repository layout

```text
client/                 React storefront and role-specific pages
  src/api/               API clients
  src/components/        Shared, product, layout, and chat components
  src/pages/             Customer, seller, and admin pages
  src/routes/            Route paths and page routing
  src/store/             Zustand commerce state
server/                 Express API and Socket.IO server
  src/config/             Database configuration
  src/controllers/        HTTP controllers
  src/middlewares/        Authentication, authorization, and validation
  src/models/             Mongoose models
  src/routes/             REST API routes
  src/services/           Business logic and integrations
  src/socket/             Real-time chat events
dataset/                 Product image dataset and MongoDB/R2 sync scripts
docs/                    Additional project documentation
docker-compose.yml       Local multi-container setup
```

## Requirements

- Node.js 22.12 or newer (Node.js 22 LTS is recommended).
- npm.
- MongoDB, either local or hosted. COD checkout and cancellation use MongoDB transactions, so use a replica set (MongoDB Atlas provides one).
- SMTP credentials for registration email OTP.
- Cloudflare R2 credentials and a public bucket domain for seller image uploads.
- Docker Desktop / Docker Engine with the Compose plugin, if using containers.

## Run locally

### 1. Configure the API

Copy the example files and set the API environment variables:

```sh
cp server/.env.example server/.env
cp client/.env.example client/.env.local
```

Set `MONGO_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in `server/.env`. Use independent, random values for the JWT secrets and `OTP_HASH_SECRET`.

Configure these variables to enable registration OTP email:

```dotenv
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
OTP_HASH_SECRET=
```

R2 variables are required for image uploads. `R2_PUBLIC_URL` must be the public custom domain for the bucket, not the private S3 API endpoint:

```dotenv
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

Set `CLIENT_URL` to the frontend origin. The local default is `http://localhost:5173`.

### 2. Start the API

Make sure MongoDB is running and set its connection string in `server/.env` (for example, `mongodb://127.0.0.1:27017/fieldhouse` for a suitable local replica set).

```sh
cd server
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. Check `http://localhost:5000/api/v1/health` to verify that it is responding.

### 3. Start the frontend

In another terminal:

```sh
cd client
npm install
npm run dev
```

Open the URL printed by Vite. The default API base URL is `http://localhost:5000/api/v1`; override it with `VITE_API_URL` in `client/.env.local` if needed.

## Demo data

The optional image dataset lives under `dataset/img`. It contains synthetic product images and scripts to generate product records and synchronize them with MongoDB and Cloudflare R2. See [dataset/README.md](dataset/README.md) before running the sync script. The process requires server dependencies and values in `server/.env`, including working MongoDB and R2 settings.

The dataset sync creates these local demo accounts with the shared password `Password123!`:

| Role | Email |
| --- | --- |
| Admin | `admin@fieldhouse.local` |
| Seller | `nike@fieldhouse.local` |
| Seller | `adidas@fieldhouse.local` |

The dataset also has 10 synthetic user accounts that use `DatasetTest123!`. Existing dataset user profiles and seller ownership are preserved. Demo credentials are for local development only; never seed or use them in a public environment.

## Docker Compose

Compose starts MongoDB, the API, and the static frontend. The frontend's Nginx proxy routes API and Socket.IO traffic to the API service on the internal network. MongoDB is not published to the host, and its data is stored in the `mongo_data` volume.

1. Copy `docker.env.example` to `.env`.
2. Replace the MongoDB password and all JWT/OTP secrets with independent random values. Use an alphanumeric MongoDB password because Compose places it in a MongoDB URI.
3. Set `CLIENT_URL` to the exact site origin. Configure SMTP and R2 variables if email OTP and image uploads are needed.
4. Start the stack from the repository root:

   ```sh
   docker compose up --build -d
   ```

The site is available at `http://localhost:8080` by default. Set `APP_PORT` in `.env` to use a different host port. Compose does not automatically load demo records.

The bundled MongoDB container currently runs as a standalone instance. COD checkout and cancellation use transactions, so those flows require a replica-set MongoDB connection; use MongoDB Atlas or configure the local MongoDB service as a replica set for end-to-end order testing.

`docker compose down` stops and removes the containers but keeps the database volume. `docker compose down -v` also deletes the MongoDB data. The Compose setup serves HTTP; place it behind a TLS-enabled reverse proxy before using a public domain.

## Deploying the API to Render

For a Render **Web Service** configured from the `server` directory:

- **Root Directory:** `server`
- **Build Command:** `npm install` (or `npm ci` when using the committed lockfile)
- **Start Command:** `npm run start`
- **Health Check Path:** `/api/v1/health`

Set `MONGO_URI`, `CLIENT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `OTP_HASH_SECRET` in the Render environment. Add SMTP and R2 variables when those features are enabled. The server listens on Render's `PORT` and binds to `0.0.0.0`.

Render's Free web services spin down after 15 minutes without inbound traffic; the next request may take about a minute to wake the service. A deploy that fails health checks can time out even if the build succeeded. See [Render health checks](https://render.com/docs/health-checks) and [Free instance limitations](https://render.com/docs/free).

For a separate frontend deployment, deploy `client` as a static site and set `VITE_API_URL` to the public API URL including `/api/v1`. Configure the API's `CLIENT_URL` to the frontend origin. For WebSocket chat, allow Socket.IO traffic through the same API origin.

## Pages and roles

| Path | Purpose |
| --- | --- |
| `/` | Storefront home |
| `/products` | Searchable product catalog |
| `/products/:productId` | Product details and seller information |
| `/stores/slug/:slug` | Public seller storefront |
| `/cart`, `/checkout`, `/orders` | Cart, COD checkout, and customer orders |
| `/profile`, `/wishlist` | Customer profile, addresses, and saved products |
| `/seller`, `/seller/messages` | Seller studio and seller chat |
| `/admin`, `/admin/messages` | Admin workspace and support inbox |
| `/login`, `/register` | Authentication and email OTP registration |

New seller products require admin approval before appearing in the public catalog. The admin manages order fulfillment statuses. After an order is delivered, each seller confirms the COD payment for their store; a multi-store order is marked paid after all participating stores confirm.

## API overview

All REST endpoints use the `/api/v1` prefix. Protected endpoints require `Authorization: Bearer <accessToken>` unless they use the refresh-token flow.

| API area | Base path | Capabilities |
| --- | --- | --- |
| Health | `/health` | Service status |
| Authentication | `/auth` | OTP registration, login, refresh, logout, current user |
| Products and categories | `/products`, `/categories` | Catalog search, product details, seller product management, category data |
| Stores | `/stores` | Public store pages and seller store management |
| Cart and orders | `/cart`, `/orders` | Cart management, COD checkout, order history, seller order/payment actions |
| Customer data | `/users`, `/users/me/addresses`, `/wishlist` | Profile, address book, saved products |
| Reviews | `/reviews` | Product reviews for eligible delivered orders |
| Chat | `/chat` | Conversation REST API; live messages use Socket.IO |
| Uploads and media | `/uploads`, `/media` | Presigned R2 uploads and image delivery |
| Administration | `/admin` | Seller/store/product review and order fulfillment |

Chat clients connect to the Socket.IO server on the API origin. The server authenticates sockets with the current access token; customer and seller support conversations are private to their participants, while the support inbox is available to admins.

## Development checks

Run these from their respective directories:

```sh
# client/
npm run lint
npm run build

# server/
node --check src/server.js
```

The repository currently has no automated test script.

## Project documentation

- [Vietnamese README](docs/README.md)
- [Dataset setup and synchronization](dataset/README.md)
