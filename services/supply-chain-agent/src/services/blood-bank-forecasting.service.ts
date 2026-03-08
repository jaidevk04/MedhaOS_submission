import { 
  BloodUsagePattern, 
  BloodForecast, 
  BloodInventoryItem,
  DonorDrive 
} from '../types';
import { config } from '../config';

/**
 * Blood Bank Stock Forecasting Service
 * Implements Poisson Regression + Neural Network for blood demand prediction
 * Requirements: 9.4, 9.5
 */
export class BloodBankForecastingService {
  
  /**
   * Analyze blood usage patterns by blood group
   */
  async analyzeBloodUsagePattern(
    facilityId: string,
    bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    historicalDays: number = 90
  ): Promise<BloodUsagePattern> {
    // In production, query database for historical blood usage
    const mockDailyUsage = this.generateMockBloodUsage(bloodGroup, historicalDays);
    const weeklyUsage = this.aggregateToWeekly(mockDailyUsage);
    
    // Calculate usage rates by category
    const emergencyRate = this.calculateEmergencyUsageRate(mockDailyUsage);
    const surgeryRate = this.calculateSurgeryUsageRate(mockDailyUsage);
    const traumaRate = this.calculateTraumaUsageRate(mockDailyUsage);
    
    return {
      bloodGroup,
      facilityId,
      dailyUsage: mockDailyUsage,
      weeklyUsage,
      emergencyUsageRate: emergencyRate,
      surgeryUsageRate: surgeryRate,
      traumaUsageRate: traumaRate
    };
  }

  /**
   * Generate blood demand forecast using Poisson Regression + Neural Network
   */
  async generateBloodForecast(
    facilityId: string,
    bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    forecastPeriod: '7d' | '14d' | '30d'
  ): Promise<BloodForecast> {
    // Get usage pattern
    const usagePattern = await this.analyzeBloodUsagePattern(facilityId, bloodGroup);
    
    // Determine forecast horizon
    const days = forecastPeriod === '7d' ? 7 : forecastPeriod === '14d' ? 14 : 30;
    
    // Generate forecast using Poisson regression for count data
    // In production, this would call AWS SageMaker endpoint
    const predictedDemand = this.forecastBloodDemand(usagePattern, days);
    const confidenceInterval = this.calculateConfidenceInterval(predictedDemand);
    
    // Get current stock
    const currentStock = await this.getCurrentBloodStock(facilityId, bloodGroup);
    
    // Determine critical threshold based on blood group rarity
    const criticalThreshold = this.getCriticalThreshold(bloodGroup);
    
    // Assess shortage risk
    const shortageRisk = this.assessShortageRisk(
      currentStock,
      predictedDemand,
      criticalThreshold
    );
    
    // Determine if donor drive is needed
    const recommendedDonorDrive = this.shouldTriggerDonorDrive(
      currentStock,
      predictedDemand,
      shortageRisk
    );
    
    return {
      bloodGroup,
      facilityId,
      forecastPeriod,
      predictedDemand,
      confidenceInterval,
      currentStock,
      criticalThreshold,
      shortageRisk,
      recommendedDonorDrive,
      generatedAt: new Date()
    };
  }

  /**
   * Generate forecasts for all blood groups
   */
  async generateAllBloodGroupForecasts(
    facilityId: string,
    forecastPeriod: '7d' | '14d' | '30d'
  ): Promise<BloodForecast[]> {
    const bloodGroups: Array<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'> = [
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    ];
    
    const forecasts: BloodForecast[] = [];
    
    for (const bloodGroup of bloodGroups) {
      const forecast = await this.generateBloodForecast(facilityId, bloodGroup, forecastPeriod);
      forecasts.push(forecast);
    }
    
