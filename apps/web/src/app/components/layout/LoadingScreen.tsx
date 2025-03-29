'use client';

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-t-primary-600 dark:border-t-primary-400 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    </div>
  );
}