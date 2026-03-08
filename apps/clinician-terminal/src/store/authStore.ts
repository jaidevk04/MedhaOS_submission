import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens, LoginCredentials, LoginResponse } from '@/types/auth';

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresMFA: boolean;
  tempUserId: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearError: () => void;
  verifyToken: () => Promise<boolean>;
}

const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresMFA: false,
      tempUserId: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          // Attempt real login
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
          }

          const data = await response.json();
          
          // Map user data
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.name.split(' ')[0],
            lastName: data.user.name.split(' ').slice(1).join(' ') || '',
            role: data.user.role as any,
          };

          const tokens: AuthTokens = {
            accessToken: data.token,
            refreshToken: 'refresh-token-not-implemented', // If needed
          };

          set({
            user,
            tokens,
            isAuthenticated: true,
            requiresMFA: false,
            tempUserId: null,
            isLoading: false,
            error: null,
          });

          return { user, tokens, requiresMFA: false };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        // Mock logout - just clear local state
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          requiresMFA: false,
          tempUserId: null,
          error: null,
        });
      },

      refreshToken: async () => {
        // Mock token refresh - just return success
        const { user, tokens } = get();

        if (!tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        // Keep existing user and tokens (mock refresh)
        set({
          user,
          tokens,
          isAuthenticated: true,
        });
      },

      verifyToken: async () => {
        // Mock token verification - always return true if token exists
        const { tokens } = get();

        if (!tokens?.accessToken) {
          return false;
        }

        // Mock tokens are always valid
        return true;
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setTokens: (tokens: AuthTokens) => {
        set({ tokens });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
