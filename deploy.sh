#!/bin/bash

# Huddle Deployment Script
echo "🚀 Starting Huddle deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists git; then
    echo "❌ Error: Git is not installed"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Check git status
echo "📋 Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected, committing..."
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    git commit -m "Deploy: Fix login issues, rebrand to Huddle - $timestamp"
    
    echo "✅ Changes committed"
else
    echo "✅ No changes to commit"
fi

# Check if we're on the main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  Warning: You're on branch '$current_branch', not 'main'"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Push to remote
echo "📤 Pushing to remote repository..."
if git push origin $current_branch; then
    echo "✅ Successfully pushed to remote"
else
    echo "❌ Failed to push to remote"
    exit 1
fi

# Check if Vercel CLI is installed
if command_exists vercel; then
    echo "🌐 Vercel CLI detected"
    echo "📋 Current Vercel project status:"
    vercel ls 2>/dev/null || echo "No Vercel projects found"
    
    echo ""
    echo "🎉 Deployment completed!"
    echo "📱 Your Huddle app should automatically deploy on Vercel"
    echo "🔗 Check your Vercel dashboard for the deployment status"
else
    echo "🌐 Vercel CLI not found"
    echo "📋 To install Vercel CLI: npm i -g vercel"
    echo "🎉 Git push completed!"
    echo "📱 Your Huddle app should automatically deploy on Vercel if connected"
fi

echo ""
echo "🔧 Troubleshooting tips:"
echo "1. Check Vercel dashboard for deployment status"
echo "2. Verify environment variables are set in Vercel"
echo "3. Check build logs for any errors"
echo "4. Test the API connection using the debug tools"
echo ""
echo "📞 If you need help, check the console logs and error messages"
