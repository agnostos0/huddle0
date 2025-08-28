#!/bin/bash

echo "🚀 Deploying Huddle Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment process..."

# Deploy Backend to Railway
print_status "Deploying backend to Railway..."
cd backend

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    echo "railway login"
    exit 1
fi

# Deploy to Railway
print_status "Deploying backend to Railway..."
railway up

if [ $? -eq 0 ]; then
    print_status "Backend deployed successfully to Railway!"
else
    print_error "Backend deployment failed!"
    exit 1
fi

cd ..

# Deploy Frontend to Vercel
print_status "Deploying frontend to Vercel..."
cd frontend

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Please install it first:"
    echo "npm install -g vercel"
    echo "vercel login"
    exit 1
fi

# Deploy to Vercel
print_status "Deploying frontend to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    print_status "Frontend deployed successfully to Vercel!"
else
    print_error "Frontend deployment failed!"
    exit 1
fi

cd ..

print_status "🎉 Deployment completed successfully!"
print_status "Your application should now be live!"
print_status ""
print_status "Important notes:"
print_status "1. The 405 error should now be resolved with the updated Vercel configuration"
print_status "2. API requests are now properly proxied to your Railway backend"
print_status "3. If you still encounter issues, check the browser console for detailed error messages"
print_status ""
print_status "Frontend URL: https://your-vercel-app.vercel.app"
print_status "Backend URL: https://eventify-production-ea1c.up.railway.app"
