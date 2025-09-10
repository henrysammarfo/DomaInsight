import React, { useState, useEffect } from 'react';
import { connectWallet, isWalletConnected, getCurrentAccount, formatAddress, onAccountsChanged, onChainChanged, removeListeners } from '../web3Config';

const WalletConnect = ({ onWalletConnect, onWalletDisconnect }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkConnection();
    
    // Set up event listeners
    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);
    
    return () => {
      removeListeners();
    };
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await isWalletConnected();
      if (connected) {
        const account = await getCurrentAccount();
        if (account) {
          setAddress(account);
          setIsConnected(true);
          onWalletConnect?.(account);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { address: connectedAddress } = await connectWallet();
      setAddress(connectedAddress);
      setIsConnected(true);
      onWalletConnect?.(connectedAddress);
    } catch (error) {
      setError(error.message);
      console.error('Failed to connect wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setAddress('');
    setIsConnected(false);
    onWalletDisconnect?.();
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setAddress(accounts[0]);
      onWalletConnect?.(accounts[0]);
    }
  };

  const handleChainChanged = (chainId) => {
    // Reload the page when chain changes
    window.location.reload();
  };

  if (!window.ethereum) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
        <p className="text-sm">
          MetaMask is not installed. Please install MetaMask to connect your wallet.
        </p>
        <a 
          href="https://metamask.io/download/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 underline text-sm"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {isConnected ? (
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">
              {formatAddress(address)}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
