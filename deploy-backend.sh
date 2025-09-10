#!/bin/bash

echo "🚀 Deploying DomaInsight Backend"
echo "================================="

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Navigate to backend directory
cd backend

# Login to Fly.io (if not already logged in)
echo "🔐 Logging into Fly.io..."
flyctl auth login

# Create app (if it doesn't exist)
echo "📱 Creating Fly.io app..."
flyctl apps create domainsight-backend --generate-name

# Set environment variables
echo "🔧 Setting environment variables..."
echo "Please set your PRIVATE_KEY environment variable:"
read -p "Enter your testnet private key: " PRIVATE_KEY

flyctl secrets set PRIVATE_KEY="$PRIVATE_KEY"
flyctl secrets set NODE_ENV="production"
flyctl secrets set DOMA_SUBGRAPH_URL="https://api-testnet.doma.xyz/graphql"
flyctl secrets set DOMA_TESTNET_RPC="https://rpc-testnet.doma.xyz"

# Deploy the app
echo "🚀 Deploying to Fly.io..."
flyctl deploy

# Get the app URL
echo "🌐 Getting app URL..."
APP_URL=$(flyctl info --json | jq -r '.Hostname')
echo "✅ Backend deployed successfully!"
echo "   URL: https://$APP_URL"
echo "   Health check: https://$APP_URL/health"

# Test the deployment
echo "🧪 Testing deployment..."
curl -s "https://$APP_URL/health" | jq '.'

echo ""
echo "🎉 Backend deployment complete!"
echo "   Update your frontend REACT_APP_API_URL to: https://$APP_URL"
