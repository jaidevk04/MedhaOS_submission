import { create } from 'zustand';
import {
  CapacityMetrics,
  PredictiveAnalytics,
  Alert,
  FinancialMetrics,
  OperationalMetrics,
  StaffMetrics,
  DashboardFilters,
} from '@/types';

interface DashboardState {
  // Data
  capacityMetrics: CapacityMetrics | null;
  predictiveAnalytics: PredictiveAnalytics | null;
  alerts: Alert[];
  financialMetrics: FinancialMetrics | null;
  operationalMetrics: OperationalMetrics | null;
  staffMetrics: StaffMetrics | null;

  // UI State
  filters: DashboardFilters;
  isConnected: boolean;
  lastUpdated: Date | null;
  loading: boolean;

  // Actions
  setCapacityMetrics: (metrics: CapacityMetrics) => void;
  setPredictiveAnalytics: (analytics: PredictiveAnalytics) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
  setFinancialMetrics: (metrics: FinancialMetrics) => void;
  setOperationalMetrics: (metrics: OperationalMetrics) => void;
  setStaffMetrics: (metrics: StaffMetrics) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  updateLastUpdated: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial State
  capacityMetrics: null,
  predictiveAnalytics: null,
  alerts: [],
  financialMetrics: null,
  operationalMetrics: null,
  staffMetrics: null,
  filters: {
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Last 24 hours',
    },
  },
  isConnected: false,
  lastUpdated: null,
  loading: true,

  // Actions
  setCapacityMetrics: (metrics) =>
    set({ capacityMetrics: metrics, lastUpdated: new Date() }),

  setPredictiveAnalytics: (analytics) =>
    set({ predictiveAnalytics: analytics, lastUpdated: new Date() }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50), // Keep last 50 alerts
      lastUpdated: new Date(),
    })),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ),
    })),

  setFinancialMetrics: (metrics) =>
    set({ financialMetrics: metrics, lastUpdated: new Date() }),

  setOperationalMetrics: (metrics) =>
    set({ operationalMetrics: metrics, lastUpdated: new Date() }),

  setStaffMetrics: (metrics) =>
    set({ staffMetrics: metrics, lastUpdated: new Date() }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setConnected: (connected) => set({ isConnected: connected }),

  setLoading: (loading) => set({ loading }),

  updateLastUpdated: () => set({ lastUpdated: new Date() }),
}));
