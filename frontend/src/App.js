import React, { useState, useEffect } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client';
import { ethers } from 'ethers';
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

// Domain Scoring Component
function DomainScorer() {
  const [domainName, setDomainName] = useState('');
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const scoreDomain = async () => {
    if (!domainName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3001/score-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domainName: domainName.trim() }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setScore(data);
        setRecommendations(data.recommendations || []);
      } else {
        setError(data.error || 'Failed to score domain');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Premium';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Domain Scoring</h2>
      
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          placeholder="Enter domain name (e.g., crypto.eth)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && scoreDomain()}
        />
        <button
          onClick={scoreDomain}
          disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Scoring...' : 'Score Domain'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {score && (
        <div className="space-y-6">
          {/* Score Display */}
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreColor(score.score)}`}>
              {score.score}
            </div>
            <p className="mt-2 text-lg font-semibold text-gray-700">
              {getScoreLabel(score.score)} Quality
            </p>
            <p className="text-sm text-gray-500">{score.domainName}</p>
          </div>

          {/* Features Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{score.features.length}</div>
              <div className="text-sm text-gray-600">Length</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {score.features.hasKeyword ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Keyword</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {Math.round(score.features.tldRarity * 100)}%
              </div>
              <div className="text-sm text-gray-600">TLD Rarity</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{score.features.txnHistory}</div>
              <div className="text-sm text-gray-600">Activities</div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h3>
              <div className="space-y-2">
                {recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="font-medium text-gray-800">{rec.title}</div>
                    <div className="text-sm text-gray-600">{rec.description}</div>
                    <button className="mt-2 px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
                      {rec.action === 'tokenize' ? 'Tokenize' :
                       rec.action === 'auction' ? 'List Auction' :
                       rec.action === 'renew' ? 'Renew' :
                       'View Details'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
      const response = await fetch('http://localhost:3001/get-trends');
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Market Trends</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600">{trends.totalDomains}</div>
          <div className="text-sm text-gray-600">Total Domains</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-3xl font-bold text-green-600">{trends.insights.totalActivity}</div>
          <div className="text-sm text-gray-600">Total Activities</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-3xl font-bold text-purple-600">{trends.insights.avgScore}</div>
          <div className="text-sm text-gray-600">Avg Score</div>
        </div>
      </div>

      {/* Top TLDs */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Top TLDs</h3>
        <div className="space-y-2">
          {trends.tldStats.slice(0, 5).map((tld, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium">.{tld.tld}</div>
              <div className="text-sm text-gray-600">
                {tld.count} domains • Avg Score: {Math.round(tld.avgScore)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Distribution */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Score Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-100 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{trends.scoreDistribution.high}</div>
            <div className="text-sm text-gray-600">High (70+)</div>
          </div>
          <div className="text-center p-3 bg-yellow-100 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{trends.scoreDistribution.medium}</div>
            <div className="text-sm text-gray-600">Medium (40-69)</div>
          </div>
          <div className="text-center p-3 bg-red-100 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{trends.scoreDistribution.low}</div>
            <div className="text-sm text-gray-600">Low (<40)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  return (
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
              <div className="text-sm text-gray-500">
                Doma Protocol Hackathon • Track 4
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DomainScorer />
            <TrendAnalytics />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-gray-500 text-sm">
              <p>Built for Doma Protocol Hackathon • Powered by AI & Real On-Chain Data</p>
              <p className="mt-2">
                <a href="https://docs.doma.xyz" className="text-primary-600 hover:text-primary-700">
                  Doma Documentation
                </a>
                {' • '}
                <a href="https://start.doma.xyz" className="text-primary-600 hover:text-primary-700">
                  Testnet
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ApolloProvider>
  );
}

export default App;