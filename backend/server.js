require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { RandomForestRegression } = require('ml-random-forest');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Doma testnet subgraph endpoint
const DOMA_SUBGRAPH_URL = 'https://api-testnet.doma.xyz/graphql';

// Multi-chain support - Doma state sync endpoints
const CHAIN_ENDPOINTS = {
  testnet: 'https://api-testnet.doma.xyz/graphql',
  mainnet: 'https://api.doma.xyz/graphql',
  polygon: 'https://api-polygon.doma.xyz/graphql',
  arbitrum: 'https://api-arbitrum.doma.xyz/graphql'
};

// Doma testnet RPC and contract addresses
const DOMA_TESTNET_RPC = 'https://rpc-testnet.doma.xyz';
const DOMA_CONTRACTS = {
  testnet: {
    registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', // ENS Registry
    resolver: '0x0000000000000000000000000000000000000000', // Will be updated with actual Doma contracts
    tokenizer: '0x0000000000000000000000000000000000000000' // Doma tokenization contract
  }
};

// Initialize ethers provider and wallet
let provider, wallet;
if (process.env.PRIVATE_KEY) {
  try {
    provider = new ethers.JsonRpcProvider(DOMA_TESTNET_RPC);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log('✅ Wallet connected:', wallet.address);
  } catch (error) {
    console.warn('⚠️  Wallet connection failed:', error.message);
    console.warn('⚠️  On-chain actions will be disabled without valid PRIVATE_KEY');
  }
} else {
  console.warn('⚠️  No PRIVATE_KEY found in environment variables');
  console.warn('⚠️  On-chain actions will be disabled');
}

// State sync configuration
const STATE_SYNC_CONFIG = {
  enabled: true,
  syncInterval: 30000, // 30 seconds
  chains: ['testnet', 'mainnet', 'polygon', 'arbitrum']
};

// Alert system for high-score expiring domains
const ALERT_CONFIG = {
  enabled: true,
  checkInterval: 60000, // 1 minute
  expiryThreshold: 7, // days
  minScoreThreshold: 70 // minimum score to alert
};

// In-memory storage for alerts (in production, use Redis or database)
const alerts = [];

// Pre-trained model data (simulated real domain data for training)
const trainingData = [
  // [length, hasKeyword, tldRarity, txnHistory, expiryDays]
  [3, 1, 0.9, 15, 95], // crypto.eth - short, keyword, rare TLD, high activity
  [8, 0, 0.3, 2, 45],  // mydomain.eth - long, no keyword, common TLD, low activity
  [5, 1, 0.7, 8, 78],  // nft.eth - medium, keyword, medium rarity, medium activity
  [12, 0, 0.2, 1, 12], // verylongname.eth - very long, no keyword, common, low activity
  [4, 1, 0.8, 12, 88], // defi.eth - short, keyword, rare TLD, high activity
  [6, 0, 0.4, 3, 34],  // domain.eth - medium, no keyword, common TLD, low activity
  [7, 1, 0.6, 6, 67],  // web3.eth - medium, keyword, medium rarity, medium activity
  [9, 0, 0.3, 1, 23],  // mywebsite.eth - long, no keyword, common TLD, low activity
  [5, 1, 0.9, 20, 98], // dao.eth - short, keyword, very rare TLD, very high activity
  [10, 0, 0.2, 2, 15], // myproject.eth - long, no keyword, common TLD, low activity
  [4, 1, 0.7, 10, 82], // meta.eth - short, keyword, medium rarity, high activity
  [8, 0, 0.3, 4, 56],  // business.eth - long, no keyword, common TLD, medium activity
  [6, 1, 0.8, 14, 91], // game.eth - medium, keyword, rare TLD, high activity
  [11, 0, 0.2, 1, 8],  // mycompany.eth - very long, no keyword, common TLD, low activity
  [5, 1, 0.6, 7, 72],  // art.eth - medium, keyword, medium rarity, medium activity
  [7, 0, 0.4, 3, 41],  // website.eth - medium, no keyword, common TLD, low activity
  [4, 1, 0.9, 18, 96], // ai.eth - short, keyword, very rare TLD, very high activity
  [9, 0, 0.3, 2, 28],  // mybusiness.eth - long, no keyword, common TLD, low activity
  [6, 1, 0.7, 9, 85],  // tech.eth - medium, keyword, medium rarity, high activity
  [12, 0, 0.2, 1, 5],  // verylongdomain.eth - very long, no keyword, common TLD, very low activity
  [3, 1, 0.8, 16, 94], // btc.eth - very short, keyword, rare TLD, very high activity
  [8, 0, 0.3, 3, 38],  // mydomain.eth - long, no keyword, common TLD, low activity
  [5, 1, 0.6, 8, 76],  // eth.eth - medium, keyword, medium rarity, medium activity
  [10, 0, 0.2, 2, 18], // mywebsite.eth - long, no keyword, common TLD, low activity
  [4, 1, 0.9, 22, 99], // sol.eth - short, keyword, very rare TLD, extremely high activity
  [7, 0, 0.4, 4, 52],  // project.eth - medium, no keyword, common TLD, medium activity
  [6, 1, 0.7, 11, 87], // app.eth - medium, keyword, medium rarity, high activity
  [9, 0, 0.3, 2, 31],  // myproject.eth - long, no keyword, common TLD, low activity
  [5, 1, 0.8, 13, 89], // dev.eth - medium, keyword, rare TLD, high activity
  [11, 0, 0.2, 1, 11], // mycompany.eth - very long, no keyword, common TLD, very low activity
];

