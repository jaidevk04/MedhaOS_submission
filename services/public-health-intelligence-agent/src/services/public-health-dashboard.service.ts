import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';
import { config } from '../config';
import {
  HeatmapData,
  OutbreakTimeline,
  ResourceAllocation,
  RRTActivation,
  PublicHealthMetrics,
  DiseasePrediction,
  InfectionCluster,
} from '../types';

/**
 * Public Health Dashboard Service
 * 
 * Aggregates data for public health visualization
 * Manages outbreak timelines and resource allocation
 * Handles RRT (Rapid Response Team) activation workflow
 * 
 * Requirements: 11.4, 11.5
 */
export class PublicHealthDashboardService {
  private readonly rrtThreshold = config.alerts.rrtActivationThreshold;

  /**
   * Generate heatmap data for disease risk visualization
   */
  async generateHeatmapData(
    state: string,
    diseaseType: string,
    predictions: DiseasePrediction[]
  ): Promise<HeatmapData[]> {
    const heatmapData: HeatmapData[] = [];
    
    // Indian district coordinates (sample data)
    const districtCoordinates: Record<string, { lat: number; lon: number }> = {
      'Mumbai': { lat: 19.0760, lon: 72.8777 },
      'Pune': { lat: 18.5204, lon: 73.8567 },
      'Bangalore': { lat: 12.9716, lon: 77.5946 },
      'Chennai': { lat: 13.0827, lon: 80.2707 },
      'Delhi': { lat: 28.7041, lon: 77.1025 },
      'Kolkata': { lat: 22.5726, lon: 88.3639 },
      'Hyderabad': { lat: 17.3850, lon: 78.4867 },
    };
    
    for (const prediction of predictions) {
      // Get latest prediction
      const latestPrediction = prediction.predictions[prediction.predictions.length - 1];
      
      // Calculate risk level (0-1)
      const riskLevel = latestPrediction.outbreakProbability;
      
      // Get coordinates
      const coordinates = districtCoordinates[prediction.district] || { lat: 0, lon: 0 };
      
      // Calculate data layers
      const dataLayers = {
        syndromic: prediction.contributingFactors.syndromic,
        labConfirmed: 0.5, // Would come from actual lab data
        environmental: prediction.contributingFactors.climate,
        mobility: prediction.contributingFactors.mobility,
      };
      
      heatmapData.push({
        district: prediction.district,
        state: prediction.state,
        coordinates,
        riskLevel,
        caseCount: latestPrediction.expectedCases,
        outbreakProbability: latestPrediction.outbreakProbability,
        lastUpdated: new Date(),
        dataLayers,
      });
    }
    
    return heatmapData;
  }

  /**
   * Create outbreak timeline
   */
  async createOutbreakTimeline(
    diseaseType: string,
    district: string,
    state: string,
    startDate: Date
  ): Promise<OutbreakTimeline> {
    const timelineId = uuidv4();
    
    // In production, fetch actual outbreak data from database
    // For now, create mock timeline
    const events = [
      {
        date: startDate,
        eventType: 'first_case' as const,
        caseCount: 1,
        description: 'First confirmed case reported',
      },
      {
        date: addDays(startDate, 3),
        eventType: 'cluster_detected' as const,
        caseCount: 5,
        description: 'Cluster of 5 cases detected in same locality',
      },
      {
        date: addDays(startDate, 7),
        eventType: 'outbreak_declared' as const,
        caseCount: 15,
        description: 'Outbreak officially declared by health authorities',
      },
      {
        date: addDays(startDate, 14),
        eventType: 'peak' as const,
        caseCount: 45,
        description: 'Peak of outbreak reached',
      },
      {
        date: addDays(startDate, 21),
        eventType: 'declining' as const,
        caseCount: 30,
        description: 'Cases declining after interventions',
      },
    ];
    
    return {
      timelineId,
      diseaseType,
      district,
      state,
      events,
      status: 'active',
      totalCases: 45,
      deaths: 2,
      recoveries: 20,
      startDate,
    };
  }

  /**
   * Get active outbreak timelines
   */
  async getActiveOutbreaks(state?: string): Promise<OutbreakTimeline[]> {
    // In production, query from database
    // For now, return mock data
    const mockOutbreaks: OutbreakTimeline[] = [
      await this.createOutbreakTimeline('Dengue', 'Mumbai', 'Maharashtra', subDays(new Date(), 14)),
      await this.createOutbreakTimeline('Malaria', 'Pune', 'Maharashtra', subDays(new Date(), 7)),
    ];
    
    if (state) {
      return mockOutbreaks.filter(o => o.state === state);
    }
    
    return mockOutbreaks;
  }

