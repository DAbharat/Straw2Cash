import React, { useEffect } from 'react';
import { useAuth } from '../lib/context/AuthContext';

/**
 * Guest-only authentication routes that should not be accessible
 * by users who are already logged in.
 */
export const GUEST_ONLY_ROUTES: string[] = [
  '/login',
  '/signin',
  '/sign-in',
  '/register',
  '/signup',
  '/sign-up',
];

/**
 * Protected routes that require authentication.
 */
export const PROTECTED_ROUTES: string[] = [
  '/dashboard',
  '/baler/dashboard',
  '/profile',
  '/farmer/listings/new',
  '/buyer/requirements/new',
];

/**
 * Checks if a given path matches any guest-only route.
 */
export const isGuestOnlyRoute = (path: string): boolean => {
  const normalized = path.split('?')[0].toLowerCase();
  return GUEST_ONLY_ROUTES.some((route) => normalized === route);
};

/**
 * Checks if a given path matches any protected route.
 */
export const isProtectedRoute = (path: string): boolean => {
  const normalized = path.split('?')[0].toLowerCase();
  return PROTECTED_ROUTES.some((route) => normalized === route || normalized.startsWith(`${route}/`));
};

/**
 * Core middleware evaluation function.
 * Evaluates route access rules based on authentication status.
 *
 * Rules:
 * 1. Authenticated users cannot access sign-in (/login) and register (/register) pages.
 *    If an authenticated user visits a guest route, redirect to /dashboard.
 * 2. Unauthenticated users cannot access protected routes.
 *    If an unauthenticated user visits a protected route, redirect to /login.
 */
export const runAuthMiddleware = (
  currentPath: string,
  isAuthenticated: boolean,
  options?: {
    authenticatedRedirect?: string;
    unauthenticatedRedirect?: string;
  }
): { shouldRedirect: boolean; redirectPath?: string } => {
  const authRedirect = options?.authenticatedRedirect || '/dashboard';
  const unauthRedirect = options?.unauthenticatedRedirect || '/login';

  // Rule 1: Authenticated user attempting to access guest-only routes (login/register)
  if (isAuthenticated && isGuestOnlyRoute(currentPath)) {
    return {
      shouldRedirect: true,
      redirectPath: authRedirect,
    };
  }

  // Rule 2: Unauthenticated user attempting to access protected routes
  if (!isAuthenticated && isProtectedRoute(currentPath)) {
    return {
      shouldRedirect: true,
      redirectPath: unauthRedirect,
    };
  }

  return {
    shouldRedirect: false,
  };
};

/**
 * GuestRoute wrapper component.
 * Ensures authenticated users cannot access guest-only pages like sign-in and register.
 */
export interface GuestRouteProps {
  onNavigate: (path: string) => void;
  children: React.ReactNode;
  redirectTo?: string;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({
  onNavigate,
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      onNavigate(redirectTo);
    }
  }, [isAuthenticated, onNavigate, redirectTo]);

  if (isAuthenticated) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-white/70 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E5A812] animate-ping" />
          <span>Already authenticated. Redirecting to dashboard...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * AuthMiddleware component.
 * Intercepts route rendering and guards navigation across the entire application.
 */
export interface AuthMiddlewareProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({
  currentPath,
  onNavigate,
  children,
}) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const decision = runAuthMiddleware(currentPath, isAuthenticated);
    if (decision.shouldRedirect && decision.redirectPath) {
      onNavigate(decision.redirectPath);
    }
  }, [currentPath, isAuthenticated, onNavigate]);

  const decision = runAuthMiddleware(currentPath, isAuthenticated);
  if (decision.shouldRedirect) {
    return null;
  }

  return <>{children}</>;
};
