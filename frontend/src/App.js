import React, { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client';
import { ethers } from 'ethers';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import WalletConnect from './components/WalletConnect';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import DomainFilters from './components/DomainFilters';
import './App.css';

// Apollo Client setup for Doma subgraph
const client = new ApolloClient({
  uri: 'https://api-testnet.doma.xyz/graphql',
  cache: new InMemoryCache(),
});

// GraphQL queries
const GET_DOMAIN_DATA = gql`
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

const GET_TRENDS = gql`
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

// Backend API base URL - use environment variable for production
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Domain Scoring Component
function DomainScorer({ onScoreUpdate }) {
  const [domainName, setDomainName] = useState('');
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const scoreDomain = async () => {
    if (!domainName.trim()) {
      setError('Please enter a domain name');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/score-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domainName: domainName.trim() }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      setScore(data);
      setRecommendations(data.recommendations || []);
      onScoreUpdate(data);
      
      // Log potential transactions for impact demo
      const potentialTxns = data.recommendations?.filter(rec => 
        ['tokenize', 'auction', 'renew', 'transfer'].includes(rec.action)
      ).length || 0;
      console.log(`Potential txns: ${potentialTxns}`);
      
    } catch (err) {
      console.error('Domain scoring error:', err);
      setError(err.message.includes('Failed to fetch') 
        ? 'Unable to connect to backend. Please ensure the server is running.' 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Premium';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Domain Scoring</h2>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          placeholder="Enter domain name (e.g., crypto.eth)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          onKeyPress={(e) => e.key === 'Enter' && scoreDomain()}
        />
        <button
          onClick={scoreDomain}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors"
        >
          {loading ? 'Scoring...' : 'Score Domain'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {score && (
        <div className="space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold border-4 ${getScoreColor(score.score)}`}>
              {score.score}
            </div>
            <p className="mt-4 text-xl font-semibold text-gray-700">
              {getScoreLabel(score.score)} Quality
            </p>
            <p className="text-lg text-gray-500">{score.domainName}</p>
          </div>

          {/* Features Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg border">
              <div className="text-3xl font-bold text-gray-800">{score.features.length}</div>
              <div className="text-sm text-gray-600 font-medium">Length</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border">
              <div className="text-3xl font-bold text-gray-800">
                {score.features.hasKeyword ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600 font-medium">Keyword</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border">
              <div className="text-3xl font-bold text-gray-800">
                {Math.round(score.features.tldRarity * 100)}%
              </div>
              <div className="text-sm text-gray-600 font-medium">TLD Rarity</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg border">
              <div className="text-3xl font-bold text-gray-800">{score.features.txnHistory}</div>
              <div className="text-sm text-gray-600 font-medium">Activities</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Recommendations Component
function Recommendations({ score, onActionTrigger, walletAddress }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (score) {
      fetchRecommendations();
    }
  }, [score]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/recommend-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainName: score.domainName,
          score: score.score,
          features: score.features
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, domainName) => {
    if (!walletAddress) {
      alert('Please connect your wallet to perform on-chain actions');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/trigger-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          domainName,
          chain: 'testnet'
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        onActionTrigger(data);
        console.log(`Action triggered: ${action} for ${domainName}`);
        console.log(`Transaction hash: ${data.transactionHash}`);
        
        // Log potential transaction for impact demo
        console.log(`Potential txns: 1 (${action} action executed)`);
      } else {
        alert(`Action failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed: ' + error.message);
    }
  };

  if (!score) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Smart Recommendations</h3>
      
      {loading ? (
        <div className="text-center py-8">Loading recommendations...</div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              rec.priority === 'high' ? 'border-red-500 bg-red-50' :
              rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Est. Value: {rec.estimatedValue} ETH</span>
                    <span>Gas: {rec.gasEstimate}</span>
                    <span>ROI: {rec.roi}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleAction(rec.action, score.domainName)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {rec.action === 'tokenize' ? 'Tokenize' :
                   rec.action === 'auction' ? 'List Auction' :
                   rec.action === 'renew' ? 'Renew' :
                   rec.action === 'transfer' ? 'Transfer' :
                   'View Details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Trend Analytics Component
function TrendAnalytics() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/get-trends`);
      const data = await response.json();
      
      if (response.ok) {
        setTrends(data);
      } else {
        setError(data.error || 'Failed to fetch trends');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  if (loading) return <div className="text-center py-8">Loading trends...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
  if (!trends) return null;

  // Prepare chart data
  const tldData = trends.tldStats?.slice(0, 10).map(tld => ({
    name: tld.tld,
    domains: tld.count,
    avgScore: Math.round(tld.avgScore)
  })) || [];

  const scoreDistribution = [
    { name: 'High (70+)', value: trends.scoreDistribution?.high || 0, color: '#10b981' },
    { name: 'Medium (40-69)', value: trends.scoreDistribution?.medium || 0, color: '#f59e0b' },
    { name: 'Low (<40)', value: trends.scoreDistribution?.low || 0, color: '#ef4444' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Market Trends</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-6 bg-blue-50 rounded-lg border">
          <div className="text-4xl font-bold text-blue-600">{trends.totalDomains}</div>
          <div className="text-sm text-gray-600 font-medium">Total Domains</div>
        </div>
        <div className="text-center p-6 bg-green-50 rounded-lg border">
          <div className="text-4xl font-bold text-green-600">{trends.insights.totalActivity}</div>
          <div className="text-sm text-gray-600 font-medium">Total Activities</div>
        </div>
        <div className="text-center p-6 bg-purple-50 rounded-lg border">
          <div className="text-4xl font-bold text-purple-600">{trends.insights.avgScore}</div>
          <div className="text-sm text-gray-600 font-medium">Avg Score</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TLD Distribution */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top TLDs</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tldData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="domains" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Score Distribution */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scoreDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Alerts Component
function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    tld: 'all',
    status: 'all'
  });

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/get-alerts`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }
      
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setError(error.message.includes('Failed to fetch') 
        ? 'Unable to connect to backend for alerts' 
        : error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleFilterChange = (filterType, value) => {
    if (value === 'clear') {
      setFilters({ priority: 'all', tld: 'all', status: 'all' });
    } else {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.priority !== 'all' && alert.priority !== filters.priority) return false;
    if (filters.tld !== 'all' && alert.tld !== filters.tld) return false;
    if (filters.status !== 'all') {
      if (filters.status === 'expiring' && alert.daysUntilExpiry > 7) return false;
      if (filters.status === 'active' && alert.daysUntilExpiry <= 7) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Domain Alerts</h2>
        <button
          onClick={fetchAlerts}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      <DomainFilters filters={filters} onFilterChange={handleFilterChange} />

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Loading alerts..." />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No alerts found</div>
          ) : (
            filteredAlerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                alert.priority === 'high' ? 'border-red-500 bg-red-50' :
                alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-800">{alert.domainName}</h4>
                    <p className="text-sm text-gray-600">
                      {alert.type === 'expiring_high_score' ? 
                        `Expires in ${alert.daysUntilExpiry} days` : 
                        alert.type
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Score: {alert.score} | TLD: .{alert.tld} | {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.priority}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Main App Component
function App() {
  const [currentScore, setCurrentScore] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');

  const handleScoreUpdate = (score) => {
    setCurrentScore(score);
  };

  const handleActionTrigger = (action) => {
    setActionHistory(prev => [action, ...prev.slice(0, 9)]); // Keep last 10 actions
  };

  const handleWalletConnect = (address) => {
    setWalletAddress(address);
    console.log('Wallet connected:', address);
  };

  const handleWalletDisconnect = () => {
    setWalletAddress('');
    console.log('Wallet disconnected');
  };

  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">DomaInsight</h1>
                <p className="text-gray-600">AI-Driven Domain Scoring & Predictive Analytics</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Doma Protocol Hackathon • Track 4
                </div>
                <WalletConnect 
                  onWalletConnect={handleWalletConnect}
                  onWalletDisconnect={handleWalletDisconnect}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Domain Scoring & Recommendations */}
            <div className="lg:col-span-2 space-y-8">
              <DomainScorer onScoreUpdate={handleScoreUpdate} />
              <Recommendations 
                score={currentScore} 
                onActionTrigger={handleActionTrigger}
                walletAddress={walletAddress}
              />
            </div>

            {/* Right Column - Trends & Alerts */}
            <div className="space-y-8">
              <TrendAnalytics />
              <Alerts />
            </div>
          </div>

          {/* Action History */}
          {actionHistory.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Actions</h3>
              <div className="space-y-2">
                {actionHistory.map((action, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{action.action}</span> - {action.domainName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {action.transactionHash ? `Tx: ${action.transactionHash.slice(0, 10)}...` : 'Pending'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-gray-500 text-sm">
              <p>Built for Doma Protocol Hackathon • Powered by AI & Real On-Chain Data</p>
              <p className="mt-2">
                <a href="https://docs.doma.xyz" className="text-blue-600 hover:text-blue-700">
                  Doma Documentation
                </a>
                {' • '}
                <a href="https://start.doma.xyz" className="text-blue-600 hover:text-blue-700">
                  Testnet
                </a>
              </p>
            </div>
          </div>
        </footer>
        </div>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;