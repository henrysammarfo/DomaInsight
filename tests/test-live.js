#!/usr/bin/env node

const puppeteer = require('puppeteer');
const axios = require('axios');
const https = require('https');

// Configuration
const FRONTEND_URL = 'https://domainsight-frontend.vercel.app';
const BACKEND_URL = 'https://domainsight-backend.fly.dev';
const TEST_DOMAIN = 'johnify.io';
const TEST_INVALID_DOMAIN = 'invalid-domain-that-does-not-exist.eth';

// Test timeout
const TEST_TIMEOUT = 30000;
const PERFORMANCE_THRESHOLD = 2000; // 2 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`${statusIcon} [${testName}] ${status}${details ? ` - ${details}` : ''}`, statusColor);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 ${title}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

// Test metrics tracking
const testMetrics = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  warnings: 0,
  potentialTxns: 0,
  performanceMetrics: {},
  corsTests: 0,
  corsPassed: 0
};

// HTTP client with timeout
const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'DomaInsight-Live-Test/1.0.0'
  }
});

// Test 1: Backend Health Check
async function testBackendHealth() {
  logSection('Backend Health Check');
  
  try {
    const startTime = Date.now();
    const response = await httpClient.get(`${BACKEND_URL}/health`);
    const responseTime = Date.now() - startTime;
    
    testMetrics.performanceMetrics.healthCheck = responseTime;
    
    if (response.status === 200 && response.data.status === 'ok') {
      logTest('Backend Health', 'PASS', `${responseTime}ms`);
      log(`   Status: ${response.data.status}`, 'green');
      log(`   Model: ${response.data.model}`, 'green');
      log(`   Multi-chain: ${response.data.multiChain}`, 'green');
      log(`   Supported chains: ${response.data.supportedChains?.join(', ')}`, 'green');
      log(`   Wallet: ${response.data.wallet || 'Not configured'}`, 'green');
      log(`   On-chain actions: ${response.data.onChainActions ? 'Enabled' : 'Disabled'}`, 'green');
      testMetrics.passedTests++;
    } else {
      logTest('Backend Health', 'FAIL', `Status: ${response.data.status}`);
      testMetrics.failedTests++;
    }
  } catch (error) {
    logTest('Backend Health', 'FAIL', error.message);
    testMetrics.failedTests++;
  }
  testMetrics.totalTests++;
}

// Test 2: Backend Domain Scoring
async function testBackendScoring() {
  logSection('Backend Domain Scoring');
  
  try {
    const startTime = Date.now();
    const response = await httpClient.post(`${BACKEND_URL}/score-domain`, {
      domainName: TEST_DOMAIN
    });
    const responseTime = Date.now() - startTime;
    
    testMetrics.performanceMetrics.domainScoring = responseTime;
    
    if (response.status === 200 && response.data.score !== undefined) {
      logTest('Domain Scoring', 'PASS', `${responseTime}ms`);
      log(`   Domain: ${response.data.domainName}`, 'green');
      log(`   Score: ${response.data.score}/100`, 'green');
      log(`   Features:`, 'green');
      log(`     - Length: ${response.data.features?.length}`, 'green');
      log(`     - Has Keyword: ${response.data.features?.hasKeyword}`, 'green');
      log(`     - TLD Rarity: ${response.data.features?.tldRarity}`, 'green');
      log(`     - Transaction History: ${response.data.features?.txnHistory}`, 'green');
      log(`     - Expiry Days: ${response.data.features?.expiryDays}`, 'green');
      log(`   Recommendations: ${response.data.recommendations?.length || 0}`, 'green');
      
      // Count potential transactions
      if (response.data.recommendations) {
        const actionCount = response.data.recommendations.filter(rec => 
          ['tokenize', 'auction', 'renew', 'transfer'].includes(rec.action)
        ).length;
        testMetrics.potentialTxns += actionCount;
        log(`   Potential txns: ${actionCount}`, 'cyan');
      }
      
      testMetrics.passedTests++;
    } else {
      logTest('Domain Scoring', 'FAIL', `Invalid response format`);
      testMetrics.failedTests++;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest('Domain Scoring', 'WARN', `Domain not found (expected for test domain)`);
      testMetrics.warnings++;
    } else {
      logTest('Domain Scoring', 'FAIL', error.message);
      testMetrics.failedTests++;
    }
  }
  testMetrics.totalTests++;
}

