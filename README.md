# Hostel Management Platform

## Hosting

For the recommended production deployment stack:

- `client/` on Vercel
- `server/` on Render
- Neon for PostgreSQL
- Upstash for Redis

use [HOSTING.md]().

Full-stack hostel management monorepo with:

- `client`: React + Vite + TypeScript frontend
- `server`: NestJS + Prisma + PostgreSQL backend

The project includes:

- JWT auth with student, warden, and admin roles
- Room listing and room allocation views
- Named complaints and anonymous complaints
- Image upload via Cloudinary
- AI chatbot via Gemini (RAG-enabled)
- Real-time notifications via Socket.IO

## Current Sign-In Issue

If you cannot sign in, the main reason is:

- the frontend is running on `http://localhost:5173`
- but the backend API on `http://localhost:3001/api/v1` is not reachable
- the backend cannot start correctly until PostgreSQL is running on `localhost:5432`

Earlier checks showed:

- frontend: reachable
- backend API: not reachable
- Prisma seed: failed because PostgreSQL at `localhost:5432` was unavailable

That means login will fail until the database is running and the backend migration/seed completes.

## Project Structure

```text
hostel-platform/
├── client/   React frontend
├── server/   NestJS backend
└── README.md
```

## Tech Stack

### Frontend

- React 19
- Vite
- TypeScript
- React Router
- TanStack Query
- Zustand
- Framer Motion
- Recharts
- React Hook Form + Zod
- Socket.IO client

### Backend

- NestJS
- Prisma
- PostgreSQL
- JWT auth
- Socket.IO
- Cloudinary
- LLM

## Roles

- `STUDENT`
- `WARDEN`
- `ADMIN`

## Main Features

### Student

- Sign in and register
- View current room allocation
- Submit named complaints
- Submit anonymous complaints
- Track complaint by token
- Use AI chatbot

### Warden

- View room stats
- View complaint activity
- Update complaint statuses

### Admin

- Dashboard overview
- Room management
- Complaint administration
- Notification flow on complaint updates

## Environment Variables

### `server/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hostel_platform"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="hostel-jwt-secret-change-in-prod-2026"
JWT_REFRESH_SECRET="hostel-refresh-secret-change-in-prod-2026"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_CHAT_MODEL="gemini-1.5-flash"
GEMINI_EMBED_MODEL=""
GEMINI_API_BASE_URL="https://generativelanguage.googleapis.com"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
HASH_SALT="sau-hostel-anon-salt-2026"
HOSTEL_NAME="SAU International Hostel"
PORT=3001
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### `client/.env`

```env
VITE_API_URL="http://localhost:3001"
VITE_SOCKET_URL="http://localhost:3001"
```

## Prerequisites

Install these before running the project:

- Node.js 20+ or newer
- npm
- PostgreSQL running locally on port `5432`
- PostgreSQL database named `hostel_platform`
- `pgvector` extension available in PostgreSQL

Optional but used by features:

- Redis on `localhost:6379`
- Cloudinary account
- Gemini API key (chatbot)

## Database Setup

### 1. Start PostgreSQL

Make sure PostgreSQL is running locally on:

```text
localhost:5432
```

### 2. Create the database

Run this in PostgreSQL:

```sql
CREATE DATABASE hostel_platform;
```

### 3. Enable `pgvector`

Inside that database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

If `vector` cannot be created, install the `pgvector` extension for your PostgreSQL installation first.

## Install Dependencies

From the repo root:

```bash
cd hostel-platform
```

Install frontend and backend dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

## Backend Setup

From `hostel-platform/server`:

### 1. Generate Prisma client

```bash
npx prisma generate
```

### 2. Run migration

```bash
npx prisma migrate dev --name init
```

### 3. Seed demo data

```bash
npx prisma db seed
```

If migration or seed fails with:

```text
Can't reach database server at localhost:5432
```

then PostgreSQL is not running or the connection string in `server/.env` is wrong.

## Demo Accounts

These are created by the seed script:

- Admin: `admin@sau.ac.in` / `admin123`
- Warden: `warden@sau.ac.in` / `warden123`
- Student: `student@sau.ac.in` / `student123`

Important:

- these accounts do not exist until `npx prisma db seed` succeeds
- if seed fails, login will fail even if the backend starts

## Run the App

### Start backend

From `hostel-platform/server`:

```bash
npm run start:dev
```

Expected backend URLs:

- API root: `http://localhost:3001/api/v1`
- Swagger docs: `http://localhost:3001/api/docs`

### Start frontend

From `hostel-platform/client`:

```bash
npm run dev
```

Expected frontend URL:

- `http://localhost:5173`

## Correct Run Order

Use this order:

1. Start PostgreSQL
2. Create `hostel_platform` database if missing
3. Enable `vector` extension
4. Run `npx prisma generate`
5. Run `npx prisma migrate dev --name init`
6. Run `npx prisma db seed`
7. Run `npm run start:dev` in `server`
8. Run `npm run dev` in `client`
9. Open `http://localhost:5173`
10. Sign in with `admin@sau.ac.in / admin123`

## How Auth Works

Frontend login flow:

- login page posts to `/auth/login`
- backend returns `accessToken`
- frontend stores it in `localStorage`
- refresh token is stored in an HTTP-only cookie
- subsequent API requests use `Authorization: Bearer <token>`

If login fails, check:

- backend is reachable on port `3001`
- database is running
- migration completed
- seed completed
- demo account exists

## Available Frontend Routes

### Public

- `/login`
- `/register`
- `/track`

### Protected

- `/dashboard`
- `/my-room`
- `/complaints`
- `/complaints/anonymous`
- `/rooms`
- `/admin/complaints`
- `/maintenance`

## Implemented Backend Endpoints

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Rooms

- `GET /api/v1/rooms`
- `GET /api/v1/rooms/:id`
- `GET /api/v1/rooms/stats`
- `POST /api/v1/rooms`
- `POST /api/v1/rooms/allocate`
- `DELETE /api/v1/rooms/deallocate/:userId`

### Complaints

- `GET /api/v1/complaints`
- `POST /api/v1/complaints`
- `POST /api/v1/complaints/anonymous`
- `GET /api/v1/complaints/mine`
- `GET /api/v1/complaints/track/:token`
- `PATCH /api/v1/complaints/:id/status`

### Upload

- `POST /api/v1/upload/image`

### Chatbot

- `POST /api/v1/chatbot/message`

### Dashboard

- `GET /api/v1/dashboard/admin-stats`

## Feature Notes

### Anonymous Complaints

- anonymous complaints do not store `userId` on the complaint row
- identity is stored separately as a salted hash
- tracking happens through the complaint token

### Chatbot

- chatbot uses Gemini + embeddings-based RAG over `KnowledgeBase`
- it uses basic intent classification
- it reads live room/complaint data where relevant
- if KB embeddings are missing, it can lazily embed a few entries or fall back to keyword search

### Notifications

- complaint status updates create notifications
- notifications are emitted over Socket.IO

## Known Limitations

- Login will not work until PostgreSQL is running and seeded
- Redis is configured but not actively required for the current happy path
- Maintenance and announcements backend CRUD are not fully built yet
- Cloudinary upload needs valid account credentials
- Gemini chatbot needs a valid `GEMINI_API_KEY` (and ideally pre-indexed KB embeddings)

## Quick Troubleshooting

### Frontend opens but login fails

Check:

- `http://localhost:3001/api/v1` is reachable
- backend terminal has no Prisma connection errors
- `npx prisma db seed` completed successfully

### Prisma migrate fails

Likely causes:

- PostgreSQL not running
- wrong `DATABASE_URL`
- `pgvector` extension missing

### Seed fails

Likely causes:

- migration not applied
- database unreachable

### Upload fails

Likely causes:

- invalid Cloudinary keys
- file too large
- unsupported image type

### Chatbot fails

Likely causes:

- missing `GEMINI_API_KEY`
- KB embeddings not indexed yet (run `POST /api/v1/chatbot/kb/reindex` as an admin/warden)

## Current Status

What is working now in code:

- frontend build passes
- backend build passes
- routing and UI are implemented
- auth, complaints, anonymous complaints, chatbot, and notifications are wired

What still blocks real login on your machine:

- PostgreSQL is not reachable at `localhost:5432`
- backend API is not currently live on `localhost:3001`
- seed data has not been created successfully

## Next Step For You

Do this first:

1. Start PostgreSQL
2. Create database `hostel_platform`
3. Enable `vector` extension
4. Run:

```bash
cd hostel-platform/server
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

Then in another terminal:

```bash
cd hostel-platform/client
npm run dev
```

Then open:

```text
http://localhost:5173
```

and sign in with:

```text
admin@sau.ac.in / admin123
```
