/**
 * Authentication Store
 * Manages user authentication state
 */

import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  phone: string;
  abhaId?: string;
  language: string;
  profileImage?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,

  setUser: (user) => set({ user, isAuthenticated: true }),
  
  setToken: (token) => set({ token }),
  
  login: (user, token) => set({ 
    user, 
    token, 
    isAuthenticated: true,
    isLoading: false 
  }),
  
  logout: () => set({ 
    user: null, 
    token: null, 
    isAuthenticated: false 
  }),
  
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
}));
