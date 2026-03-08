import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          // Mock authentication for demo
          // Valid credentials: nurse@medhaos.com / nurse123
          const validUsers = {
            'nurse@medhaos.com': { password: 'nurse123', name: 'Nurse Patel', role: 'nurse' },
            'nurse2@medhaos.com': { password: 'nurse123', name: 'Nurse Kumar', role: 'nurse' },
          };

          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

          const user = validUsers[email as keyof typeof validUsers];
          
          if (!user || user.password !== password) {
            throw new Error('Invalid email or password');
          }

          const mockUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: email,
            name: user.name,
            role: user.role,
          };

          const mockToken = 'mock-token-' + Math.random().toString(36).substr(2, 9);

          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'nurse-auth-storage',
    }
  )
);