  /**
   * Track resource allocation
   */
  async trackResourceAllocation(
    district: string,
    state: string,
    resourceType: 'rrt_team' | 'medical_supplies' | 'vaccines' | 'testing_kits' | 'ambulances',
    quantity: number,
    targetFacilities: string[]
  ): Promise<ResourceAllocation> {
    const allocationId = uuidv4();
    
    const allocation: ResourceAllocation = {
      allocationId,
      district,
      state,
      resourceType,
      quantity,
      allocatedDate: new Date(),
      deploymentStatus: 'planned',
      targetFacilities,
      estimatedArrival: addDays(new Date(), 1), // 1 day for deployment
    };
    
    // In production, save to database
    console.log('Resource allocation tracked:', allocation);
    
    return allocation;
  }

  /**
   * Get resource allocations for a district
   */
  async getResourceAllocations(
    district: string,
    state: string
  ): Promise<ResourceAllocation[]> {
    // In production, query from database
    // For now, return mock data
    return [
      {
        allocationId: uuidv4(),
        district,
        state,
        resourceType: 'rrt_team',
        quantity: 1,
        allocatedDate: subDays(new Date(), 2),
        deploymentStatus: 'deployed',
        targetFacilities: ['District Hospital'],
        estimatedArrival: subDays(new Date(), 1),
        actualArrival: subDays(new Date(), 1),
      },
      {
        allocationId: uuidv4(),
        district,
        state,
        resourceType: 'testing_kits',
        quantity: 500,
        allocatedDate: new Date(),
        deploymentStatus: 'in_transit',
        targetFacilities: ['District Hospital', 'Primary Health Center'],
        estimatedArrival: addDays(new Date(), 1),
      },
    ];
  }

  /**
   * Activate Rapid Response Team (RRT)
   */
  async activateRRT(
    district: string,
    state: string,
    diseaseType: string,
    outbreakProbability: number
  ): Promise<RRTActivation | null> {
    // Check if RRT activation is warranted
    if (outbreakProbability < this.rrtThreshold) {
      console.log(`RRT activation not required. Probability ${outbreakProbability} below threshold ${this.rrtThreshold}`);
      return null;
    }
    
    const activationId = uuidv4();
    
    // In production, fetch actual team members from database
    const teamMembers = [
      {
        name: 'Dr. Rajesh Kumar',
        role: 'Epidemiologist',
        contactNumber: '+91-9876543210',
      },
      {
        name: 'Dr. Priya Sharma',
        role: 'Infectious Disease Specialist',
        contactNumber: '+91-9876543211',
      },
      {
        name: 'Mr. Amit Patel',
        role: 'Public Health Officer',
        contactNumber: '+91-9876543212',
      },
      {
        name: 'Ms. Lakshmi Reddy',
        role: 'Laboratory Technician',
        contactNumber: '+91-9876543213',
      },
    ];
    
    const objectives = [
      'Conduct rapid epidemiological investigation',
      'Identify outbreak source and transmission patterns',
      'Implement immediate control measures',
      'Coordinate with local health authorities',
      'Establish surveillance system',
      'Provide technical guidance to healthcare facilities',
    ];
    
    const activation: RRTActivation = {
      activationId,
      district,
      state,
      diseaseType,
      activationDate: new Date(),
      teamMembers,
      objectives,
      status: 'activated',
    };
    
    // In production, save to database and trigger notifications
    console.log('RRT activated:', activation);
    
    // Track resource allocation for RRT
    await this.trackResourceAllocation(
      district,
      state,
      'rrt_team',
      1,
      ['District Health Office']
    );
    
    return activation;
  }

  /**
   * Update RRT status
   */
  async updateRRTStatus(
    activationId: string,
    status: 'activated' | 'deployed' | 'investigating' | 'completed',
    findings?: string[],
    recommendations?: string[]
  ): Promise<void> {
    // In production, update database
    console.log(`RRT ${activationId} status updated to ${status}`);
    
    if (findings) {
      console.log('Findings:', findings);
    }
    
    if (recommendations) {
      console.log('Recommendations:', recommendations);
    }
  }

  /**
   * Get active RRT deployments
   */
  async getActiveRRTDeployments(state?: string): Promise<RRTActivation[]> {
    // In production, query from database
    // For now, return mock data
    const mockDeployments: RRTActivation[] = [
      {
        activationId: uuidv4(),
        district: 'Mumbai',
        state: 'Maharashtra',
        diseaseType: 'Dengue',
        activationDate: subDays(new Date(), 3),
        teamMembers: [
          { name: 'Dr. Rajesh Kumar', role: 'Epidemiologist', contactNumber: '+91-9876543210' },
        ],
        objectives: ['Investigate outbreak', 'Implement control measures'],
        status: 'investigating',
      },
    ];
    
    if (state) {
      return mockDeployments.filter(d => d.state === state);
    }
    
    return mockDeployments;
  }

