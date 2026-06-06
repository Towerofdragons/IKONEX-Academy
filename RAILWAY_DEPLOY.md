# Deploying to Railway Setup Guide

This guide describes how to deploy the Ikonex Academy Student Management System (both backend API and React frontend) to [Railway](https://railway.app/).

The repository is fully optimized for Railway deployment:
- **Backend Port Binding**: Automatically binds to the `$PORT` environment variable injected by Railway.
- **PostgreSQL Connection**: Automatically parses the `$DATABASE_URL` environment variable provided by Railway Postgres and configures `Npgsql` connection settings dynamically.
- **Database Migrations**: Automatically runs pending EF Core migrations on application startup.
- **Frontend API Endpoint**: Dynamically connects to the backend API via the `$VITE_API_BASE_URL` environment variable.

---

## Step 1: Provision a Managed PostgreSQL Database
1. Go to your [Railway Dashboard](https://railway.app/) and create a new project.
2. Click **+ New** > **Database** > **Add PostgreSQL**.
3. Railway will spin up a PostgreSQL instance and automatically define a `DATABASE_URL` environment variable in the project.

---

## Step 2: Deploy the Backend API
1. In the same project, click **+ New** > **GitHub Repo** and select this repository.
2. Under the service settings:
   - **Service Name**: e.g., `ikonex-backend`
   - **Root Directory**: `/` (Leave as root `/` to target the .NET application)
3. Go to the **Variables** tab of the backend service:
   - Click **New Variable** > **Add Reference** and select the database service's `DATABASE_URL` (so the backend inherits the dynamic connection string).
4. Railway (using Nixpacks) will automatically detect the .NET 9 API, build it, run EF migrations on startup, and host it.
5. In the backend settings, click **Generate Domain** under the networking panel to expose the public endpoint (e.g., `https://ikonex-backend.up.railway.app`).

---

## Step 3: Deploy the Frontend Client
1. In the same project, click **+ New** > **GitHub Repo** and select the same repository.
2. Under the service settings:
   - **Service Name**: e.g., `ikonex-frontend`
   - **Root Directory**: change it to `/frontend` (so it targets the Vite React project)
3. Go to the **Variables** tab of the frontend service:
   - Define the environment variable:
     - `VITE_API_BASE_URL`: Set this to your backend service's public domain URL with `/api` appended (e.g., `https://ikonex-backend.up.railway.app/api`).
     *(Note: Vite embeds variables at build-time, so this variable must be set before deploying or rebuilding the service).*
4. Under the frontend settings, click **Generate Domain** to get a public URL for your React portal.

---

## Step 4: Verify Deployment
Once both services are active:
1. Open the frontend domain in your browser.
2. The UI will retrieve baseline data from your Railway Postgres database through the backend API.
3. Test creating a stream, enrolling a student, and recording scorecards directly in production!
