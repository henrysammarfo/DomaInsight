import { ethers } from 'ethers';

// Web3Modal configuration for Doma testnet
export const web3Config = {
  // Doma testnet configuration
  chainId: 31337, // Doma testnet chain ID (update with actual ID)
  chainName: 'Doma Testnet',
  rpcUrls: ['https://rpc-testnet.doma.xyz'],
  blockExplorerUrls: ['https://explorer-testnet.doma.xyz'],
  nativeCurrency: {
    name: 'Doma',
    symbol: 'DOMA',
    decimals: 18,
  },
};

// Initialize ethers provider
export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
};

// Connect wallet function
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    const provider = getProvider();
    if (!provider) {
      throw new Error('Failed to get provider');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Get signer
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Switch to Doma testnet if needed
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${web3Config.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${web3Config.chainId.toString(16)}`,
            chainName: web3Config.chainName,
            rpcUrls: web3Config.rpcUrls,
            blockExplorerUrls: web3Config.blockExplorerUrls,
            nativeCurrency: web3Config.nativeCurrency,
          }],
        });
      } else {
        throw switchError;
      }
    }

    return {
      provider,
      signer,
      address,
      chainId: web3Config.chainId
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

// Check if wallet is connected
export const isWalletConnected = async () => {
  if (!window.ethereum) return false;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch (error) {
    console.error('Failed to check wallet connection:', error);
    return false;
  }
};

// Get current account
export const getCurrentAccount = async () => {
  if (!window.ethereum) return null;
  
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch (error) {
    console.error('Failed to get current account:', error);
    return null;
  }
};

// Format address for display
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Contract interaction helpers
export const sendTransaction = async (to, data, value = '0') => {
  try {
    const provider = getProvider();
    if (!provider) {
      throw new Error('No provider available');
    }

    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
      to,
      data,
      value,
    });

    console.log('Transaction sent:', tx.hash);
    return tx;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

// Listen for account changes
export const onAccountsChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

// Listen for chain changes
export const onChainChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

// Remove listeners
export const removeListeners = () => {
  if (window.ethereum) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};
