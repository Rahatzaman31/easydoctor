# Admin Panel Deployment Guide - Vercel.com

This guide will help you deploy the admin panel on Vercel.com separately from the main frontend.

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
1. Create a **new** GitHub repository (e.g., `my-admin-panel`)
2. Copy all files and folders inside the `admin-frontend` folder
3. Push them to your new repository root
4. Your repository should have: `package.json`, `vite.config.js`, `src/`, `public/`, etc. at the root

**Option B: Monorepo Approach**
1. Push this entire project to GitHub
2. When configuring Vercel, set **Root Directory** to `admin-frontend`
3. Vercel will only build from that folder

**Files Included:**
- `src/` - React components and admin pages
- `public/` - Static assets (favicon, logo, robots.txt)
- `package.json` - Dependencies
- `vite.config.js` - Build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `vercel.json` - Vercel routing configuration (already included!)
- `index.html` - HTML entry point (includes noindex meta tag)

### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** then **"Project"**
3. Click **"Import"** next to your admin GitHub repository

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
3. Your admin panel will be live at: `https://your-admin.vercel.app`

---

## Configure Custom Domain (Recommended)

For security, use a different subdomain for admin panel:

### Example Domain Setup

| Site | Domain |
|------|--------|
| Main Frontend | `www.yoursite.com` |
| Admin Panel | `admin.yoursite.com` |

### Add Subdomain

1. Go to your admin project in Vercel Dashboard
2. Click **"Settings"** tab
3. Click **"Domains"** in the sidebar
4. Enter `admin.yoursite.com` and click **"Add"**

### Update DNS

Add a CNAME record for your subdomain:
- Type: `CNAME`
- Name: `admin`
- Value: `cname.vercel-dns.com`

---

## Security Recommendations

### 1. Restrict Access (Optional)

For additional security, you can:

1. Use Vercel's password protection (Pro plan required)
2. Or implement IP whitelisting at your DNS/CDN level

### 2. Keep Admin URL Private

- Don't link to admin panel from main site
- Don't share admin URL publicly
- Use complex subdomain like `management.yoursite.com`

### 3. Regular Credential Updates

- Change admin password regularly
- Use strong, unique passwords
- Enable OTP verification when available

---

## Vercel Configuration for SPA

A `vercel.json` file is **already included** in this folder:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all admin routes work correctly with client-side routing. No additional configuration needed!

---

## Troubleshooting

### Common Issues

1. **Build fails**: 
   - Check for any TypeScript/ESLint errors
   - Verify all dependencies are in `package.json`

2. **Login not working**:
   - Verify API URL points to your Render backend
   - Check backend is running and accessible

3. **404 on page refresh**:
   - Add `vercel.json` with rewrites configuration

4. **Environment variables not working**:
   - Variable names must start with `VITE_`
   - Redeploy after adding environment variables

### Checking Build Logs

1. Go to Vercel Dashboard
2. Click on your admin project
3. Go to "Deployments" tab
4. Click on the deployment to see build logs

---

## Important Notes

- Keep admin panel deployment **separate** from main frontend
- Use different GitHub repository for admin panel
- Admin panel should have different subdomain for security
- Don't expose admin panel URL in main site robots.txt
- Consider using Vercel Analytics to monitor admin panel usage
