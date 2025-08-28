# Deployment Fixes and Troubleshooting Guide

## 405 Method Not Allowed Error - RESOLVED ✅

### Problem
The login functionality was returning a 405 (Method Not Allowed) error on Vercel deployment.

### Root Cause
The Vercel configuration was not properly routing API requests to the Railway backend, causing the frontend to try to handle API calls locally.

### Solution Applied
1. **Updated `frontend/vercel.json`**:
   - Added proper API proxy configuration
   - Routes `/api/*` requests to Railway backend
   - Maintains SPA routing for frontend pages

2. **Enhanced API Configuration**:
   - Updated `frontend/src/lib/api.js` to handle different environments
   - Added specific 405 error handling
   - Improved debugging and error reporting

3. **Updated Login Component**:
   - Added specific handling for 405 errors
   - Better error messages for users

### Files Modified
- `frontend/vercel.json` - API routing configuration
- `frontend/src/lib/api.js` - Enhanced API handling
- `frontend/src/pages/Login.jsx` - Better error handling
- `deploy.sh` - Updated deployment script

## How to Deploy the Fix

### Option 1: Use the Deployment Script
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

#### Deploy Backend (Railway)
```bash
cd backend
railway up
```

#### Deploy Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

## Testing the Fix

1. **Check API Health**:
   - Visit: `https://eventify-production-ea1c.up.railway.app/api/health`
   - Should return: `{"status":"ok","service":"huddle-backend"}`

2. **Test Login**:
   - Try logging in with valid credentials
   - Check browser console for detailed logs
   - Should no longer show 405 error

3. **Debug Information**:
   - Open browser developer tools
   - Check Network tab for API requests
   - Look for proper routing to Railway backend

## Common Issues and Solutions

### Issue: Still Getting 405 Error
**Solution**: 
1. Clear browser cache
2. Hard refresh the page (Ctrl+F5)
3. Check if Vercel deployment completed successfully
4. Verify the API proxy is working by checking Network tab

### Issue: CORS Errors
**Solution**:
- The backend CORS configuration should handle this
- Check if the origin is in the allowed list in `backend/src/server.js`

### Issue: Network Errors
**Solution**:
1. Check if Railway backend is running
2. Verify the API URL is correct
3. Test the health endpoint directly

### Issue: Authentication Errors
**Solution**:
1. Check if user exists in database
2. Verify password is correct
3. Check if account is active

## Environment Variables

Make sure these are set correctly:

### Frontend (Vercel)
- `VITE_API_BASE_URL` (optional, will use proxy if not set)

### Backend (Railway)
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `PORT`

## Monitoring and Debugging

### Browser Console
Check for these log messages:
- `API: Making request to: /api/auth/login`
- `API: Base URL: /api` (on Vercel)
- `API: Response received: /api/auth/login 200`

### Network Tab
Look for:
- Requests to `/api/*` endpoints
- Proper HTTP methods (POST for login)
- Correct response status codes

### Vercel Logs
Check Vercel deployment logs for:
- Build success
- No routing conflicts
- Proper proxy configuration

## Support

If you're still experiencing issues:

1. **Check the logs**: Browser console and Vercel deployment logs
2. **Test the API directly**: Use tools like Postman or curl
3. **Verify deployment**: Ensure both frontend and backend are deployed
4. **Clear cache**: Browser cache and CDN cache

## Recent Changes Summary

- ✅ Fixed 405 Method Not Allowed error
- ✅ Improved API routing configuration
- ✅ Enhanced error handling and debugging
- ✅ Updated deployment process
- ✅ Added comprehensive troubleshooting guide
