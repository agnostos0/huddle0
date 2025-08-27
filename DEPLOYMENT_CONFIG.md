# 🚀 Eventify Deployment Configuration

## Your Actual Environment Variables

### Backend Environment Variables (Railway)

Copy and paste these exact values into Railway:

```
PORT=4000
MONGODB_URI=mongodb+srv://princetagadiya11:LlFxXfXU82tFFJN4@cluster0.ybpu75u.mongodb.net/eventify?retryWrites=true&w=majority
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
CLIENT_ORIGIN=https://your-frontend.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=princetagadiya11@gmail.com
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD_HERE
EMAIL_FROM=Eventify <princetagadiya11@gmail.com>
```

### Frontend Environment Variables (Vercel)

Copy and paste this into Vercel:

```
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

## 🔧 What You Still Need to Provide

### 1. Gmail App Password
You need to generate an app password for your Gmail account:

1. Go to your Google Account settings: https://myaccount.google.com/
2. Click "Security"
3. Enable 2-Step Verification if not already enabled
4. Go to "App passwords"
5. Generate a new app password for "Mail"
6. Replace `YOUR_GMAIL_APP_PASSWORD_HERE` with the generated password

### 2. Frontend URL (After Vercel Deployment)
After you deploy to Vercel, you'll get a URL like:
`https://eventify-frontend.vercel.app`

Then update:
- `CLIENT_ORIGIN` in Railway with your Vercel URL
- `VITE_API_BASE_URL` in Vercel with your Railway URL

### 3. Backend URL (After Railway Deployment)
After you deploy to Railway, you'll get a URL like:
`https://eventify-backend.railway.app`

Then update:
- `VITE_API_BASE_URL` in Vercel with: `https://eventify-backend.railway.app/api`

## 🎯 Quick Deployment Steps

1. **Deploy Backend to Railway:**
   - Use the backend environment variables above
   - Set root directory to `backend`

2. **Deploy Frontend to Vercel:**
   - Use the frontend environment variable above
   - Set root directory to `frontend`

3. **Update URLs:**
   - Replace placeholder URLs with actual deployment URLs

4. **Test:**
   - Visit your Vercel URL
   - Register a user
   - Create an event

## 📞 Need Help?

If you need help with:
- Gmail app password setup
- Railway deployment
- Vercel deployment
- URL updates

Just tell me what step you're on and I'll help you!
