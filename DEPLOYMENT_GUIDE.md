# 🚀 AluVerse Deployment Guide

Complete guide to deploy AluVerse to production.

**⚠️ Important Note:** This project uses Socket.IO for real-time features (chat, notifications). Socket.IO requires persistent connections, which don't work well with serverless platforms like Vercel. Therefore, we use a **separate deployment strategy**:
- **Frontend**: Vercel/Netlify (static site)
- **Backend**: Railway/Render/Heroku (Node.js server with Socket.IO support)

---

## Table of Contents

1. [GitHub Setup](#github-setup)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Railway/Render)](#backend-deployment)
4. [Database Setup (MongoDB Atlas)](#database-setup)
5. [Email Configuration (Gmail)](#email-configuration)
6. [Troubleshooting](#troubleshooting)

---

## GitHub Setup

### Step 1: Initialize Git Repository

```bash
cd "c:\Users\Lenovo\Desktop\kashu aluverse"
git init
```

### Step 2: Create Remote Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `aluverse`
4. Description: `Alumni networking portal`
5. Don't initialize with README (we have one)
6. Click "Create repository"

### Step 3: Add Remote and Push

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/aluverse.git

# Verify .gitignore is in place
cat .gitignore  # Should show .env files excluded

# Stage all files
git add .

# Commit
git commit -m "Initial commit: AluVerse alumni portal"

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 4: Verify on GitHub

- Visit: `https://github.com/YOUR_USERNAME/aluverse`
- Confirm `.env` files are NOT present
- Confirm `.env.example` files ARE present

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

```bash
cd alunet93

# Ensure .env.local is configured locally
# But NOT pushed to GitHub
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Click "Import Git Repository"
4. Select `aluverse` repository
5. Click "Import"

### Step 3: Configure Project Settings

- **Framework Preset**: Vite
- **Root Directory**: `./alunet93`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variables

In Vercel project settings, go to **Settings** → **Environment Variables**

```env
VITE_API_URL=https://your-backend-url.com/api
VITE_SOCKET_URL=https://your-backend-url.com
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

**Note:** Set these to your deployed backend URL (after backend deployment).

### Step 5: Deploy

- Click "Deploy"
- Wait for build to complete
- Your frontend will be live at: `https://your-project.vercel.app`

---

## Backend Deployment

**⚠️ Important:** Backend uses Socket.IO for real-time features. Deploy to Railway or Render (not Vercel).

### Option A: Railway (Recommended - Free tier, easy setup)

#### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"

#### 2. Deploy from GitHub

1. Select "Deploy from GitHub repo"
2. Authorize Railway to access your repositories
3. Select `aluverse` repository
4. Select `backend` directory as root
5. Click "Deploy"

#### 3. Configure Environment Variables

In Railway Dashboard → Project → Variables:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aluverse
JWT_SECRET=your_secret_key_change_this
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 4. Get Backend URL

- Railway will provide a URL like: `https://your-app.up.railway.app`
- Copy this URL - you'll need it for frontend configuration

---

### Option B: Render (Alternative - Good for Socket.IO)

#### 1. Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

#### 2. Create Web Service

1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub account
4. Select `aluverse` repository
5. Fill in settings:
   - **Name**: aluverse-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

#### 3. Add Environment Variables

Go to **Environment** in Render dashboard:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/aluverse
JWT_SECRET=your_secret_key_change_this
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 4. Deploy

- Click "Create Web Service"
- Render will auto-build and deploy
- Your backend URL will be like: `https://aluverse-backend.onrender.com`

---

## Database Setup

### MongoDB Atlas

#### 1. Create Account

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Sign up for free
3. Create a new project

#### 2. Create Cluster

1. Click "Create a Deployment"
2. Select "Free" tier
3. Choose region closest to your users
4. Create cluster

#### 3. Create Database User

1. In left sidebar, go to "Database Access"
2. Click "Add New Database User"
3. Username: `aluverse_user`
4. Password: Generate secure password
5. Role: "Atlas Admin"
6. Click "Create User"

#### 4. Get Connection String

1. Go to "Databases"
2. Click "Connect" on your cluster
3. Select "Drivers"
4. Copy the connection string
5. Replace `<username>` and `<password>` with your credentials
6. Add `/aluverse` before `?retryWrites`

Example:
```
mongodb+srv://aluverse_user:PASSWORD@cluster0.abc123.mongodb.net/aluverse?retryWrites=true&w=majority
```

#### 5. Add IP Whitelist

1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (or add specific IPs)
4. Click "Confirm"

---

## Email Configuration

### Gmail SMTP Setup

#### 1. Enable 2-Factor Authentication

1. Go to [google.com/account](https://google.com/account)
2. Select "Security"
3. Enable "2-Step Verification"

#### 2. Create App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select App: "Mail"
3. Select Device: "Windows Computer" (or your OS)
4. Click "Generate"
5. Copy the 16-character password

#### 3. Add to Environment

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # The 16-character password from step 2
```

---

## Troubleshooting

### Issue: Frontend can't connect to backend

**Solution:**
```env
# Frontend .env
VITE_API_URL=https://your-backend-url.com/api
```

Make sure CORS is enabled in backend:
```javascript
// backend/src/index.js
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Issue: Emails not sending

1. Verify SMTP credentials are correct
2. Check that Gmail allows "Less Secure App Access"
3. Check backend logs for error messages
4. Send test email: `npm run test-smtp`

### Issue: MongoDB connection refused

1. Verify MONGODB_URI in .env is correct
2. Check IP whitelist on MongoDB Atlas (should be 0.0.0.0/0 or your IP)
3. Verify username and password are correct
4. Check network connectivity

### Issue: GitHub still shows .env files

**If .env was already committed:**

```bash
# Remove from git history (careful!)
git rm --cached .env
git rm --cached .env.local
git commit -m "Remove .env files from tracking"
git push origin main
```

---

## Final Checklist

- [ ] Code pushed to GitHub
- [ ] `.env` files NOT in repository
- [ ] `.env.example` files present
- [ ] `.gitignore` configured
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Backend deployed (Railway/Render/Heroku)
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables configured on hosting
- [ ] Email (SMTP) configured
- [ ] Frontend → Backend connection tested
- [ ] Login flow tested
- [ ] Database queries tested

---

## Production Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] CORS_ORIGIN is set to frontend URL only
- [ ] MONGODB_URI username/password are not exposed
- [ ] SMTP passwords are app-specific passwords
- [ ] All .env files excluded from Git
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive data

---

## Deployment Complete! 🎉

Your AluVerse application is now deployed!

- **Frontend**: https://your-project.vercel.app
- **Backend**: https://your-backend-url.com
- **GitHub**: https://github.com/YOUR_USERNAME/aluverse

### Next Steps

1. Share your frontend URL with users
2. Monitor logs for errors
3. Set up automated backups for MongoDB
4. Configure domain names (if desired)
5. Set up CI/CD for automatic deployments

---

**Need Help?**
- Check GitHub Issues
- Review Railway/Vercel/Render documentation
- Contact MongoDB support for database issues
