'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes (tokens expire in 15 minutes)
const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

export function useSession() {
  const { isAuthenticated, refreshToken, logout, verifyToken } = useAuthStore();

  // Refresh token periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Logout will be handled by the store
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken]);

  // Handle activity timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    let activityTimeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        logout();
      }, ACTIVITY_TIMEOUT);
    };

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimeout);
    });

    // Initial timeout
    resetTimeout();

    return () => {
      clearTimeout(activityTimeout);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimeout);
      });
    };
  }, [isAuthenticated, logout]);

  // Verify token on mount
  useEffect(() => {
    if (isAuthenticated) {
      verifyToken();
    }
  }, [isAuthenticated, verifyToken]);

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return {
    handleLogout,
  };
}
