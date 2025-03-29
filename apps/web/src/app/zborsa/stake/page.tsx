'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { 
  TokenRewards, 
  StakeRecord
} from '@obscuranet/shared';
import StakeForm from '../../components/zborsa/StakeForm';
import StakeList from '../../components/zborsa/StakeList';
import Link from 'next/link';

export default function StakePage() {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<TokenRewards | null>(null);
  const [activeStakes, setActiveStakes] = useState<StakeRecord[]>([]);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingStakes, setIsLoadingStakes] = useState(true);
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
  
  // Fetch active stakes
  useEffect(() => {
    const fetchActiveStakes = async () => {
      if (!user) return;
      
      try {
        setIsLoadingStakes(true);
        
        // Call API to get active stakes
        const response = await fetch('/api/zborsa/getStakes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch active stakes');
        }
        
        const data = await response.json();
        
        if (data.success && data.stakes) {
          setActiveStakes(data.stakes);
        }
      } catch (err) {
        console.error('Error fetching active stakes:', err);
        
        // Create mock data for testing
        const now = new Date();
        const endDate1 = new Date();
        endDate1.setDate(now.getDate() + 7);
        const endDate2 = new Date();
        endDate2.setDate(now.getDate() + 28);
        
        const mockStakes: StakeRecord[] = [
          {
            id: '1',
            userId: user?.id || 'test-user',
            tokenType: 'OBX',
            amount: 10,
            yieldToken: 'STX',
            yieldRate: 0.08,
            lockPeriodDays: 7,
            startDate: now,
            endDate: endDate1,
            totalYieldAccrued: 0.05,
            lastYieldAt: now,
            status: 'active',
            projectedYield: 0.15
          },
          {
            id: '2',
            userId: user?.id || 'test-user',
            tokenType: 'OBX',
            amount: 20,
            yieldToken: 'VIZ',
            yieldRate: 0.13,
            lockPeriodDays: 30,
            startDate: now,
            endDate: endDate2,
            totalYieldAccrued: 0.18,
            lastYieldAt: now,
            status: 'active',
            projectedYield: 0.7
          },
        ];
        
        setActiveStakes(mockStakes);
      } finally {
        setIsLoadingStakes(false);
      }
    };
    
    fetchActiveStakes();
  }, [user]);
  
  // Handle stake tokens
  const handleStake = async (tokenType: string, amount: number, yieldToken: string, lockPeriodDays: number) => {
    if (!user || !walletBalance) {
      setError('You must be logged in to stake tokens');
      return;
    }
    
    try {
      // Call API to stake tokens
      const response = await fetch('/api/zborsa/stakeTokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          tokenType,
          amount,
          yieldToken,
          lockPeriodDays
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to stake tokens');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update wallet balance - deduct staked amount
        if (walletBalance) {
          const updatedBalance = { ...walletBalance };
          updatedBalance[tokenType] -= amount;
          setWalletBalance(updatedBalance);
        }
        
        // Add new stake to active stakes
        setActiveStakes([data.stake, ...activeStakes]);
      }
    } catch (err) {
      console.error('Error staking tokens:', err);
      throw err;
    }
  };
  
  // Handle withdraw stake
  const handleWithdraw = async (stakeId: string) => {
    if (!user) {
      setError('You must be logged in to withdraw stakes');
      return;
    }
    
    try {
      // Call API to withdraw stake
      const response = await fetch('/api/zborsa/withdrawStake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          stakeId
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to withdraw stake');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update wallet balance - add returned amount and yield
        if (walletBalance) {
          const stake = activeStakes.find(s => s.id === stakeId);
          
          if (stake) {
            const updatedBalance = { ...walletBalance };
            updatedBalance[stake.tokenType] += stake.amount;
            updatedBalance[stake.yieldToken] = (updatedBalance[stake.yieldToken] || 0) + data.withdrawal.yieldAmount;
            setWalletBalance(updatedBalance);
          }
        }
        
        // Remove stake from active stakes
        setActiveStakes(activeStakes.filter(stake => stake.id !== stakeId));
      }
    } catch (err) {
      console.error('Error withdrawing stake:', err);
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
                Z-Borsa Staking
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Stake your tokens to earn passive income
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/zborsa" className="btn-secondary">
                Token Swap
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
            {/* Stake Form */}
            <StakeForm 
              walletBalance={walletBalance || {
                STX: 0,
                VIZ: 0,
                LOG: 0,
                CRE: 0,
                ANA: 0,
                SYN: 0,
                OBX: 0
              }} 
              onStake={handleStake} 
            />
            
            {/* Staking Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  About Staking
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    What is token staking?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Staking allows you to earn passive income by locking your tokens for a specific period. The longer the lock period, the higher the yield rate.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    How returns are calculated
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Staking rewards are calculated based on the Annual Percentage Yield (APY), the amount staked, and the lock period. For example, with a 10% APY, staking 100 tokens for a year would yield 10 tokens.
                  </p>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    Early Withdrawal
                  </h4>
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                    Early withdrawal (before the lock period ends) is possible but will only return 50% of the accrued yield. This ensures stability in the staking system.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Available Lock Periods
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400">7 Days</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">7-8% APY</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400">30 Days</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">13-15% APY</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Active Stakes */}
          <StakeList 
            stakes={activeStakes} 
            isLoading={isLoadingStakes} 
            onWithdraw={handleWithdraw} 
          />
        </div>
      </div>
    </div>
  );
}