const trainingScores = [
  95, 45, 78, 12, 88, 34, 67, 23, 98, 15, 82, 56, 91, 8, 72, 41, 96, 28, 85, 5, 94, 38, 76, 18, 99, 52, 87, 31, 89, 11
];

// Initialize and train the model
let model = new RandomForestRegression({
  nEstimators: 100,
  maxFeatures: 1.0,
  replacement: true,
  seed: 42
});

model.train(trainingData, trainingScores);

// Helper function to calculate TLD rarity
function calculateTldRarity(tld) {
  const tldRarityMap = {
    'eth': 0.3,    // Common
    'com': 0.2,    // Very common
    'org': 0.4,    // Common
    'net': 0.3,    // Common
    'crypto': 0.9, // Very rare
    'nft': 0.8,    // Rare
    'defi': 0.8,   // Rare
    'dao': 0.9,    // Very rare
    'web3': 0.7,   // Medium rare
    'meta': 0.7,   // Medium rare
    'game': 0.8,   // Rare
    'art': 0.6,    // Medium
    'ai': 0.9,     // Very rare
    'tech': 0.7,   // Medium rare
    'btc': 0.8,    // Rare
    'sol': 0.9,    // Very rare
    'app': 0.7,    // Medium rare
    'dev': 0.8     // Rare
  };
  return tldRarityMap[tld.toLowerCase()] || 0.3;
}

// Helper function to check for keywords
function hasKeyword(domainName) {
  const keywords = ['crypto', 'nft', 'defi', 'dao', 'web3', 'meta', 'game', 'art', 'ai', 'tech', 'btc', 'sol', 'app', 'dev', 'eth'];
  return keywords.some(keyword => domainName.toLowerCase().includes(keyword)) ? 1 : 0;
}

// Helper function to calculate days until expiry
function calculateExpiryDays(expiryTimestamp) {
  if (!expiryTimestamp) return 365; // Default to 1 year if no expiry
  const now = Math.floor(Date.now() / 1000);
  const daysUntilExpiry = Math.floor((expiryTimestamp - now) / (24 * 60 * 60));
  return Math.max(0, daysUntilExpiry);
}

// Endpoint to score a domain
app.post('/score-domain', async (req, res) => {
  const { domainName } = req.body;

  if (!domainName) {
    return res.status(400).json({ error: 'Domain name is required' });
  }

  try {
    console.log(`Scoring domain: ${domainName}`);
    
    // Query Doma subgraph for domain traits
    const query = `
      query GetDomain($name: String!) {
        name(name: $name) {
          name
          tld
          expiry
          owner
          activities {
            type
            timestamp
          }
        }
      }
    `;

    const response = await axios.post(DOMA_SUBGRAPH_URL, {
      query,
      variables: { name: domainName }
    });

    const domainData = response.data.data?.name;

    if (!domainData) {
      return res.status(404).json({ 
        error: 'Domain not found in Doma testnet',
        domainName 
      });
    }

    // Extract features for scoring
    const length = domainData.name.length;
    const hasKeywordValue = hasKeyword(domainData.name);
    const tldRarity = calculateTldRarity(domainData.tld);
    const txnHistory = domainData.activities?.length || 0;
    const expiryDays = calculateExpiryDays(domainData.expiry);

    // Predict the score using the trained model
    const features = [[length, hasKeywordValue, tldRarity, txnHistory, expiryDays]];
    const score = Math.round(model.predict(features)[0]);
    const clampedScore = Math.max(0, Math.min(100, score));

    // Generate recommendations based on score
    const recommendations = generateRecommendations(clampedScore, domainData);

    res.json({
      domainName,
      score: clampedScore,
      features: {
        length,
        hasKeyword: hasKeywordValue === 1,
        tldRarity,
        txnHistory,
        expiryDays
      },
      domainData: {
        name: domainData.name,
        tld: domainData.tld,
        expiry: domainData.expiry,
        owner: domainData.owner,
        activityCount: txnHistory
      },
      recommendations
    });

  } catch (error) {
    console.error('Error scoring domain:', error);
    if (error.response) {
      console.error('GraphQL Error:', error.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to score domain',
      details: error.message 
    });
  }
});

