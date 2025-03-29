'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { 
  TokenRewards, 
  SwapTransaction, 
  ZBORSA_CONSTANTS
} from '@obscuranet/shared';
import SwapForm from '../components/zborsa/SwapForm';
import SwapHistory from '../components/zborsa/SwapHistory';
import TokenChart from '../components/zborsa/TokenChart';
import Link from 'next/link';

export default function ZBorsaPage() {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<TokenRewards | null>(null);
  const [swapHistory, setSwapHistory] = useState<SwapTransaction[]>([]);
  const [selectedFromToken, setSelectedFromToken] = useState<string>('OBX');
  const [selectedToToken, setSelectedToToken] = useState<string>('STX');
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        setIsLoadingBalance(true);
        
        // Call API to get wallet balance
        const response = await fetch('/api/wallet');
        
        if (!response.ok) {
          throw new Error('Failed to fetch wallet balance');
        }
        
        const data = await response.json();
        setWalletBalance(data.walletBalance);
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
        setError('Failed to load your wallet balance. Please try again.');
        
        // Fallback for demo
        setWalletBalance({
          STX: 12.3,
          VIZ: 9.7,
          LOG: 5.2,
          CRE: 7.6,
          ANA: 8.4,
          SYN: 6.1,
          OBX: 50.0
        });
      } finally {
        setIsLoadingBalance(false);
      }
    };
    
    fetchWalletBalance();
  }, []);
  
  // Fetch swap history
  useEffect(() => {
    const fetchSwapHistory = async () => {
      if (!user) return;
      
      try {
        setIsLoadingHistory(true);
        
        // Call API to get swap history
        const response = await fetch('/api/zborsa/swapHistory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch swap history');
        }
        
        const data = await response.json();
        
        if (data.success && data.swaps) {
          setSwapHistory(data.swaps);
        }
      } catch (err) {
        console.error('Error fetching swap history:', err);
        
        // Create mock data for testing
        const mockSwaps: SwapTransaction[] = [
          {
            id: '1',
            userId: user?.id || 'test-user',
            fromToken: 'OBX',
            toToken: 'STX',
            fromAmount: 5,
            toAmount: 12,
            rate: 2.4,
            fee: 0.05,
            status: 'completed',
            createdAt: new Date(Date.now() - 3600000 * 24)
          },
          {
            id: '2',
            userId: user?.id || 'test-user',
            fromToken: 'STX',
            toToken: 'OBX',
            fromAmount: 3,
            toAmount: 1.2,
            rate: 0.4,
            fee: 0.06,
            status: 'completed',
            createdAt: new Date(Date.now() - 3600000 * 48)
          },
        ];
        
        setSwapHistory(mockSwaps);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    fetchSwapHistory();
  }, [user]);
  
  // Handle token swap
  const handleSwap = async (fromToken: string, toToken: string, amount: number) => {
    if (!user || !walletBalance) {
      setError('You must be logged in to swap tokens');
      return;
    }
    
    try {
      // Update selected tokens for chart
      setSelectedFromToken(fromToken);
      setSelectedToToken(toToken);
      
      // Call API to swap tokens
      const response = await fetch('/api/zborsa/swapTokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          fromToken,
          toToken,
          amount
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to swap tokens');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update wallet balance
        setWalletBalance(data.newBalance);
        
        // Add new swap to history
        setSwapHistory([data.swap, ...swapHistory]);
      }
    } catch (err) {
      console.error('Error swapping tokens:', err);
      throw err;
    }
  };
  
  return (
    <div className="py-16">
      <div className="container-content">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Z-Borsa Exchange
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Swap and stake your OBX tokens and rewards
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/zborsa/stake" className="btn-secondary">
                Stake Tokens
              </Link>
              <Link href="/wallet" className="btn-primary">
                My Wallet
              </Link>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Swap Form */}
            <SwapForm 
              walletBalance={walletBalance || {
                STX: 0,
                VIZ: 0,
                LOG: 0,
                CRE: 0,
                ANA: 0,
                SYN: 0,
                OBX: 0
              }} 
              onSwap={handleSwap} 
            />
            
            {/* Token Chart */}
            <TokenChart 
              fromToken={selectedFromToken} 
              toToken={selectedToToken} 
            />
          </div>
          
          {/* Swap History */}
          <SwapHistory 
            swaps={swapHistory} 
            isLoading={isLoadingHistory} 
          />
        </div>
      </div>
    </div>
  );
}