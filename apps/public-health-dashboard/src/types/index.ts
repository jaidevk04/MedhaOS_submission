// Disease and outbreak types
export interface DiseaseData {
  id: string;
  district: string;
  state: string;
  diseaseType: string;
  caseCount: number;
  syndromeIndicators: string[];
  labConfirmed: boolean;
  outbreakProbability: number;
  predictionHorizonDays: number;
  environmentalFactors: {
    temperature: number;
    rainfall: number;
    humidity: number;
  };
  detectedAt: string;
  coordinates: [number, number]; // [longitude, latitude]
}

// Risk levels for heatmap visualization
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface DistrictRiskData {
  districtId: string;
  districtName: string;
  state: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  activeCases: number;
  coordinates: [number, number];
  diseases: string[];
}

// Map layer types
export type MapLayerType = 'syndromic' | 'lab' | 'environmental' | 'mobility';

export interface MapLayer {
  id: MapLayerType;
  name: string;
  enabled: boolean;
  opacity: number;
}

// Outbreak alert types
export interface OutbreakAlert {
  id: string;
  district: string;
  state: string;
  diseaseType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  outbreakProbability: number;
  syndromeIndicators: string[];
  environmentalFactors: {
    temperature: number;
    rainfall: number;
    humidity: number;
  };
  labConfirmation: {
    confirmed: boolean;
    pendingTests: number;
    confirmedCases: number;
  };
  predictedCases: number;
  currentCases: number;
  rrtActivated: boolean;
  createdAt: string;
  updatedAt: string;
}

// Outbreak timeline types
export type OutbreakStatus = 'active' | 'resolved' | 'monitoring';

export interface OutbreakEvent {
  id: string;
  diseaseType: string;
  district: string;
  state: string;
  status: OutbreakStatus;
  startDate: string;
  endDate?: string;
  peakCases: number;
  totalCases: number;
  deaths: number;
  interventions: string[];
  timeline: {
    date: string;
    event: string;
    cases: number;
  }[];
}

// Resource allocation types
export interface RRTDeployment {
  id: string;
  teamId: string;
  teamName: string;
  district: string;
  state: string;
  status: 'deployed' | 'standby' | 'returning';
  deployedAt: string;
  members: number;
  equipment: string[];
}

export interface MedicalSupply {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  requiredStock: number;
  unit: string;
  location: string;
  expiryDate?: string;
}

export interface HospitalCapacity {
  hospitalId: string;
  hospitalName: string;
  district: string;
  state: string;
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  availableIcuBeds: number;
  ventilators: number;
  availableVentilators: number;
  isolationBeds: number;
  availableIsolationBeds: number;
  coordinates: [number, number];
}

export interface ResourceGap {
  id: string;
  type: 'rrt' | 'supplies' | 'capacity';
  district: string;
  state: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  requiredResources: string[];
  estimatedCost?: number;
  priority: number;
}

// Syndromic trends types
export interface SyndromicTrend {
  date: string;
  syndrome: string;
  cases: number;
  baseline: number;
  threshold: number;
}

export interface TrendData {
  syndrome: string;
  color: string;
  data: {
    date: string;
    value: number;
  }[];
}

// Media scanning types
export interface MediaEvent {
  id: string;
  source: string;
  language: string;
  title: string;
  content: string;
  location: {
    district: string;
    state: string;
  };
  diseaseKeywords: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  verified: boolean;
  botDetected: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  publishedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

// Public awareness campaign types
export interface Campaign {
  id: string;
  name: string;
  diseaseType: string;
  targetRegions: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  channels: ('sms' | 'whatsapp' | 'social' | 'radio' | 'tv')[];
  messageTemplates: {
    language: string;
    content: string;
  }[];
  reach: {
    total: number;
    delivered: number;
    read: number;
    engaged: number;
  };
  budget: number;
  spent: number;
}

// Dashboard state types
export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  states: string[];
  districts: string[];
  diseases: string[];
  riskLevels: RiskLevel[];
}

// WebSocket message types
export interface WSMessage {
  type: 'outbreak_alert' | 'capacity_update' | 'rrt_deployment' | 'media_event';
  data: any;
  timestamp: string;
}
