#!/bin/bash

echo "🚀 Deploying DomaInsight Frontend"
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "   npm i -g vercel"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Set environment variables
echo "🔧 Setting environment variables..."
read -p "Enter your backend URL (e.g., https://domainsight-backend.fly.dev): " BACKEND_URL

# Create .env.local file
echo "REACT_APP_API_URL=$BACKEND_URL" > .env.local

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Get the deployment URL
echo "🌐 Getting deployment URL..."
DEPLOYMENT_URL=$(vercel ls | grep domainsight | head -1 | awk '{print $2}')

echo "✅ Frontend deployed successfully!"
echo "   URL: https://$DEPLOYMENT_URL"
echo "   Backend: $BACKEND_URL"

# Test the deployment
echo "🧪 Testing deployment..."
curl -s "https://$DEPLOYMENT_URL" | grep -q "DomaInsight" && echo "✅ Frontend is accessible" || echo "❌ Frontend test failed"

echo ""
echo "🎉 Frontend deployment complete!"
echo "   Live URL: https://$DEPLOYMENT_URL"
