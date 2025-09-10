# DomaInsight Live Deployment Tests

This directory contains comprehensive live deployment tests for the DomaInsight application.

## Overview

The live deployment test suite validates that both the frontend and backend are properly deployed and functioning with real Doma Protocol data.

## Test Configuration

### URLs
- **Frontend**: `https://domainsight-frontend.vercel.app`
- **Backend**: `https://domainsight-backend.fly.dev`
- **Health Check**: `https://domainsight-backend.fly.dev/health`

### Test Domain
- **Primary**: `crypto.eth` (for scoring tests)
- **Invalid**: `invalid-domain-that-does-not-exist.eth` (for error handling)

## Test Categories

### 1. Backend Health Check
- ✅ **Health Endpoint**: Validates `/health` returns 200 and `{ status: "ok" }`
- ✅ **Model Status**: Confirms AI model is trained and ready
- ✅ **Multi-chain Support**: Verifies multi-chain configuration
- ✅ **Wallet Status**: Checks on-chain action capability
- ✅ **Response Time**: Measures health check performance

### 2. Backend Domain Scoring
- ✅ **Domain Scoring**: Tests `/score-domain` endpoint with real domain
- ✅ **Feature Extraction**: Validates domain features (length, keywords, TLD rarity)
- ✅ **AI Model**: Confirms ML model returns valid scores (0-100)
- ✅ **Recommendations**: Checks AI-generated recommendations
- ✅ **Transaction Potential**: Counts potential on-chain actions

### 3. Backend Trends Analytics
- ✅ **Trends Data**: Tests `/get-trends` endpoint
- ✅ **TLD Statistics**: Validates top-level domain analytics
- ✅ **Score Distribution**: Checks high/medium/low score categorization
- ✅ **Monthly Activity**: Verifies time-series data
- ✅ **Data Quality**: Ensures real data (not mocks)

### 4. Backend Alerts System
- ✅ **Alerts Endpoint**: Tests `/get-alerts` endpoint
- ✅ **Expiring Domains**: Validates high-score expiring domain detection
- ✅ **Alert Configuration**: Checks alert system settings
- ✅ **Real-time Data**: Confirms live data polling
- ✅ **Alert Metrics**: Tracks alert generation

### 5. CORS Configuration
- ✅ **Frontend to Backend**: Tests CORS from frontend to backend
- ✅ **Origin Headers**: Validates `Access-Control-Allow-Origin`
- ✅ **Credentials**: Checks `Access-Control-Allow-Credentials`
- ✅ **Methods**: Verifies allowed HTTP methods
- ✅ **Preflight**: Tests CORS preflight requests

### 6. Frontend Tests (Puppeteer)
- ✅ **Page Load**: Validates frontend loads within 2 seconds
- ✅ **Page Title**: Confirms correct page title
- ✅ **Search Functionality**: Tests domain search and scoring
- ✅ **Filter Elements**: Validates TLD, score, and status filters
- ✅ **Alerts Section**: Checks alerts display
- ✅ **Mobile Responsiveness**: Tests mobile viewport (375x667)

### 7. Performance Tests
- ✅ **Load Time**: Measures page load performance
- ✅ **API Response**: Tests backend response times
- ✅ **Thresholds**: Validates <1s (good), <2s (acceptable), >2s (slow)
- ✅ **Resource Usage**: Monitors memory and CPU usage
- ✅ **Network Performance**: Tests network latency

### 8. End-to-End Integration
- ✅ **Complete User Flow**: Tests search → score → recommendations → actions
- ✅ **Wallet Integration**: Mocks Web3 wallet connection
- ✅ **Transaction Generation**: Counts potential on-chain actions
- ✅ **Real Data Flow**: Validates live Doma Protocol data
- ✅ **Error Handling**: Tests graceful error recovery

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Ensure Puppeteer is available
npm install puppeteer
```

### Run All Tests
```bash
# Run complete test suite
yarn test:live

# Or with npm
npm run test:live
```

### Individual Test Categories
```bash
# Backend tests only
node tests/test-live.js --backend-only

