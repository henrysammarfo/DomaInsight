import React, { useState, useEffect } from '@apollo/client';
import { gql, useQuery } from '@apollo/client';

// GraphQL query to fetch available TLDs from Doma subgraph
const GET_AVAILABLE_TLDS = gql`
  query GetAvailableTLDs {
    domains(first: 1000) {
      id
      name
      tld
      expiryDate
      owner
    }
  }
`;

// GraphQL query to fetch domain status data
const GET_DOMAIN_STATUS = gql`
  query GetDomainStatus {
    domains(first: 1000) {
      id
      name
      tld
      expiryDate
      owner
      createdAt
    }
  }
`;

const Filters = ({ onFiltersChange, currentFilters = {} }) => {
  const [filters, setFilters] = useState({
    tld: currentFilters.tld || 'all',
    scoreRange: currentFilters.scoreRange || 'all',
    status: currentFilters.status || 'all'
  });

  // Fetch available TLDs from Doma subgraph
  const { data: tldData, loading: tldLoading } = useQuery(GET_AVAILABLE_TLDS, {
    errorPolicy: 'ignore',
    onError: (error) => {
      console.warn('TLD query failed, using fallback options:', error.message);
    }
  });

  // Fetch domain status data
  const { data: statusData, loading: statusLoading } = useQuery(GET_DOMAIN_STATUS, {
    errorPolicy: 'ignore',
    onError: (error) => {
      console.warn('Status query failed, using fallback options:', error.message);
    }
  });

  // Extract unique TLDs from subgraph data
  const getAvailableTLDs = () => {
    if (tldData?.domains) {
      const tlds = [...new Set(tldData.domains.map(domain => domain.tld))];
      return tlds.sort();
    }
    // Fallback TLDs if subgraph query fails
    return ['eth', 'com', 'org', 'crypto', 'nft', 'defi', 'xyz', 'ape', 'shib', 'core'];
  };

  // Calculate domain status based on expiry date
  const getDomainStatus = (expiryDate) => {
    if (!expiryDate) return 'unknown';
    
    const now = new Date();
    const expiry = new Date(expiryDate * 1000); // Convert from timestamp
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring';
    return 'active';
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = { tld: 'all', scoreRange: 'all', status: 'all' };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // Score range options
  const scoreRangeOptions = [
    { value: 'all', label: 'All Scores', color: 'gray' },
    { value: 'high', label: 'High (80+)', color: 'green' },
    { value: 'medium', label: 'Medium (60-79)', color: 'yellow' },
    { value: 'low', label: 'Low (<60)', color: 'red' }
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'expiring', label: 'Expiring Soon', color: 'orange' },
    { value: 'expired', label: 'Expired', color: 'red' }
  ];

  const availableTLDs = getAvailableTLDs();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Domain Filters</h3>
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TLD Filter */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Top-Level Domain
          </label>
          <div className="relative">
            <select
              value={filters.tld}
              onChange={(e) => handleFilterChange('tld', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none bg-white cursor-pointer"
            >
              <option value="all">All TLDs</option>
              {availableTLDs.map(tld => (
                <option key={tld} value={tld}>
                  .{tld}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {tldLoading && (
            <p className="text-xs text-gray-500">Loading TLDs from Doma subgraph...</p>
          )}
        </div>

        {/* Score Range Filter */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Score Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            {scoreRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('scoreRange', option.value)}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                  filters.scoreRange === option.value
                    ? `bg-${option.color}-100 text-${option.color}-800 border-2 border-${option.color}-300`
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Domain Status
          </label>
          <div className="space-y-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleFilterChange('status', option.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                  filters.status === option.value
                    ? `bg-${option.color}-100 text-${option.color}-800 border-2 border-${option.color}-300`
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {statusLoading && (
            <p className="text-xs text-gray-500">Loading status data...</p>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Active filters:</span>
          {filters.tld !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              TLD: .{filters.tld}
              <button
                onClick={() => handleFilterChange('tld', 'all')}
                className="ml-1 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          )}
          {filters.scoreRange !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Score: {scoreRangeOptions.find(opt => opt.value === filters.scoreRange)?.label}
              <button
                onClick={() => handleFilterChange('scoreRange', 'all')}
                className="ml-1 hover:text-green-600"
              >
                ×
              </button>
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Status: {statusOptions.find(opt => opt.value === filters.status)?.label}
              <button
                onClick={() => handleFilterChange('status', 'all')}
                className="ml-1 hover:text-orange-600"
              >
                ×
              </button>
            </span>
          )}
          {filters.tld === 'all' && filters.scoreRange === 'all' && filters.status === 'all' && (
            <span className="text-sm text-gray-500">No filters applied</span>
          )}
        </div>
      </div>

      {/* Filter Stats */}
      <div className="mt-4 text-xs text-gray-500">
        <p>💡 Filters update results in real-time using live Doma testnet data</p>
        <p>🔍 TLD options are dynamically loaded from the Doma subgraph</p>
      </div>
    </div>
  );
};

export default Filters;
