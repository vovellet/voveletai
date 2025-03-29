'use client';

import { useState } from 'react';
import { StakeRecord } from '@obscuranet/shared';

interface StakeListProps {
  stakes: StakeRecord[];
  isLoading: boolean;
  onWithdraw: (stakeId: string) => Promise<void>;
}

export default function StakeList({ stakes, isLoading, onWithdraw }: StakeListProps) {
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  
  // Format date for display
  const formatDate = (date: Date | any): string => {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Calculate days remaining in lock period
  const calculateDaysRemaining = (endDate: Date | any): number => {
    if (!endDate) return 0;
    
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const now = new Date();
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };
  
  // Handle withdraw button click
  const handleWithdraw = async (stakeId: string) => {
    setWithdrawingId(stakeId);
    
    try {
      await onWithdraw(stakeId);
    } catch (error) {
      console.error('Error withdrawing stake:', error);
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Your Active Stakes
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : stakes.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No active stakes yet. Stake your tokens to start earning yield.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Staked Token
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Yield Token
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Lock Period
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Accrued Yield
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stakes.map((stake) => (
                <tr key={stake.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stake.amount.toFixed(4)} {stake.tokenType}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Staked on {formatDate(stake.startDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stake.yieldToken}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {(stake.yieldRate * 100).toFixed(1)}% APY
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {stake.lockPeriodDays} days
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {calculateDaysRemaining(stake.endDate)} days remaining
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {stake.totalYieldAccrued.toFixed(4)} {stake.yieldToken}
                    </div>
                    {stake.projectedYield && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        +{(stake.projectedYield - stake.totalYieldAccrued).toFixed(4)} pending
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleWithdraw(stake.id)}
                      disabled={withdrawingId === stake.id}
                      className={`px-3 py-1.5 rounded text-white ${
                        withdrawingId === stake.id
                          ? 'bg-gray-400 dark:bg-gray-600'
                          : calculateDaysRemaining(stake.endDate) === 0
                            ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                            : 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
                      }`}
                    >
                      {withdrawingId === stake.id ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Withdrawing...
                        </div>
                      ) : calculateDaysRemaining(stake.endDate) === 0 ? (
                        'Withdraw'
                      ) : (
                        'Withdraw Early'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}