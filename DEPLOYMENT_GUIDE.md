# DomaInsight Deployment Guide

This guide covers deploying both the backend (Fly.io) and frontend (Vercel) of DomaInsight using automated deployment scripts.

## Prerequisites

### Backend (Fly.io)
1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the Fly CLI tool
3. **Doma Testnet Private Key**: For on-chain actions

### Frontend (Vercel)
1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install the Vercel CLI tool
3. **Node.js**: Version 16 or higher

## Installation

### Install Fly CLI
```bash
# macOS
brew install flyctl

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Linux
curl -L https://fly.io/install.sh | sh
```

### Install Vercel CLI
```bash
npm install -g vercel
```

## Backend Deployment (Fly.io)

### 1. Authentication
```bash
cd backend
flyctl auth login
```

### 2. Create Fly.io App
```bash
flyctl apps create domainsight-backend
```

### 3. Set Environment Variables
```bash
# Set your Doma testnet private key
flyctl secrets set PRIVATE_KEY="your_testnet_private_key_here"

# Optional: Set other environment variables
flyctl secrets set NODE_ENV="production"
```

### 4. Deploy Backend
```bash
# Using the automated script
yarn deploy:backend

# Or manually
flyctl deploy
```

### 5. Verify Deployment
```bash
# Check health endpoint
curl https://domainsight-backend.fly.dev/health

# View logs
flyctl logs

# Check status
flyctl status
```

## Frontend Deployment (Vercel)

### 1. Authentication
```bash
cd frontend
vercel login
```

### 2. Link Project (if not already linked)
```bash
vercel link
```

### 3. Deploy Frontend
```bash
# Using the automated script
yarn deploy:frontend

# Or manually
vercel --prod
```

### 4. Verify Deployment
```bash
# Check deployment status
vercel ls

# View project info
vercel project ls
```

## Automated Deployment Scripts

### Backend Script Features
- ✅ Validates Fly CLI installation and authentication
- ✅ Checks environment variables and secrets
- ✅ Deploys to Fly.io with real-time output
- ✅ Verifies health endpoint after deployment
- ✅ Provides deployment status and troubleshooting info

### Frontend Script Features
- ✅ Validates Vercel CLI installation and authentication
- ✅ Sets up production environment variables
- ✅ Builds React application
- ✅ Deploys to Vercel with real-time output
- ✅ Verifies deployment accessibility
- ✅ Provides deployment information

## Environment Variables

### Backend (Fly.io Secrets)
```bash
# Required
PRIVATE_KEY="your_doma_testnet_private_key"

# Optional
NODE_ENV="production"
DOMA_SUBGRAPH_URL="https://api-testnet.doma.xyz/graphql"
```

### Frontend (Automatic)
The deployment script automatically sets:
```bash
REACT_APP_API_URL="https://domainsight-backend.fly.dev"
REACT_APP_ENVIRONMENT="production"
REACT_APP_VERSION="1.0.0"
REACT_APP_BUILD_TIME="2025-01-10T12:00:00.000Z"
```

## Deployment Commands

### Quick Deploy Both
```bash
# Deploy backend
cd backend && yarn deploy:backend

# Deploy frontend
cd frontend && yarn deploy:frontend
```

### Individual Deployments
```bash
# Backend only
cd backend
yarn deploy:backend

# Frontend only
cd frontend
yarn deploy:frontend
```

## URLs After Deployment

- **Backend**: `https://domainsight-backend.fly.dev`
- **Frontend**: `https://domainsight-frontend.vercel.app`
- **Health Check**: `https://domainsight-backend.fly.dev/health`

## Monitoring and Maintenance

### Backend Monitoring
```bash
# View real-time logs
flyctl logs --follow

# Check app status
flyctl status

# Scale application
flyctl scale count 1

# View app info
flyctl info
```

### Frontend Monitoring
```bash
# View deployments
vercel ls

# View project info
vercel project ls

# View logs
vercel logs
```

## Troubleshooting

### Backend Issues

1. **Deployment Fails**
   - Check Fly CLI authentication: `flyctl auth whoami`
   - Verify app exists: `flyctl apps list`
   - Check secrets: `flyctl secrets list`
   - View logs: `flyctl logs`

2. **Health Check Fails**
   - Verify backend is running: `flyctl status`
   - Check environment variables
   - Test health endpoint manually

3. **CORS Issues**
   - Verify CORS configuration in server.js
   - Check frontend URL in corsOptions
   - Ensure HTTPS is used in production

### Frontend Issues

1. **Build Fails**
   - Check Node.js version (16+)
   - Verify all dependencies are installed
   - Check for TypeScript/ESLint errors

2. **Deployment Fails**
   - Check Vercel authentication: `vercel whoami`
   - Verify project linking: `vercel project ls`
   - Check build logs for errors

3. **API Connection Issues**
   - Verify REACT_APP_API_URL is set correctly
   - Check CORS configuration on backend
   - Test API endpoints manually

## Security Considerations

### Backend Security
- ✅ Private keys stored in Fly.io secrets (never in code)
- ✅ CORS configured for specific frontend domains
- ✅ HTTPS enforced for all communications
- ✅ Non-root user in Docker container

### Frontend Security
- ✅ Environment variables properly configured
- ✅ Production build optimizations
- ✅ HTTPS enforced by Vercel
- ✅ No sensitive data in client-side code

## Performance Optimization

### Backend (Fly.io)
- ✅ Auto-scaling (0-1 machines)
- ✅ Health checks for reliability
- ✅ Optimized Docker image
- ✅ Efficient resource allocation

### Frontend (Vercel)
- ✅ Automatic CDN distribution
- ✅ Build optimizations
- ✅ Static asset optimization
- ✅ Edge caching

## Rollback Procedures

### Backend Rollback
```bash
# List deployments
flyctl releases

# Rollback to previous version
flyctl releases rollback <release-id>
```

### Frontend Rollback
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>
```

## Support

For issues with:
- **Fly.io Platform**: Check [Fly.io Documentation](https://fly.io/docs)
- **Vercel Platform**: Check [Vercel Documentation](https://vercel.com/docs)
- **DomaInsight**: Check application logs and health endpoints
- **Doma Protocol**: Refer to [Doma Documentation](https://docs.doma.xyz)

## Next Steps

After successful deployment:

1. **Test All Features**
   - Domain scoring functionality
   - Trend analytics
   - Recommendations system
   - On-chain actions

2. **Monitor Performance**
   - Backend health checks
   - Frontend loading times
   - API response times
   - Error rates

3. **Set Up Monitoring**
   - Fly.io metrics
   - Vercel analytics
   - Error tracking
   - Performance monitoring

4. **Configure CI/CD**
   - GitHub Actions for automated deployments
   - Automated testing
   - Staging environments
   - Production monitoring
