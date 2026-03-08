export interface BedOccupancyData {
  facilityId: string;
  timestamp: Date;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  bedType: 'general' | 'icu' | 'emergency' | 'maternity' | 'pediatric';
  wardId?: string;
}

export interface BedOccupancyPrediction {
  facilityId: string;
  predictionTimestamp: Date;
  forecastHorizon: number; // hours
  predictions: Array<{
    timestamp: Date;
    predictedOccupancy: number;
    predictedAvailable: number;
    confidence: number;
  }>;
  bedType: string;
  modelVersion: string;
}

export interface ICUAdmissionData {
  facilityId: string;
  timestamp: Date;
  totalICUBeds: number;
  occupiedICUBeds: number;
  availableICUBeds: number;
  icuUtilization: number;
  admissionsLast24h: number;
  dischargesLast24h: number;
  averageStayDays: number;
  criticalPatients: number;
}

export interface ICUDemandPrediction {
  facilityId: string;
  predictionTimestamp: Date;
  forecastHorizon: number; // hours
  predictions: Array<{
    timestamp: Date;
    predictedDemand: number;
    predictedUtilization: number;
    confidence: number;
  }>;
  alertLevel: 'normal' | 'warning' | 'critical';
  recommendedActions: string[];
  modelVersion: string;
}

export interface StaffMember {
  staffId: string;
  name: string;
  role: 'nurse' | 'doctor' | 'technician' | 'support';
  specialization?: string;
  experienceYears: number;
  skillLevel: 'junior' | 'mid' | 'senior' | 'expert';
  availability: {
    dayOfWeek: number; // 0-6
    startTime: string; // HH:mm
    endTime: string; // HH:mm
  }[];
  maxHoursPerWeek: number;
  currentHoursThisWeek: number;
  preferredShifts?: ('morning' | 'afternoon' | 'night')[];
}

export interface ShiftRequirement {
  facilityId: string;
  date: Date;
  shift: 'morning' | 'afternoon' | 'night';
  role: string;
  requiredCount: number;
  minSkillLevel: 'junior' | 'mid' | 'senior' | 'expert';
  patientAcuity: 'low' | 'medium' | 'high';
}

export interface ShiftAssignment {
  assignmentId: string;
  staffId: string;
  facilityId: string;
  date: Date;
  shift: 'morning' | 'afternoon' | 'night';
  startTime: string;
  endTime: string;
  assignedPatients?: string[];
  workloadScore: number;
}

export interface StaffSchedule {
  facilityId: string;
  weekStartDate: Date;
  assignments: ShiftAssignment[];
  coverageScore: number; // 0-1, how well requirements are met
  fairnessScore: number; // 0-1, how evenly distributed workload is
  burnoutRisks: Array<{
    staffId: string;
    riskLevel: number; // 0-1
    factors: string[];
    recommendations: string[];
  }>;
}

export interface WorkflowEvent {
  eventId: string;
  facilityId: string;
  timestamp: Date;
  processName: string;
  stepName: string;
  duration: number; // milliseconds
  staffInvolved: string[];
  resourcesUsed: string[];
  outcome: 'success' | 'failure' | 'delayed';
  metadata?: Record<string, any>;
}

export interface WorkflowBottleneck {
  processName: string;
  stepName: string;
  facilityId: string;
  averageDuration: number;
  p95Duration: number;
  frequency: number;
  impactScore: number; // 0-100
  rootCauses: string[];
  recommendations: string[];
}

export interface CapacityAlert {
  alertId: string;
  facilityId: string;
  alertType: 'bed_shortage' | 'icu_critical' | 'staff_shortage' | 'workflow_bottleneck';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  predictedTime: Date;
  currentValue: number;
  thresholdValue: number;
  recommendations: string[];
  createdAt: Date;
}

export interface OperationalMetrics {
  facilityId: string;
  timestamp: Date;
  bedOccupancyRate: number;
  icuUtilization: number;
  averageWaitTime: number;
  staffUtilization: number;
  patientThroughput: number;
  bottleneckCount: number;
}
