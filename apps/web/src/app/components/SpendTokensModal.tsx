'use client';

import { useState } from 'react';
import { TokenRewards } from '@obscuranet/shared';

interface SpendTokensModalProps {
  tokenType: string;
  tokenAmount: number;
  serviceType: string;
  serviceName: string;
  serviceDescription: string;
  onClose: () => void;
  onSubmit: (userId: string, tokenType: string, amount: number, serviceType: string) => Promise<void>;
}

interface TransactionState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
  newBalance?: TokenRewards;
}

export default function SpendTokensModal({
  tokenType,
  tokenAmount,
  serviceType,
  serviceName,
  serviceDescription,
  onClose,
  onSubmit
}: SpendTokensModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: 'idle'
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransactionState({ status: 'processing' });
    
    try {
      await onSubmit('test-user-id', tokenType, tokenAmount, serviceType);
      setTransactionState({ 
        status: 'success',
        message: `Successfully used ${tokenAmount} ${tokenType} tokens for ${serviceName}.`
      });
    } catch (err: any) {
      console.error('Error spending tokens:', err);
      setTransactionState({ 
        status: 'error',
        message: err.message || 'Failed to spend tokens. Please try again.'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Use {tokenType} Tokens for {serviceName}
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
                    You are about to spend <span className="font-bold">{tokenAmount} {tokenType}</span> tokens 
                    for <span className="font-bold">{serviceName}</span>.
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
                    {serviceDescription}
                  </p>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg mb-4">
                    <span className="text-gray-700 dark:text-gray-300">Cost:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{tokenAmount} {tokenType}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded text-sm text-yellow-800 dark:text-yellow-300 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>
                    This transaction will deduct tokens from your balance.
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
                >
                  Confirm
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}