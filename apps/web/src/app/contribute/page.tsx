'use client';

import { useState } from 'react';
import { ContributionAnalysis, TokenRewards } from '@obscuranet/shared';

interface AnalysisResponse {
  success: boolean;
  contribution: {
    id: string;
    category: string;
    gptScore: number;
    aiComment?: string;
    zScore: number;
    tokenAmount: number;
    rewards: TokenRewards;
  };
  analysis: ContributionAnalysis;
  zScore: number;
  tokenAmount: number;
  rewards: TokenRewards;
}

export default function ContributePage() {
  const [contribution, setContribution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contribution.trim()) {
      setError('Please enter your contribution');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // In a real app, we would call our actual API endpoint
      const res = await fetch('/api/submitContribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contribution }),
      });
      
      if (!res.ok) throw new Error('Failed to submit contribution');
      const data = await res.json();
      
      // Set the analysis result
      setAnalysisResult(data);
    } catch (err) {
      setError('Failed to submit contribution. Please try again.');
      console.error(err);
      
      // Fallback for demo purposes if the API call fails
      // In a real app, you would handle this differently
      setAnalysisResult({
        success: true,
        contribution: {
          id: Date.now().toString(),
          category: 'STX',
          gptScore: 7.8,
          aiComment: 'This is a well-formed strategic thinking contribution that demonstrates good understanding of core concepts. The ideas presented are coherent and have potential for further development.',
          zScore: 19.75,
          tokenAmount: 35,
          rewards: {
            STX: 5.93,
            VIZ: 3.29,
            LOG: 2.82,
            CRE: 2.47,
            ANA: 2.63,
            SYN: 3.04
          }
        },
        analysis: {
          category: 'STX',
          gptScore: 7.8,
          aiComment: 'This is a well-formed strategic thinking contribution that demonstrates good understanding of core concepts. The ideas presented are coherent and have potential for further development.',
        },
        zScore: 19.75,
        tokenAmount: 35,
        rewards: {
          STX: 5.93,
          VIZ: 3.29,
          LOG: 2.82,
          CRE: 2.47,
          ANA: 2.63,
          SYN: 3.04
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16">
      <div className="container-content">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Contribute with GPT
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Share your insights, ideas, and knowledge to earn tokens while contributing to the ObscuraNet ecosystem.
          </p>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="contribution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Contribution
                </label>
                <textarea
                  id="contribution"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Share your insights, ideas, or knowledge..."
                  value={contribution}
                  onChange={(e) => setContribution(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </div>
                ) : (
                  'Submit Contribution'
                )}
              </button>
            </form>
          </div>
          
          {analysisResult && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  GPT Analysis
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your contribution has been analyzed by our AI system.
                </p>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {analysisResult.analysis.category}
                    </span>
                    <span className="ml-2 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs rounded-md">
                      {analysisResult.analysis.category === 'STX' && 'Strategic Thinking'}
                      {analysisResult.analysis.category === 'VIZ' && 'Visualization'}
                      {analysisResult.analysis.category === 'LOG' && 'Logical Reasoning'}
                      {analysisResult.analysis.category === 'CRE' && 'Creative Thinking'}
                      {analysisResult.analysis.category === 'ANA' && 'Analysis'}
                      {analysisResult.analysis.category === 'SYN' && 'Synthesis'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">GPT Score</div>
                  <div className="flex items-end">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analysisResult.analysis.gptScore.toFixed(1)}
                    </span>
                    <span className="text-base text-gray-500 dark:text-gray-400 ml-1 mb-0.5">/ 10</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Z-Score</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {analysisResult.zScore.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">AI Comment</div>
                <p className="text-gray-700 dark:text-gray-300">
                  {analysisResult.analysis.aiComment}
                </p>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    🪙 Token Rewards
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(analysisResult.rewards).map(([category, amount]) => (
                      <div key={category} className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md flex items-center justify-between">
                        <div className="font-medium">
                          {category}
                        </div>
                        <div className={`font-bold ${category === analysisResult.analysis.category ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-primary-50 dark:bg-primary-900/20 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Reward Value</div>
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {Object.values(analysisResult.rewards).reduce((sum, value) => sum + value, 0).toFixed(2)} OBX
                    </div>
                  </div>
                  <button className="btn-primary">
                    Claim Rewards
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
