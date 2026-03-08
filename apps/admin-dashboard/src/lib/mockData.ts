import {
  CapacityMetrics,
  PredictiveAnalytics,
  Alert,
  FinancialMetrics,
  OperationalMetrics,
  StaffMetrics,
} from '@/types';

export const mockCapacityMetrics: CapacityMetrics = {
  beds: {
    total: 400,
    occupied: 348,
    available: 52,
    occupancyRate: 87,
  },
  icuBeds: {
    total: 50,
    occupied: 46,
    available: 4,
    occupancyRate: 92,
  },
  edQueue: {
    currentPatients: 18,
    averageWaitTime: 12,
  },
  opdQueue: {
    currentPatients: 45,
    averageWaitTime: 8,
  },
  staff: {
    total: 200,
    onDuty: 188,
    utilizationRate: 94,
  },
};

export const mockPredictiveAnalytics: PredictiveAnalytics = {
  bedOccupancyForecast: [
    { timestamp: new Date().toISOString(), value: 87, confidence: 0.95 },
    { timestamp: new Date(Date.now() + 6 * 3600000).toISOString(), value: 89, confidence: 0.92 },
    { timestamp: new Date(Date.now() + 12 * 3600000).toISOString(), value: 92, confidence: 0.88 },
    { timestamp: new Date(Date.now() + 24 * 3600000).toISOString(), value: 95, confidence: 0.85 },
    { timestamp: new Date(Date.now() + 48 * 3600000).toISOString(), value: 97, confidence: 0.80 },
    { timestamp: new Date(Date.now() + 72 * 3600000).toISOString(), value: 94, confidence: 0.75 },
  ],
  icuDemandForecast: [
    { timestamp: new Date().toISOString(), value: 92, confidence: 0.95 },
    { timestamp: new Date(Date.now() + 6 * 3600000).toISOString(), value: 95, confidence: 0.90 },
    { timestamp: new Date(Date.now() + 12 * 3600000).toISOString(), value: 98, confidence: 0.85 },
    { timestamp: new Date(Date.now() + 18 * 3600000).toISOString(), value: 96, confidence: 0.82 },
    { timestamp: new Date(Date.now() + 24 * 3600000).toISOString(), value: 93, confidence: 0.80 },
  ],
  drugInventoryAlerts: [
    {
      id: '1',
      itemName: 'Clopidogrel 75mg',
      currentStock: 150,
      reorderLevel: 500,
      severity: 'warning',
      predictedStockoutDate: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
    },
    {
      id: '2',
      itemName: 'Insulin Glargine',
      currentStock: 45,
      reorderLevel: 200,
      severity: 'critical',
      predictedStockoutDate: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
    },
  ],
  bloodBankStatus: [
    { bloodGroup: 'O-', unitsAvailable: 2, criticalLevel: 10, status: 'critical' },
    { bloodGroup: 'O+', unitsAvailable: 15, criticalLevel: 20, status: 'low' },
    { bloodGroup: 'A-', unitsAvailable: 8, criticalLevel: 10, status: 'low' },
    { bloodGroup: 'A+', unitsAvailable: 25, criticalLevel: 20, status: 'adequate' },
    { bloodGroup: 'B-', unitsAvailable: 6, criticalLevel: 10, status: 'low' },
    { bloodGroup: 'B+', unitsAvailable: 22, criticalLevel: 20, status: 'adequate' },
    { bloodGroup: 'AB-', unitsAvailable: 4, criticalLevel: 5, status: 'low' },
    { bloodGroup: 'AB+', unitsAvailable: 12, criticalLevel: 10, status: 'adequate' },
  ],
};

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'ICU Capacity Critical',
    message: 'ICU capacity at 92%. Predicted to reach 98% in 6 hours.',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    actionable: true,
    actions: [
      { label: 'View Details', action: 'view_icu_details' },
      { label: 'Prepare Transfer', action: 'prepare_transfer' },
    ],
    acknowledged: false,
  },
  {
    id: '2',
    type: 'critical',
    title: 'Blood Bank Alert',
    message: 'O- blood critically low. Only 2 units remaining.',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    actionable: true,
    actions: [
      { label: 'Trigger Donor Drive', action: 'trigger_donor_drive' },
      { label: 'Request Transfer', action: 'request_transfer' },
    ],
    acknowledged: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Drug Inventory Low',
    message: 'Insulin Glargine stock below reorder level. Predicted stockout in 2 days.',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    actionable: true,
    actions: [
      { label: 'Place Order', action: 'place_order' },
      { label: 'View Alternatives', action: 'view_alternatives' },
    ],
    acknowledged: false,
  },
];