  /**
   * Calculate public health metrics
   */
  async calculatePublicHealthMetrics(): Promise<PublicHealthMetrics> {
    // In production, aggregate from database
    // For now, return mock metrics
    
    const activeOutbreaks = await this.getActiveOutbreaks();
    const rrtDeployments = await this.getActiveRRTDeployments();
    
    return {
      timestamp: new Date(),
      totalActiveOutbreaks: activeOutbreaks.length,
      districtsAtRisk: 15, // Would calculate from predictions
      totalCases: activeOutbreaks.reduce((sum, o) => sum + o.totalCases, 0),
      totalDeaths: activeOutbreaks.reduce((sum, o) => sum + o.deaths, 0),
      rrtDeployments: rrtDeployments.length,
      averageResponseTime: 6.5, // hours
      predictionAccuracy: 0.89, // From requirements
      earlyWarningLeadTime: 21, // days (2-4 weeks)
    };
  }

  /**
   * Generate dashboard summary
   */
  async generateDashboardSummary(state?: string): Promise<{
    metrics: PublicHealthMetrics;
    activeOutbreaks: OutbreakTimeline[];
    rrtDeployments: RRTActivation[];
    heatmapData: HeatmapData[];
    resourceAllocations: ResourceAllocation[];
  }> {
    const metrics = await this.calculatePublicHealthMetrics();
    const activeOutbreaks = await this.getActiveOutbreaks(state);
    const rrtDeployments = await this.getActiveRRTDeployments(state);
    
    // Generate heatmap data for all active outbreaks
    const heatmapData: HeatmapData[] = [];
    // In production, would fetch predictions and generate heatmap
    
    // Get resource allocations for affected districts
    const resourceAllocations: ResourceAllocation[] = [];
    for (const outbreak of activeOutbreaks) {
      const allocations = await this.getResourceAllocations(outbreak.district, outbreak.state);
      resourceAllocations.push(...allocations);
    }
    
    return {
      metrics,
      activeOutbreaks,
      rrtDeployments,
      heatmapData,
      resourceAllocations,
    };
  }

  /**
   * Identify resource gaps
   */
  async identifyResourceGaps(
    district: string,
    state: string,
    expectedCases: number
  ): Promise<{
    resourceType: string;
    required: number;
    available: number;
    gap: number;
  }[]> {
    // Calculate resource requirements based on expected cases
    const testingKitsRequired = expectedCases * 2; // 2 tests per case
    const medicalSuppliesRequired = expectedCases * 5; // 5 units per case
    const ambulancesRequired = Math.ceil(expectedCases / 10); // 1 per 10 cases
    
    // In production, fetch actual availability from database
    const testingKitsAvailable = 300;
    const medicalSuppliesAvailable = 500;
    const ambulancesAvailable = 3;
    
    const gaps = [
      {
        resourceType: 'Testing Kits',
        required: testingKitsRequired,
        available: testingKitsAvailable,
        gap: Math.max(0, testingKitsRequired - testingKitsAvailable),
      },
      {
        resourceType: 'Medical Supplies',
        required: medicalSuppliesRequired,
        available: medicalSuppliesAvailable,
        gap: Math.max(0, medicalSuppliesRequired - medicalSuppliesAvailable),
      },
      {
        resourceType: 'Ambulances',
        required: ambulancesRequired,
        available: ambulancesAvailable,
        gap: Math.max(0, ambulancesRequired - ambulancesAvailable),
      },
    ];
    
    return gaps.filter(g => g.gap > 0);
  }

  /**
   * Generate public awareness message
   */
  async generatePublicAwarenessMessage(
    diseaseType: string,
    district: string,
    state: string,
    language: string
  ): Promise<string> {
    // In production, use LLM to generate multilingual messages
    // For now, return template message
    
    const messages: Record<string, string> = {
      en: `Health Alert: ${diseaseType} cases increasing in ${district}, ${state}. Take preventive measures: use mosquito repellent, eliminate standing water, seek medical care if symptoms develop. For more info, call 1075.`,
      hi: `स्वास्थ्य चेतावनी: ${district}, ${state} में ${diseaseType} के मामले बढ़ रहे हैं। निवारक उपाय करें: मच्छर भगाने वाली क्रीम का उपयोग करें, जमा पानी हटाएं, लक्षण दिखने पर चिकित्सा सहायता लें। अधिक जानकारी के लिए 1075 पर कॉल करें।`,
      ta: `சுகாதார எச்சரிக்கை: ${district}, ${state} இல் ${diseaseType} வழக்குகள் அதிகரித்து வருகின்றன. தடுப்பு நடவடிக்கைகள் எடுக்கவும்: கொசு விரட்டி பயன்படுத்தவும், தேங்கிய நீரை அகற்றவும், அறிகுறிகள் தோன்றினால் மருத்துவ உதவி பெறவும். மேலும் தகவலுக்கு 1075 ஐ அழைக்கவும்.`,
    };
    
    return messages[language] || messages['en'];
  }
}
