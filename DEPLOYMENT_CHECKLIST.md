# 🚀 Eventify Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] Code is committed and pushed to GitHub
- [ ] MongoDB Atlas account created
- [ ] Gmail account with 2FA enabled
- [ ] Railway account created
- [ ] Vercel account created

## 🔧 Backend Deployment (Railway)

### Step 1: Deploy to Railway
- [ ] Go to [Railway](https://railway.app/)
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select your repository
- [ ] Set root directory to `backend`
- [ ] Wait for deployment to complete

### Step 2: Configure Environment Variables
Add these variables in Railway dashboard:

- [ ] `PORT` = `4000`
- [ ] `MONGODB_URI` = `mongodb+srv://username:password@cluster.mongodb.net/eventify?retryWrites=true&w=majority`
- [ ] `JWT_SECRET` = `your_super_secret_jwt_key_here`
- [ ] `CLIENT_ORIGIN` = `https://your-frontend.vercel.app` (update after frontend deployment)
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`
- [ ] `SMTP_USER` = `your_email@gmail.com`
- [ ] `SMTP_PASS` = `your_gmail_app_password`
- [ ] `EMAIL_FROM` = `Eventify <your_email@gmail.com>`

### Step 3: Get Backend URL
- [ ] Copy the Railway deployment URL (e.g., `https://your-app.railway.app`)

## 🎨 Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel
- [ ] Go to [Vercel](https://vercel.com/)
- [ ] Click "New Project" → "Import Git Repository"
- [ ] Select your repository
- [ ] Set root directory to `frontend`
- [ ] Set framework preset to "Vite"
- [ ] Deploy

### Step 2: Configure Environment Variables
Add this variable in Vercel dashboard:

- [ ] `VITE_API_BASE_URL` = `https://your-backend.railway.app/api`

### Step 3: Get Frontend URL
- [ ] Copy the Vercel deployment URL (e.g., `https://your-app.vercel.app`)

## 🔄 Update Environment Variables

### Step 1: Update Backend
- [ ] Go back to Railway
- [ ] Update `CLIENT_ORIGIN` with your Vercel frontend URL

### Step 2: Update Frontend
- [ ] Go back to Vercel
- [ ] Update `VITE_API_BASE_URL` with your Railway backend URL

## 🧪 Testing

### Step 1: Basic Functionality
- [ ] Visit frontend URL
- [ ] Register a new user
- [ ] Login with the user
- [ ] Create an event
- [ ] Join an event
- [ ] Create a team
- [ ] Invite team members

### Step 2: Advanced Features
- [ ] Test OTP verification for event joining
- [ ] Test email notifications
- [ ] Test team leadership features
- [ ] Test admin dashboard (if admin user exists)
- [ ] Test responsive design on mobile

### Step 3: Error Handling
- [ ] Test with invalid credentials
- [ ] Test with expired tokens
- [ ] Test network errors
- [ ] Check error messages are user-friendly

## 🔒 Security Checklist

- [ ] JWT secret is strong and random
- [ ] MongoDB password is strong
- [ ] Gmail app password is used (not regular password)
- [ ] Environment variables are not committed to Git
- [ ] CORS is properly configured
- [ ] API endpoints are protected where needed

## 📊 Monitoring Setup

- [ ] Check Railway logs for backend errors
- [ ] Check Vercel analytics for frontend performance
- [ ] Monitor MongoDB Atlas for database performance
- [ ] Set up error tracking (optional: Sentry)

## 🎉 Post-Deployment

- [ ] Share the frontend URL with users
- [ ] Create admin account if needed
- [ ] Set up monitoring alerts
- [ ] Document any custom configurations
- [ ] Plan for future updates

## 🆘 Troubleshooting

If something doesn't work:

1. **Check logs** in Railway/Vercel dashboards
2. **Verify environment variables** are set correctly
3. **Test API endpoints** directly with curl/Postman
4. **Check CORS settings** if frontend can't connect to backend
5. **Verify MongoDB connection** if database operations fail
6. **Check SMTP settings** if emails aren't sending

## 📞 Support

- Railway: https://railway.app/docs
- Vercel: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Gmail SMTP: https://support.google.com/mail/answer/7126229