# Frontend tests only
node tests/test-live.js --frontend-only

# Performance tests only
node tests/test-live.js --performance-only
```

## Test Output

### Console Output
- **Colored Status**: ✅ PASS, ❌ FAIL, ⚠️ WARN
- **Performance Metrics**: Response times and load times
- **Transaction Counts**: Potential on-chain actions
- **Detailed Logs**: Step-by-step test execution

### Test Report
```
📊 Test Summary:
   Total Tests: 15
   Passed: 14
   Failed: 0
   Warnings: 1
   Pass Rate: 93.3%

🌐 CORS Tests:
   CORS Tests: 2
   CORS Passed: 2
   CORS Rate: 100%

⚡ Performance Metrics:
   healthCheck: 245ms
   domainScoring: 1.2s
   trends: 890ms
   alerts: 567ms
   frontendLoad: 1.8s

💰 Transaction Metrics:
   Potential txns: 8

🎯 Overall Status:
   ✅ DEPLOYMENT HEALTHY
```

## Test Metrics

### Performance Thresholds
- **Excellent**: <1 second
- **Good**: <2 seconds
- **Acceptable**: <3 seconds
- **Poor**: >3 seconds

### Success Criteria
- **Pass Rate**: ≥80% for healthy deployment
- **CORS Rate**: ≥80% for proper configuration
- **Performance**: <2s average response time
- **Zero Critical Failures**: No failed health checks

### Transaction Tracking
- **Potential Transactions**: Counts actionable recommendations
- **On-chain Actions**: Tokenize, auction, renew, transfer
- **DeFi Opportunities**: High-value domain actions
- **Revenue Impact**: Estimated transaction volume

## Troubleshooting

### Common Issues

1. **Backend Unreachable**
   - Check Fly.io deployment status
   - Verify health endpoint accessibility
   - Check network connectivity

2. **Frontend Load Failures**
   - Verify Vercel deployment
   - Check CORS configuration
   - Validate environment variables

3. **CORS Errors**
   - Check backend CORS configuration
   - Verify frontend URL in allowed origins
   - Test preflight requests

4. **Performance Issues**
   - Check server resources
   - Monitor network latency
   - Optimize database queries

### Debug Commands
```bash
# Check backend health
curl https://domainsight-backend.fly.dev/health

# Test CORS
curl -H "Origin: https://domainsight-frontend.vercel.app" \
     https://domainsight-backend.fly.dev/health

# Check frontend
curl -I https://domainsight-frontend.vercel.app
```

## Continuous Integration

### GitHub Actions Integration
```yaml
name: Live Deployment Tests
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:live
```

### Monitoring Integration
- **Uptime Monitoring**: Ping health endpoints
- **Performance Monitoring**: Track response times
- **Error Tracking**: Monitor test failures
- **Alerting**: Notify on deployment issues

## Security Considerations

### Test Data
- **No Sensitive Data**: Tests use public test domains
- **Mock Wallets**: Test wallet addresses are mock
- **Public Endpoints**: Only public APIs are tested
- **No Private Keys**: No sensitive credentials in tests

### Network Security
- **HTTPS Only**: All tests use HTTPS
- **CORS Validation**: Proper origin validation
- **Rate Limiting**: Respect API rate limits
- **Error Handling**: Graceful failure handling

## Best Practices

### Test Reliability
- **Retry Logic**: Automatic retry for transient failures
- **Timeout Handling**: Proper timeout configuration
- **Error Recovery**: Graceful error handling
- **Data Validation**: Comprehensive response validation

### Performance Optimization
- **Parallel Execution**: Run independent tests in parallel
- **Resource Management**: Proper browser cleanup
- **Memory Management**: Avoid memory leaks
- **Network Optimization**: Efficient HTTP requests

### Maintenance
- **Regular Updates**: Keep dependencies current
- **Test Data Refresh**: Update test domains regularly
- **Performance Baselines**: Update performance thresholds
- **Documentation**: Keep test documentation current