export const mockFinancialMetrics: FinancialMetrics = {
  revenueCycle: {
    totalClaims: 1250,
    submittedClaims: 1100,
    approvedClaims: 950,
    deniedClaims: 85,
    pendingClaims: 215,
    denialRate: 7.7,
  },
  accountsReceivable: {
    total: 45000000,
    current: 25000000,
    days30: 12000000,
    days60: 5000000,
    days90: 2000000,
    daysOver90: 1000000,
  },
  codingAccuracy: 92,
  averageReimbursementTime: 18,
};

export const mockOperationalMetrics: OperationalMetrics = {
  waitTimes: [
    {
      timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
      edWaitTime: 15,
      opdWaitTime: 10,
      labTurnaround: 45,
      radiologyTurnaround: 60,
    },
    {
      timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
      edWaitTime: 12,
      opdWaitTime: 8,
      labTurnaround: 42,
      radiologyTurnaround: 55,
    },
    {
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      edWaitTime: 18,
      opdWaitTime: 12,
      labTurnaround: 50,
      radiologyTurnaround: 65,
    },
    {
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      edWaitTime: 14,
      opdWaitTime: 9,
      labTurnaround: 48,
      radiologyTurnaround: 58,
    },
    {
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      edWaitTime: 16,
      opdWaitTime: 11,
      labTurnaround: 46,
      radiologyTurnaround: 62,
    },
    {
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      edWaitTime: 12,
      opdWaitTime: 8,
      labTurnaround: 44,
      radiologyTurnaround: 56,
    },
    {
      timestamp: new Date().toISOString(),
      edWaitTime: 12,
      opdWaitTime: 8,
      labTurnaround: 43,
      radiologyTurnaround: 54,
    },
  ],
  patientSatisfaction: {
    score: 4.3,
    trend: 'up',
    responses: 1250,
  },
  bottlenecks: [
    {
      id: '1',
      area: 'Radiology Department',
      severity: 'high',
      description: 'Average turnaround time 25% above target',
      impact: 'Delaying ED discharge decisions',
    },
    {
      id: '2',
      area: 'Pharmacy',
      severity: 'medium',
      description: 'Medication dispensing delays during peak hours',
      impact: 'Increased patient wait times',
    },
  ],
  optimizationRecommendations: [
    {
      id: '1',
      category: 'Workflow',
      title: 'Implement parallel processing for lab orders',
      description: 'Process routine and urgent labs simultaneously to reduce turnaround time',
      expectedImpact: '15% reduction in lab turnaround time',
      priority: 'high',
    },
    {
      id: '2',
      category: 'Staffing',
      title: 'Add radiology technician during peak hours',
      description: 'Schedule additional technician from 2 PM - 8 PM',
      expectedImpact: '20% reduction in radiology wait times',
      priority: 'medium',
    },
  ],
};

export const mockStaffMetrics: StaffMetrics = {
  shiftCoverage: [
    {
      shift: 'morning',
      department: 'Emergency',
      required: 15,
      scheduled: 15,
      actual: 14,
      coverageRate: 93,
    },
    {
      shift: 'afternoon',
      department: 'Emergency',
      required: 18,
      scheduled: 18,
      actual: 18,
      coverageRate: 100,
    },
    {
      shift: 'night',
      department: 'Emergency',
      required: 12,
      scheduled: 12,
      actual: 11,
      coverageRate: 92,
    },
  ],
  burnoutRisk: [
    {
      staffId: 'N001',
      staffName: 'Priya Sharma',
      department: 'ICU',
      riskLevel: 'high',
      factors: ['7 consecutive days', '15 hours overtime this week'],
      consecutiveDays: 7,
      overtimeHours: 15,
    },
    {
      staffId: 'N002',
      staffName: 'Rajesh Kumar',
      department: 'Emergency',
      riskLevel: 'medium',
      factors: ['5 consecutive days', '8 hours overtime this week'],
      consecutiveDays: 5,
      overtimeHours: 8,
    },
  ],
  overtimeTracking: [
    {
      department: 'Emergency',
      totalHours: 120,
      averagePerStaff: 6.7,
      trend: 'increasing',
    },
    {
      department: 'ICU',
      totalHours: 95,
      averagePerStaff: 7.9,
      trend: 'stable',
    },
  ],
  scheduleOptimizations: [
    {
      id: '1',
      department: 'Emergency',
      suggestion: 'Shift 2 nurses from morning to afternoon shift',
      expectedBenefit: 'Better coverage during peak hours (2-6 PM)',
      implementationEffort: 'low',
    },
    {
      id: '2',
      department: 'ICU',
      suggestion: 'Hire 2 additional float nurses',
      expectedBenefit: 'Reduce burnout risk and overtime costs',
      implementationEffort: 'high',
    },
  ],
};
