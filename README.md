# IKONEX Academy Student Management System

A comprehensive school administration portal for managing class streams, students, subjects, assessments, leaderboards, and PDF report cards.

## 🚀 Quick Start

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `Admin123!`

> **Note:** On first startup, the API automatically seeds this default admin account if none exists. These credentials can be overridden via environment variables `DEFAULT_ADMIN_USERNAME` and `DEFAULT_ADMIN_PASSWORD`.

### Local Development

**Prerequisites:**
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) and npm
- PostgreSQL (local or remote)

**Quick Start (Windows):**
```powershell
.\startall.ps1
```

**Manual Setup:**
```bash
# Terminal 1 - Backend
dotnet run

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

**Access URLs:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5178/api`
- Swagger Docs: `http://localhost:5178/swagger`

## Features

- **Stream Management** - Create class streams and assign subjects
- **Student Registration** - Enroll students with unique registration numbers
- **Subject Management** - Configure syllabus subjects with codes
- **Assessment Scoring** - Record Continuous Assessment (0-30) and Exam (0-70) scores
- **Leaderboard Generation** - Automatic class rankings with competition ranking (1224 rule)
- **PDF Reports** - Export individual student report cards and class performance PDFs
- **Admin Management** - Register additional administrator accounts
- **Audit Logging** - All write actions are logged for accountability

## Tech Stack

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL |
| Backend | .NET 9 (ASP.NET Core Web API) |
| Frontend | React 19 + Vite |
| Icons | Lucide React |
| PDF Generation | jsPDF + AutoTable |

## Documentation

- **[User Guide](USER_GUIDE.md)** - Comprehensive setup, deployment, and usage instructions
- **[Backend Documentation](backend.md)** - Technical architecture, API endpoints, and database schema

## Deployment

### Render Deployment

The application is cloud-ready for [Render](https://render.com) deployment:

1. **PostgreSQL** - Create a PostgreSQL instance on Render
2. **Backend** - Deploy as a Web Service with environment variables:
   - `DATABASE_URL` - From Render Postgres
   - `ALLOWED_CORS_ORIGINS` - Frontend URL
3. **Frontend** - Deploy as a Static Site with:
   - `VITE_API_BASE_URL` - Backend URL

See [USER_GUIDE.md](USER_GUIDE.md) for detailed deployment instructions.

## Security

- JWT authentication with 24-hour token expiration
- CORS configuration for cross-origin requests
- Database-level constraints for data integrity
- Audit logging for all write operations
- Environment variable configuration for secrets

## Grading Scale

| Average | Grade |
|---------|-------|
| ≥ 80 | A |
| ≥ 70 | B |
| ≥ 60 | C |
| ≥ 50 | D |
| < 50 | E |

## Recommended Workflow

1. Create subjects → Subject Deck
2. Create streams → Stream Manager
3. Assign subjects → Stream Manager → Manage stream
4. Register students → Student Roster
5. Record scores → Scoring Board
6. Generate reports → Stream Manager → Process Leaderboard
7. Export PDFs → Student Profile or Class Leaderboard

## Project Structure

```
IKONEX-Academy/
├── Controllers/     # REST API endpoints
├── Data/            # EF Core DbContext
├── Entities/        # Database models
├── DTOs/            # Data transfer objects
├── Services/        # Reports and scoring logic
├── Middleware/      # Global exception handling
├── frontend/        # React Vite admin UI
├── Migrations/      # EF Core schema migrations
├── Program.cs       # App entry, auth, DB, CORS
├── startall.ps1     # Local dev launcher
└── dockerfile       # Container build for backend
```

## Testing

Run the Render deployment test script:
```powershell
.\test_render.ps1 -RenderUrl "https://your-backend.onrender.com"
```


## Support

For detailed troubleshooting and API documentation, see [USER_GUIDE.md](USER_GUIDE.md).
