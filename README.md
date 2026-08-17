# JobTrackr

A full-stack job application tracker: Kanban workflow, interview tracking, search/filtering, and an analytics dashboard — built with React, TypeScript, Node.js/Express, and PostgreSQL.

**Live demo login:** `demo@jobtrackr.dev` / `demo1234` (55+ seeded applications with interview history)

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, `@hello-pangea/dnd` (Kanban drag-and-drop), React Router |
| Backend | Node.js, Express, TypeScript, JWT auth, `bcryptjs`, `zod` validation |
| Database | PostgreSQL (raw parameterized SQL via `node-postgres` — no ORM black box) |
| Deployment | Frontend → Vercel · Backend + DB → Render/Railway (Docker) |

## Features

- **Auth** — JWT-based register/login, password hashing, protected routes
- **Kanban board** — drag applications across Wishlist → Applied → Screening → Interview → Offer → Rejected, with instant optimistic UI updates
- **Applications table** — full-text search (company/role/location/notes), status filter, sortable columns
- **Interview tracking** — log rounds per application (type, interviewer, outcome, notes) with a timeline view
- **Analytics dashboard** — response/interview/offer conversion rates, 6-month application trend, pipeline breakdown, source effectiveness — all computed server-side and rendered with Recharts
- **55+ demo records** — realistic seed data so the app looks alive out of the box

## Project structure

```
jobtrackr/
├── backend/            Express API (TypeScript, raw SQL/pg)
│   ├── src/
│   │   ├── controllers/  Route handlers (auth, applications, interviews, analytics)
│   │   ├── routes/
│   │   ├── middleware/   requireAuth, centralized error handler
│   │   ├── db/            pool.ts, schema.sql, migrate.ts, seed.ts
│   │   └── utils/         JWT + bcrypt helpers
│   ├── Dockerfile
│   └── docker-entrypoint.sh   (runs migrations, then starts the server)
├── frontend/           React app (Vite + TS + Tailwind)
│   └── src/
│       ├── pages/         Board, Applications, ApplicationDetail, Analytics, Login, Register
│       ├── components/    Layout, KanbanCard, forms, StatusBadge
│       ├── context/       AuthContext
│       └── lib/           axios client, formatters
├── docker-compose.yml  One-command local full stack (Postgres + API)
└── render.yaml         Render blueprint for backend + managed Postgres
```

## Local development

### Option A — Docker Compose (fastest)

```bash
docker compose up --build      # starts Postgres + backend on :4000
cd frontend && npm install && npm run dev   # starts frontend on :5173
```

Then seed demo data once the backend is up:
```bash
cd backend && npm run seed
```

### Option B — Manual

**1. Backend**
```bash
cd backend
npm install
cp .env.example .env          # edit DATABASE_URL if not using local defaults
npm run migrate                # creates tables
npm run seed                   # optional: 55+ demo applications
npm run dev                    # http://localhost:4000
```

**2. Frontend**
```bash
cd frontend
npm install
cp .env.example .env           # VITE_API_URL=http://localhost:4000
npm run dev                    # http://localhost:5173
```

Requires a local PostgreSQL instance (or use Docker Compose above). `DATABASE_URL` format:
```
postgresql://USER:PASSWORD@HOST:5432/jobtrackr?schema=public
```

## Deployment

### Backend → Render (or Railway)

1. Push this repo to GitHub.
2. On Render: **New → Blueprint**, point at the repo — `render.yaml` provisions the web service and a free Postgres database automatically.
   - Or manually: New Web Service → Docker → root directory `backend` → add env vars from `.env.example` (`DATABASE_URL` from your Postgres instance, a strong `JWT_SECRET`, `CORS_ORIGIN` set to your Vercel URL).
3. On first boot, `docker-entrypoint.sh` runs `npm run migrate` automatically before starting the server — no manual migration step needed.
4. To load demo data on the deployed DB, run one-off: `npm run seed` from Render's shell (or point `DATABASE_URL` locally at the remote DB and run it from your machine).

### Frontend → Vercel

1. Import the repo in Vercel, set **root directory** to `frontend`.
2. Add environment variable `VITE_API_URL` = your Render backend URL (e.g. `https://jobtrackr-api.onrender.com`).
3. Deploy — `vercel.json` handles SPA routing rewrites.
4. Back on Render, update `CORS_ORIGIN` to your live Vercel URL and redeploy the backend.

## API overview

All routes except `/health`, `/api/auth/register`, and `/api/auth/login` require `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, returns JWT |
| POST | `/api/auth/login` | Returns JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/applications` | List, with `search`, `status`, `sortBy`, `sortDir`, `page`, `pageSize` query params |
| POST | `/api/applications` | Create |
| GET | `/api/applications/:id` | Detail (includes interviews) |
| PATCH | `/api/applications/:id` | Update fields |
| PATCH | `/api/applications/:id/status` | Fast status-only update for Kanban drag |
| DELETE | `/api/applications/:id` | Delete |
| GET/POST | `/api/applications/:applicationId/interviews` | List / add interview rounds |
| PATCH/DELETE | `/api/interviews/:id` | Update / delete an interview round |
| GET | `/api/analytics` | Aggregated dashboard metrics |

## Security notes

- Passwords hashed with bcrypt (10 rounds)
- JWT signed with a server-side secret, 7-day expiry by default
- All application/interview queries are scoped to the authenticated user (ownership checked server-side, never trusted from the client)
- Parameterized SQL throughout — no string-concatenated queries
- `helmet` + rate limiting on auth endpoints

## Possible next steps

- **Job Description Analyzer** (skill-match scoring) — the original scope item not included in this MVP; would add a `POST /api/applications/:id/analyze` endpoint that tokenizes the stored job description against a user skills profile and returns a match percentage.
- Email reminders for upcoming interviews
- CSV export of applications
- Multi-user team/workspace support