    return forecasts;
  }

  /**
   * Identify critical blood shortages across all groups
   */
  async identifyCriticalShortages(facilityId: string): Promise<BloodForecast[]> {
    const forecasts = await this.generateAllBloodGroupForecasts(facilityId, '7d');
    
    return forecasts.filter(
      f => f.shortageRisk === 'critical' || f.shortageRisk === 'high'
    ).sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return riskOrder[a.shortageRisk] - riskOrder[b.shortageRisk];
    });
  }

  /**
   * Create donor drive recommendation
   */
  async createDonorDriveRecommendation(
    facilityId: string,
    bloodGroups: string[]
  ): Promise<DonorDrive> {
    // Calculate target units based on forecasts
    let totalTargetUnits = 0;
    
    for (const bloodGroup of bloodGroups) {
      const forecast = await this.generateBloodForecast(
        facilityId,
        bloodGroup as any,
        '14d'
      );
      const deficit = Math.max(0, forecast.criticalThreshold - forecast.currentStock);
      totalTargetUnits += deficit;
    }
    
    // Add buffer
    totalTargetUnits = Math.ceil(totalTargetUnits * 1.5);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 2); // Start in 2 days
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // 7-day drive
    
    return {
      driveId: `drive-${Date.now()}`,
      facilityId,
      bloodGroups,
      targetUnits: totalTargetUnits,
      startDate,
      endDate,
      status: 'planned',
      registeredDonors: 0,
      collectedUnits: 0,
      createdAt: new Date()
    };
  }

  /**
   * Calculate blood compatibility matrix for emergency situations
   */
  getCompatibleBloodGroups(
    recipientBloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  ): string[] {
    const compatibilityMatrix: Record<string, string[]> = {
      'O-': ['O-'],
      'O+': ['O-', 'O+'],
      'A-': ['O-', 'A-'],
      'A+': ['O-', 'O+', 'A-', 'A+'],
      'B-': ['O-', 'B-'],
      'B+': ['O-', 'O+', 'B-', 'B+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    };
    
    return compatibilityMatrix[recipientBloodGroup] || [];
  }

  /**
   * Find alternative blood sources in emergency
   */
  async findAlternativeBloodSources(
    facilityId: string,
    requiredBloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-',
    requiredUnits: number
  ): Promise<{ bloodGroup: string; availableUnits: number }[]> {
    const compatibleGroups = this.getCompatibleBloodGroups(requiredBloodGroup);
    const alternatives: { bloodGroup: string; availableUnits: number }[] = [];
    
    for (const bloodGroup of compatibleGroups) {
      const stock = await this.getCurrentBloodStock(facilityId, bloodGroup as any);
      if (stock > 0) {
        alternatives.push({
          bloodGroup,
          availableUnits: stock
        });
      }
    }
    
    // Sort by preference (exact match first, then by availability)
    return alternatives.sort((a, b) => {
      if (a.bloodGroup === requiredBloodGroup) return -1;
      if (b.bloodGroup === requiredBloodGroup) return 1;
      return b.availableUnits - a.availableUnits;
    });
  }

  // Helper methods

  private generateMockBloodUsage(
    bloodGroup: string,
    days: number
  ): number[] {
    // Blood usage follows Poisson distribution (count data)
    // Different blood groups have different base rates
    const baseRates: Record<string, number> = {
      'O+': 8,  // Most common, highest usage
      'O-': 3,  // Universal donor, moderate usage
      'A+': 7,
      'A-': 2,
      'B+': 5,
      'B-': 2,
      'AB+': 3,
      'AB-': 1  // Rarest, lowest usage
    };
    
    const lambda = baseRates[bloodGroup] || 3;
    const data: number[] = [];
    
    for (let i = 0; i < days; i++) {
      // Poisson-like distribution with some variation
      const value = Math.max(0, Math.round(
        lambda + (Math.random() - 0.5) * lambda * 0.5
      ));
      data.push(value);
    }
    
    return data;
  }

  private aggregateToWeekly(dailyData: number[]): number[] {
    const weekly: number[] = [];
    for (let i = 0; i < dailyData.length; i += 7) {
      const weekSum = dailyData.slice(i, i + 7).reduce((a, b) => a + b, 0);
      weekly.push(weekSum);
    }
    return weekly;
  }

  private calculateEmergencyUsageRate(dailyUsage: number[]): number {
    // Assume 30% of usage is emergency
    return 0.30;
  }

  private calculateSurgeryUsageRate(dailyUsage: number[]): number {
    // Assume 50% of usage is planned surgery
    return 0.50;
  }

  private calculateTraumaUsageRate(dailyUsage: number[]): number {
    // Assume 20% of usage is trauma
    return 0.20;
  }

  private forecastBloodDemand(pattern: BloodUsagePattern, days: number): number[] {
    // Simplified Poisson-based forecasting
    // In production, use Poisson Regression + Neural Network
    const recentAvg = pattern.dailyUsage.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const forecast: number[] = [];
    
    for (let i = 0; i < days; i++) {
      // Add day-of-week variation
      const dayOfWeek = i % 7;
      let multiplier = 1.0;
      
      // Weekends typically have lower elective surgery, higher trauma
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        multiplier = 0.8;
      }
      
      // Add random Poisson-like variation
      const value = Math.max(0, Math.round(
        recentAvg * multiplier + (Math.random() - 0.5) * recentAvg * 0.3
      ));
      
      forecast.push(value);
    }
    
    return forecast;
  }

  private calculateConfidenceInterval(forecast: number[]): { lower: number[]; upper: number[] } {
    // For Poisson distribution, variance = mean
    // 95% CI: mean ± 1.96 * sqrt(mean)
    return {
      lower: forecast.map(v => Math.max(0, Math.round(v - 1.96 * Math.sqrt(v)))),
      upper: forecast.map(v => Math.round(v + 1.96 * Math.sqrt(v)))
    };
  }

  private async getCurrentBloodStock(
    facilityId: string,
    bloodGroup: string
  ): Promise<number> {
    // In production, query database
    // Simulate different stock levels for different blood groups
    const stockLevels: Record<string, number> = {
      'O+': 45,
      'O-': 8,
      'A+': 35,
      'A-': 6,
      'B+': 25,
      'B-': 4,
      'AB+': 15,
      'AB-': 2
    };
    
    return stockLevels[bloodGroup] || 10;
  }

  private getCriticalThreshold(bloodGroup: string): number {
    // Critical thresholds based on blood group rarity and usage
    const thresholds: Record<string, number> = {
      'O+': 30,  // High usage, need more
      'O-': 15,  // Universal donor, critical
      'A+': 25,
      'A-': 10,
      'B+': 20,
      'B-': 10,
      'AB+': 15,
      'AB-': 8
    };
    
    return thresholds[bloodGroup] || config.thresholds.bloodCriticalUnits;
  }

  private assessShortageRisk(
    currentStock: number,
    predictedDemand: number[],
    criticalThreshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const totalDemand = predictedDemand.reduce((a, b) => a + b, 0);
    const daysOfSupply = currentStock / (totalDemand / predictedDemand.length);
    
    if (currentStock <= criticalThreshold * 0.3 || daysOfSupply < 2) {
      return 'critical';
    }
    if (currentStock <= criticalThreshold * 0.6 || daysOfSupply < 4) {
      return 'high';
    }
    if (currentStock <= criticalThreshold || daysOfSupply < 7) {
      return 'medium';
    }
    return 'low';
  }

  private shouldTriggerDonorDrive(
    currentStock: number,
    predictedDemand: number[],
    shortageRisk: 'low' | 'medium' | 'high' | 'critical'
  ): boolean {
    // Trigger donor drive if:
    // 1. Risk is high or critical
    // 2. Current stock won't last through forecast period
    const totalDemand = predictedDemand.reduce((a, b) => a + b, 0);
    
    return (
      shortageRisk === 'critical' ||
      shortageRisk === 'high' ||
      currentStock < totalDemand * 1.2
    );
  }
}
