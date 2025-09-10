import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon, 
  WifiIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const ErrorMessage = ({ error, onRetry, type = 'general' }) => {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiIcon,
          title: 'Connection Error',
          message: 'Unable to connect to the server. Please check your internet connection.',
          color: 'red',
          showRetry: true
        };
      case 'domain':
        return {
          icon: MagnifyingGlassIcon,
          title: 'Domain Not Found',
          message: 'The domain you searched for was not found. Please try another domain name.',
          color: 'orange',
          showRetry: false
        };
      case 'subgraph':
        return {
          icon: ExclamationTriangleIcon,
          title: 'Data Loading Error',
          message: 'Unable to load data from Doma subgraph. Please try again.',
          color: 'yellow',
          showRetry: true
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          title: 'Something went wrong',
          message: error || 'An unexpected error occurred. Please try again.',
          color: 'red',
          showRetry: true
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const iconColorClasses = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`mb-6 p-4 border rounded-lg ${colorClasses[config.color]}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${iconColorClasses[config.color]}`} />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {config.title}
          </h3>
          <div className="mt-2 text-sm">
            <p>{config.message}</p>
          </div>
          {config.showRetry && onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ErrorMessage;
