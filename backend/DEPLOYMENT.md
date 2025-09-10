# DomaInsight Backend Deployment Guide

This guide covers deploying the DomaInsight backend to Fly.io.

## Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly CLI**: Install the Fly CLI tool
3. **Docker**: Ensure Docker is installed locally
4. **Environment Variables**: Prepare your environment variables

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

## Deployment Steps

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

**⚠️ IMPORTANT: Never commit your private key to version control!**

```bash
# Set your Doma testnet private key
flyctl secrets set PRIVATE_KEY="your_testnet_private_key_here"

# Optional: Set other environment variables
flyctl secrets set NODE_ENV="production"
flyctl secrets set DOMA_SUBGRAPH_URL="https://api-testnet.doma.xyz/graphql"
```

### 4. Deploy the Application

```bash
flyctl deploy
```

### 5. Verify Deployment

```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Test health endpoint
curl https://domainsight-backend.fly.dev/health
```

## Environment Variables

### Required Variables

- `PRIVATE_KEY`: Your Doma testnet private key for on-chain actions

### Optional Variables

- `NODE_ENV`: Set to "production" for production deployment
- `DOMA_SUBGRAPH_URL`: Doma subgraph endpoint (defaults to testnet)
- `DOMA_TESTNET_RPC`: Doma testnet RPC endpoint

## Configuration Files

### fly.toml
- App name: `domainsight-backend`
- Port: `3000`
- Health check: `/health`
- Auto-scaling: Enabled (0-1 machines)

### Dockerfile
- Base image: Node.js 18 Alpine
- Security: Non-root user
- Health check: Built-in HTTP health check
- Optimization: Multi-stage build for smaller image

## Monitoring and Maintenance

### View Logs
```bash
flyctl logs
flyctl logs --follow  # Follow logs in real-time
```

### Scale Application
```bash
flyctl scale count 1    # Scale to 1 machine
flyctl scale count 0    # Scale to 0 machines (sleep)
```

### Update Application
```bash
flyctl deploy  # Deploy latest changes
```

### Check Status
```bash
flyctl status
flyctl info
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Dockerfile syntax
   - Verify all dependencies in package.json
   - Ensure .dockerignore excludes unnecessary files

2. **Runtime Errors**
   - Check logs: `flyctl logs`
   - Verify environment variables: `flyctl secrets list`
   - Test health endpoint: `curl https://your-app.fly.dev/health`

3. **CORS Issues**
   - Verify CORS configuration in server.js
   - Check frontend URL in corsOptions
   - Ensure credentials are properly configured

4. **Wallet Connection Issues**
   - Verify PRIVATE_KEY is set correctly
   - Check wallet address in logs
   - Ensure testnet RPC is accessible

### Health Check

The application includes a health check endpoint at `/health` that returns:

```json
{
  "status": "ok",
  "timestamp": "2025-01-10T12:00:00.000Z",
  "model": "trained",
  "multiChain": true,
  "supportedChains": ["testnet", "mainnet", "polygon", "arbitrum"],
  "wallet": "0x...",
  "onChainActions": true
}
```

## Security Considerations

1. **Private Key Security**
   - Never commit private keys to version control
   - Use Fly.io secrets for sensitive data
   - Rotate keys regularly

2. **CORS Configuration**
   - Only allow trusted frontend domains
   - Use HTTPS in production
   - Configure credentials properly

3. **Environment Variables**
   - Use secrets for sensitive data
   - Validate all environment variables
   - Use different keys for different environments

## Performance Optimization

1. **Docker Image**
   - Use Alpine Linux for smaller images
   - Multi-stage builds to reduce size
   - Proper .dockerignore configuration

2. **Application**
   - Enable gzip compression
   - Use connection pooling
   - Implement caching where appropriate

3. **Fly.io Configuration**
   - Auto-scaling based on demand
   - Proper resource allocation
   - Health check optimization

## Support

For issues with:
- **Fly.io Platform**: Check [Fly.io Documentation](https://fly.io/docs)
- **DomaInsight Backend**: Check application logs and health endpoint
- **Doma Protocol**: Refer to [Doma Documentation](https://docs.doma.xyz)

## URLs

After deployment, your backend will be available at:
- **Production**: `https://domainsight-backend.fly.dev`
- **Health Check**: `https://domainsight-backend.fly.dev/health`
- **API Endpoints**: `https://domainsight-backend.fly.dev/*`
