# IKONEX Academy — Brief User Guide

The **Ikonex Academy Student Management System (SMS)** is a school administration portal for managing class streams, students, subjects, assessments, leaderboards, and PDF report cards.

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL |
| Backend | .NET 9 (ASP.NET Core Web API) |
| Frontend | React 19 + Vite |
| Hosting | [Render](https://render.com) |

---

## System Overview

```text
Admin Browser  →  React Vite Frontend  →  .NET 9 API  →  PostgreSQL
```

On first startup, the API runs EF Core migrations and seeds a default admin account if none exists:

- **Username:** `admin` (override with `DEFAULT_ADMIN_USERNAME`)
- **Password:** `Admin123!` (override with `DEFAULT_ADMIN_PASSWORD`)

All management endpoints require JWT authentication. Interactive API docs are available at `/swagger` on the backend URL.

---

## 1. Local Setup

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) and npm
- PostgreSQL (local or remote)

### Configure Environment

**Backend** — copy `.env.example` to `.env` in the project root:

```env
PORT=5178
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=IkonexAcademyDb
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
ALLOWED_CORS_ORIGINS=http://localhost:5173
```

Alternatively, edit the connection string in `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=IkonexAcademyDb;Username=postgres;Password=yourpassword"
}
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5178/api
```

### Database

Create the PostgreSQL database, then either run migrations manually:

```bash
dotnet ef database update
```

or start the API — migrations run automatically on startup.

### Run the Application

**Option A — Windows launcher:**

```powershell
.\startall.ps1
```

**Option B — Manual (two terminals):**

```bash
# Terminal 1 — Backend
dotnet run

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5178/api` |
| Swagger docs | `http://localhost:5178/swagger` |

---

## 2. Deployment on Render

The backend is cloud-ready: it binds to Render's `PORT`, parses `DATABASE_URL`, runs EF migrations on startup, and seeds the first admin if the database is empty.

> **Important:** Render does not support native .NET/C# deployment. To deploy the .NET 9 backend on Render, you **must use a Docker container**. The project includes a pre-configured `dockerfile` for this purpose.

### Step 1 — Provision PostgreSQL

1. In the [Render Dashboard](https://dashboard.render.com/), create a **PostgreSQL** instance.
2. Copy the database URL — Render exposes it as `DATABASE_URL`.

### Step 2 — Deploy the Backend API (Docker Container)

1. **New → Web Service** → connect this GitHub repository.
2. Configure the service:

| Setting | Value |
|---------|-------|
| Runtime | Docker |
| Root Directory | `/` (repo root) |
| Docker Context | `/` (repo root) |
| Dockerfile Path | `./dockerfile` |

3. Set environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | From Render Postgres (link or paste) |
| `DEFAULT_ADMIN_USERNAME` | Initial admin username (optional) |
| `DEFAULT_ADMIN_PASSWORD` | Initial admin password (optional) |
| `ALLOWED_CORS_ORIGINS` | Frontend URL, e.g. `https://ikonex-frontend.onrender.com` |

4. Generate a public URL (e.g. `https://ikonex-backend.onrender.com`).

> The `dockerfile` uses a multi-stage build process with the official .NET SDK image for building and the lightweight ASP.NET runtime image for running. Render automatically injects the `PORT` environment variable, which the application uses to bind to the correct port.

### Step 3 — Deploy the Frontend

1. **New → Static Site** (or Web Service) → connect the same repository.
2. Configure the service:

| Setting | Value |
|---------|-------|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

3. Set the build-time environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://ikonex-backend.onrender.com/api` |

> Vite embeds environment variables at build time. Rebuild the frontend whenever the backend URL changes.

### Step 4 — Verify Deployment

Run the included test script:

```powershell
.\test_render.ps1 -RenderUrl "https://ikonex-backend.onrender.com"
```

Or open the frontend URL, sign in, and confirm the dashboard displays stream, student, and subject counts.

---

## 3. System Usage

Sign in at the login screen. The session token is stored in browser `localStorage` and sent with every API request.

### Recommended Workflow

```text
1. Create subjects      →  Subject Deck
2. Create streams       →  Stream Manager
3. Assign subjects      →  Stream Manager → Manage stream
4. Register students    →  Student Roster
5. Record scores        →  Scoring Board
6. Generate reports     →  Stream Manager → Process Leaderboard
7. Export PDFs          →  Student Profile or Class Leaderboard
```

### Navigation

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Overview counts for streams, students, and subjects |
| **Stream Manager** | Create streams, assign subjects, view enrollments, run leaderboards |
| **Student Roster** | Register, edit, and delete students; view profiles and report cards |
| **Subject Deck** | Create and manage syllabus subjects |
| **Scoring Board** | Record CA and exam scores per student and subject |
| **Admin Deck** | Register additional admin accounts |

### Scoring Rules

- **CA score:** 0–30
- **Exam score:** 0–70
- **Total:** CA + Exam (max 100)
- One score entry per student per subject (duplicates are rejected)

### Grading Scale

Grades are computed from a student's average across all subjects assigned to their stream:

| Average | Grade |
|---------|-------|
| ≥ 80 | A |
| ≥ 70 | B |
| ≥ 60 | C |
| ≥ 50 | D |
| < 50 | E |

### Leaderboards & Reports

In **Stream Manager**, select a stream and click **Process Leaderboard Report**:

- Ranks use standard competition ranking (ties share a rank; the next rank is skipped).
- Filter by overall class performance or a single subject.
- Download a class performance PDF from the leaderboard view.
- Open a student profile from **Student Roster** to view their transcript and download an individual PDF report card.

### Admin & Security

- JWT tokens expire after 24 hours.
- Write actions (create, edit, delete) are recorded in database audit logs.
- New admin accounts are created from **Admin Deck** by an authenticated admin.

---

## 4. API Quick Reference

All endpoints except `POST /api/auth/login` require the header:

```text
Authorization: Bearer <token>
```

| Area | Key Endpoints |
|------|---------------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register` |
| Streams | `GET/POST /api/streams`, `GET /api/streams/{id}` |
| Students | `GET/POST /api/students`, `PUT/DELETE /api/students/{id}` |
| Subjects | `GET/POST /api/subjects`, assign via `POST/DELETE /api/streams/{streamId}/subjects/{subjectId}` |
| Scores | `POST /api/scores`, `PUT /api/scores/{id}` |
| Reports | `GET /api/reports/stream/{streamId}?subjectId={optional}` |

Full interactive documentation: `https://your-backend.onrender.com/swagger`

---

## 5. Troubleshooting

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| "API Connection Offline" in UI | Backend down or wrong API URL | Confirm backend is running; rebuild frontend with correct `VITE_API_BASE_URL` |
| CORS errors in browser | Frontend origin not allowed | Set `ALLOWED_CORS_ORIGINS` to your frontend URL |
| Login fails | Wrong credentials or DB not connected | Use default admin credentials or check `DATABASE_URL` / connection string |
| Empty dashboard after login | Auth succeeded but data fetch failed | Check Render service logs and database connectivity |
| Duplicate score error | Score already exists for that student and subject | Edit the existing score in **Scoring Board** |

---

## Project Structure

```text
IKONEX-Academy/
├── Controllers/     # REST API endpoints
├── Data/            # EF Core DbContext
├── Entities/        # Database models
├── Services/        # Reports and scoring logic
├── frontend/        # React Vite admin UI
├── Migrations/      # EF Core schema migrations
├── Program.cs       # App entry, auth, DB, CORS
├── startall.ps1     # Local dev launcher
└── dockerfile       # Container build for backend
```

For deeper backend technical documentation, see [backend.md](backend.md).
