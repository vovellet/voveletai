'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PROJECT_STATUS, 
  PROJECT_CATEGORIES,
  ProjectSubmission
} from '@obscuranet/shared';

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case PROJECT_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case PROJECT_STATUS.REVIEWING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case PROJECT_STATUS.APPROVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case PROJECT_STATUS.DEPLOYED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case PROJECT_STATUS.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <span className={`${getStatusColor()} px-2.5 py-0.5 rounded-full text-xs font-medium`}>
      {status}
    </span>
  );
}

// Project score component
function ProjectScore({ evaluation }: { evaluation?: any }) {
  if (!evaluation) return null;
  
  const { feasibilityScore, originalityScore, clarityScore, overallScore } = evaluation;
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500 dark:text-green-400';
    if (score >= 6) return 'text-blue-500 dark:text-blue-400';
    return 'text-yellow-500 dark:text-yellow-400';
  };
  
  return (
    <div className="grid grid-cols-4 gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-4">
      <div className="text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Feasibility</div>
        <div className={`text-lg font-bold ${getScoreColor(feasibilityScore)}`}>
          {feasibilityScore.toFixed(1)}
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Originality</div>
        <div className={`text-lg font-bold ${getScoreColor(originalityScore)}`}>
          {originalityScore.toFixed(1)}
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Clarity</div>
        <div className={`text-lg font-bold ${getScoreColor(clarityScore)}`}>
          {clarityScore.toFixed(1)}
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Overall</div>
        <div className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
          {overallScore.toFixed(1)}
        </div>
      </div>
    </div>
  );
}

// Project card component
function ProjectCard({ project }: { project: any }) {
  const [showFeedback, setShowFeedback] = useState(false);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {project.name} ({project.symbol})
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {Object.entries(PROJECT_CATEGORIES).find(([key]) => key === project.category)?.[0] || project.category}
              {' · '}Created on {formatDate(project.createdAt)}
            </div>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </div>
      
      <div className="p-6">
        <div className="text-gray-700 dark:text-gray-300 mb-4">
          <p className="mb-2">{project.description}</p>
          <p className="font-medium">Goal: {project.goal}</p>
        </div>
        
        {project.evaluation && (
          <div className="mb-4">
            <ProjectScore evaluation={project.evaluation} />
            
            <div className="mt-3">
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="text-primary-600 dark:text-primary-400 text-sm font-medium flex items-center"
              >
                {showFeedback ? 'Hide Feedback' : 'Show Feedback'}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ml-1 transition-transform ${showFeedback ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showFeedback && (
                <div className="mt-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-gray-700 dark:text-gray-300 text-sm">
                  <div dangerouslySetInnerHTML={{ __html: project.evaluation.feedback.replace(/\n/g, '<br>') }} />
                </div>
              )}
            </div>
          </div>
        )}
        
        {project.status === PROJECT_STATUS.DEPLOYED && project.contractAddress && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-4">
            <h3 className="text-purple-800 dark:text-purple-300 font-medium mb-2">
              Token Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Contract Address:</span>
                <span className="text-purple-700 dark:text-purple-300 font-mono">{`${project.contractAddress.substring(0, 6)}...${project.contractAddress.substring(project.contractAddress.length - 4)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Supply:</span>
                <span className="text-gray-800 dark:text-gray-200">{project.tokenSupply.toLocaleString()} {project.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Network:</span>
                <span className="text-gray-800 dark:text-gray-200 capitalize">{project.network || 'Goerli'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Deployed:</span>
                <span className="text-gray-800 dark:text-gray-200">{formatDate(project.deployedAt)}</span>
              </div>
            </div>
            
            <div className="mt-4">
              <a 
                href={`https://goerli.etherscan.io/address/${project.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-2 text-center text-sm"
              >
                View on Etherscan
              </a>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {[PROJECT_STATUS.PENDING, PROJECT_STATUS.REVIEWING].includes(project.status) && (
            <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-1">
                Under Review
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Your project is being reviewed by our team. This process typically takes 1-3 business days.
              </p>
            </div>
          )}
          
          {project.status === PROJECT_STATUS.REJECTED && (
            <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <h3 className="text-red-800 dark:text-red-300 font-medium mb-1">
                Project Rejected
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {project.rejectionReason || 'Your project was rejected. Please see feedback above for details.'}
              </p>
            </div>
          )}
          
          {project.status === PROJECT_STATUS.APPROVED && (
            <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="text-green-800 dark:text-green-300 font-medium mb-1">
                Approved - Pending Deployment
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Your project has been approved! Token deployment is in progress and should be completed soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ZOriginDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        // Call our API endpoint to get project data
        const response = await fetch('/api/zorigin/userProjects?userId=test-user-id');
        
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }
        
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error('Failed to fetch project data:', err);
        setError('Failed to load your projects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return (
    <div className="py-16">
      <div className="container-content">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Z-Origin Dashboard
            </h1>
            
            <Link href="/zorigin" className="btn-primary">
              New Project
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
          ) : projects.length > 0 ? (
            <>
              {/* Project list */}
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Projects Yet
              </h2>
              
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                You haven't created any Z-Origin projects yet. Get started by creating your first project!
              </p>
              
              <Link href="/zorigin" className="btn-primary">
                Create Your First Project
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}