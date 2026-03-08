// Dashboard Data Types

export interface CapacityMetrics {
  beds: {
    total: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  };
  icuBeds: {
    total: number;
    occupied: number;
    available: number;
    occupancyRate: number;
  };
  edQueue: {
    currentPatients: number;
    averageWaitTime: number;
  };
  opdQueue: {
    currentPatients: number;
    averageWaitTime: number;
  };
  staff: {
    total: number;
    onDuty: number;
    utilizationRate: number;
  };
}

export interface PredictiveAnalytics {
  bedOccupancyForecast: ForecastData[];
  icuDemandForecast: ForecastData[];
  drugInventoryAlerts: InventoryAlert[];
  bloodBankStatus: BloodBankStatus[];
}

export interface ForecastData {
  timestamp: string;
  value: number;
  confidence: number;
}

export interface InventoryAlert {
  id: string;
  itemName: string;
  currentStock: number;
  reorderLevel: number;
  severity: 'critical' | 'warning' | 'info';
  predictedStockoutDate: string;
}

export interface BloodBankStatus {
  bloodGroup: string;
  unitsAvailable: number;
  criticalLevel: number;
  status: 'critical' | 'low' | 'adequate';
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  actionable: boolean;
  actions?: AlertAction[];
  acknowledged: boolean;
}

export interface AlertAction {
  label: string;
  action: string;
}

export interface FinancialMetrics {
  revenueCycle: {
    totalClaims: number;
    submittedClaims: number;
    approvedClaims: number;
    deniedClaims: number;
    pendingClaims: number;
    denialRate: number;
  };
  accountsReceivable: {
    total: number;
    current: number;
    days30: number;
    days60: number;
    days90: number;
    daysOver90: number;
  };
  codingAccuracy: number;
  averageReimbursementTime: number;
}

export interface OperationalMetrics {
  waitTimes: WaitTimeData[];
  patientSatisfaction: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    responses: number;
  };
  bottlenecks: Bottleneck[];
  optimizationRecommendations: Recommendation[];
}

export interface WaitTimeData {
  timestamp: string;
  edWaitTime: number;
  opdWaitTime: number;
  labTurnaround: number;
  radiologyTurnaround: number;
}

export interface Bottleneck {
  id: string;
  area: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
}

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
}

export interface StaffMetrics {
  shiftCoverage: ShiftCoverage[];
  burnoutRisk: BurnoutRisk[];
  overtimeTracking: OvertimeData[];
  scheduleOptimizations: ScheduleOptimization[];
}

export interface ShiftCoverage {
  shift: 'morning' | 'afternoon' | 'night';
  department: string;
  required: number;
  scheduled: number;
  actual: number;
  coverageRate: number;
}

export interface BurnoutRisk {
  staffId: string;
  staffName: string;
  department: string;
  riskLevel: 'high' | 'medium' | 'low';
  factors: string[];
  consecutiveDays: number;
  overtimeHours: number;
}

export interface OvertimeData {
  department: string;
  totalHours: number;
  averagePerStaff: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ScheduleOptimization {
  id: string;
  department: string;
  suggestion: string;
  expectedBenefit: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'capacity_update' | 'alert' | 'forecast_update' | 'metrics_update';
  data: any;
  timestamp: string;
}

// Filter and Time Range Types
export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface DashboardFilters {
  facility?: string;
  department?: string;
  timeRange: TimeRange;
}