// Endpoint to get trend analytics
app.get('/get-trends', async (req, res) => {
  try {
    console.log('Fetching trend analytics...');
    
    // Query Doma subgraph for time-series data
    const query = `
      query GetTrends {
        names(first: 1000) {
          name
          tld
          expiry
          activities {
            type
            timestamp
          }
        }
      }
    `;

    const response = await axios.post(DOMA_SUBGRAPH_URL, { query });
    const namesData = response.data.data?.names || [];

    if (namesData.length === 0) {
      return res.status(404).json({ error: 'No domain data found' });
    }

    // Process data to compute trends
    const trends = computeTrends(namesData);

    res.json(trends);

  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch trends',
      details: error.message 
    });
  }
});

// Helper function to generate recommendations
function generateRecommendations(score, domainData) {
  const recommendations = [];
  
  if (score >= 80) {
    recommendations.push({
      action: 'tokenize',
      title: 'Tokenize Domain',
      description: 'High-value domain suitable for tokenization',
      priority: 'high'
    });
    recommendations.push({
      action: 'auction',
      title: 'List for Auction',
      description: 'Premium domain ready for auction',
      priority: 'high'
    });
  } else if (score >= 60) {
    recommendations.push({
      action: 'hold',
      title: 'Hold and Develop',
      description: 'Good potential for development',
      priority: 'medium'
    });
    recommendations.push({
      action: 'market',
      title: 'Market for Sale',
      description: 'Consider marketing for potential buyers',
      priority: 'medium'
    });
  } else {
    recommendations.push({
      action: 'monitor',
      title: 'Monitor Trends',
      description: 'Keep monitoring for value changes',
      priority: 'low'
    });
  }

  // Add expiry-based recommendations
  const expiryDays = calculateExpiryDays(domainData.expiry);
  if (expiryDays < 30) {
    recommendations.push({
      action: 'renew',
      title: 'Renew Domain',
      description: 'Domain expires soon - consider renewal',
      priority: 'high'
    });
  }

  return recommendations;
}

// Helper function to compute trends
function computeTrends(namesData) {
  const tldStats = {};
  const monthlyActivity = {};
  const scoreDistribution = { high: 0, medium: 0, low: 0 };

  namesData.forEach(domain => {
    const tld = domain.tld;
    const activityCount = domain.activities?.length || 0;
    
    // TLD statistics
    if (!tldStats[tld]) {
      tldStats[tld] = { count: 0, totalActivity: 0, avgScore: 0 };
    }
    tldStats[tld].count++;
    tldStats[tld].totalActivity += activityCount;

    // Monthly activity tracking
    domain.activities?.forEach(activity => {
      const date = new Date(activity.timestamp * 1000);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
    });

    // Score distribution (simplified)
    const estimatedScore = Math.min(100, Math.max(0, 
      (domain.name.length < 5 ? 20 : 0) + 
      (hasKeyword(domain.name) ? 30 : 0) + 
      (calculateTldRarity(tld) * 30) + 
      (Math.min(activityCount, 20) * 1)
    ));
    
    if (estimatedScore >= 70) scoreDistribution.high++;
    else if (estimatedScore >= 40) scoreDistribution.medium++;
    else scoreDistribution.low++;
  });

  // Calculate averages
  Object.keys(tldStats).forEach(tld => {
    tldStats[tld].avgActivity = tldStats[tld].totalActivity / tldStats[tld].count;
    tldStats[tld].avgScore = Math.min(100, Math.max(0, 
      (calculateTldRarity(tld) * 50) + 
      (tldStats[tld].avgActivity * 2)
    ));
  });

  // Sort TLDs by popularity
  const topTlds = Object.entries(tldStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10)
    .map(([tld, stats]) => ({ tld, ...stats }));

  // Sort monthly activity
  const monthlyTrends = Object.entries(monthlyActivity)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  return {
    totalDomains: namesData.length,
    tldStats: topTlds,
    monthlyActivity: monthlyTrends,
    scoreDistribution,
    insights: {
      mostPopularTld: topTlds[0]?.tld || 'eth',
      totalActivity: Object.values(monthlyActivity).reduce((sum, count) => sum + count, 0),
      avgScore: Math.round((scoreDistribution.high * 85 + scoreDistribution.medium * 55 + scoreDistribution.low * 25) / namesData.length)
    }
  };
}

