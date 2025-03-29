'use client';

import { useState, useEffect } from 'react';
import { 
  TokenRewards, 
  Z_SCORE_LEVELS, 
  ZScoreLevel,
  SERVICE_TYPES,
  SERVICES
} from '@vovelet/shared';
import { canAccessService } from '@vovelet/vcore';
import Link from 'next/link';
import VoveCard from '../components/VoveCard';
import SpendTokensModal from '../components/SpendTokensModal';

interface WalletResponse {
  success: boolean;
  userId: string;
  walletBalance: TokenRewards;
  contributionsCount: number;
  zScoreLevel: ZScoreLevel;
  totalZScore: number;
}

interface OnChainBalanceResponse {
  success: boolean;
  walletAddress: string;
  balance: string;
  name: string;
  symbol: string;
  networkName: string;
  chainId: number;
}

interface ClaimModalProps {
  tokenType: string;
  tokenAmount: number;
  tokenDescription: string;
  onClose: () => void;
  onSubmit: (walletAddress: string, amount: number) => Promise<void>;
}

interface TransactionState {
  status: 'idle' | 'processing' | 'success' | 'error';
  txHash?: string;
  message?: string;
}

// Component for the wallet connection modal
function ClaimModal({ tokenType, tokenAmount, tokenDescription, onClose, onSubmit }: ClaimModalProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [amountToMint, setAmountToMint] = useState(tokenAmount);
  const [error, setError] = useState<string | null>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: 'idle'
  });

  // Handle metamask connection
  const connectMetamask = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setError(null);
    } catch (err: any) {
      console.error('Error connecting to MetaMask:', err);
      setError(err.message || 'Failed to connect to MetaMask');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (amountToMint <= 0 || amountToMint > tokenAmount) {
      setError(`Amount must be between 0 and ${tokenAmount}`);
      return;
    }

    setTransactionState({ status: 'processing' });
    
    try {
      await onSubmit(walletAddress, amountToMint);
      setTransactionState({ 
        status: 'success',
        message: `Successfully initiated minting of ${amountToMint} ${tokenType} tokens to your wallet.`
      });
    } catch (err: any) {
      console.error('Error minting tokens:', err);
      setTransactionState({ 
        status: 'error',
        message: err.message || 'Failed to mint tokens. Please try again.'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Claim {tokenType} Tokens On-Chain
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {transactionState.status === 'processing' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Processing your transaction. Please wait...
              </p>
            </div>
          ) : transactionState.status === 'success' ? (
            <div className="py-6">
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                {transactionState.message}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          ) : transactionState.status === 'error' ? (
            <div className="py-6">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 dark:bg-red-900 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <p className="text-red-600 dark:text-red-400 text-center mb-6">
                {transactionState.message}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setTransactionState({ status: 'idle' })}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    You are about to mint <span className="font-bold">{tokenType}</span> tokens ({tokenDescription}) to your Ethereum wallet address. These tokens represent your contributions to the VoveletAI platform.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Wallet Address
                  </label>
                  
                  {walletAddress ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={walletAddress}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setWalletAddress('')}
                        className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={connectMetamask}
                      className="w-full flex justify-center items-center gap-2 btn-primary"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 212 189"
                        className="h-5 w-5"
                      >
                        <g fill="none" fillRule="evenodd">
                          <path
                            fill="#CDBDB2"
                            d="M60.75 173.25L88.5 180v-12.375L92.25 165h27v-7.5H84.75l-24-18.75z"
                          />
                          <path
                            fill="#CDBDB2"
                            d="M151.25 173.25L123.5 180v-12.375L119.75 165h-27v-7.5h34.5l24-18.75z"
                          />
                          <path
                            fill="#393939"
                            d="M84.75 117l-3.75 29.25L92.25 165h27l11.25-18.75-3.75-29.25-15-5.625-11.25 5.625z"
                          />
                          <path fill="#F89C35" d="M56.25 4.5L78.75 55.5l7.5 58.5 15-5.625 11.25 5.625 7.5-58.5L143.25 4.5z" />
                          <path
                            fill="#F89D35"
                            d="M73.5 55.5L51 103.5l33.75 13.5-3.75-29.25zm65 0L161.25 103.5l-33.75 13.5 3.75-29.25z"
                          />
                          <path
                            fill="#D87C30"
                            d="M142.5 55.5L120 4.5 97.5 55.5h45zm-73.125 0L92.25 4.5 69.75 55.5h45z"
                          />
                          <path fill="#EA8D3A" d="M51 103.5l-3.75 45 33.75-24zm110.25 0l3.75 45-33.75-24z" />
                          <path fill="#F89D35" d="M115.5 113.25L142.5 55.5l-30 13.5zm-19 0L69.5 55.5l30 13.5z" />
                          <path fill="#EB8F35" d="M69.75 55.5l26.25 57.75-3.75-29.25zm72.75 0l-26.25 57.75 3.75-29.25z" />
                        </g>
                      </svg>
                      Connect MetaMask
                    </button>
                  )}
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount to Mint
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={amountToMint}
                      onChange={(e) => setAmountToMint(parseFloat(e.target.value) || 0)}
                      min="0.01"
                      max={tokenAmount}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      / {tokenAmount} {tokenType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded text-sm text-yellow-800 dark:text-yellow-300 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    This will trigger an on-chain transaction that requires gas fees. Make sure your wallet has enough ETH for gas.
                  </span>
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!walletAddress || amountToMint <= 0 || amountToMint > tokenAmount}
                >
                  Mint Tokens
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const [walletData, setWalletData] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onChainBalance, setOnChainBalance] = useState<OnChainBalanceResponse | null>(null);
  const [activeModal, setActiveModal] = useState<{ tokenType: string; amount: number; description: string } | null>(null);
  const [activeSpendModal, setActiveSpendModal] = useState<{
    tokenType: string; 
    amount: number; 
    serviceType: string;
    serviceName: string;
    serviceDescription: string;
  } | null>(null);

  useEffect(() => {
    async function fetchWalletData() {
      try {
        // Call our API endpoint to get wallet data
        const response = await fetch('/api/wallet');
        
        if (!response.ok) {
          throw new Error('Failed to fetch wallet data');
        }
        
        const data = await response.json();
        setWalletData(data);
      } catch (err) {
        console.error('Failed to fetch wallet data:', err);
        setError('Failed to load your wallet data. Please try again later.');
        
        // Fallback for demo purposes
        setWalletData({
          success: true,
          userId: 'test-user-id',
          walletBalance: {
            STX: 12.3,
            VIZ: 9.7,
            LOG: 5.2,
            CRE: 7.6,
            ANA: 8.4,
            SYN: 6.1,
          },
          contributionsCount: 5,
          zScoreLevel: Z_SCORE_LEVELS.PRO as ZScoreLevel,
          totalZScore: 15.7
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchWalletData();
  }, []);

  // Calculate total balance
  const totalBalance = walletData 
    ? Object.values(walletData.walletBalance).reduce((sum, amount) => sum + amount, 0)
    : 0;
    
  // Get token description
  const getTokenDescription = (category: string): string => {
    switch (category) {
      case 'STX': return 'Strategic Thinking';
      case 'VIZ': return 'Visualization';
      case 'LOG': return 'Logical Reasoning';
      case 'CRE': return 'Creative Thinking';
      case 'ANA': return 'Analysis';
      case 'SYN': return 'Synthesis';
      default: return category;
    }
  };

  // Handle claim tokens button click
  const handleClaimClick = (tokenType: string, amount: number) => {
    if (amount <= 0) return;
    
    setActiveModal({
      tokenType,
      amount,
      description: getTokenDescription(tokenType)
    });
  };

  // Handle token minting
  const handleMintTokens = async (walletAddress: string, amount: number) => {
    if (!activeModal) return;
    
    try {
      // Call the mintTokens API
      const response = await fetch('/api/mintTokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: walletData?.userId || 'test-user-id',
          tokenType: activeModal.tokenType,
          amount,
          walletAddress,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mint tokens');
      }
      
      const data = await response.json();
      
      // Update local wallet data to reflect the minted tokens
      if (walletData) {
        const updatedBalance = { ...walletData.walletBalance };
        updatedBalance[activeModal.tokenType] -= amount;
        
        setWalletData({
          ...walletData,
          walletBalance: updatedBalance,
        });
      }
      
      // Simulate delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return data;
    } catch (error: any) {
      console.error('Error minting tokens:', error);
      throw new Error(error.message || 'Failed to mint tokens');
    }
  };

  // Handle spending tokens
  const handleSpendTokens = async (userId: string, tokenType: string, amount: number, serviceType: string) => {
    try {
      // Call the spendTokens API
      const response = await fetch('/api/spendTokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tokenType,
          amount,
          serviceType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to spend tokens');
      }
      
      const data = await response.json();
      
      // Update local wallet data to reflect the spent tokens
      if (walletData && data.newBalance) {
        setWalletData({
          ...walletData,
          walletBalance: data.newBalance,
        });
      }
      
      return data;
    } catch (error: any) {
      console.error('Error spending tokens:', error);
      throw new Error(error.message || 'Failed to spend tokens');
    }
  };

  // Handle spend button click
  const handleSpendClick = (serviceType: string) => {
    if (!walletData) return;
    
    const service = SERVICES[serviceType];
    
    // Check if user can access the service
    if (!canAccessService(walletData.zScoreLevel, serviceType)) {
      // Display an error message or notification
      alert(`Your Z-score level (${walletData.zScoreLevel}) is not high enough to access this service.`);
      return;
    }
    
    // Check if user has enough tokens
    if (!walletData.walletBalance[service.tokenType] || walletData.walletBalance[service.tokenType] < service.amount) {
      alert(`You don't have enough ${service.tokenType} tokens for this service.`);
      return;
    }
    
    setActiveSpendModal({
      tokenType: service.tokenType,
      amount: service.amount,
      serviceType,
      serviceName: service.name,
      serviceDescription: service.description,
    });
  };

  return (
    <div className="py-16">
      <div className="container-content">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Let Wallet
            </h1>
            
            <Link href="/contribute" className="btn-primary">
              Earn More Tokens
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : walletData ? (
            <>
              {/* Overview section - Card & Balance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Vove Card */}
                <div className="md:col-span-1">
                  <VoveCard 
                    zScoreLevel={walletData.zScoreLevel} 
                    totalZScore={walletData.totalZScore} 
                  />
                </div>
                
                {/* Overview stats */}
                <div className="md:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md h-full">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Wallet Overview
                      </h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Total Balance
                        </div>
                        <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                          {totalBalance.toFixed(2)} Let
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Contributions
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {walletData.contributionsCount}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg flex flex-col justify-between">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          On-chain Status
                        </div>
                        <div className="flex items-center text-green-600 dark:text-green-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Ready for on-chain minting</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Token breakdown card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Token Breakdown
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your current balance by token category
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(walletData.walletBalance).map(([category, amount]) => (
                      <div 
                        key={category}
                        className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">{category}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {getTokenDescription(category)}
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {amount.toFixed(2)}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleClaimClick(category, amount)}
                          disabled={amount <= 0}
                          className="w-full btn-primary py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Claim On-Chain
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Spend Tokens section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    Spend Tokens
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use your tokens to access premium services
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* GPT Premium */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border-2 border-transparent hover:border-primary-500 transition-colors">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 mb-4 mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                        Vove Premium
                      </h3>
                      
                      <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
                        Access to premium Vove Engine features and models
                      </p>
                      
                      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Cost:</span>
                        <span className="font-medium text-gray-900 dark:text-white">2.5 LOG</span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Z-Level:</span>
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs py-1 px-2 rounded">
                          Basic
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleSpendClick(SERVICE_TYPES.VOVE_PREMIUM)}
                        disabled={!walletData.walletBalance.LOG || walletData.walletBalance.LOG < 2.5}
                        className={`w-full py-2 px-4 rounded-md text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          (!walletData.walletBalance.LOG || walletData.walletBalance.LOG < 2.5) 
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500'
                        }`}
                      >
                        Spend Tokens
                      </button>
                    </div>
                    
                    {/* NFT Mint */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border-2 border-transparent hover:border-primary-500 transition-colors">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mb-4 mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                        NFT Mint
                      </h3>
                      
                      <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
                        Mint an exclusive VoveletAI NFT
                      </p>
                      
                      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Cost:</span>
                        <span className="font-medium text-gray-900 dark:text-white">3.5 VIZ</span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Z-Level:</span>
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs py-1 px-2 rounded">
                          Pro
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleSpendClick(SERVICE_TYPES.NFT_MINT)}
                        disabled={
                          !walletData.walletBalance.VIZ || 
                          walletData.walletBalance.VIZ < 3.5 || 
                          !canAccessService(walletData.zScoreLevel, SERVICE_TYPES.NFT_MINT)
                        }
                        className={`w-full py-2 px-4 rounded-md text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          (!walletData.walletBalance.VIZ || 
                           walletData.walletBalance.VIZ < 3.5 || 
                           !canAccessService(walletData.zScoreLevel, SERVICE_TYPES.NFT_MINT)) 
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
                        }`}
                      >
                        Spend Tokens
                      </button>
                    </div>
                    
                    {/* Z-Origin Boost */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border-2 border-transparent hover:border-primary-500 transition-colors">
                      <div className="flex items-center justify-center h-12 w-12 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 mb-4 mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
                        Z-Origin Boost
                      </h3>
                      
                      <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
                        Boost your Z-score calculation for all future contributions
                      </p>
                      
                      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Cost:</span>
                        <span className="font-medium text-gray-900 dark:text-white">5.0 STX</span>
                      </div>
                      
                      <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Z-Level:</span>
                        <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs py-1 px-2 rounded">
                          Prime
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleSpendClick(SERVICE_TYPES.Z_ORIGIN_BOOST)}
                        disabled={
                          !walletData.walletBalance.STX || 
                          walletData.walletBalance.STX < 5.0 || 
                          !canAccessService(walletData.zScoreLevel, SERVICE_TYPES.Z_ORIGIN_BOOST)
                        }
                        className={`w-full py-2 px-4 rounded-md text-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          (!walletData.walletBalance.STX || 
                           walletData.walletBalance.STX < 5.0 || 
                           !canAccessService(walletData.zScoreLevel, SERVICE_TYPES.Z_ORIGIN_BOOST)) 
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                            : 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500'
                        }`}
                      >
                        Spend Tokens
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-primary-50 dark:bg-primary-900/20 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Unlock more services by increasing your Z-score level. Contribute high-quality content to earn more tokens and improve your level.
                  </div>
                  
                  <div className="flex gap-4">
                    <Link href="/contribute" className="btn-primary">
                      Earn More Tokens
                    </Link>
                    <button className="btn-secondary">
                      View Transaction History
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
              No wallet data found. Please try refreshing the page.
            </div>
          )}
        </div>
      </div>
      
      {/* Claim Token Modal */}
      {activeModal && (
        <ClaimModal
          tokenType={activeModal.tokenType}
          tokenAmount={activeModal.amount}
          tokenDescription={activeModal.description}
          onClose={() => setActiveModal(null)}
          onSubmit={handleMintTokens}
        />
      )}

      {/* Spend Tokens Modal */}
      {activeSpendModal && (
        <SpendTokensModal
          tokenType={activeSpendModal.tokenType}
          tokenAmount={activeSpendModal.amount}
          serviceType={activeSpendModal.serviceType}
          serviceName={activeSpendModal.serviceName}
          serviceDescription={activeSpendModal.serviceDescription}
          onClose={() => setActiveSpendModal(null)}
          onSubmit={handleSpendTokens}
        />
      )}
    </div>
  );
}