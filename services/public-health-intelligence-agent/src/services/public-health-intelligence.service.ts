import { RegionalDiseasePredictionService } from './regional-disease-prediction.service';
import { InfectionSurveillanceService } from './infection-surveillance.service';
import { MediaScanningService } from './media-scanning.service';
import { PublicHealthDashboardService } from './public-health-dashboard.service';
import {
  DiseasePrediction,
  OutbreakAlert,
  InfectionCluster,
  InfectionAlert,
  MediaScanningResult,
  PublicHealthMetrics,
} from '../types';

/**
 * Public Health Intelligence Service
 * 
 * Main orchestrator for all public health intelligence operations
 * Coordinates disease prediction, infection surveillance, media scanning, and dashboard services
 */
export class PublicHealthIntelligenceService {
  private diseasePredictionService: RegionalDiseasePredictionService;
  private infectionSurveillanceService: InfectionSurveillanceService;
  private mediaScanningService: MediaScanningService;
  private dashboardService: PublicHealthDashboardService;

  constructor() {
    this.diseasePredictionService = new RegionalDiseasePredictionService();
    this.infectionSurveillanceService = new InfectionSurveillanceService();
    this.mediaScanningService = new MediaScanningService();
    this.dashboardService = new PublicHealthDashboardService();
  }

  /**
   * Perform comprehensive public health surveillance
   */
  async performSurveillance(
    state: string,
    districts: string[],
    diseaseType: string
  ): Promise<{
    predictions: DiseasePrediction[];
    outbreakAlerts: OutbreakAlert[];
    infectionClusters: InfectionCluster[];
    infectionAlerts: InfectionAlert[];
    mediaScan: MediaScanningResult;
    metrics: PublicHealthMetrics;
  }> {
    console.log(`Starting public health surveillance for ${state}...`);
    
    // 1. Regional Disease Prediction
    console.log('Running disease prediction models...');
    const predictions = await this.diseasePredictionService.getForecastForRegion(
      state,
      districts,
      diseaseType
    );
    
    // 2. Create outbreak alerts
    const outbreakAlerts: OutbreakAlert[] = [];
    for (const prediction of predictions) {
      const alert = await this.diseasePredictionService.createOutbreakAlert(prediction);
      if (alert) {
        outbreakAlerts.push(alert);
        
        // Activate RRT if needed
        if (alert.rrtActivationRequired) {
          await this.dashboardService.activateRRT(
            alert.district,
            alert.state,
            alert.diseaseType,
            alert.outbreakProbability
          );
        }
      }
    }
    
    // 3. Infection Surveillance (for healthcare facilities)
    console.log('Monitoring healthcare facilities for infection clusters...');
    const infectionClusters: InfectionCluster[] = [];
    const infectionAlerts: InfectionAlert[] = [];
    
    // In production, would iterate through all facilities in the districts
    // For now, simulate with one facility per district
    for (const district of districts) {
      const facilityId = `facility-${district}`;
      const clusters = await this.infectionSurveillanceService.detectSymptomClusters(facilityId);
      infectionClusters.push(...clusters);
      
      for (const cluster of clusters) {
        const alert = await this.infectionSurveillanceService.createInfectionAlert(cluster);
        infectionAlerts.push(alert);
      }
    }
    
    // 4. Media Scanning
    console.log('Scanning news and social media...');
    const mediaScan = await this.mediaScanningService.performMediaScan(7); // Last 7 days
    
    // 5. Calculate metrics
    const metrics = await this.dashboardService.calculatePublicHealthMetrics();
    
    console.log('Surveillance complete.');
    
    return {
      predictions,
      outbreakAlerts,
      infectionClusters,
      infectionAlerts,
      mediaScan,
      metrics,
    };
  }

  /**
   * Get dashboard data for public health officials
   */
  async getDashboardData(state?: string) {
    return await this.dashboardService.generateDashboardSummary(state);
  }

  /**
   * Predict outbreak for specific district
   */
  async predictOutbreak(district: string, state: string, diseaseType: string) {
    return await this.diseasePredictionService.predictOutbreak(district, state, diseaseType);
  }

  /**
   * Monitor facility for infections
   */
  async monitorFacility(facilityId: string) {
    return await this.infectionSurveillanceService.monitorFacility(facilityId);
  }

  /**
   * Scan media for disease events
   */
  async scanMedia(daysBack: number = 7) {
    return await this.mediaScanningService.performMediaScan(daysBack);
  }

  /**
   * Activate RRT for outbreak
   */
  async activateRRT(district: string, state: string, diseaseType: string, probability: number) {
    return await this.dashboardService.activateRRT(district, state, diseaseType, probability);
  }

  /**
   * Generate heatmap data
   */
  async generateHeatmap(state: string, diseaseType: string, predictions: DiseasePrediction[]) {
    return await this.dashboardService.generateHeatmapData(state, diseaseType, predictions);
  }

  /**
   * Get active outbreaks
   */
  async getActiveOutbreaks(state?: string) {
    return await this.dashboardService.getActiveOutbreaks(state);
  }

  /**
   * Track resource allocation
   */
  async trackResources(
    district: string,
    state: string,
    resourceType: 'rrt_team' | 'medical_supplies' | 'vaccines' | 'testing_kits' | 'ambulances',
    quantity: number,
    facilities: string[]
  ) {
    return await this.dashboardService.trackResourceAllocation(
      district,
      state,
      resourceType,
      quantity,
      facilities
    );
  }

  /**
   * Identify resource gaps
   */
  async identifyResourceGaps(district: string, state: string, expectedCases: number) {
    return await this.dashboardService.identifyResourceGaps(district, state, expectedCases);
  }

  /**
   * Generate public awareness message
   */
  async generateAwarenessMessage(
    diseaseType: string,
    district: string,
    state: string,
    language: string
  ) {
    return await this.dashboardService.generatePublicAwarenessMessage(
      diseaseType,
      district,
      state,
      language
    );
  }
}