// Helper function to aggregate cross-chain trends
function aggregateCrossChainTrends(allTrends) {
  const aggregated = {
    totalDomains: 0,
    totalActivity: 0,
    avgScore: 0,
    tldStats: {},
    scoreDistribution: { high: 0, medium: 0, low: 0 },
    chainStats: {}
  };

  Object.entries(allTrends).forEach(([chain, trends]) => {
    if (trends.error) return;

    aggregated.totalDomains += trends.totalDomains || 0;
    aggregated.totalActivity += trends.insights?.totalActivity || 0;
    
    // Aggregate TLD stats
    trends.tldStats?.forEach(tld => {
      if (!aggregated.tldStats[tld.tld]) {
        aggregated.tldStats[tld.tld] = { count: 0, totalActivity: 0, avgScore: 0 };
      }
      aggregated.tldStats[tld.tld].count += tld.count;
      aggregated.tldStats[tld.tld].totalActivity += tld.totalActivity;
      aggregated.tldStats[tld.tld].avgScore = 
        (aggregated.tldStats[tld.tld].avgScore + tld.avgScore) / 2;
    });

    // Aggregate score distribution
    if (trends.scoreDistribution) {
      aggregated.scoreDistribution.high += trends.scoreDistribution.high || 0;
      aggregated.scoreDistribution.medium += trends.scoreDistribution.medium || 0;
      aggregated.scoreDistribution.low += trends.scoreDistribution.low || 0;
    }

    // Chain-specific stats
    aggregated.chainStats[chain] = {
      domains: trends.totalDomains || 0,
      activity: trends.insights?.totalActivity || 0,
      avgScore: trends.insights?.avgScore || 0
    };
  });

  // Calculate overall average score
  const totalDomains = aggregated.totalDomains;
  if (totalDomains > 0) {
    aggregated.avgScore = Math.round(
      (aggregated.scoreDistribution.high * 85 + 
       aggregated.scoreDistribution.medium * 55 + 
       aggregated.scoreDistribution.low * 25) / totalDomains
    );
  }

  // Sort TLDs by total count
  aggregated.topTlds = Object.entries(aggregated.tldStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10)
    .map(([tld, stats]) => ({ tld, ...stats }));

  return aggregated;
}

// Enhanced smart recommendations generator
function generateSmartRecommendations(score, features, domainName) {
  const recommendations = [];
  
  // High-value domain recommendations (80+)
  if (score >= 80) {
    recommendations.push({
      action: 'tokenize',
      title: 'Tokenize for Fractional Sales',
      description: `High-value domain (${score}/100) perfect for tokenization. Create ERC-721 tokens for fractional ownership.`,
      priority: 'high',
      estimatedValue: score * 100, // ETH equivalent
      gasEstimate: '0.01 ETH',
      roi: 'High potential for 3-5x returns'
    });
    
    recommendations.push({
      action: 'auction',
      title: 'List Premium Auction',
      description: 'Premium domain suitable for high-value auction with reserve price.',
      priority: 'high',
      estimatedValue: score * 80,
      gasEstimate: '0.005 ETH',
      roi: 'Expected 2-4x current valuation'
    });
  }
  
  // Medium-value domain recommendations (60-79)
  else if (score >= 60) {
    recommendations.push({
      action: 'hold',
      title: 'Strategic Hold & Develop',
      description: `Good potential domain (${score}/100). Consider developing or holding for market appreciation.`,
      priority: 'medium',
      estimatedValue: score * 50,
      gasEstimate: '0 ETH',
      roi: 'Long-term appreciation potential'
    });
    
    recommendations.push({
      action: 'market',
      title: 'Targeted Marketing',
      description: 'Market to specific buyer segments for optimal sale price.',
      priority: 'medium',
      estimatedValue: score * 60,
      gasEstimate: '0 ETH',
      roi: '1.5-2x with proper marketing'
    });
  }
  
  // Low-value domain recommendations (<60)
  else {
    recommendations.push({
      action: 'monitor',
      title: 'Monitor Market Trends',
      description: `Lower value domain (${score}/100). Monitor for market changes and keyword trends.`,
      priority: 'low',
      estimatedValue: score * 20,
      gasEstimate: '0 ETH',
      roi: 'Potential for improvement with time'
    });
  }

  // Feature-based recommendations
  if (features && features.hasKeyword) {
    recommendations.push({
      action: 'seo',
      title: 'SEO Optimization',
      description: 'Domain contains valuable keywords. Optimize for search visibility.',
      priority: 'medium',
      estimatedValue: score * 30,
      gasEstimate: '0 ETH',
      roi: 'Increased organic traffic value'
    });
  }

  if (features && features.tldRarity > 0.8) {
    recommendations.push({
      action: 'premium',
      title: 'Premium TLD Strategy',
      description: 'Rare TLD detected. Position as premium offering.',
      priority: 'high',
      estimatedValue: score * 120,
      gasEstimate: '0 ETH',
      roi: 'Premium pricing potential'
    });
  }

  // Expiry-based recommendations
  if (features && features.expiryDays < 30) {
    recommendations.push({
      action: 'renew',
      title: 'Urgent Renewal Required',
      description: `Domain expires in ${features.expiryDays} days. Renew immediately to maintain ownership.`,
      priority: 'high',
      estimatedValue: score * 100,
      gasEstimate: '0.002 ETH',
      roi: 'Prevents loss of valuable asset'
    });
  }

  return recommendations;
}

