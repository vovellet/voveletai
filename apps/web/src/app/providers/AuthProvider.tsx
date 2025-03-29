'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { User } from '@obscuranet/shared';
import { auth, firebaseUserToUser } from '../lib/firebase';

// Authentication context interface
interface AuthContextProps {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

// Create a context with default values
const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user data
  const refreshUser = async () => {
    if (auth.currentUser) {
      const userData = await firebaseUserToUser(auth.currentUser);
      setUser(userData);
    }
  };

  // Set up auth state listener when component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userData = await firebaseUserToUser(firebaseUser);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}