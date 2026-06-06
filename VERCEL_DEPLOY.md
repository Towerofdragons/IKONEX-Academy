# Deploying Frontend to Vercel Setup Guide

This guide describes how to deploy the React Vite frontend client of the Ikonex Academy Student Management System to [Vercel](https://vercel.com/), while keeping the backend hosted on Render or Railway.

---

## Step 1: Import Project to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/) and click **Add New** > **Project**.
2. Connect your GitHub account and import this repository.

---

## Step 2: Configure Project Settings
In Vercel's import panel, configure the following settings:
- **Framework Preset**: select `Vite`
- **Root Directory**: edit and change this to `frontend` (so Vercel builds within the `/frontend` subfolder instead of the project root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## Step 3: Configure Environment Variables
Expand the **Environment Variables** section and define:
- **Key**: `VITE_API_BASE_URL`
- **Value**: Set this to your deployed backend API's public URL with `/api` appended (e.g., `https://ikonex-backend.onrender.com/api` or `https://ikonex-backend.up.railway.app/api`).

*(Note: Vite embeds environment variables at build-time. Defining this variable ensures the production build connects to your production backend instead of localhost).*

---

## Step 4: Deploy & Verify
1. Click **Deploy**. Vercel will install dependencies, build the assets, and deploy them.
2. Once complete, click the generated deployment domain to open the live application.
3. Verify that the dashboard stats successfully fetch from the production database via the backend API.