// Test 3: Backend Trends
async function testBackendTrends() {
  logSection('Backend Trends Analytics');
  
  try {
    const startTime = Date.now();
    const response = await httpClient.get(`${BACKEND_URL}/get-trends`);
    const responseTime = Date.now() - startTime;
    
    testMetrics.performanceMetrics.trends = responseTime;
    
    if (response.status === 200 && response.data.totalDomains !== undefined) {
      logTest('Trends Analytics', 'PASS', `${responseTime}ms`);
      log(`   Total domains: ${response.data.totalDomains}`, 'green');
      log(`   Top TLDs: ${response.data.tldStats?.slice(0, 3).map(t => t.tld).join(', ')}`, 'green');
      log(`   Score distribution:`, 'green');
      log(`     - High: ${response.data.scoreDistribution?.high}`, 'green');
      log(`     - Medium: ${response.data.scoreDistribution?.medium}`, 'green');
      log(`     - Low: ${response.data.scoreDistribution?.low}`, 'green');
      log(`   Monthly activity: ${response.data.monthlyActivity?.length || 0} months`, 'green');
      testMetrics.passedTests++;
    } else {
      logTest('Trends Analytics', 'FAIL', `Invalid response format`);
      testMetrics.failedTests++;
    }
  } catch (error) {
    logTest('Trends Analytics', 'FAIL', error.message);
    testMetrics.failedTests++;
  }
  testMetrics.totalTests++;
}

// Test 4: Backend Alerts
async function testBackendAlerts() {
  logSection('Backend Alerts System');
  
  try {
    const startTime = Date.now();
    const response = await httpClient.get(`${BACKEND_URL}/get-alerts`);
    const responseTime = Date.now() - startTime;
    
    testMetrics.performanceMetrics.alerts = responseTime;
    
    if (response.status === 200) {
      logTest('Alerts System', 'PASS', `${responseTime}ms`);
      log(`   Total alerts: ${response.data.totalAlerts || 0}`, 'green');
      log(`   Recent alerts: ${response.data.alerts?.length || 0}`, 'green');
      log(`   Expiring domains: ${response.data.expiringDomains?.length || 0}`, 'green');
      log(`   New alerts: ${response.data.newAlerts || 0}`, 'green');
      log(`   Config:`, 'green');
      log(`     - Enabled: ${response.data.config?.enabled}`, 'green');
      log(`     - Check interval: ${response.data.config?.checkInterval}ms`, 'green');
      log(`     - Expiry threshold: ${response.data.config?.expiryThreshold} days`, 'green');
      log(`     - Min score threshold: ${response.data.config?.minScoreThreshold}`, 'green');
      testMetrics.passedTests++;
    } else {
      logTest('Alerts System', 'FAIL', `Status: ${response.status}`);
      testMetrics.failedTests++;
    }
  } catch (error) {
    logTest('Alerts System', 'FAIL', error.message);
    testMetrics.failedTests++;
  }
  testMetrics.totalTests++;
}

