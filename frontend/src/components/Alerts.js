import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  FireIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// Backend API base URL
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState('general');
  const [filters, setFilters] = useState({
    tld: 'all',
    scoreRange: 'all',
    expiryRange: 'all'
  });
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Fetch alerts from backend
  const fetchAlerts = useCallback(async (isRetry = false) => {
    setLoading(true);
    setError(null);
    setErrorType('general');
    
    try {
      const response = await fetch(`${API_BASE}/get-alerts`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setErrorType('subgraph');
        return;
      }
      
      // Filter for high-score domains (score > 70) and expiring domains
      const highScoreAlerts = (data.alerts || []).filter(alert => 
        alert.score > 70 && alert.daysUntilExpiry <= 30
      );
      
      setAlerts(highScoreAlerts);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        setError('Unable to connect to backend for alerts');
        setErrorType('network');
      } else if (error.message.includes('subgraph') || error.message.includes('GraphQL')) {
        setError('Unable to load alerts from Doma subgraph');
        setErrorType('subgraph');
      } else {
        setError(error.message);
        setErrorType('general');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for alerts every 30 seconds
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Handle retry
  const handleRetry = () => {
    fetchAlerts(true);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    if (value === 'clear') {
      setFilters({ tld: 'all', scoreRange: 'all', expiryRange: 'all' });
    } else {
      setFilters(prev => ({ ...prev, [filterType]: value }));
    }
  };

  // Dismiss alert
  const dismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  // Apply filters to alerts
  const filteredAlerts = alerts.filter(alert => {
    // Skip dismissed alerts
    if (dismissedAlerts.has(alert.id)) return false;
    
    // TLD filter
    if (filters.tld !== 'all') {
      const domainTld = alert.domainName?.split('.').pop();
      if (domainTld !== filters.tld) return false;
    }
    
    // Score range filter
    if (filters.scoreRange !== 'all') {
      switch (filters.scoreRange) {
        case 'high':
          if (alert.score < 80) return false;
          break;
        case 'medium':
          if (alert.score < 70 || alert.score >= 80) return false;
          break;
        case 'low':
          if (alert.score >= 70) return false;
          break;
      }
    }
    
    // Expiry range filter
    if (filters.expiryRange !== 'all') {
      switch (filters.expiryRange) {
        case 'urgent':
          if (alert.daysUntilExpiry > 7) return false;
          break;
        case 'soon':
          if (alert.daysUntilExpiry <= 7 || alert.daysUntilExpiry > 30) return false;
          break;
        case 'later':
          if (alert.daysUntilExpiry <= 30) return false;
          break;
      }
    }
    
    return true;
  });

  // Trigger action (renew domain)
  const triggerAction = async (alert) => {
    try {
      const response = await fetch(`${API_BASE}/trigger-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'renew',
          domainName: alert.domainName,
          chain: 'testnet'
        }),
      });
      
      const data = await response.json();
      
      if (data.transactionHash) {
        console.log(`Domain renewal initiated: ${alert.domainName}`);
        console.log(`Transaction hash: ${data.transactionHash}`);
        
        // Dismiss the alert after successful action
        dismissAlert(alert.id);
      }
    } catch (error) {
      console.error('Failed to trigger renewal:', error);
    }
  };

  // Get urgency level and styling
  const getUrgencyLevel = (daysUntilExpiry) => {
    if (daysUntilExpiry <= 3) return { level: 'critical', color: 'red', icon: FireIcon };
    if (daysUntilExpiry <= 7) return { level: 'urgent', color: 'orange', icon: ExclamationTriangleIcon };
    if (daysUntilExpiry <= 30) return { level: 'soon', color: 'yellow', icon: ClockIcon };
    return { level: 'normal', color: 'blue', icon: ClockIcon };
  };

  // Get score styling
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Domain Alerts</h2>
          <p className="text-sm text-gray-600 mt-1">
            High-score domains expiring soon • Updates every 30s
          </p>
        </div>
        <motion.button
          onClick={() => fetchAlerts()}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 flex items-center space-x-1"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Refresh</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TLD Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">TLD</label>
            <select
              value={filters.tld}
              onChange={(e) => handleFilterChange('tld', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All TLDs</option>
              <option value="eth">.eth</option>
              <option value="com">.com</option>
              <option value="org">.org</option>
              <option value="crypto">.crypto</option>
              <option value="nft">.nft</option>
              <option value="defi">.defi</option>
              <option value="xyz">.xyz</option>
              <option value="ape">.ape</option>
              <option value="shib">.shib</option>
            </select>
          </div>

          {/* Score Range Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Score Range</label>
            <select
              value={filters.scoreRange}
              onChange={(e) => handleFilterChange('scoreRange', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Scores</option>
              <option value="high">High (80+)</option>
              <option value="medium">Medium (70-79)</option>
              <option value="low">Low (<70)</option>
            </select>
          </div>

          {/* Expiry Range Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Expiry</label>
            <select
              value={filters.expiryRange}
              onChange={(e) => handleFilterChange('expiryRange', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Timeframes</option>
              <option value="urgent">Urgent (≤7 days)</option>
              <option value="soon">Soon (8-30 days)</option>
              <option value="later">Later (>30 days)</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => handleFilterChange('clear', null)}
            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <ErrorMessage 
            error={error} 
            type={errorType}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <LoadingSpinner text="Loading domain alerts..." color="purple" />
      )}

      {/* Alerts List */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No alerts found</h3>
              <p className="text-sm text-gray-500">
                {alerts.length === 0 
                  ? "No high-score domains are expiring soon"
                  : "No alerts match your current filters"
                }
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert, index) => {
                const urgency = getUrgencyLevel(alert.daysUntilExpiry);
                const UrgencyIcon = urgency.icon;
                
                return (
                  <motion.div
                    key={alert.id}
                    className={`p-4 border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                      urgency.color === 'red' ? 'border-red-500 bg-red-50' :
                      urgency.color === 'orange' ? 'border-orange-500 bg-orange-50' :
                      urgency.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <UrgencyIcon className={`w-5 h-5 ${
                            urgency.color === 'red' ? 'text-red-600' :
                            urgency.color === 'orange' ? 'text-orange-600' :
                            urgency.color === 'yellow' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {alert.domainName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(alert.score)}`}>
                            {alert.score}/100
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="w-4 h-4" />
                            <span>
                              {alert.daysUntilExpiry === 0 ? 'Expires today' :
                               alert.daysUntilExpiry === 1 ? 'Expires tomorrow' :
                               `Expires in ${alert.daysUntilExpiry} days`}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            <span>TLD: .{alert.domainName?.split('.').pop()}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={() => triggerAction(alert)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Act Now - Renew
                          </motion.button>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {!loading && !error && alerts.length > 0 && (
        <motion.div 
          className="mt-6 pt-4 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </span>
            <span>
              {alerts.filter(a => a.daysUntilExpiry <= 7).length} urgent
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Alerts;
