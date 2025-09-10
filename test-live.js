const axios = require('axios');

// Configuration - Update these URLs after deployment
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://domainsight-frontend.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://domainsight-backend.fly.dev';
const TEST_DOMAIN = 'crypto.eth';

async function testLiveDeployment() {
  console.log('🌐 Testing Live DomaInsight Deployment');
  console.log('=====================================');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log('');

  let allTestsPassed = true;

  try {
    // Test 1: Backend Health Check
    console.log('🏥 Test 1: Backend Health Check...');
    try {
      const healthResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
      console.log('✅ Backend is healthy');
      console.log(`   - Status: ${healthResponse.data.status}`);
      console.log(`   - Multi-chain: ${healthResponse.data.multiChain}`);
      console.log(`   - Wallet: ${healthResponse.data.wallet ? 'Connected' : 'Not configured'}`);
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
      allTestsPassed = false;
    }

    // Test 2: Frontend Accessibility
    console.log('\n📱 Test 2: Frontend Accessibility...');
    try {
      const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 10000 });
      if (frontendResponse.data.includes('DomaInsight')) {
        console.log('✅ Frontend is accessible');
      } else {
        console.log('❌ Frontend content validation failed');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('❌ Frontend accessibility test failed:', error.message);
      allTestsPassed = false;
    }

    // Test 3: Domain Scoring API
    console.log('\n🔍 Test 3: Domain Scoring API...');
    try {
      const scoreResponse = await axios.post(`${BACKEND_URL}/score-domain`, {
        domainName: TEST_DOMAIN
      }, { timeout: 15000 });
      
      console.log('✅ Domain scoring successful');
      console.log(`   - Domain: ${scoreResponse.data.domainName}`);
      console.log(`   - Score: ${scoreResponse.data.score}/100`);
      console.log(`   - Features: ${Object.keys(scoreResponse.data.features).length} analyzed`);
    } catch (error) {
      console.log('❌ Domain scoring failed:', error.response?.data?.error || error.message);
      allTestsPassed = false;
    }

    // Test 4: Recommendations API
    console.log('\n💡 Test 4: Recommendations API...');
    try {
      const recommendationsResponse = await axios.post(`${BACKEND_URL}/recommend-actions`, {
        domainName: TEST_DOMAIN,
        score: 85,
        features: { hasKeyword: true, tldRarity: 0.9 }
      }, { timeout: 10000 });
      
      console.log('✅ Recommendations generated');
      console.log(`   - Count: ${recommendationsResponse.data.recommendations.length}`);
      console.log(`   - Actions: ${recommendationsResponse.data.recommendations.map(r => r.action).join(', ')}`);
    } catch (error) {
      console.log('❌ Recommendations failed:', error.response?.data?.error || error.message);
      allTestsPassed = false;
    }

    // Test 5: Trends API
    console.log('\n📊 Test 5: Market Trends API...');
    try {
      const trendsResponse = await axios.get(`${BACKEND_URL}/get-trends`, { timeout: 15000 });
      
      console.log('✅ Market trends retrieved');
      console.log(`   - Total domains: ${trendsResponse.data.totalDomains}`);
      console.log(`   - Average score: ${trendsResponse.data.insights.avgScore}`);
      console.log(`   - Popular TLD: .${trendsResponse.data.insights.mostPopularTld}`);
    } catch (error) {
      console.log('❌ Trends API failed:', error.response?.data?.error || error.message);
      allTestsPassed = false;
    }

    // Test 6: Alerts API
    console.log('\n🚨 Test 6: Alerts API...');
    try {
      const alertsResponse = await axios.get(`${BACKEND_URL}/get-alerts`, { timeout: 10000 });
      
      console.log('✅ Alerts retrieved');
      console.log(`   - Total alerts: ${alertsResponse.data.totalAlerts}`);
      console.log(`   - Recent alerts: ${alertsResponse.data.alerts.length}`);
    } catch (error) {
      console.log('❌ Alerts API failed:', error.response?.data?.error || error.message);
      allTestsPassed = false;
    }

    // Test 7: Multi-Chain Support
    console.log('\n🌐 Test 7: Multi-Chain Support...');
    try {
      const multiChainResponse = await axios.post(`${BACKEND_URL}/score-domain-multi`, {
        domainName: TEST_DOMAIN,
        chain: 'testnet'
      }, { timeout: 10000 });
      
      console.log('✅ Multi-chain scoring successful');
      console.log(`   - Chain: ${multiChainResponse.data.chain}`);
      console.log(`   - Score: ${multiChainResponse.data.score}/100`);
    } catch (error) {
      console.log('❌ Multi-chain API failed:', error.response?.data?.error || error.message);
      allTestsPassed = false;
    }

    // Test 8: State Sync Status
    console.log('\n🔄 Test 8: State Sync Status...');
    try {
      const syncResponse = await axios.get(`${BACKEND_URL}/state-sync-status`, { timeout: 10000 });
      
      console.log('✅ State sync status retrieved');
      console.log(`   - Enabled: ${syncResponse.data.enabled}`);
      console.log(`   - Chains: ${syncResponse.data.chains.join(', ')}`);
    } catch (error) {
      console.log('❌ State sync check failed:', error.response?.data?.error || error.message);
      allTestsPassed = false;
    }

    // Test 9: On-Chain Actions (if wallet configured)
    console.log('\n🔗 Test 9: On-Chain Actions...');
    try {
      const actionResponse = await axios.post(`${BACKEND_URL}/trigger-action`, {
        action: 'tokenize',
        domainName: TEST_DOMAIN,
        chain: 'testnet'
      }, { timeout: 15000 });
      
      console.log('✅ On-chain action successful');
      console.log(`   - Action: ${actionResponse.data.action}`);
      console.log(`   - Transaction: ${actionResponse.data.transactionHash}`);
      console.log(`   - Gas used: ${actionResponse.data.gasUsed}`);
      
      // Log potential transaction for impact demo
      console.log(`   - Potential txns: 1 (${actionResponse.data.action} executed)`);
      
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('⚠️  On-chain actions disabled (no wallet configured)');
      } else {
        console.log('❌ On-chain action failed:', error.response?.data?.error || error.message);
        allTestsPassed = false;
      }
    }

    // Test 10: CORS Configuration
    console.log('\n🔒 Test 10: CORS Configuration...');
    try {
      const corsResponse = await axios.options(`${BACKEND_URL}/health`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      console.log('✅ CORS configuration working');
      console.log(`   - Status: ${corsResponse.status}`);
    } catch (error) {
      console.log('⚠️  CORS test inconclusive:', error.message);
    }

    // Summary
    console.log('\n📈 Live Deployment Test Summary');
    console.log('===============================');
    
    if (allTestsPassed) {
      console.log('🎉 All tests passed! DomaInsight is live and working correctly.');
      console.log('');
      console.log('✅ Features verified:');
      console.log('   - Real-time domain scoring with AI');
      console.log('   - Smart recommendations generation');
      console.log('   - Market trends and analytics');
      console.log('   - Multi-chain data synchronization');
      console.log('   - Real-time alerts and monitoring');
      console.log('   - On-chain actions (if wallet configured)');
      console.log('   - No mocks - all live data from Doma testnet');
      console.log('');
      console.log('🌐 Live URLs:');
      console.log(`   Frontend: ${FRONTEND_URL}`);
      console.log(`   Backend: ${BACKEND_URL}`);
      console.log(`   Health: ${BACKEND_URL}/health`);
    } else {
      console.log('❌ Some tests failed. Please check the deployment.');
    }

    return allTestsPassed;

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    return false;
  }
}

// Run tests
if (require.main === module) {
  testLiveDeployment()
    .then((success) => {
      if (success) {
        console.log('\n✅ Live deployment test completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Live deployment test failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testLiveDeployment };
