import React, { useState, useEffect, useCallback } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import WalletConnect from './components/WalletConnect';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorMessage from './components/ErrorMessage';
import Filters from './components/Filters';
import Alerts from './components/Alerts';
import './App.css';

// Apollo Client setup for Doma subgraph
const client = new ApolloClient({
  uri: 'https://api-testnet.doma.xyz/graphql',
  cache: new InMemoryCache(),
});

// GraphQL query for domain data (for future use)
// const GET_DOMAINS = gql`
//   query GetDomains {
//     domains(first: 100) {
//       id
//       name
//       tld
//       expiryDate
//       owner
//       createdAt
//       transactionCount
//     }
//   }
// `;

// Backend API base URL - use environment variable for production
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Domain Scoring Component
function DomainScorer({ onScoreUpdate, filters = {} }) {
  const [domainName, setDomainName] = useState('');
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState('general');

  const scoreDomain = async (isRetry = false) => {
    if (!domainName.trim()) {
      setError('Please enter a domain name');
      setErrorType('domain');
      return;
    }
    
    setLoading(true);
    setError(null);
    setErrorType('general');
    
    
    try {
      const response = await fetch(`${API_BASE}/score-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domainName: domainName.trim() }),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Domain not found in Doma registry');
          setErrorType('domain');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setErrorType('domain');
        return;
      }
      
      setScore(data);
      onScoreUpdate(data);
      
      // Log potential transactions for impact demo
      const potentialTxns = data.recommendations?.filter(rec => 
        ['tokenize', 'auction', 'renew', 'transfer'].includes(rec.action)
      ).length || 0;
      console.log(`Potential txns: ${potentialTxns}`);
      
    } catch (err) {
      console.error('Domain scoring error:', err);
      
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        setError('Unable to connect to backend. Please check your connection.');
        setErrorType('network');
      } else if (err.message.includes('subgraph') || err.message.includes('GraphQL')) {
        setError('Unable to load data from Doma subgraph');
        setErrorType('subgraph');
      } else {
        setError(err.message);
        setErrorType('general');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    scoreDomain(true);
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
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Domain Scoring</h2>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          placeholder="Enter domain name (e.g., crypto.eth)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-200"
          onKeyPress={(e) => e.key === 'Enter' && !loading && scoreDomain()}
        />
        <motion.button
          onClick={() => scoreDomain()}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-colors duration-200"
          whileHover={{ scale: loading ? 1 : 1.05 }}
          whileTap={{ scale: loading ? 1 : 0.95 }}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Scoring...
            </div>
          ) : (
            'Score Domain'
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {error && (
          <ErrorMessage 
            error={error} 
            type={errorType}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {score && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Score Display */}
            <motion.div 
              className="text-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <motion.div 
                className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold border-4 ${getScoreColor(score.score)}`}
                initial={{ rotate: -180 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {score.score}
              </motion.div>
              <motion.p 
                className="mt-4 text-xl font-semibold text-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {getScoreLabel(score.score)} Quality
              </motion.p>
              <motion.p 
                className="text-lg text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {score.domainName}
              </motion.p>
            </motion.div>

            {/* Features Breakdown */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Recommendations Component
function Recommendations({ score, onActionTrigger, walletAddress }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = useCallback(async () => {
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
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [score]);

  useEffect(() => {
    if (score) {
      fetchRecommendations();
    }
  }, [score, fetchRecommendations]);


  const triggerAction = async (action) => {
    try {
      const response = await fetch(`${API_BASE}/trigger-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action.action,
          domainName: score.domainName,
          chain: 'testnet'
        }),
      });
      
      const data = await response.json();
      onActionTrigger(data);
    } catch (error) {
      console.error('Failed to trigger action:', error);
    }
  };

  if (!score) return null;

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">AI Recommendations</h2>
      
      {loading ? (
        <LoadingSpinner text="Generating recommendations..." color="green" />
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{rec.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{rec.description}</p>
                  <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                    <span>Priority: {rec.priority}</span>
                    <span>ROI: {rec.estimatedROI}%</span>
                    <span>Gas: {rec.estimatedGas} ETH</span>
                  </div>
                </div>
                <motion.button
                  onClick={() => triggerAction(rec)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {rec.action}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Trend Analytics Component
function TrendAnalytics() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/get-trends`);
      const data = await response.json();
      setTrends(data);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Market Trends</h2>
      
      {loading ? (
        <LoadingSpinner text="Loading trends..." color="purple" />
      ) : trends ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{trends.totalDomains}</div>
              <div className="text-sm text-blue-800">Total Domains</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{trends.insights.avgScore}</div>
              <div className="text-sm text-green-800">Avg Score</div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">No trend data available</div>
      )}
    </motion.div>
  );
}

// Legacy Alerts Component (replaced by new Alerts.js)
// This component is now imported from './components/Alerts'

// Action History Component
function ActionHistory({ history }) {
  if (history.length === 0) return null;

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Actions</h3>
      <div className="space-y-2">
        {history.map((action, index) => (
          <motion.div
            key={index}
            className="flex justify-between items-center p-2 bg-gray-50 rounded"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-sm text-gray-700">{action.action}</span>
            <span className="text-xs text-gray-500">{action.transactionHash?.slice(0, 8)}...</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Main App Component
function App() {
  const [currentScore, setCurrentScore] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [filters, setFilters] = useState({
    tld: 'all',
    scoreRange: 'all',
    status: 'all'
  });

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

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    console.log('Filters updated:', newFilters);
  };

  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <motion.div 
          className="min-h-screen bg-gray-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
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
            {/* Enhanced Filters Section */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Filters 
                onFiltersChange={handleFiltersChange}
                currentFilters={filters}
              />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Domain Scoring & Recommendations */}
              <motion.div 
                className="lg:col-span-2 space-y-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <DomainScorer 
                  onScoreUpdate={handleScoreUpdate}
                  filters={filters}
                />
                <Recommendations 
                  score={currentScore} 
                  onActionTrigger={handleActionTrigger}
                  walletAddress={walletAddress}
                />
              </motion.div>

              {/* Right Column - Trends & Alerts */}
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <TrendAnalytics />
                <Alerts />
              </motion.div>
            </div>

            {/* Action History */}
            {actionHistory.length > 0 && (
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ActionHistory history={actionHistory} />
              </motion.div>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <p className="text-gray-600">
                  Built for Doma Protocol Hackathon Track 4 • 
                  <a href="https://docs.doma.xyz" className="text-blue-600 hover:text-blue-800 ml-1">
                    Doma Documentation
                  </a> • 
                  <a href="https://start.doma.xyz" className="text-blue-600 hover:text-blue-800 ml-1">
                    Testnet
                  </a>
                </p>
              </div>
            </div>
          </footer>
        </motion.div>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;