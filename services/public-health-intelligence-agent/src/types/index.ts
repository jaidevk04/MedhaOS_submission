// Regional Disease Prediction Types
export interface SyndromicData {
  district: string;
  state: string;
  timestamp: Date;
  symptomType: string;
  caseCount: number;
  populationDensity: number;
  ageDistribution: {
    '0-5': number;
    '6-18': number;
    '19-45': number;
    '46-65': number;
    '65+': number;
  };
}

export interface ClimateData {
  district: string;
  state: string;
  timestamp: Date;
  temperature: number; // Celsius
  rainfall: number; // mm
  humidity: number; // percentage
  windSpeed: number; // km/h
  pressure: number; // hPa
}

export interface DiseasePrediction {
  predictionId: string;
  district: string;
  state: string;
  diseaseType: string;
  predictionTimestamp: Date;
  forecastHorizon: number; // days
  predictions: Array<{
    date: Date;
    outbreakProbability: number;
    expectedCases: number;
    confidence: number;
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: {
    syndromic: number; // 0-1
    climate: number; // 0-1
    historical: number; // 0-1
    mobility: number; // 0-1
  };
  recommendations: string[];
  modelVersion: string;
}

export interface OutbreakAlert {
  alertId: string;
  district: string;
  state: string;
  diseaseType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  outbreakProbability: number;
  predictedCases: number;
  predictedDate: Date;
  affectedPopulation: number;
  recommendations: string[];
  rrtActivationRequired: boolean;
  createdAt: Date;
}

// Infection Surveillance Types
export interface PatientSymptom {
  patientId: string;
  facilityId: string;
  wardId: string;
  timestamp: Date;
  symptoms: string[];
  temperature: number;
  labConfirmed: boolean;
  infectionType?: string;
  location: {
    building: string;
    floor: string;
    room: string;
  };
}

export interface InfectionCluster {
  clusterId: string;
  facilityId: string;
  wardId?: string;
  detectionTimestamp: Date;
  infectionType: string;
  caseCount: number;
  patients: string[];
  timeWindow: {
    start: Date;
    end: Date;
  };
  spatialPattern: {
    centroid: { x: number; y: number };
    radius: number;
    density: number;
  };
  clusterScore: number; // 0-1
  isHAI: boolean; // Healthcare-Associated Infection
  transmissionPattern: 'person-to-person' | 'environmental' | 'device-related' | 'unknown';
  sourceIdentification: {
    likelySource: string;
    confidence: number;
    evidence: string[];
  };
}

export interface InfectionAlert {
  alertId: string;
  facilityId: string;
  alertType: 'cluster_detected' | 'hai_outbreak' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  infectionType: string;
  affectedCount: number;
  detectionTime: Date;
  location: string;
  recommendations: string[];
  isolationRequired: boolean;
  contactTracingRequired: boolean;
  environmentalSamplingRequired: boolean;
}

// Media Scanning Types
export interface MediaEvent {
  eventId: string;
  source: 'news' | 'twitter' | 'facebook' | 'telegram' | 'whatsapp';
  sourceUrl: string;
  timestamp: Date;
  language: string;
  originalText: string;
  translatedText: string;
  location: {
    district?: string;
    state?: string;
    coordinates?: { lat: number; lon: number };
  };
  diseaseKeywords: string[];
  symptomKeywords: string[];
  severity: 'low' | 'medium' | 'high';
  isBotGenerated: boolean;
  botConfidence: number;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'false';
  relatedEvents: string[];
}

export interface MediaScanningResult {
  scanId: string;
  scanTimestamp: Date;
  timeRange: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  verifiedEvents: number;
  botFilteredEvents: number;
  languageDistribution: Record<string, number>;
  diseaseDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  priorityEvents: MediaEvent[];
}

// Public Health Dashboard Types
export interface HeatmapData {
  district: string;
  state: string;
  coordinates: { lat: number; lon: number };
  riskLevel: number; // 0-1
  caseCount: number;
  outbreakProbability: number;
  lastUpdated: Date;
  dataLayers: {
    syndromic: number;
    labConfirmed: number;
    environmental: number;
    mobility: number;
  };
}

export interface OutbreakTimeline {
  timelineId: string;
  diseaseType: string;
  district: string;
  state: string;
  events: Array<{
    date: Date;
    eventType: 'first_case' | 'cluster_detected' | 'outbreak_declared' | 'peak' | 'declining' | 'resolved';
    caseCount: number;
    description: string;
  }>;
  status: 'active' | 'monitoring' | 'resolved';
  totalCases: number;
  deaths: number;
  recoveries: number;
  startDate: Date;
  endDate?: Date;
}

export interface ResourceAllocation {
  allocationId: string;
  district: string;
  state: string;
  resourceType: 'rrt_team' | 'medical_supplies' | 'vaccines' | 'testing_kits' | 'ambulances';
  quantity: number;
  allocatedDate: Date;
  deploymentStatus: 'planned' | 'in_transit' | 'deployed' | 'completed';
  targetFacilities: string[];
  estimatedArrival?: Date;
  actualArrival?: Date;
}

export interface RRTActivation {
  activationId: string;
  district: string;
  state: string;
  diseaseType: string;
  activationDate: Date;
  teamMembers: Array<{
    name: string;
    role: string;
    contactNumber: string;
  }>;
  objectives: string[];
  status: 'activated' | 'deployed' | 'investigating' | 'completed';
  findings?: string[];
  recommendations?: string[];
  completionDate?: Date;
}

export interface PublicHealthMetrics {
  timestamp: Date;
  totalActiveOutbreaks: number;
  districtsAtRisk: number;
  totalCases: number;
  totalDeaths: number;
  rrtDeployments: number;
  averageResponseTime: number; // hours
  predictionAccuracy: number; // 0-1
  earlyWarningLeadTime: number; // days
}

// ML Model Types
export interface LSTMModelInput {
  sequenceData: number[][]; // Time series data
  features: number; // Number of features per timestep
  timesteps: number; // Length of sequence
}

export interface AttentionWeights {
  timestep: number;
  weight: number;
  feature: string;
}

export interface ModelPrediction {
  prediction: number[];
  confidence: number;
  attentionWeights?: AttentionWeights[];
  modelVersion: string;
  inferenceTime: number; // milliseconds
}

// DBSCAN Clustering Types
export interface DBSCANParams {
  epsilon: number; // Maximum distance between two samples
  minSamples: number; // Minimum number of samples in a neighborhood
  metric: 'euclidean' | 'manhattan' | 'haversine';
}

export interface ClusterPoint {
  id: string;
  coordinates: number[];
  timestamp: Date;
  metadata: Record<string, any>;
  clusterId: number; // -1 for noise
}
