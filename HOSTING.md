# Hosting Guide

This project is prepared for the following stack:

- `client/` on Vercel
- `server/` on Render
- PostgreSQL on Neon
- Redis on Upstash

Recommended domain layout:

- `app.yourdomain.com` -> Vercel frontend
- `api.yourdomain.com` -> Render backend

Use subdomains under the same custom domain. The app uses an HTTP-only refresh-token cookie with `sameSite: 'strict'`, so keeping frontend and API on the same site family is the safest setup.

## 1. Create Managed Services

### Neon

Create a Neon project and copy the pooled connection string from the Neon dashboard.

Set it as:

```env
DATABASE_URL=postgresql://USER:PASSWORD@ep-example-region.aws.neon.tech/hostel_platform?sslmode=require
```

### Upstash

Create an Upstash Redis database and copy the TLS Redis URL.

Set it as:

```env
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST:6379
```

## 2. Deploy Backend to Render

This repo includes [render.yaml](/c:/Users/amarr/OneDrive/Desktop/smarthack/HM/hostel-platform/render.yaml).

### Render setup

1. In Render, create a new Web Service from your GitHub repo.
2. Render should detect the Blueprint file automatically, or you can create the service manually with:
   - Root Directory: `server`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm run start:render`
3. Set the following environment variables in Render:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=10000
DATABASE_URL=<your Neon connection string>
REDIS_URL=<your Upstash TLS Redis URL>
CLIENT_URL=https://app.yourdomain.com,https://your-vercel-project.vercel.app
JWT_SECRET=<strong-random-string>
JWT_REFRESH_SECRET=<strong-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
HASH_SALT=<strong-random-string>
HOSTEL_NAME=South Asian University Hostel
ANTHROPIC_API_KEY=<optional if chatbot is enabled>
CLOUDINARY_CLOUD_NAME=<optional if uploads are enabled>
CLOUDINARY_API_KEY=<optional if uploads are enabled>
CLOUDINARY_API_SECRET=<optional if uploads are enabled>
SERVER_PUBLIC_URL=https://api.yourdomain.com
```

### Important Render notes

- `npm run start:render` runs `prisma migrate deploy` before starting the Nest app.
- The backend health endpoint is `GET /api/v1/health`.
- If you use the free Render plan, the first request after inactivity may be slow because of cold starts.
- If Cloudinary keys are missing, uploads fall back to local `/uploads` files served by the API.

### Seed the production database

Render startup runs migrations, not seed data. Run the seed once from a shell with the same `DATABASE_URL`, for example on your machine:

```bash
cd server
$env:DATABASE_URL="your_neon_database_url"
npx prisma db seed
```

Do this once per environment if you want the demo accounts and sample data.

## 3. Deploy Frontend to Vercel

This repo includes [client/vercel.json](/c:/Users/amarr/OneDrive/Desktop/smarthack/HM/hostel-platform/client/vercel.json).

### Vercel setup

1. Create a new Vercel project from the same GitHub repo.
2. Set the Root Directory to `client`.
3. Vercel will use the Vite preset automatically.
4. Add these environment variables:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
```

### Why the Vercel config matters

The frontend is a client-side React app. The rewrite rule in `client/vercel.json` sends unknown routes back to `index.html`, so routes like `/dashboard` or `/complaints/anonymous` still work on refresh.

## 4. Connect Your Custom Domain

### Frontend

Point `app.yourdomain.com` to Vercel using the DNS records Vercel gives you.

### Backend

Point `api.yourdomain.com` to Render using the DNS records Render gives you.

After DNS is active:

- update Vercel env vars to use `https://api.yourdomain.com`
- update Render `CLIENT_URL` to include the final Vercel production URL and your custom frontend domain

## 5. Production Checklist

- Backend is reachable at `https://api.yourdomain.com/api/v1/health`
- Swagger opens at `https://api.yourdomain.com/api/docs`
- Frontend loads at `https://app.yourdomain.com`
- Login works and sets a refresh cookie
- Socket notifications connect from the frontend to the backend
- Demo seed data exists if you want judge-ready accounts

## 6. Local-to-Hosted Variable Mapping

Use these files as templates:

- [server/.env.example](/c:/Users/amarr/OneDrive/Desktop/smarthack/HM/hostel-platform/server/.env.example)
- [client/.env.example](/c:/Users/amarr/OneDrive/Desktop/smarthack/HM/hostel-platform/client/.env.example)

## 7. Troubleshooting

### Frontend loads but login fails

Check:

- `VITE_API_URL` points to the live Render API
- Render `CLIENT_URL` includes the Vercel URL
- the backend health endpoint is returning `200`
- the database was seeded if you are trying demo accounts

### Refresh token works locally but not in production

Check:

- frontend and backend are on subdomains of the same custom domain
- both use `https`
- Render `CLIENT_URL` includes the exact frontend origin

### WebSocket notifications do not connect

Check:

- `VITE_SOCKET_URL` matches the backend domain
- the backend `CLIENT_URL` env var includes the frontend origin
- the browser has a valid access token in local storage
