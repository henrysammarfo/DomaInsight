#!/bin/bash

# DomaInsight Deployment Script with Real Credentials
# This script deploys the backend to Fly.io with real Doma testnet credentials

echo "🚀 Deploying DomaInsight with Real Doma Testnet Credentials..."

# Set real environment variables for Fly.io
echo "📝 Setting environment variables..."

# API Key
flyctl secrets set DOMA_API_KEY="v1.2ab2b25922189b0a4eae6015f4e4808a2d8b40dec8c9d04e29281a82d9f2f0f1"

# Private Key (REAL TESTNET KEY - KEEP SECURE!)
flyctl secrets set PRIVATE_KEY="df7320e1ab7c638ec2a434d230af96d1bb98b3ccbd2b8e7d8002270117ea52a0"

# Other environment variables
flyctl secrets set NODE_ENV="production"
flyctl secrets set DOMA_SUBGRAPH_URL="https://api-testnet.doma.xyz/graphql"
flyctl secrets set DOMA_TESTNET_RPC="https://rpc-testnet.doma.xyz"

echo "✅ Environment variables set successfully!"

# Deploy backend
echo "🚀 Deploying backend to Fly.io..."
cd backend
flyctl deploy

echo "✅ Backend deployed successfully!"

# Check health endpoint
echo "🔍 Checking health endpoint..."
sleep 10
curl https://domainsight-backend.fly.dev/health

echo ""
echo "🎉 DomaInsight backend deployed with real Doma testnet credentials!"
echo "🌐 Backend URL: https://domainsight-backend.fly.dev"
echo "🔗 Health Check: https://domainsight-backend.fly.dev/health"
echo ""
echo "📋 Real tokenized domains available for testing:"
echo "   - johnify.io"
echo "   - johnventures.io"
echo "   - insightstream.io"
echo "   - johnica.io"
echo "   - insightwise.io"
echo "   - estatewise.io"
echo "   - coolrealm.io"
echo "   - orgrealm.io"
echo ""
echo "🚀 Next steps:"
echo "   1. Deploy frontend to Vercel"
echo "   2. Run live tests: yarn test:live"
echo "   3. Record demo video"
echo "   4. Submit to hackathon!"
