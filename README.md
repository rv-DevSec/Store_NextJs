# Car Parts Store - فروشگاه آنلاین قطعات خودرو

Full-stack e-commerce platform for auto parts with admin and seller dashboards.

## Architecture

- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- **Backend**: Express.js + MongoDB (Mongoose)
- **Payments**: Zarinpal gateway, Card-to-Card, Cash on Delivery

## Development

```bash
# Install all dependencies
npm install

# Run both server & client with hot reload
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Production

### Option 1: PM2 (recommended for VPS)

```bash
# Install dependencies
npm install && cd server && npm install && cd ../client && npm install

# Build client
cd client && npm run build

# Set environment variables (copy .env.example to server/.env)
cp .env.example server/.env
# Edit server/.env with your real values

# Start both services
pm2 start ecosystem.config.js

# Save PM2 process list for auto-start on reboot
pm2 save
pm2 startup
```

### Option 2: Docker Compose

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your real values

# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## Environment Variables

### Server (`server/.env` or `.env`)

```env
MONGO_URI=mongodb://localhost:27017/carparts
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
ZARINPAL_MERCHANT_ID=your-merchant-id
PORT=5000
```

### Client (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Scripts

**Root:**
- `npm run dev` — Run both server & client
- `npm run build` — Build client
- `npm run start` — Start server in production
- `npm run prod` — Alias for start with NODE_ENV=production

**Server (`server/`):**
- `npm run dev` — Nodemon with hot reload
- `npm start` — Node production server
- `npm run seed` — Seed database

**Client (`client/`):**
- `npm run dev` — Next.js dev server
- `npm run build` — Production build (standalone output)
- `npm run start` — Start Next.js production server

## Deployment Notes

- Next.js uses `output: 'standalone'` for optimized Docker images
- API proxy configured in `next.config.ts` (rewrites `/api/*` and `/uploads/*` to backend)
- PM2 uses cluster mode for the API to utilize all CPU cores
- Nginx config provided for reverse proxy with SSL support
- MongoDB data persisted via Docker volume in compose setup
