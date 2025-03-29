'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">ObscuraNet</h1>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          {pathname === '/auth/login' && 'Sign in to your account'}
          {pathname === '/auth/signup' && 'Create a new account'}
          {pathname === '/auth/unauthorized' && 'Access Denied'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}