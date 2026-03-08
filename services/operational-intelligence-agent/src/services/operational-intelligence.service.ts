import { BedOccupancyPredictionService } from './bed-occupancy-prediction.service';
import { ICUDemandForecastingService } from './icu-demand-forecasting.service';
import { StaffSchedulingService } from './staff-scheduling.service';
import { WorkflowOptimizationService } from './workflow-optimization.service';
import {
  OperationalMetrics,
  CapacityAlert,
  StaffMember,
  ShiftRequirement,
} from '../types';

/**
 * Operational Intelligence Service
 * 
 * Main orchestrator for all operational intelligence agents
 */
export class OperationalIntelligenceService {
  private bedOccupancyService: BedOccupancyPredictionService;
  private icuDemandService: ICUDemandForecastingService;
  private staffSchedulingService: StaffSchedulingService;
  private workflowOptimizationService: WorkflowOptimizationService;

  constructor() {
    this.bedOccupancyService = new BedOccupancyPredictionService();
    this.icuDemandService = new ICUDemandForecastingService();
    this.staffSchedulingService = new StaffSchedulingService();
    this.workflowOptimizationService = new WorkflowOptimizationService();
  }

  /**
   * Get comprehensive operational metrics for a facility
   */
  async getOperationalMetrics(facilityId: string): Promise<OperationalMetrics> {
    // Get bed occupancy prediction
    const bedPrediction = await this.bedOccupancyService.predictBedOccupancy(
      facilityId,
      'general',
      24
    );
    
    // Get ICU demand prediction
    const icuPrediction = await this.icuDemandService.predictICUDemand(facilityId, 24);
    
    // Get workflow efficiency for key processes
    const admissionEfficiency = await this.workflowOptimizationService.analyzeWorkflowEfficiency(
      facilityId,
      'patient-admission'
    );
    
    // Calculate current metrics
    const currentBedOccupancy = bedPrediction.predictions[0];
    const currentICU = icuPrediction.predictions[0];
    
    const bedOccupancyRate =
      currentBedOccupancy.predictedOccupancy /
      (currentBedOccupancy.predictedOccupancy + currentBedOccupancy.predictedAvailable);
    
    const icuUtilization = currentICU.predictedUtilization;
    
    // Get bottlenecks
    const bottlenecks = await this.workflowOptimizationService.identifyBottlenecks(
      facilityId,
      'patient-admission'
    );
    
    return {
      facilityId,
      timestamp: new Date(),
      bedOccupancyRate,
      icuUtilization,
      averageWaitTime: admissionEfficiency.averageCycleTime / 60000, // Convert to minutes
      staffUtilization: 0.75, // Would be calculated from actual staff data
      patientThroughput: admissionEfficiency.totalCases,
      bottleneckCount: bottlenecks.length,
    };
  }

  /**
   * Get all capacity alerts for a facility
   */
  async getAllCapacityAlerts(facilityId: string): Promise<CapacityAlert[]> {
    const alerts: CapacityAlert[] = [];
    
    // Bed occupancy alerts
    const bedPrediction = await this.bedOccupancyService.predictBedOccupancy(
      facilityId,
      'general',
      72
    );
    const bedAlerts = await this.bedOccupancyService.generateCapacityAlerts(bedPrediction);
    alerts.push(...bedAlerts);
    
    // ICU alerts
    const icuPrediction = await this.icuDemandService.predictICUDemand(facilityId, 24);
    const icuAlerts = await this.icuDemandService.generateICUAlerts(icuPrediction);
    alerts.push(...icuAlerts);
    
    // Sort by severity and predicted time
    alerts.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      
      if (severityDiff !== 0) return severityDiff;
      
      return a.predictedTime.getTime() - b.predictedTime.getTime();
    });
    
    return alerts;
  }

  /**
   * Generate comprehensive operational dashboard data
   */
  async generateDashboardData(facilityId: string): Promise<{
    metrics: OperationalMetrics;
    bedCapacity: any;
    icuDemand: any;
    alerts: CapacityAlert[];
    workflowBottlenecks: any[];
    staffingStatus: {
      coverageScore: number;
      burnoutRisks: number;
    };
  }> {
    // Get all data in parallel
    const [
      metrics,
      bedCapacity,
      icuDemand,
      alerts,
      bottlenecks,
    ] = await Promise.all([
      this.getOperationalMetrics(facilityId),
      this.bedOccupancyService.getCapacityHeatmap(facilityId),
      this.icuDemandService.predictICUDemand(facilityId, 24),
      this.getAllCapacityAlerts(facilityId),
      this.workflowOptimizationService.identifyBottlenecks(facilityId, 'patient-admission'),
    ]);
    
    return {
      metrics,
      bedCapacity,
      icuDemand,
      alerts,
      workflowBottlenecks: bottlenecks,
      staffingStatus: {
        coverageScore: 0.85, // Would be calculated from actual schedule
        burnoutRisks: 0, // Would be calculated from actual staff data
      },
    };
  }

  /**
   * Optimize facility operations
   */
  async optimizeFacilityOperations(
    facilityId: string,
    staffMembers: StaffMember[],
    shiftRequirements: ShiftRequirement[]
  ): Promise<{
    schedule: any;
    capacityRecommendations: string[];
    workflowImprovements: string[];
    estimatedImpact: {
      capacityIncrease: number;
      efficiencyGain: number;
      costSavings: number;
    };
  }> {
    // Generate optimal schedule
    const schedule = await this.staffSchedulingService.generateWeeklySchedule(
      facilityId,
      new Date(),
      staffMembers,
      shiftRequirements
    );
    
    // Get capacity recommendations
    const alerts = await this.getAllCapacityAlerts(facilityId);
    const capacityRecommendations = alerts
      .filter(a => a.severity === 'critical' || a.severity === 'high')
      .flatMap(a => a.recommendations)
      .slice(0, 5);
    
    // Get workflow improvements
    const bottlenecks = await this.workflowOptimizationService.identifyBottlenecks(
      facilityId,
      'patient-admission'
    );
    const workflowImprovements = bottlenecks
      .slice(0, 3)
      .flatMap(b => b.recommendations.slice(0, 2));
    
    // Estimate impact
    const currentEfficiency = await this.workflowOptimizationService.analyzeWorkflowEfficiency(
      facilityId,
      'patient-admission'
    );
    
    const estimatedImpact = {
      capacityIncrease: 15, // 15% capacity increase from optimizations
      efficiencyGain: 100 - currentEfficiency.efficiencyScore, // Potential efficiency gain
      costSavings: 50000, // Estimated monthly savings
    };
    
    return {
      schedule,
      capacityRecommendations,
      workflowImprovements,
      estimatedImpact,
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.bedOccupancyService.dispose();
    this.icuDemandService.dispose();
  }
}
