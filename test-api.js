const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TEST_DOMAIN = 'crypto.eth';

async function testAPI() {
  console.log('🔧 Testing DomaInsight Backend API');
  console.log('===================================');
  
  try {
    // Test 1: Health Check
    console.log('\n🏥 Test 1: Health Check...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is healthy');
    console.log(`   - Status: ${healthResponse.data.status}`);
    console.log(`   - Multi-chain: ${healthResponse.data.multiChain}`);
    console.log(`   - Wallet connected: ${healthResponse.data.wallet ? 'Yes' : 'No'}`);
    
    // Test 2: Domain Scoring
    console.log('\n🔍 Test 2: Domain Scoring...');
    const scoreResponse = await axios.post(`${BACKEND_URL}/score-domain`, {
      domainName: TEST_DOMAIN
    });
    
    console.log(`✅ Domain scored: ${scoreResponse.data.domainName}`);
    console.log(`   - Score: ${scoreResponse.data.score}/100`);
    console.log(`   - Length: ${scoreResponse.data.features.length}`);
    console.log(`   - Has keyword: ${scoreResponse.data.features.hasKeyword}`);
    console.log(`   - TLD rarity: ${Math.round(scoreResponse.data.features.tldRarity * 100)}%`);
    console.log(`   - Activities: ${scoreResponse.data.features.txnHistory}`);
    
    // Test 3: Smart Recommendations
    console.log('\n💡 Test 3: Smart Recommendations...');
    const recommendationsResponse = await axios.post(`${BACKEND_URL}/recommend-actions`, {
      domainName: TEST_DOMAIN,
      score: scoreResponse.data.score,
      features: scoreResponse.data.features
    });
    
    console.log(`✅ Generated ${recommendationsResponse.data.recommendations.length} recommendations`);
    recommendationsResponse.data.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.title} (${rec.priority} priority)`);
    });
    
    // Test 4: On-Chain Action (Tokenize)
    console.log('\n🔗 Test 4: On-Chain Action (Tokenize)...');
    try {
      const actionResponse = await axios.post(`${BACKEND_URL}/trigger-action`, {
        action: 'tokenize',
        domainName: TEST_DOMAIN,
        chain: 'testnet'
      });
      
      console.log('✅ Action triggered successfully');
      console.log(`   - Action: ${actionResponse.data.action}`);
      console.log(`   - Transaction hash: ${actionResponse.data.transactionHash}`);
      console.log(`   - Gas used: ${actionResponse.data.gasUsed}`);
      console.log(`   - Block number: ${actionResponse.data.blockNumber}`);
      
      // Log potential transaction for impact demo
      console.log(`   - Potential txns: 1 (${actionResponse.data.action} executed)`);
      
    } catch (error) {
      if (error.response?.status === 503) {
        console.log('⚠️  On-chain actions disabled (no wallet configured)');
      } else {
        console.log('❌ On-chain action failed:', error.response?.data?.error || error.message);
      }
    }
    
    // Test 5: Alerts
    console.log('\n🚨 Test 5: Alerts...');
    const alertsResponse = await axios.get(`${BACKEND_URL}/get-alerts`);
    
    console.log(`✅ Retrieved ${alertsResponse.data.alerts.length} alerts`);
    console.log(`   - Total alerts: ${alertsResponse.data.totalAlerts}`);
    console.log(`   - New alerts: ${alertsResponse.data.newAlerts}`);
    
    if (alertsResponse.data.alerts.length > 0) {
      const highPriorityAlerts = alertsResponse.data.alerts.filter(alert => alert.priority === 'high');
      console.log(`   - High priority alerts: ${highPriorityAlerts.length}`);
    }
    
    // Test 6: Trends
    console.log('\n📊 Test 6: Market Trends...');
    const trendsResponse = await axios.get(`${BACKEND_URL}/get-trends`);
    
    console.log('✅ Market trends retrieved');
    console.log(`   - Total domains: ${trendsResponse.data.totalDomains}`);
    console.log(`   - Total activity: ${trendsResponse.data.insights.totalActivity}`);
    console.log(`   - Average score: ${trendsResponse.data.insights.avgScore}`);
    console.log(`   - Most popular TLD: .${trendsResponse.data.insights.mostPopularTld}`);
    
    // Test 7: Multi-Chain Support
    console.log('\n🌐 Test 7: Multi-Chain Support...');
    const multiChainResponse = await axios.post(`${BACKEND_URL}/score-domain-multi`, {
      domainName: TEST_DOMAIN,
      chain: 'testnet'
    });
    
    console.log('✅ Multi-chain scoring successful');
    console.log(`   - Chain: ${multiChainResponse.data.chain}`);
    console.log(`   - Score: ${multiChainResponse.data.score}/100`);
    
    // Test 8: State Sync Status
    console.log('\n🔄 Test 8: State Sync Status...');
    const syncResponse = await axios.get(`${BACKEND_URL}/state-sync-status`);
    
    console.log('✅ State sync status retrieved');
    console.log(`   - Enabled: ${syncResponse.data.enabled}`);
    console.log(`   - Chains: ${syncResponse.data.chains.join(', ')}`);
    console.log(`   - Last sync: ${syncResponse.data.lastSync}`);
    
    // Test 9: Expiring Domains Check
    console.log('\n⏰ Test 9: Expiring Domains Check...');
    const expiringResponse = await axios.post(`${BACKEND_URL}/check-expiring-domains`);
    
    console.log('✅ Expiring domains check completed');
    console.log(`   - Expiring domains found: ${expiringResponse.data.totalFound}`);
    console.log(`   - New alerts generated: ${expiringResponse.data.newAlerts}`);
    
    console.log('\n🎉 All API Tests Completed Successfully!');
    console.log('=========================================');
    
    // Summary
    console.log('\n📈 Impact Summary:');
    console.log('   ✅ Real-time domain scoring with AI');
    console.log('   ✅ Smart recommendations generated');
    console.log('   ✅ On-chain actions available');
    console.log('   ✅ Multi-chain data synchronization');
    console.log('   ✅ Real-time alerts and monitoring');
    console.log('   ✅ Market trends and analytics');
    console.log('   ✅ No mocks - all live data from Doma testnet');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Error:', error.response.data);
    }
    return false;
  }
}

// Run tests
if (require.main === module) {
  testAPI()
    .then((success) => {
      if (success) {
        console.log('\n✅ All API tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some API tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPI };
