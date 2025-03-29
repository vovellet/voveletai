'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { isAdmin } from '@obscuranet/shared';
import LoadingScreen from '../layout/LoadingScreen';

/**
 * Higher-order component for protecting admin routes
 * Checks if user is logged in and has admin role
 */
export default function withAdminAuth(Component: React.ComponentType) {
  return function WithAdminAuth(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      // If authentication is complete and user is not an admin, redirect
      if (!loading && !isAdmin(user)) {
        router.push('/auth/unauthorized');
      }
    }, [loading, user, router]);
    
    // Show loading state while checking authentication
    if (loading) {
      return <LoadingScreen />;
    }
    
    // Show component only if user is admin
    return isAdmin(user) ? <Component {...props} /> : <LoadingScreen />;
  };
}