# Eventify Deployment Guide

This guide will help you deploy the Eventify application to production.

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Railway account (for backend)
- MongoDB Atlas account
- Gmail account (for SMTP)

## Step 1: Backend Deployment (Railway)

### 1.1 Prepare MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a new cluster or use existing one
3. Get your connection string
4. Create a database user with read/write permissions

### 1.2 Deploy to Railway
1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub account and select this repository
4. Set the root directory to `backend`
5. Add the following environment variables:

```env
PORT=4000
MONGODB_URI=mongodb+srv://princetagadiya11:LlFxXfXU82tFFJN4@cluster0.ybpu75u.mongodb.net/eventify?retryWrites=true&w=majority
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
CLIENT_ORIGIN=https://your-frontend-domain.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=princetagadiya11@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Eventify <princetagadiya11@gmail.com>
```

### 1.3 Gmail SMTP Setup
1. Go to your Google Account settings
2. Enable 2-factor authentication
3. Generate an App Password for "Mail"
4. Use this password as `SMTP_PASS`

### 1.4 Get Backend URL
After deployment, Railway will provide a URL like:
`https://your-app-name.railway.app`

## Step 2: Frontend Deployment (Vercel)

### 2.1 Deploy to Vercel
1. Go to [Vercel](https://vercel.com/)
2. Click "New Project" → "Import Git Repository"
3. Connect your GitHub account and select this repository
4. Set the root directory to `frontend`
5. Add the following environment variable:

```env
VITE_API_BASE_URL=https://your-backend-url.railway.app/api
```

### 2.2 Configure Build Settings
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 2.3 Get Frontend URL
After deployment, Vercel will provide a URL like:
`https://your-app-name.vercel.app`

## Step 3: Update Environment Variables

### 3.1 Update Backend CLIENT_ORIGIN
Go back to Railway and update the `CLIENT_ORIGIN` environment variable with your Vercel frontend URL.

### 3.2 Update Frontend API URL
Go back to Vercel and update the `VITE_API_BASE_URL` environment variable with your Railway backend URL.

## Step 4: Test Deployment

1. Visit your frontend URL
2. Try to register a new user
3. Try to create an event
4. Test all major features

## Alternative Deployment Options

### Backend Alternatives
- **Render**: Similar to Railway, good free tier
- **Heroku**: Classic choice, requires credit card
- **DigitalOcean App Platform**: Good performance
- **AWS Elastic Beanstalk**: Enterprise-grade

### Frontend Alternatives
- **Netlify**: Great for static sites
- **GitHub Pages**: Free for public repos
- **Firebase Hosting**: Google's solution
- **AWS S3 + CloudFront**: Enterprise-grade

## Environment Variables Reference

### Backend (.env)
```env
PORT=4000
MONGODB_URI=mongodb+srv://princetagadiya11:LlFxXfXU82tFFJN4@cluster0.ybpu75u.mongodb.net/eventify?retryWrites=true&w=majority
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
CLIENT_ORIGIN=https://your-frontend.vercel.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=princetagadiya11@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Eventify <princetagadiya11@gmail.com>
```

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend.railway.app/api
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure `CLIENT_ORIGIN` is set correctly
2. **Database Connection**: Verify MongoDB URI and credentials
3. **Email Not Working**: Check SMTP credentials and app password
4. **Build Failures**: Check Node.js version compatibility

### Debug Commands

```bash
# Check backend health
curl https://your-backend.railway.app/api/health

# Check frontend build
npm run build

# Test API locally
curl http://localhost:4000/api/health
```

## Security Considerations

1. **JWT Secret**: Use a strong, random secret
2. **MongoDB**: Use strong passwords and IP whitelist
3. **SMTP**: Use app passwords, not regular passwords
4. **Environment Variables**: Never commit secrets to Git

## Performance Optimization

1. **Database Indexing**: Add indexes for frequently queried fields
2. **Caching**: Consider Redis for session storage
3. **CDN**: Use Vercel's edge network
4. **Image Optimization**: Compress images before upload

## Monitoring

1. **Railway**: Built-in logs and metrics
2. **Vercel**: Analytics and performance monitoring
3. **MongoDB Atlas**: Database performance monitoring
4. **External**: Consider Sentry for error tracking

## Support

If you encounter issues:
1. Check the logs in Railway/Vercel dashboards
2. Verify all environment variables are set correctly
3. Test locally first
4. Check the troubleshooting section above
