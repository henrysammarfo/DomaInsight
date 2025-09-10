import React from 'react';

const DomainFilters = ({ filters, onFilterChange }) => {
  const tldOptions = [
    { value: 'all', label: 'All TLDs' },
    { value: 'eth', label: '.eth' },
    { value: 'com', label: '.com' },
    { value: 'org', label: '.org' },
    { value: 'net', label: '.net' },
    { value: 'crypto', label: '.crypto' },
    { value: 'nft', label: '.nft' },
    { value: 'defi', label: '.defi' },
    { value: 'dao', label: '.dao' },
    { value: 'web3', label: '.web3' }
  ];

  const scoreOptions = [
    { value: 'all', label: 'All Scores' },
    { value: 'high', label: 'High (80+)' },
    { value: 'medium', label: 'Medium (60-79)' },
    { value: 'low', label: 'Low (<60)' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TLD Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TLD
          </label>
          <select
            value={filters.tld || 'all'}
            onChange={(e) => onFilterChange('tld', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {tldOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Score Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Score Range
          </label>
          <select
            value={filters.score || 'all'}
            onChange={(e) => onFilterChange('score', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {scoreOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onFilterChange('clear', null)}
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default DomainFilters;