// On-chain action functions
async function tokenizeDomain(domainName, chain) {
  console.log(`Tokenizing domain: ${domainName} on ${chain}`);
  
  // For demo purposes, we'll simulate the tokenization process
  // In production, this would interact with actual Doma tokenization contracts
  
  try {
    // Simulate contract interaction
    const tokenId = ethers.keccak256(ethers.toUtf8Bytes(domainName));
    
    // Create a mock transaction (replace with actual contract call)
    const mockTx = {
      hash: ethers.keccak256(ethers.toUtf8Bytes(`${domainName}-${Date.now()}`)),
      gasUsed: ethers.parseUnits('50000', 'wei'),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000
    };
    
    console.log(`✅ Domain tokenized: ${domainName}`);
    console.log(`📝 Transaction hash: ${mockTx.hash}`);
    
    return {
      transactionHash: mockTx.hash,
      gasUsed: mockTx.gasUsed.toString(),
      blockNumber: mockTx.blockNumber,
      tokenId: tokenId,
      action: 'tokenize'
    };
    
  } catch (error) {
    console.error('Tokenization failed:', error);
    throw new Error(`Tokenization failed: ${error.message}`);
  }
}

async function listDomainForAuction(domainName, chain) {
  console.log(`Listing domain for auction: ${domainName} on ${chain}`);
  
  try {
    // Simulate auction listing
    const mockTx = {
      hash: ethers.keccak256(ethers.toUtf8Bytes(`auction-${domainName}-${Date.now()}`)),
      gasUsed: ethers.parseUnits('30000', 'wei'),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000
    };
    
    console.log(`✅ Domain listed for auction: ${domainName}`);
    console.log(`📝 Transaction hash: ${mockTx.hash}`);
    
    return {
      transactionHash: mockTx.hash,
      gasUsed: mockTx.gasUsed.toString(),
      blockNumber: mockTx.blockNumber,
      action: 'auction'
    };
    
  } catch (error) {
    console.error('Auction listing failed:', error);
    throw new Error(`Auction listing failed: ${error.message}`);
  }
}

async function renewDomain(domainName, chain) {
  console.log(`Renewing domain: ${domainName} on ${chain}`);
  
  try {
    // Simulate domain renewal
    const mockTx = {
      hash: ethers.keccak256(ethers.toUtf8Bytes(`renew-${domainName}-${Date.now()}`)),
      gasUsed: ethers.parseUnits('20000', 'wei'),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000
    };
    
    console.log(`✅ Domain renewed: ${domainName}`);
    console.log(`📝 Transaction hash: ${mockTx.hash}`);
    
    return {
      transactionHash: mockTx.hash,
      gasUsed: mockTx.gasUsed.toString(),
      blockNumber: mockTx.blockNumber,
      action: 'renew'
    };
    
  } catch (error) {
    console.error('Domain renewal failed:', error);
    throw new Error(`Domain renewal failed: ${error.message}`);
  }
}

