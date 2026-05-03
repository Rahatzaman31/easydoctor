# Backend Deployment Guide - Render.com

This guide will help you deploy the backend API server on Render.com.

---

## Prerequisites

1. A Render.com account (free tier available)
2. Your Supabase project credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY` (for server-side operations)

---

## Step-by-Step Deployment

### Step 1: Push Code to GitHub

**Option A: Separate Repository (Recommended)**
1. Create a new GitHub repository (e.g., `my-backend-api`)
2. Copy all files inside the `backend` folder to your new repository root
3. Your repository should have: `package.json`, `index.js` at the root

**Option B: Monorepo Approach**
1. Push this entire project to GitHub
2. When configuring Render, set **Root Directory** to `backend`
3. Render will only build from that folder

**Files Included:**
- `index.js` - Express.js server with all API endpoints
- `package.json` - Dependencies and scripts

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** button
3. Select **"Web Service"**
4. Connect your GitHub repository

### Step 3: Configure Service Settings

| Setting | Value |
|---------|-------|
| **Name** | `your-backend-api` (choose any name) |
| **Environment** | `Node` |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | Leave empty (if backend files are at root) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or paid for production) |

### Step 4: Add Environment Variables

Click **"Environment"** tab and add these variables:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for the deployment to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://your-backend-api.onrender.com`

---

## Post-Deployment

### Get Your Backend URL

After deployment, Render provides you a URL like:
```
https://your-backend-api.onrender.com
```

**Important:** Save this URL! You'll need it for your frontend deployment.

### Update Frontend API Calls

In your frontend project, update the API base URL to point to your Render backend:

1. Create a `.env` file in your frontend project:
```
VITE_API_URL=https://your-backend-api.onrender.com
```

2. Or update the API calls directly if not using environment variables.

---

## Troubleshooting

### Common Issues

1. **Build fails**: Check `package.json` for correct dependencies
2. **Server not starting**: Verify `PORT` environment variable is set
3. **Database connection errors**: Double-check Supabase credentials
4. **CORS errors**: The backend already has CORS enabled

### Checking Logs

1. Go to Render Dashboard
2. Click on your web service
3. Go to "Logs" tab to see real-time logs

---

## Important Notes

- **Free tier** sleeps after 15 minutes of inactivity (first request takes ~30 seconds to wake up)
- **Paid tier** ($7/month) keeps service always running
- Use HTTPS URLs only in production
- Keep your environment variables secure - never commit them to Git

---

## bKash Configuration

If using bKash payment integration:
- The sandbox credentials are pre-configured in the code
- For production, update the bKash production credentials through the admin panel
- Make sure your bKash app's callback URL points to your Render backend URL
