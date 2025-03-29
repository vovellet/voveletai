'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PROJECT_CATEGORIES, 
  ZORIGIN_CONSTANTS,
  ProjectCategory, 
  Z_SCORE_LEVELS 
} from '@obscuranet/shared';

interface User {
  id: string;
  displayName?: string;
  walletAddress?: string;
  zScoreLevel?: string;
  totalZScore?: number;
  activeProjects?: number;
  walletBalance?: {
    OBX: number;
    [key: string]: number;
  };
}

export default function ZOriginPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectSymbol, setProjectSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory | ''>('');
  const [goal, setGoal] = useState('');
  
  // Form validation state
  const [nameError, setNameError] = useState<string | null>(null);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  
  // Load user data
  useEffect(() => {
    const mockUser: User = {
      id: 'test-user-id',
      displayName: 'Test User',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      zScoreLevel: Z_SCORE_LEVELS.PRIME,
      totalZScore: 160,
      activeProjects: 1,
      walletBalance: {
        OBX: 20,
        STX: 12.3,
        VIZ: 8.5,
        LOG: 5.2
      }
    };
    
    // Simulate API delay
    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 800);
  }, []);
  
  // Validate form fields
  const validateForm = () => {
    let isValid = true;
    
    // Validate project name
    if (!projectName.trim()) {
      setNameError('Project name is required');
      isValid = false;
    } else if (projectName.trim().length < 3) {
      setNameError('Project name must be at least 3 characters');
      isValid = false;
    } else {
      setNameError(null);
    }
    
    // Validate project symbol
    if (!projectSymbol.trim()) {
      setSymbolError('Project symbol is required');
      isValid = false;
    } else if (!/^[A-Z]{3,5}$/.test(projectSymbol)) {
      setSymbolError('Symbol must be 3-5 uppercase letters');
      isValid = false;
    } else {
      setSymbolError(null);
    }
    
    // Validate description
    if (!description.trim()) {
      setDescriptionError('Description is required');
      isValid = false;
    } else if (description.trim().length < 50) {
      setDescriptionError('Description must be at least 50 characters');
      isValid = false;
    } else {
      setDescriptionError(null);
    }
    
    // Validate category
    if (!category) {
      setCategoryError('Please select a category');
      isValid = false;
    } else {
      setCategoryError(null);
    }
    
    // Validate goal
    if (!goal.trim()) {
      setGoalError('Project goal is required');
      isValid = false;
    } else if (goal.trim().length < 20) {
      setGoalError('Goal must be at least 20 characters');
      isValid = false;
    } else {
      setGoalError(null);
    }
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error/success states
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Check user eligibility
    if (!user) {
      setError('User data not available');
      return;
    }
    
    // Check Z-score requirement
    if (
      !user.totalZScore || 
      user.totalZScore < ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT
    ) {
      setError(`Your Z-score is too low. You need at least ${ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT} to create a Z-Origin project.`);
      return;
    }
    
    // Check active projects limit
    if (
      user.activeProjects !== undefined && 
      user.activeProjects >= ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS
    ) {
      setError(`You have reached the maximum number of active projects (${ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS}).`);
      return;
    }
    
    // Check OBX balance for staking
    if (
      !user.walletBalance?.OBX ||
      user.walletBalance.OBX < ZORIGIN_CONSTANTS.STAKE_AMOUNT
    ) {
      setError(`Insufficient OBX tokens. You need at least ${ZORIGIN_CONSTANTS.STAKE_AMOUNT} OBX to stake for a new project.`);
      return;
    }
    
    // Set loading state
    setIsSubmitting(true);
    
    try {
      // Call the API to submit the project
      const response = await fetch('/api/zorigin/submitProject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          projectName,
          projectSymbol,
          description,
          category,
          goal
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit project');
      }
      
      const data = await response.json();
      
      // Show success message
      setSuccess('Project submitted successfully! Redirecting to dashboard...');
      
      // Redirect to dashboard after delay
      setTimeout(() => {
        router.push('/zorigin-dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting project:', err);
      setError(err.message || 'Failed to submit project');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Component for user eligibility status
  const EligibilityStatus = () => {
    if (!user) return null;
    
    const isEligible = 
      user.zScoreLevel === Z_SCORE_LEVELS.PRIME && 
      user.totalZScore && 
      user.totalZScore >= ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT &&
      (!user.activeProjects || user.activeProjects < ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS) &&
      user.walletBalance?.OBX && 
      user.walletBalance.OBX >= ZORIGIN_CONSTANTS.STAKE_AMOUNT;
    
    return (
      <div className={`p-4 rounded-lg ${isEligible ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'} mb-6`}>
        <h3 className={`text-lg font-medium ${isEligible ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'} mb-2`}>
          {isEligible ? 'You are eligible to create a Z-Origin project!' : 'Eligibility Status'}
        </h3>
        
        <ul className="space-y-1">
          <li className="flex items-start">
            <span className={`mt-0.5 mr-2 ${user.zScoreLevel === Z_SCORE_LEVELS.PRIME ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {user.zScoreLevel === Z_SCORE_LEVELS.PRIME ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={`${user.zScoreLevel === Z_SCORE_LEVELS.PRIME ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              Z-Score Level: <span className="font-medium">{user.zScoreLevel || 'Unknown'}</span>
              {user.zScoreLevel !== Z_SCORE_LEVELS.PRIME && ' (Prime level required)'}
            </span>
          </li>
          
          <li className="flex items-start">
            <span className={`mt-0.5 mr-2 ${user.totalZScore && user.totalZScore >= ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {user.totalZScore && user.totalZScore >= ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={`${user.totalZScore && user.totalZScore >= ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              Z-Score: <span className="font-medium">{user.totalZScore?.toFixed(2) || 'Unknown'}</span>
              {(!user.totalZScore || user.totalZScore < ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT) && ` (Minimum ${ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT} required)`}
            </span>
          </li>
          
          <li className="flex items-start">
            <span className={`mt-0.5 mr-2 ${!user.activeProjects || user.activeProjects < ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {!user.activeProjects || user.activeProjects < ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={`${!user.activeProjects || user.activeProjects < ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              Active Projects: <span className="font-medium">{user.activeProjects || 0}</span>
              {user.activeProjects && user.activeProjects >= ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS && ` (Maximum ${ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS} allowed)`}
            </span>
          </li>
          
          <li className="flex items-start">
            <span className={`mt-0.5 mr-2 ${user.walletBalance?.OBX && user.walletBalance.OBX >= ZORIGIN_CONSTANTS.STAKE_AMOUNT ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {user.walletBalance?.OBX && user.walletBalance.OBX >= ZORIGIN_CONSTANTS.STAKE_AMOUNT ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={`${user.walletBalance?.OBX && user.walletBalance.OBX >= ZORIGIN_CONSTANTS.STAKE_AMOUNT ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
              OBX Balance: <span className="font-medium">{user.walletBalance?.OBX?.toFixed(2) || 0}</span>
              {(!user.walletBalance?.OBX || user.walletBalance.OBX < ZORIGIN_CONSTANTS.STAKE_AMOUNT) && ` (${ZORIGIN_CONSTANTS.STAKE_AMOUNT} OBX stake required)`}
            </span>
          </li>
        </ul>
      </div>
    );
  };
  
  return (
    <div className="py-16">
      <div className="container-content">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Z-Origin Project Submission
            </h1>
            
            <Link href="/zorigin-dashboard" className="btn-secondary">
              My Projects
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent"></div>
            </div>
          ) : !user ? (
            <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
              Unable to load user data. Please try again later.
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    About Z-Origin
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Launch your own token project on the ObscuraNet platform
                  </p>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Z-Origin is a platform for launching new token projects on ObscuraNet. Prime-level users with a high Z-score can create their own ERC-20 tokens, which will be deployed on the Ethereum network after review and approval.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                    <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-2">Requirements</h3>
                    <ul className="text-blue-700 dark:text-blue-400 text-sm space-y-1 list-disc list-inside">
                      <li>Prime-level account status (Z-score of at least {ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT})</li>
                      <li>Stake of {ZORIGIN_CONSTANTS.STAKE_AMOUNT} OBX tokens per project</li>
                      <li>Maximum of {ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS} active project per user</li>
                      <li>Valid project details with a unique 3-5 letter token symbol</li>
                    </ul>
                  </div>
                  
                  <EligibilityStatus />
                  
                  {/* Success message */}
                  {success && (
                    <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6">
                      {success}
                    </div>
                  )}
                  
                  {/* Error message */}
                  {error && (
                    <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Project Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Project Name*
                        </label>
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="e.g., TrendWave"
                        />
                        {nameError && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{nameError}</p>
                        )}
                      </div>
                      
                      {/* Project Symbol */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Token Symbol* (3-5 uppercase letters)
                        </label>
                        <input
                          type="text"
                          value={projectSymbol}
                          onChange={(e) => setProjectSymbol(e.target.value.toUpperCase())}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="e.g., TRND"
                          maxLength={5}
                        />
                        {symbolError && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{symbolError}</p>
                        )}
                      </div>
                      
                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Project Category*
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select a category...</option>
                          {Object.entries(PROJECT_CATEGORIES).map(([key, value]) => (
                            <option key={key} value={key}>
                              {key.charAt(0) + key.slice(1).toLowerCase()} 
                              {/* Convert "DEFI" to "Defi", etc. */}
                            </option>
                          ))}
                        </select>
                        {categoryError && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{categoryError}</p>
                        )}
                      </div>
                      
                      {/* Supply and Stake Info */}
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">Token Details</h4>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <p>
                            <span className="font-medium">Initial Supply:</span>{' '}
                            {ZORIGIN_CONSTANTS.DEFAULT_TOKEN_SUPPLY.toLocaleString()} tokens
                          </p>
                          <p>
                            <span className="font-medium">Stake Required:</span>{' '}
                            {ZORIGIN_CONSTANTS.STAKE_AMOUNT} OBX tokens
                          </p>
                          <p>
                            <span className="font-medium">Your Balance:</span>{' '}
                            {user.walletBalance?.OBX?.toFixed(2) || 0} OBX
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Project Description* (min. 50 characters)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Describe your project in detail. What problem does it solve? Why is a token necessary? How will it work?"
                      ></textarea>
                      {descriptionError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{descriptionError}</p>
                      )}
                    </div>
                    
                    {/* Goal */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Project Goal* (min. 20 characters)
                      </label>
                      <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="What is the main goal of your project? Be specific and concise."
                      ></textarea>
                      {goalError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{goalError}</p>
                      )}
                    </div>
                    
                    {/* Disclaimer */}
                    <div className="mb-6 bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                      <p className="mb-2">
                        <strong>By submitting this form:</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>You confirm that you are staking {ZORIGIN_CONSTANTS.STAKE_AMOUNT} OBX tokens for this project</li>
                        <li>Your project will be reviewed by the ObscuraNet team before deployment</li>
                        <li>If approved, a new ERC-20 token will be created with you as the owner</li>
                        <li>You will be responsible for the proper use and distribution of your token</li>
                      </ul>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn-primary px-8"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Submitting...
                          </span>
                        ) : (
                          'Submit Project'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}