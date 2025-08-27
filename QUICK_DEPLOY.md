# 🚀 Quick Deploy Guide - Eventify

## Step 1: Backend Deployment (Railway)

### 1.1 Go to Railway
- Open: https://railway.app/
- Click "Login with GitHub"
- Authorize Railway to access your GitHub

### 1.2 Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Find and select your `eventify` repository
- Click "Deploy Now"

### 1.3 Configure Project
- In your project dashboard, click "Settings"
- Find "Root Directory" and set it to: `backend`
- Click "Save"

### 1.4 Add Environment Variables
Click "Variables" tab and add these:

```
PORT=4000
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/eventify?retryWrites=true&w=majority
JWT_SECRET=eventify_super_secret_key_2024_make_it_long_and_random
CLIENT_ORIGIN=https://your-frontend.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=Eventify <your_email@gmail.com>
```

### 1.5 Get Backend URL
- After deployment, copy the URL (e.g., `https://eventify-backend.railway.app`)
- Save this URL for the next step

## Step 2: Frontend Deployment (Vercel)

### 2.1 Go to Vercel
- Open: https://vercel.com/
- Click "Login with GitHub"
- Authorize Vercel to access your GitHub

### 2.2 Create New Project
- Click "New Project"
- Find and select your `eventify` repository
- Click "Import"

### 2.3 Configure Project
- Set "Root Directory" to: `frontend`
- Set "Framework Preset" to: `Vite`
- Click "Deploy"

### 2.4 Add Environment Variable
- After deployment, go to "Settings" → "Environment Variables"
- Add: `VITE_API_BASE_URL` = `https://your-backend-url.railway.app/api`
- Click "Save"

### 2.5 Get Frontend URL
- Copy your Vercel URL (e.g., `https://eventify-frontend.vercel.app`)
- Save this URL

## Step 3: Update URLs

### 3.1 Update Backend
- Go back to Railway
- Update `CLIENT_ORIGIN` with your Vercel frontend URL

### 3.2 Update Frontend
- Go back to Vercel
- Update `VITE_API_BASE_URL` with your Railway backend URL

## Step 4: Test Your Website

1. Visit your Vercel frontend URL
2. Register a new user
3. Create an event
4. Test all features

## 🔧 What You Need to Provide

### MongoDB Atlas
- Your MongoDB connection string
- Username and password for database

### Gmail SMTP
- Your Gmail address
- App password (not regular password)

### JWT Secret
- Any long random string (I can generate one for you)

## 🆘 Need Help?

If you get stuck at any step, tell me:
1. Which step you're on
2. What error you're seeing
3. What you've tried

I'll help you fix it!

## 🎯 Quick Commands

```bash
# Check if your code is ready
./deploy.sh

# Test locally first
cd backend && npm start
cd frontend && npm run dev
```
