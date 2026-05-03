# Frontend Deployment Guide - Vercel.com

This guide will help you deploy the main client-facing website on Vercel.com.

---

## Prerequisites

1. A Vercel account (free tier available)
2. Your Supabase project credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Your deployed backend API URL from Render

---

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

**Option A: Separate Repository (Recommended)**
1. Create a new GitHub repository (e.g., `my-frontend`)
2. Copy all files and folders inside the `frontend` folder
3. Push them to your new repository root
4. Your repository should have: `package.json`, `vite.config.js`, `src/`, `public/`, etc. at the root

**Option B: Monorepo Approach**
1. Push this entire project to GitHub
2. When configuring Vercel, set **Root Directory** to `frontend`
3. Vercel will only build from that folder

**Files Included:**
- `src/` - React components and pages
- `public/` - Static assets (icons, images, robots.txt)
- `package.json` - Dependencies
- `vite.config.js` - Build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `vercel.json` - Vercel routing configuration (already included!)
- `index.html` - HTML entry point

### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** then **"Project"**
3. Click **"Import"** next to your GitHub repository

### Step 3: Configure Project Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `.` (leave default) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 4: Add Environment Variables

In the **"Environment Variables"** section, add:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_API_URL` | Your Render backend URL (e.g., `https://your-backend.onrender.com`) |

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 1-3 minutes)
3. Your site will be live at: `https://your-project.vercel.app`

---

## Configure Custom Domain (Optional)

### Step 1: Add Domain

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** tab
3. Click **"Domains"** in the sidebar
4. Enter your custom domain and click **"Add"**

### Step 2: Update DNS Records

Vercel will show you the DNS records to add. Usually:

**For root domain (example.com):**
- Type: `A`
- Value: `76.76.21.21`

**For subdomain (www.example.com):**
- Type: `CNAME`
- Value: `cname.vercel-dns.com`

### Step 3: Wait for Propagation

- DNS changes take 5 minutes to 48 hours to propagate
- Vercel automatically provisions SSL certificate

---

## Update API Configuration

After deploying backend to Render, you need to update the frontend to use the correct API URL.

### Option 1: Using Environment Variables

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add or update: `VITE_API_URL` = `https://your-backend.onrender.com`
3. Redeploy your project

### Option 2: Update in Code

If your code uses hardcoded API URLs, update them to point to your Render backend URL.

---

## Vercel Configuration for SPA

A `vercel.json` file is **already included** in this folder to handle client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes are handled by your React app. No additional configuration needed!

---

## Troubleshooting

### Common Issues

1. **Build fails**: 
   - Check for any TypeScript/ESLint errors
   - Verify all dependencies are in `package.json`

2. **Environment variables not working**:
   - Make sure variable names start with `VITE_`
   - Redeploy after adding environment variables

3. **404 on page refresh**:
   - Add `vercel.json` with rewrites configuration

4. **API calls failing**:
   - Check CORS settings on backend
   - Verify API URL is correct

### Checking Build Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click on the deployment to see build logs

---

## Important Notes

- Vercel free tier includes:
  - Unlimited deployments
  - 100GB bandwidth per month
  - Custom domains with SSL
  
- Every push to your main branch triggers automatic deployment
- Preview deployments are created for pull requests
- Use HTTPS URLs only in production
