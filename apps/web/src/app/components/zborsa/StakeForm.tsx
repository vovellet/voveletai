'use client';

import { useState, useEffect, FormEvent } from 'react';
import { 
  TokenRewards, 
  ZBORSA_CONSTANTS 
} from '@obscuranet/shared';

interface StakeFormProps {
  walletBalance: TokenRewards;
  onStake: (tokenType: string, amount: number, yieldToken: string, lockPeriodDays: number) => Promise<void>;
}

export default function StakeForm({ walletBalance, onStake }: StakeFormProps) {
  const [tokenType, setTokenType] = useState<string>('OBX');
  const [amount, setAmount] = useState<string>('');
  const [yieldToken, setYieldToken] = useState<string>('STX');
  const [lockPeriodDays, setLockPeriodDays] = useState<number>(7);
  const [estimatedYield, setEstimatedYield] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get staking options from constants
  const stakingOptions = ZBORSA_CONSTANTS.DEFAULT_STAKING_OPTIONS;
  
  // Get available yield tokens for selected token type
  const availableYieldTokens = Array.from(new Set(
    stakingOptions
      .filter(option => option.tokenType === tokenType)
      .map(option => option.yieldToken)
  ));
  
  // Get available lock periods for selected token type and yield token
  const availableLockPeriods = stakingOptions
    .filter(option => option.tokenType === tokenType && option.yieldToken === yieldToken)
    .map(option => option.lockPeriodDays);
  
  // Update yield token when token type changes
  useEffect(() => {
    if (availableYieldTokens.length > 0 && !availableYieldTokens.includes(yieldToken)) {
      setYieldToken(availableYieldTokens[0]);
    }
  }, [tokenType, availableYieldTokens, yieldToken]);
  
  // Update lock period when yield token changes
  useEffect(() => {
    if (availableLockPeriods.length > 0 && !availableLockPeriods.includes(lockPeriodDays)) {
      setLockPeriodDays(availableLockPeriods[0]);
    }
  }, [yieldToken, availableLockPeriods, lockPeriodDays]);
  
  // Calculate estimated yield based on selected options
  useEffect(() => {
    if (tokenType && yieldToken && lockPeriodDays && amount && Number(amount) > 0) {
      const selectedOption = stakingOptions.find(
        option => option.tokenType === tokenType && 
                option.yieldToken === yieldToken && 
                option.lockPeriodDays === lockPeriodDays
      );
      
      if (selectedOption) {
        // Calculate annual yield
        const annualYield = Number(amount) * selectedOption.yieldRate;
        
        // Calculate yield for lock period
        const periodYield = annualYield * (lockPeriodDays / 365);
        
        setEstimatedYield(periodYield);
      } else {
        setEstimatedYield(null);
      }
    } else {
      setEstimatedYield(null);
    }
  }, [tokenType, yieldToken, lockPeriodDays, amount, stakingOptions]);
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!tokenType || !yieldToken || !lockPeriodDays || !amount || Number(amount) <= 0) {
      setError('Please fill all fields with valid values');
      return;
    }
    
    // Check if user has sufficient balance
    if (!walletBalance[tokenType] || walletBalance[tokenType] < Number(amount)) {
      setError(`Insufficient ${tokenType} balance`);
      return;
    }
    
    // Validate against min/max amounts
    const selectedOption = stakingOptions.find(
      option => option.tokenType === tokenType && 
              option.yieldToken === yieldToken && 
              option.lockPeriodDays === lockPeriodDays
    );
    
    if (!selectedOption) {
      setError('Invalid staking option');
      return;
    }
    
    if (Number(amount) < selectedOption.minAmount) {
      setError(`Minimum stake amount is ${selectedOption.minAmount} ${tokenType}`);
      return;
    }
    
    if (Number(amount) > selectedOption.maxAmount) {
      setError(`Maximum stake amount is ${selectedOption.maxAmount} ${tokenType}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onStake(tokenType, Number(amount), yieldToken, lockPeriodDays);
      // Reset amount after successful stake
      setAmount('');
    } catch (err) {
      console.error('Stake error:', err);
      setError(err instanceof Error ? err.message : 'Failed to stake tokens');
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
  
  // Get yield rate for selected options
  const getYieldRate = (): number => {
    const selectedOption = stakingOptions.find(
      option => option.tokenType === tokenType && 
              option.yieldToken === yieldToken && 
              option.lockPeriodDays === lockPeriodDays
    );
    
    return selectedOption ? selectedOption.yieldRate * 100 : 0;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Stake Tokens
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {/* Token Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token to Stake
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1">
              <select
                value={tokenType}
                onChange={(e) => setTokenType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={loading}
              >
                {Array.from(new Set(stakingOptions.map(option => option.tokenType))).map((token) => (
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
                  Balance: {walletBalance[tokenType]?.toFixed(2) || '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Yield Token */}
        <div className="mb-4 mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Earn Yield In
          </label>
          <select
            value={yieldToken}
            onChange={(e) => setYieldToken(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading || availableYieldTokens.length === 0}
          >
            {availableYieldTokens.map((token) => (
              <option key={token} value={token}>
                {token} ({getTokenDescription(token)})
              </option>
            ))}
          </select>
        </div>
        
        {/* Lock Period */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lock Period
          </label>
          <select
            value={lockPeriodDays}
            onChange={(e) => setLockPeriodDays(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading || availableLockPeriods.length === 0}
          >
            {availableLockPeriods.map((days) => (
              <option key={days} value={days}>
                {days} days ({days === 7 ? '1 week' : days === 30 ? '1 month' : `${days} days`})
              </option>
            ))}
          </select>
        </div>
        
        {/* Yield Information */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">APY (Annual Percentage Yield)</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {getYieldRate().toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Lock Until</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {new Date(Date.now() + lockPeriodDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">You Stake</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {amount || '0'} {tokenType}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Estimated Yield</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {estimatedYield !== null ? formatNumber(estimatedYield) : '0'} {yieldToken}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded">
            Note: Early withdrawal before the lock period ends will only return 50% of the accrued yield.
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          className="w-full btn-primary py-3"
          disabled={loading || !tokenType || !yieldToken || !lockPeriodDays || !amount || Number(amount) <= 0}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing Stake
            </div>
          ) : (
            <>Stake Tokens</>
          )}
        </button>
      </form>
    </div>
  );
}