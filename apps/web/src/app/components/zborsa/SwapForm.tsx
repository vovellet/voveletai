'use client';

import { useState, useEffect, FormEvent } from 'react';
import { 
  TokenPair, 
  TokenRewards, 
  ZBORSA_CONSTANTS 
} from '@obscuranet/shared';
import { 
  getRate, 
  estimateOutput, 
  getAllTokenPairs 
} from '@obscuranet/zcore';

interface SwapFormProps {
  walletBalance: TokenRewards;
  onSwap: (fromToken: string, toToken: string, amount: number) => Promise<void>;
}

export default function SwapForm({ walletBalance, onSwap }: SwapFormProps) {
  const [fromToken, setFromToken] = useState<string>('OBX');
  const [toToken, setToToken] = useState<string>('STX');
  const [amount, setAmount] = useState<string>('');
  const [tokenPairs, setTokenPairs] = useState<TokenPair[]>([]);
  const [availableToTokens, setAvailableToTokens] = useState<string[]>([]);
  const [rate, setRate] = useState<number | null>(null);
  const [outputAmount, setOutputAmount] = useState<number | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize available tokens and rates
  useEffect(() => {
    const pairs = getAllTokenPairs();
    setTokenPairs(pairs);
    
    // Set available "to" tokens based on selected "from" token
    updateAvailableToTokens(fromToken, pairs);
  }, [fromToken]);
  
  // Update rate when tokens or amount change
  useEffect(() => {
    if (fromToken && toToken && amount && Number(amount) > 0) {
      const currentRate = getRate(fromToken, toToken);
      setRate(currentRate);
      
      const output = estimateOutput(fromToken, toToken, Number(amount));
      if (output) {
        setOutputAmount(output.outputAmount);
        setFee(output.fee);
      } else {
        setOutputAmount(null);
        setFee(null);
      }
    } else {
      setRate(null);
      setOutputAmount(null);
      setFee(null);
    }
  }, [fromToken, toToken, amount]);
  
  // Update available "to" tokens based on selected "from" token
  const updateAvailableToTokens = (from: string, pairs: TokenPair[]) => {
    const available = pairs
      .filter(pair => pair.fromToken === from && pair.isActive)
      .map(pair => pair.toToken);
    
    setAvailableToTokens(available);
    
    // If current toToken is not in available tokens, select the first available
    if (available.length > 0 && !available.includes(toToken)) {
      setToToken(available[0]);
    }
  };
  
  // Swap from/to tokens
  const handleSwapDirection = () => {
    // Check if reverse pair exists
    const reversePair = tokenPairs.find(
      pair => pair.fromToken === toToken && pair.toToken === fromToken && pair.isActive
    );
    
    if (reversePair) {
      const temp = fromToken;
      setFromToken(toToken);
      setToToken(temp);
      setAmount(''); // Reset amount when swapping direction
    } else {
      setError('This swap pair is not available in reverse direction');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!fromToken || !toToken || !amount || Number(amount) <= 0) {
      setError('Please fill all fields with valid values');
      return;
    }
    
    // Check if user has sufficient balance
    if (!walletBalance[fromToken] || walletBalance[fromToken] < Number(amount)) {
      setError(`Insufficient ${fromToken} balance`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onSwap(fromToken, toToken, Number(amount));
      // Reset amount after successful swap
      setAmount('');
    } catch (err) {
      console.error('Swap error:', err);
      setError(err instanceof Error ? err.message : 'Failed to swap tokens');
    } finally {
      setLoading(false);
    }
  };
  
  // Get token description for display
  const getTokenDescription = (token: string): string => {
    switch (token) {
      case 'STX': return 'Strategic Thinking';
      case 'VIZ': return 'Visualization';
      case 'LOG': return 'Logical Reasoning';
      case 'CRE': return 'Creative Thinking';
      case 'ANA': return 'Analysis';
      case 'SYN': return 'Synthesis';
      case 'OBX': return 'ObscuraNet Token';
      default: return token;
    }
  };
  
  // Format number with 4 decimal places
  const formatNumber = (num: number): string => {
    return num.toFixed(4);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Swap Tokens
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {/* From Token */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            From
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              >
                {Object.values(ZBORSA_CONSTANTS.TOKENS).map((token) => (
                  <option key={token} value={token}>
                    {token} ({getTokenDescription(token)})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/3">
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={loading}
                />
                <div className="absolute text-xs text-right text-gray-500 dark:text-gray-400 -bottom-5 right-1">
                  Balance: {walletBalance[fromToken]?.toFixed(2) || '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Swap Direction Button */}
        <div className="flex justify-center my-4">
          <button
            type="button"
            onClick={handleSwapDirection}
            className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>
        
        {/* To Token */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            To
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading || availableToTokens.length === 0}
              >
                {availableToTokens.map((token) => (
                  <option key={token} value={token}>
                    {token} ({getTokenDescription(token)})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/3">
              <input
                type="text"
                value={outputAmount !== null ? formatNumber(outputAmount) : ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
        
        {/* Rate and Fee Information */}
        {rate !== null && outputAmount !== null && fee !== null && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Exchange Rate</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  1 {fromToken} = {formatNumber(rate)} {toToken}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Fee</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatNumber(fee)} {fromToken} ({(fee / Number(amount) * 100).toFixed(2)}%)
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">You Pay</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {amount} {fromToken}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">You Receive</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatNumber(outputAmount)} {toToken}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          className="w-full btn-primary py-3"
          disabled={loading || !fromToken || !toToken || !amount || Number(amount) <= 0 || outputAmount === null}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing Swap
            </div>
          ) : (
            <>Swap Tokens</>
          )}
        </button>
      </form>
    </div>
  );
}