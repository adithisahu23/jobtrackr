<div align="center">

# 🚀 JobTrackr

### Your Personal Job Search Command Center

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-jobtrackr--gamma.vercel.app-blue?style=for-the-badge)](https://jobtrackr-gamma.vercel.app)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Stop losing track of job applications in spreadsheets.**  
JobTrackr gives you a Kanban board, interview timeline, and analytics dashboard — all in one place.

[🎯 Try Live Demo](https://jobtrackr-gamma.vercel.app) · [🐛 Report Bug](https://github.com/adithisahu23/jobtrackr/issues) · [✨ Request Feature](https://github.com/adithisahu23/jobtrackr/issues)

</div>

---

## 🎥 Demo

> **Live Demo Login:** `demo@jobtrackr.dev` / `demo1234`  
> (55+ pre-seeded applications with full interview history — no signup needed to explore)

| Kanban Board | Analytics Dashboard |
|---|---|
| Drag & drop applications across stages | Charts for conversion rates & trends |

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗂️ **Kanban Board** | Drag applications across Wishlist → Applied → Screening → Interview → Offer → Rejected |
| 📊 **Analytics Dashboard** | Response rate, interview rate, offer conversion, 6-month trends, source effectiveness |
| 🔍 **Smart Search** | Search across company, role, location, and notes instantly |
| 📅 **Interview Tracker** | Log every round — type, interviewer, outcome, scheduled time |
| 🔐 **JWT Auth** | Secure register/login with bcrypt password hashing |
| ⚡ **Optimistic UI** | Kanban drag feels instant — no waiting for server response |
| 📱 **Responsive** | Works on desktop and mobile |
| 🌱 **Demo Data** | 55+ realistic applications seeded out of the box |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript** — Component-based UI with full type safety
- **Vite** — Lightning fast dev server and builds
- **Tailwind CSS v4** — Utility-first styling with custom design tokens
- **Recharts** — Analytics charts (Area, Pie, Bar)
- **@hello-pangea/dnd** — Accessible drag-and-drop for Kanban
- **React Router v6** — Client-side routing with protected routes
- **Axios** — HTTP client with JWT interceptors

### Backend
- **Node.js + Express** — REST API with TypeScript
- **node-postgres (pg)** — Raw parameterized SQL — no ORM, full control
- **JWT + bcryptjs** — Secure authentication
- **Zod** — Runtime request validation
- **Helmet + express-rate-limit** — Security hardening

### Database & DevOps
- **PostgreSQL** — Relational database with proper indexes and triggers
- **Docker** — Containerized backend with auto-migration on boot
- **Render** — Backend + managed Postgres hosting
- **Vercel** — Frontend hosting with SPA routing

---

## 📁 Project Structure

```
jobtrackr/
├── backend/                    Express API (TypeScript)
│   ├── src/
│   │   ├── controllers/        auth, applications, interviews, analytics
│   │   ├── routes/             RESTful route definitions
│   │   ├── middleware/         requireAuth, error handler
│   │   ├── db/                 schema.sql, migrate.ts, seed.ts, pool.ts
│   │   └── utils/              JWT + bcrypt helpers
│   ├── Dockerfile
│   └── docker-entrypoint.sh   auto-migrates on every deploy
├── frontend/                   React app (Vite + TS + Tailwind)
│   └── src/
│       ├── pages/              Board, Applications, Detail, Analytics, Auth
│       ├── components/         Layout, KanbanCard, Modals, StatusBadge
│       ├── context/            AuthContext (JWT state management)
│       └── lib/                axios client, formatters
├── docker-compose.yml          One-command local full stack
└── render.yaml                 Render blueprint (auto-provisions DB + API)
```

---

## 🚀 Getting Started

### Option A — Docker Compose (Recommended)

```bash
git clone https://github.com/adithisahu23/jobtrackr.git
cd jobtrackr

# Start Postgres + Backend
docker compose up --build

# In a new terminal — Start Frontend
cd frontend && npm install && npm run dev

# Seed demo data (one-time)
cd backend && npm run seed
```

### Option B — Manual Setup

**1. Clone the repo**
```bash
git clone https://github.com/adithisahu23/jobtrackr.git
cd jobtrackr
```

**2. Backend setup**
```bash
cd backend
npm install
cp .env.example .env        # Add your DATABASE_URL
npm run migrate             # Create tables
npm run seed                # Optional: 55+ demo applications
npm run dev                 # Runs on http://localhost:4000
```

**3. Frontend setup**
```bash
cd frontend
npm install
cp .env.example .env        # Set VITE_API_URL=http://localhost:4000
npm run dev                 # Runs on http://localhost:5173
```

---

## ☁️ Deployment

### Backend → Render
1. Push repo to GitHub
2. Render → **New → Blueprint** → select repo
3. `render.yaml` auto-provisions web service + Postgres database
4. On first boot, migrations run automatically via `docker-entrypoint.sh`

### Frontend → Vercel
1. Import repo in Vercel → set **Root Directory** to `frontend`
2. Add env variable: `VITE_API_URL` = your Render backend URL
3. Deploy — `vercel.json` handles SPA routing

---

## 📡 API Reference

> All routes require `Authorization: Bearer <token>` except auth and health endpoints.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/auth/me` | Current user |
| `GET` | `/api/applications` | List with search, filter, sort, pagination |
| `POST` | `/api/applications` | Create application |
| `GET` | `/api/applications/:id` | Detail with interviews |
| `PATCH` | `/api/applications/:id` | Update application |
| `PATCH` | `/api/applications/:id/status` | Kanban status update |
| `DELETE` | `/api/applications/:id` | Delete application |
| `GET/POST` | `/api/applications/:id/interviews` | List / add interview rounds |
| `PATCH/DELETE` | `/api/interviews/:id` | Update / delete interview |
| `GET` | `/api/analytics` | Dashboard metrics |

---

## 🔒 Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- JWT tokens signed server-side, 7-day expiry
- All queries **parameterized** — zero SQL injection risk
- **Ownership validation** on every request — users can only access their own data
- **Helmet** headers + **rate limiting** on auth endpoints

---

## 🗺️ Roadmap

- [ ] Job Description Analyzer (skill-match % scoring)
- [ ] Email reminders for upcoming interviews
- [ ] CSV export of all applications
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a PR.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

**Built with ❤️ by [Adithi Sahu](https://github.com/adithisahu23)**

⭐ **Star this repo if you found it helpful!** ⭐

</div>