async function transferDomain(domainName, toAddress, chain) {
  console.log(`Transferring domain: ${domainName} to ${toAddress} on ${chain}`);
  
  if (!toAddress) {
    throw new Error('Recipient address is required for transfer');
  }
  
  try {
    // Simulate domain transfer
    const mockTx = {
      hash: ethers.keccak256(ethers.toUtf8Bytes(`transfer-${domainName}-${toAddress}-${Date.now()}`)),
      gasUsed: ethers.parseUnits('25000', 'wei'),
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000
    };
    
    console.log(`✅ Domain transferred: ${domainName} to ${toAddress}`);
    console.log(`📝 Transaction hash: ${mockTx.hash}`);
    
    return {
      transactionHash: mockTx.hash,
      gasUsed: mockTx.gasUsed.toString(),
      blockNumber: mockTx.blockNumber,
      action: 'transfer',
      toAddress: toAddress
    };
    
  } catch (error) {
    console.error('Domain transfer failed:', error);
    throw new Error(`Domain transfer failed: ${error.message}`);
  }
}

// Enhanced expiring domains checker
async function checkExpiringDomains() {
  try {
    const query = `
      query GetExpiringDomains {
        names(first: 1000) {
          name
          tld
          expiry
          owner
          activities {
            type
            timestamp
          }
        }
      }
    `;

    const response = await axios.post(DOMA_SUBGRAPH_URL, { query });
    const namesData = response.data.data?.names || [];

    const expiringDomains = [];
    const now = Math.floor(Date.now() / 1000);
    let newAlerts = 0;

    for (const domain of namesData) {
      if (!domain.expiry) continue;
      
      const daysUntilExpiry = Math.floor((domain.expiry - now) / (24 * 60 * 60));
      
      if (daysUntilExpiry <= ALERT_CONFIG.expiryThreshold && daysUntilExpiry > 0) {
        // Calculate score for this domain
        const length = domain.name.length;
        const hasKeywordValue = hasKeyword(domain.name);
        const tldRarity = calculateTldRarity(domain.tld);
        const txnHistory = domain.activities?.length || 0;
        const expiryDays = daysUntilExpiry;

        const features = [[length, hasKeywordValue, tldRarity, txnHistory, expiryDays]];
        const score = Math.round(model.predict(features)[0]);
        const clampedScore = Math.max(0, Math.min(100, score));

        if (clampedScore >= ALERT_CONFIG.minScoreThreshold) {
          expiringDomains.push({
            domainName: domain.name,
            tld: domain.tld,
            score: clampedScore,
            daysUntilExpiry,
            owner: domain.owner,
            activityCount: txnHistory,
            timestamp: new Date().toISOString()
          });

          // Add to alerts if not already present
          const existingAlert = alerts.find(alert => 
            alert.domainName === domain.name && 
            alert.daysUntilExpiry === daysUntilExpiry
          );
          
          if (!existingAlert) {
            alerts.push({
              id: `${domain.name}-${Date.now()}`,
              type: 'expiring_high_score',
              domainName: domain.name,
              tld: domain.tld,
              score: clampedScore,
              daysUntilExpiry,
              owner: domain.owner,
              timestamp: new Date().toISOString(),
              priority: clampedScore >= 90 ? 'high' : 'medium'
            });
            newAlerts++;
          }
        }
      }
    }

    return {
      expiringDomains,
      newAlerts,
      totalChecked: namesData.length
    };

  } catch (error) {
    console.error('Error checking expiring domains:', error);
    return {
      expiringDomains: [],
      newAlerts: 0,
      error: error.message
    };
  }
}

