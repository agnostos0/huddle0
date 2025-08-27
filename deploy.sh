#!/bin/bash

echo "🚀 Eventify Deployment Script"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
    exit 1
fi

echo "✅ Git repository is ready"

# Check if remote is set
if [ -z "$(git remote -v)" ]; then
    echo "⚠️  No remote repository found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/your-repo.git"
    echo "   git push -u origin main"
    exit 1
fi

echo "✅ Remote repository is configured"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🎉 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Deploy backend to Railway:"
echo "   - Go to https://railway.app/"
echo "   - Create new project from GitHub"
echo "   - Set root directory to 'backend'"
echo "   - Add environment variables (see DEPLOYMENT.md)"
echo ""
echo "2. Deploy frontend to Vercel:"
echo "   - Go to https://vercel.com/"
echo "   - Create new project from GitHub"
echo "   - Set root directory to 'frontend'"
echo "   - Add VITE_API_BASE_URL environment variable"
echo ""
echo "3. Update environment variables with your deployment URLs"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
