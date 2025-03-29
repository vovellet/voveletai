import { User, UserRole } from './types';

/**
 * Firebase Authentication helpers for ObscuraNet
 * This file contains utilities for working with user authentication and roles
 */

/**
 * Determine if a user has admin privileges
 * @param user The user object from Firebase Auth
 * @returns boolean indicating if user has admin role
 */
export const isAdmin = (user: User | null): boolean => {
  if (!user) return false;
  return user.role === 'admin';
};

/**
 * Check if a user has a specific role
 * @param user The user object from Firebase Auth
 * @param role The role to check for
 * @returns boolean indicating if user has the specified role
 */
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * Options for role-based route protection
 */
export interface RouteProtectionOptions {
  requiredRole?: UserRole;
  requiredZScore?: number;
  redirectUrl?: string;
}

/**
 * Default protection options
 */
export const defaultProtectionOptions: RouteProtectionOptions = {
  redirectUrl: '/auth/login'
};

/**
 * Admin route protection options
 */
export const adminProtectionOptions: RouteProtectionOptions = {
  requiredRole: 'admin',
  redirectUrl: '/auth/unauthorized'
};