// Test 5: CORS Configuration
async function testCORS() {
  logSection('CORS Configuration');
  
  const corsTests = [
    {
      name: 'Frontend to Backend',
      url: `${BACKEND_URL}/health`,
      origin: FRONTEND_URL
    },
    {
      name: 'Backend Health CORS',
      url: `${BACKEND_URL}/health`,
      origin: 'https://localhost:3001'
    }
  ];
  
  for (const test of corsTests) {
    try {
      const response = await httpClient.get(test.url, {
        headers: {
          'Origin': test.origin
        }
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers['access-control-allow-origin'],
        'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
        'access-control-allow-methods': response.headers['access-control-allow-methods']
      };
      
      testMetrics.corsTests++;
      
      if (response.status === 200) {
        logTest(`CORS ${test.name}`, 'PASS', `Origin: ${test.origin}`);
        log(`   Allow-Origin: ${corsHeaders['access-control-allow-origin']}`, 'green');
        log(`   Allow-Credentials: ${corsHeaders['access-control-allow-credentials']}`, 'green');
        testMetrics.corsPassed++;
      } else {
        logTest(`CORS ${test.name}`, 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      logTest(`CORS ${test.name}`, 'FAIL', error.message);
    }
  }
}

// Test 6: Frontend Tests with Puppeteer
async function testFrontend() {
  logSection('Frontend Tests');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Test 6.1: Page Load
    const loadStartTime = Date.now();
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    const loadTime = Date.now() - loadStartTime;
    
    testMetrics.performanceMetrics.frontendLoad = loadTime;
    
    if (loadTime < PERFORMANCE_THRESHOLD) {
      logTest('Frontend Load', 'PASS', `${loadTime}ms`);
    } else {
      logTest('Frontend Load', 'WARN', `${loadTime}ms (threshold: ${PERFORMANCE_THRESHOLD}ms)`);
      testMetrics.warnings++;
    }
    testMetrics.totalTests++;
    
    // Test 6.2: Page Title
    const title = await page.title();
    if (title.includes('DomaInsight')) {
      logTest('Page Title', 'PASS', title);
      testMetrics.passedTests++;
    } else {
      logTest('Page Title', 'FAIL', title);
      testMetrics.failedTests++;
    }
    testMetrics.totalTests++;
    
    // Test 6.3: Search Functionality
    try {
      await page.waitForSelector('input[placeholder*="domain"]', { timeout: 5000 });
      await page.type('input[placeholder*="domain"]', TEST_DOMAIN);
      await page.click('button:has-text("Score Domain")');
      
      // Wait for response
      await page.waitForTimeout(3000);
      
      const scoreElement = await page.$('.text-4xl.font-bold');
      if (scoreElement) {
        logTest('Search Functionality', 'PASS', 'Domain search and scoring works');
        testMetrics.passedTests++;
      } else {
        logTest('Search Functionality', 'WARN', 'Search completed but no score displayed');
        testMetrics.warnings++;
      }
    } catch (error) {
      logTest('Search Functionality', 'FAIL', error.message);
      testMetrics.failedTests++;
    }
    testMetrics.totalTests++;
    
    // Test 6.4: Filters
    try {
      const filterElements = await page.$$('select, button:has-text("High"), button:has-text("Medium"), button:has-text("Low")');
      if (filterElements.length > 0) {
        logTest('Filter Elements', 'PASS', `${filterElements.length} filter elements found`);
        testMetrics.passedTests++;
      } else {
        logTest('Filter Elements', 'WARN', 'No filter elements found');
        testMetrics.warnings++;
      }
    } catch (error) {
      logTest('Filter Elements', 'FAIL', error.message);
      testMetrics.failedTests++;
    }
    testMetrics.totalTests++;
    
    // Test 6.5: Alerts Section
    try {
      const alertsSection = await page.$('text="Domain Alerts"');
      if (alertsSection) {
        logTest('Alerts Section', 'PASS', 'Alerts section is present');
        testMetrics.passedTests++;
      } else {
        logTest('Alerts Section', 'WARN', 'Alerts section not found');
        testMetrics.warnings++;
      }
    } catch (error) {
      logTest('Alerts Section', 'FAIL', error.message);
      testMetrics.failedTests++;
    }
    testMetrics.totalTests++;
    
    // Test 6.6: Mobile Responsiveness
    await page.setViewport({ width: 375, height: 667 });
    await page.reload({ waitUntil: 'networkidle0' });
    
    const mobileElements = await page.$$('input, button');
    if (mobileElements.length > 0) {
      logTest('Mobile Responsiveness', 'PASS', `${mobileElements.length} interactive elements on mobile`);
      testMetrics.passedTests++;
    } else {
      logTest('Mobile Responsiveness', 'FAIL', 'No interactive elements found on mobile');
      testMetrics.failedTests++;
    }
    testMetrics.totalTests++;
    
  } catch (error) {
    logTest('Frontend Tests', 'FAIL', error.message);
    testMetrics.failedTests++;
    testMetrics.totalTests++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Test 7: Performance Tests
async function testPerformance() {
  logSection('Performance Tests');
  
  const performanceTests = [
    { name: 'Backend Health', url: `${BACKEND_URL}/health` },
    { name: 'Backend Trends', url: `${BACKEND_URL}/get-trends` },
    { name: 'Backend Alerts', url: `${BACKEND_URL}/get-alerts` }
  ];
  
  for (const test of performanceTests) {
    try {
      const startTime = Date.now();
      const response = await httpClient.get(test.url);
      const responseTime = Date.now() - startTime;
      
      if (responseTime < 1000) {
        logTest(`${test.name} Performance`, 'PASS', `${responseTime}ms`);
        testMetrics.passedTests++;
      } else if (responseTime < 2000) {
        logTest(`${test.name} Performance`, 'WARN', `${responseTime}ms (slow)`);
        testMetrics.warnings++;
      } else {
        logTest(`${test.name} Performance`, 'FAIL', `${responseTime}ms (too slow)`);
        testMetrics.failedTests++;
      }
      testMetrics.totalTests++;
    } catch (error) {
      logTest(`${test.name} Performance`, 'FAIL', error.message);
      testMetrics.failedTests++;
      testMetrics.totalTests++;
    }
  }
}

// Test 8: End-to-End Integration
async function testE2EIntegration() {
  logSection('End-to-End Integration');
  
  let browser;
  let page;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to frontend
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    
    // Mock wallet connection
    await page.evaluateOnNewDocument(() => {
      window.ethereum = {
        isMetaMask: true,
        request: async (params) => {
          if (params.method === 'eth_requestAccounts') {
            return ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'];
          }
          return null;
        }
      };
    });
    
    // Test complete user flow
    await page.waitForSelector('input[placeholder*="domain"]', { timeout: 5000 });
    await page.type('input[placeholder*="domain"]', TEST_DOMAIN);
    await page.click('button:has-text("Score Domain")');
    
    // Wait for scoring
    await page.waitForTimeout(5000);
    
    // Check for recommendations
    const recommendations = await page.$$('[class*="recommendation"]');
    if (recommendations.length > 0) {
      logTest('E2E Integration', 'PASS', `${recommendations.length} recommendations generated`);
      testMetrics.passedTests++;
      
      // Count potential transactions
      const actionButtons = await page.$$('button:has-text("Act Now"), button:has-text("Tokenize"), button:has-text("Renew")');
      testMetrics.potentialTxns += actionButtons.length;
      log(`   Potential txns: ${actionButtons.length}`, 'cyan');
    } else {
      logTest('E2E Integration', 'WARN', 'No recommendations found');
      testMetrics.warnings++;
    }
    testMetrics.totalTests++;
    
  } catch (error) {
    logTest('E2E Integration', 'FAIL', error.message);
    testMetrics.failedTests++;
    testMetrics.totalTests++;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Generate test report
function generateReport() {
  logSection('Test Report');
  
  const passRate = ((testMetrics.passedTests / testMetrics.totalTests) * 100).toFixed(1);
  const corsRate = ((testMetrics.corsPassed / testMetrics.corsTests) * 100).toFixed(1);
  
  log(`📊 Test Summary:`, 'bright');
  log(`   Total Tests: ${testMetrics.totalTests}`, 'blue');
  log(`   Passed: ${testMetrics.passedTests}`, 'green');
  log(`   Failed: ${testMetrics.failedTests}`, 'red');
  log(`   Warnings: ${testMetrics.warnings}`, 'yellow');
  log(`   Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');
  
  log(`\n🌐 CORS Tests:`, 'bright');
  log(`   CORS Tests: ${testMetrics.corsTests}`, 'blue');
  log(`   CORS Passed: ${testMetrics.corsPassed}`, 'green');
  log(`   CORS Rate: ${corsRate}%`, corsRate >= 80 ? 'green' : 'red');
  
  log(`\n⚡ Performance Metrics:`, 'bright');
  Object.entries(testMetrics.performanceMetrics).forEach(([test, time]) => {
    const status = time < 1000 ? 'green' : time < 2000 ? 'yellow' : 'red';
    log(`   ${test}: ${time}ms`, status);
  });
  
  log(`\n💰 Transaction Metrics:`, 'bright');
  log(`   Potential txns: ${testMetrics.potentialTxns}`, 'cyan');
  
  log(`\n🎯 Overall Status:`, 'bright');
  if (testMetrics.failedTests === 0 && passRate >= 80) {
    log(`   ✅ DEPLOYMENT HEALTHY`, 'green');
  } else if (testMetrics.failedTests < 3 && passRate >= 60) {
    log(`   ⚠️  DEPLOYMENT WARNING`, 'yellow');
  } else {
    log(`   ❌ DEPLOYMENT ISSUES`, 'red');
  }
  
  log(`\n🔗 URLs:`, 'bright');
  log(`   Frontend: ${FRONTEND_URL}`, 'cyan');
  log(`   Backend: ${BACKEND_URL}`, 'cyan');
  log(`   Health: ${BACKEND_URL}/health`, 'cyan');
}

// Main test runner
async function runTests() {
  log('🚀 DomaInsight Live Deployment Test Suite', 'bright');
  log('==========================================', 'bright');
  log(`Frontend: ${FRONTEND_URL}`, 'blue');
  log(`Backend: ${BACKEND_URL}`, 'blue');
  log(`Test Domain: ${TEST_DOMAIN}`, 'blue');
  
  try {
    // Backend tests
    await testBackendHealth();
    await testBackendScoring();
    await testBackendTrends();
    await testBackendAlerts();
    
    // CORS tests
    await testCORS();
    
    // Frontend tests
    await testFrontend();
    
    // Performance tests
    await testPerformance();
    
    // E2E integration
    await testE2EIntegration();
    
    // Generate report
    generateReport();
    
    // Exit with appropriate code
    if (testMetrics.failedTests === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled rejection: ${reason}`, 'red');
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testBackendHealth,
  testBackendScoring,
  testBackendTrends,
  testBackendAlerts,
  testCORS,
  testFrontend,
  testPerformance,
  testE2EIntegration
};