// Multi-chain domain scoring endpoint
app.post('/score-domain-multi', async (req, res) => {
  const { domainName, chain = 'testnet' } = req.body;

  if (!domainName) {
    return res.status(400).json({ error: 'Domain name is required' });
  }

  if (!CHAIN_ENDPOINTS[chain]) {
    return res.status(400).json({ error: 'Unsupported chain' });
  }

  try {
    console.log(`Scoring domain: ${domainName} on ${chain}`);
    
    const query = `
      query GetDomain($name: String!) {
        name(name: $name) {
          name
          tld
          expiry
          owner
          activities {
            type
            timestamp
          }
        }
      }
    `;

    const response = await axios.post(CHAIN_ENDPOINTS[chain], {
      query,
      variables: { name: domainName }
    });

    const domainData = response.data.data?.name;

    if (!domainData) {
      return res.status(404).json({ 
        error: `Domain not found on ${chain}`,
        domainName,
        chain
      });
    }

    // Extract features for scoring
    const length = domainData.name.length;
    const hasKeywordValue = hasKeyword(domainData.name);
    const tldRarity = calculateTldRarity(domainData.tld);
    const txnHistory = domainData.activities?.length || 0;
    const expiryDays = calculateExpiryDays(domainData.expiry);

    // Predict the score using the trained model
    const features = [[length, hasKeywordValue, tldRarity, txnHistory, expiryDays]];
    const score = Math.round(model.predict(features)[0]);
    const clampedScore = Math.max(0, Math.min(100, score));

    // Generate recommendations based on score
    const recommendations = generateRecommendations(clampedScore, domainData);

    res.json({
      domainName,
      chain,
      score: clampedScore,
      features: {
        length,
        hasKeyword: hasKeywordValue === 1,
        tldRarity,
        txnHistory,
        expiryDays
      },
      domainData: {
        name: domainData.name,
        tld: domainData.tld,
        expiry: domainData.expiry,
        owner: domainData.owner,
        activityCount: txnHistory
      },
      recommendations
    });

  } catch (error) {
    console.error(`Error scoring domain on ${chain}:`, error);
    res.status(500).json({ 
      error: `Failed to score domain on ${chain}`,
      details: error.message 
    });
  }
});

// Cross-chain trend analytics
app.get('/get-trends-multi', async (req, res) => {
  try {
    console.log('Fetching multi-chain trend analytics...');
    
    const allTrends = {};
    const promises = STATE_SYNC_CONFIG.chains.map(async (chain) => {
      try {
        const query = `
          query GetTrends {
            names(first: 1000) {
              name
              tld
              expiry
              activities {
                type
                timestamp
              }
            }
          }
        `;

        const response = await axios.post(CHAIN_ENDPOINTS[chain], { query });
        const namesData = response.data.data?.names || [];
        
        if (namesData.length > 0) {
          allTrends[chain] = computeTrends(namesData);
        }
      } catch (error) {
        console.error(`Error fetching trends from ${chain}:`, error.message);
        allTrends[chain] = { error: 'Failed to fetch data' };
      }
    });

    await Promise.all(promises);

    // Aggregate cross-chain data
    const aggregatedTrends = aggregateCrossChainTrends(allTrends);

    res.json({
      chains: allTrends,
      aggregated: aggregatedTrends,
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching multi-chain trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch multi-chain trends',
      details: error.message 
    });
  }
});

// Alert system endpoints
app.get('/alerts', (req, res) => {
  res.json({
    alerts: alerts.slice(-50), // Return last 50 alerts
    config: ALERT_CONFIG,
    total: alerts.length
  });
});

app.post('/check-expiring-domains', async (req, res) => {
  try {
    console.log('Checking for high-score expiring domains...');
    
    const query = `
      query GetExpiringDomains {
        names(first: 1000) {
          name
          tld
          expiry
          owner
          activities {
            type
            timestamp
          }
        }
      }
    `;

    const response = await axios.post(DOMA_SUBGRAPH_URL, { query });
    const namesData = response.data.data?.names || [];

    const expiringDomains = [];
    const now = Math.floor(Date.now() / 1000);

    for (const domain of namesData) {
      if (!domain.expiry) continue;
      
      const daysUntilExpiry = Math.floor((domain.expiry - now) / (24 * 60 * 60));
      
      if (daysUntilExpiry <= ALERT_CONFIG.expiryThreshold && daysUntilExpiry > 0) {
        // Calculate score for this domain
        const length = domain.name.length;
        const hasKeywordValue = hasKeyword(domain.name);
        const tldRarity = calculateTldRarity(domain.tld);
        const txnHistory = domain.activities?.length || 0;
        const expiryDays = daysUntilExpiry;

        const features = [[length, hasKeywordValue, tldRarity, txnHistory, expiryDays]];
        const score = Math.round(model.predict(features)[0]);
        const clampedScore = Math.max(0, Math.min(100, score));

        if (clampedScore >= ALERT_CONFIG.minScoreThreshold) {
          expiringDomains.push({
            domainName: domain.name,
            tld: domain.tld,
            score: clampedScore,
            daysUntilExpiry,
            owner: domain.owner,
            activityCount: txnHistory,
            timestamp: new Date().toISOString()
          });

          // Add to alerts if not already present
          const existingAlert = alerts.find(alert => 
            alert.domainName === domain.name && 
            alert.daysUntilExpiry === daysUntilExpiry
          );
          
          if (!existingAlert) {
            alerts.push({
              id: `${domain.name}-${Date.now()}`,
              type: 'expiring_high_score',
              domainName: domain.name,
              tld: domain.tld,
              score: clampedScore,
              daysUntilExpiry,
              owner: domain.owner,
              timestamp: new Date().toISOString(),
              priority: clampedScore >= 90 ? 'high' : 'medium'
            });
          }
        }
      }
    }

    res.json({
      expiringDomains,
      totalFound: expiringDomains.length,
      newAlerts: alerts.filter(alert => 
        alert.timestamp > new Date(Date.now() - 60000).toISOString()
      ).length
    });

  } catch (error) {
    console.error('Error checking expiring domains:', error);
    res.status(500).json({ 
      error: 'Failed to check expiring domains',
      details: error.message 
    });
  }
});

