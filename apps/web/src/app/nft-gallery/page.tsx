'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NFT, NFT_CONSTANTS, CONTRIBUTION_CATEGORIES } from '@obscuranet/shared';
import { getBlockchainConfig } from '@obscuranet/shared';

// NFT Card component
function NFTCard({ nft }: { nft: any }) {
  const getBlockExplorer = () => {
    const blockchainConfig = getBlockchainConfig();
    return `${blockchainConfig.blockExplorerUrl || 'https://goerli.etherscan.io'}/tx/${nft.txHash}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get background color based on contribution category
  const getBgColorClass = (category: string) => {
    switch (category) {
      case CONTRIBUTION_CATEGORIES.STX:
        return 'bg-slate-700';
      case CONTRIBUTION_CATEGORIES.VIZ:
        return 'bg-blue-700';
      case CONTRIBUTION_CATEGORIES.LOG:
        return 'bg-purple-700';
      case CONTRIBUTION_CATEGORIES.CRE:
        return 'bg-orange-600';
      case CONTRIBUTION_CATEGORIES.ANA:
        return 'bg-green-700';
      case CONTRIBUTION_CATEGORIES.SYN:
        return 'bg-red-700';
      default:
        return 'bg-gray-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      {/* NFT Image Section */}
      <div className={`h-48 ${getBgColorClass(nft.contribution?.category || 'STX')} relative overflow-hidden flex items-center justify-center`}>
        {nft.metadata?.image ? (
          <div className="text-white text-4xl font-bold">
            {nft.contribution?.category || 'NFT'}
          </div>
        ) : (
          <div className="text-white text-4xl font-bold">
            {nft.contribution?.category || 'NFT'}
          </div>
        )}
        
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Token #{nft.tokenId}
        </div>
      </div>
      
      {/* NFT Info Section */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {nft.metadata?.name || `Contribution #${nft.contributionId?.slice(-6)}`}
        </h3>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {nft.contribution?.text?.substring(0, 80)}
          {nft.contribution?.text?.length > 80 ? '...' : ''}
        </div>
        
        {/* NFT Attributes */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Category</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {nft.contribution?.category || 'Unknown'}
            </div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Z-Score</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {nft.contribution?.zScore?.toFixed(2) || 'N/A'}
            </div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Minted</div>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatDate(nft.mintedAt)}
            </div>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <div className="text-xs text-gray-500 dark:text-gray-400">Network</div>
            <div className="font-medium text-gray-900 dark:text-white capitalize">
              {nft.network || 'Goerli'}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-2">
          <a 
            href={getBlockExplorer()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded transition-colors text-sm"
          >
            View Transaction
          </a>
          
          <a 
            href={nft.tokenURI?.replace('ipfs://', 'https://ipfs.io/ipfs/')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-center py-2 px-4 rounded transition-colors text-sm"
          >
            View Metadata
          </a>
        </div>
      </div>
    </div>
  );
}

// Placeholder NFT card for "Mint a new NFT"
function MintNFTCard({ onClick }: { onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden h-full cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 dark:border-gray-600"
    >
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Mint a New NFT
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Turn your high-quality contributions into NFTs that showcase your expertise
        </p>
      </div>
    </div>
  );
}

// Modal for selecting contributions to mint
function MintModal({ onClose, onMint }: { onClose: () => void, onMint: (contributionId: string) => Promise<void> }) {
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContribution, setSelectedContribution] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would fetch from API
    // Simulate fetch from API
    setTimeout(() => {
      setContributions([
        {
          id: 'contrib1',
          text: 'This is a high-quality contribution about visualization techniques in data science.',
          category: 'VIZ',
          zScore: 182.5,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'contrib2',
          text: 'Strategic analysis of emerging technology trends in the AI industry.',
          category: 'STX',
          zScore: 165.3,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'contrib3',
          text: 'Logical breakdown of computational complexity in modern algorithms.',
          category: 'LOG',
          zScore: 158.7,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleMint = async () => {
    if (!selectedContribution) return;
    
    setMinting(true);
    setError(null);
    
    try {
      await onMint(selectedContribution);
      // Success is handled by the parent component
    } catch (err: any) {
      console.error('Error minting NFT:', err);
      setError(err.message || 'Failed to mint NFT. Please try again.');
      setMinting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Mint New NFT
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Loading your eligible contributions...
              </p>
            </div>
          ) : minting ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Minting your NFT... This may take a minute.
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm mt-2">
                We're generating your artwork, uploading to IPFS, and minting the NFT on-chain.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Select one of your high-quality contributions to mint as an NFT. Only contributions with a Z-score greater than 150 are eligible.
                  </p>
                </div>
                
                {contributions.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {contributions.map(contribution => (
                      <div 
                        key={contribution.id}
                        className={`border p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedContribution === contribution.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                        }`}
                        onClick={() => setSelectedContribution(contribution.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-gray-900 dark:text-white mb-1 truncate pr-2">
                            {contribution.text.length > 50 
                              ? contribution.text.substring(0, 50) + '...' 
                              : contribution.text}
                          </div>
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs py-1 px-2 rounded">
                            {contribution.category}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            {formatDate(contribution.createdAt)}
                          </span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            Z-Score: {contribution.zScore.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg text-center">
                    You don't have any contributions that qualify for NFT minting yet. Keep contributing high-quality content to reach the required Z-score threshold.
                  </div>
                )}
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
                  type="button"
                  onClick={handleMint}
                  className="btn-primary"
                  disabled={!selectedContribution}
                >
                  Mint NFT
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NFTGalleryPage() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [mintSuccess, setMintSuccess] = useState<any | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      try {
        // Call our API endpoint to get NFT data
        const response = await fetch('/api/userNFTs?userId=test-user-id');
        
        if (!response.ok) {
          throw new Error('Failed to fetch NFT data');
        }
        
        const data = await response.json();
        setNfts(data.nfts || []);
      } catch (err) {
        console.error('Failed to fetch NFT data:', err);
        setError('Failed to load your NFT collection. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNFTs();
  }, []);

  const handleMintNFT = async (contributionId: string) => {
    try {
      // Call the createNFT API
      const response = await fetch('/api/createNFT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user-id',
          contributionId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mint NFT');
      }
      
      const data = await response.json();
      
      // Show success message and close modal
      setMintSuccess(data);
      setShowMintModal(false);
      
      // Refresh NFT list after a short delay
      setTimeout(async () => {
        const response = await fetch('/api/userNFTs?userId=test-user-id');
        const newData = await response.json();
        setNfts(newData.nfts || []);
        // Reset success state after 5 seconds
        setTimeout(() => setMintSuccess(null), 5000);
      }, 1000);
      
    } catch (error: any) {
      console.error('Error minting NFT:', error);
      throw new Error(error.message || 'Failed to mint NFT');
    }
  };

  return (
    <div className="py-16">
      <div className="container-content">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              NFT Gallery
            </h1>
            
            <Link href="/wallet" className="btn-secondary">
              Back to Wallet
            </Link>
          </div>
          
          {mintSuccess && (
            <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">NFT Successfully Minted!</p>
                <p className="text-sm">Your NFT has been created with token ID #{mintSuccess.tokenId}.</p>
                <a 
                  href={mintSuccess.blockExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline mt-1 inline-block"
                >
                  View transaction
                </a>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MintNFTCard onClick={() => setShowMintModal(true)} />
              
              {nfts.map(nft => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
              
              {nfts.length === 0 && (
                <div className="md:col-span-2 lg:col-span-2 bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
                  <div className="text-gray-500 dark:text-gray-300 mb-3">
                    You haven't minted any NFTs yet. Get started by minting your first NFT from a high-quality contribution.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {showMintModal && (
        <MintModal 
          onClose={() => setShowMintModal(false)}
          onMint={handleMintNFT}
        />
      )}
    </div>
  );
}