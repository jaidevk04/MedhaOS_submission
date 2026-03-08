/**
 * Application Store
 * Manages global app state
 */

import { create } from 'zustand';

interface AppState {
  language: string;
  isOnline: boolean;
  notifications: Notification[];
  
  // Actions
  setLanguage: (language: string) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'en',
  isOnline: true,
  notifications: [],

  setLanguage: (language) => set({ language }),
  
  setOnlineStatus: (isOnline) => set({ isOnline }),
  
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  
  clearNotifications: () => set({ notifications: [] }),
}));