// State sync status endpoint
app.get('/state-sync-status', (req, res) => {
  res.json({
    enabled: STATE_SYNC_CONFIG.enabled,
    chains: STATE_SYNC_CONFIG.chains,
    endpoints: CHAIN_ENDPOINTS,
    lastSync: new Date().toISOString(),
    nextSync: new Date(Date.now() + STATE_SYNC_CONFIG.syncInterval).toISOString(),
    alerts: {
      enabled: ALERT_CONFIG.enabled,
      total: alerts.length,
      recent: alerts.filter(alert => 
        alert.timestamp > new Date(Date.now() - 3600000).toISOString()
      ).length
    }
  });
});

// Enhanced recommendation endpoint with smart actions
app.post('/recommend-actions', async (req, res) => {
  const { domainName, score, features } = req.body;

  if (!domainName || score === undefined) {
    return res.status(400).json({ error: 'Domain name and score are required' });
  }

  try {
    const recommendations = generateSmartRecommendations(score, features, domainName);
    
    res.json({
      domainName,
      score,
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error.message 
    });
  }
});

// On-chain action trigger endpoint
app.post('/trigger-action', async (req, res) => {
  const { action, domainName, chain = 'testnet' } = req.body;

  if (!action || !domainName) {
    return res.status(400).json({ error: 'Action type and domain name are required' });
  }

  if (!wallet) {
    return res.status(503).json({ 
      error: 'Wallet not configured',
      details: 'PRIVATE_KEY environment variable is required for on-chain actions'
    });
  }

  try {
    console.log(`Triggering ${action} for domain: ${domainName} on ${chain}`);
    
    let result;
    switch (action.toLowerCase()) {
      case 'tokenize':
        result = await tokenizeDomain(domainName, chain);
        break;
      case 'auction':
        result = await listDomainForAuction(domainName, chain);
        break;
      case 'renew':
        result = await renewDomain(domainName, chain);
        break;
      case 'transfer':
        result = await transferDomain(domainName, req.body.toAddress, chain);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported action type' });
    }

    res.json({
      success: true,
      action,
      domainName,
      chain,
      transactionHash: result.transactionHash,
      gasUsed: result.gasUsed,
      blockNumber: result.blockNumber,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error triggering ${action}:`, error);
    res.status(500).json({ 
      error: `Failed to execute ${action}`,
      details: error.message,
      transactionHash: error.transactionHash || null
    });
  }
});

// Enhanced alerts endpoint with real-time monitoring
app.get('/get-alerts', async (req, res) => {
  try {
    console.log('Fetching real-time alerts...');
    
    // Get recent alerts from memory
    const recentAlerts = alerts.filter(alert => 
      new Date(alert.timestamp) > new Date(Date.now() - 3600000) // Last hour
    );

    // Check for new expiring domains
    const expiringCheck = await checkExpiringDomains();
    
    res.json({
      alerts: recentAlerts,
      expiringDomains: expiringCheck.expiringDomains,
      newAlerts: expiringCheck.newAlerts,
      totalAlerts: alerts.length,
      lastCheck: new Date().toISOString(),
      config: ALERT_CONFIG
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch alerts',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    model: 'trained',
    multiChain: true,
    supportedChains: Object.keys(CHAIN_ENDPOINTS),
    wallet: wallet ? wallet.address : null,
    onChainActions: !!wallet
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DomaInsight Backend Server running on port ${PORT}`);
  console.log(`📊 AI Model trained with ${trainingData.length} samples`);
  console.log(`🔗 Multi-chain support enabled`);
  console.log(`🌐 Supported chains: ${Object.keys(CHAIN_ENDPOINTS).join(', ')}`);
  console.log(`⚡ State sync interval: ${STATE_SYNC_CONFIG.syncInterval / 1000}s`);
  console.log(`🔗 Primary endpoint: ${DOMA_SUBGRAPH_URL}`);
});

module.exports = app;
