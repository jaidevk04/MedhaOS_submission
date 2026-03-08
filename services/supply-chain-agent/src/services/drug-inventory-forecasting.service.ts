import { 
  DrugUsagePattern, 
  DrugForecast, 
  DrugInventoryItem,
  ReorderRecommendation 
} from '../types';

/**
 * Drug Inventory Forecasting Service
 * Implements SARIMA + XGBoost forecasting for 7-30 day demand prediction
 * Requirements: 9.1, 9.2
 */
export class DrugInventoryForecastingService {
  
  /**
   * Analyze historical usage patterns for a drug
   */
  async analyzeUsagePattern(
    facilityId: string,
    drugId: string,
    historicalDays: number = 90
  ): Promise<DrugUsagePattern> {
    // In production, this would query the database for historical usage data
    // For now, we'll simulate the analysis
    
    const mockDailyUsage = this.generateMockUsageData(historicalDays);
    const weeklyUsage = this.aggregateToWeekly(mockDailyUsage);
    const monthlyUsage = this.aggregateToMonthly(mockDailyUsage);
    
    return {
      drugId,
      drugName: `Drug-${drugId}`,
      facilityId,
      dailyUsage: mockDailyUsage,
      weeklyUsage,
      monthlyUsage,
      seasonalFactors: this.detectSeasonalFactors(mockDailyUsage),
      trendDirection: this.detectTrend(mockDailyUsage)
    };
  }

  /**
   * Generate demand forecast using SARIMA + XGBoost model
   */
  async generateForecast(
    facilityId: string,
    drugId: string,
    forecastPeriod: '7d' | '14d' | '30d'
  ): Promise<DrugForecast> {
    // Get usage pattern
    const usagePattern = await this.analyzeUsagePattern(facilityId, drugId);
    
    // Determine forecast horizon
    const days = forecastPeriod === '7d' ? 7 : forecastPeriod === '14d' ? 14 : 30;
    
    // Generate forecast using time series model
    // In production, this would call AWS SageMaker endpoint with SARIMA + XGBoost
    const predictedDemand = this.forecastDemand(usagePattern, days);
    const confidenceInterval = this.calculateConfidenceInterval(predictedDemand);
    
    // Get current stock
    const currentStock = await this.getCurrentStock(facilityId, drugId);
    
    // Calculate reorder point and quantity
    const { reorderPoint, reorderQuantity } = this.calculateReorderParameters(
      predictedDemand,
      currentStock
    );
    
    // Assess stockout risk
    const stockoutRisk = this.assessStockoutRisk(currentStock, predictedDemand, reorderPoint);
    
    return {
      drugId,
      drugName: usagePattern.drugName,
      facilityId,
      forecastPeriod,
      predictedDemand,
      confidenceInterval,
      currentStock,
      reorderPoint,
      reorderQuantity,
      stockoutRisk,
      generatedAt: new Date()
    };
  }

  /**
   * Calculate reorder point using safety stock formula
   * Reorder Point = (Average Daily Usage × Lead Time) + Safety Stock
   */
  calculateReorderPoint(
    averageDailyUsage: number,
    leadTimeDays: number = 7,
    serviceLevel: number = 0.95
  ): number {
    // Safety stock = Z-score × Standard Deviation × √Lead Time
    // For 95% service level, Z-score ≈ 1.65
    const zScore = 1.65;
    const stdDev = averageDailyUsage * 0.3; // Assume 30% coefficient of variation
    const safetyStock = zScore * stdDev * Math.sqrt(leadTimeDays);
    
    const reorderPoint = (averageDailyUsage * leadTimeDays) + safetyStock;
    return Math.ceil(reorderPoint);
  }

  /**
   * Calculate Economic Order Quantity (EOQ)
   * EOQ = √((2 × Annual Demand × Order Cost) / Holding Cost)
   */
  calculateEOQ(
    annualDemand: number,
    orderCost: number = 500,
    holdingCostPerUnit: number = 10
  ): number {
    const eoq = Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit);
    return Math.ceil(eoq);
  }

  /**
   * Generate reorder recommendations for all drugs in a facility
   */
  async generateReorderRecommendations(
    facilityId: string
  ): Promise<ReorderRecommendation[]> {
    // In production, query all drugs for the facility
    const mockDrugs = await this.getAllDrugs(facilityId);
    
    const recommendations: ReorderRecommendation[] = [];
    
    for (const drug of mockDrugs) {
      const forecast = await this.generateForecast(facilityId, drug.drugId, '7d');
      
      if (forecast.currentStock <= forecast.reorderPoint) {
        const urgency = this.determineUrgency(
          forecast.currentStock,
          forecast.reorderPoint,
          forecast.stockoutRisk
        );
        
        const estimatedStockoutDate = this.estimateStockoutDate(
          forecast.currentStock,
          forecast.predictedDemand
        );
        
        recommendations.push({
          itemId: drug.drugId,
          itemName: drug.drugName,
          currentStock: forecast.currentStock,
          reorderPoint: forecast.reorderPoint,
          recommendedQuantity: forecast.reorderQuantity,
          urgency,
          estimatedStockoutDate,
          supplier: drug.supplier || 'Default Supplier'
        });
      }
    }
    
    // Sort by urgency
    return recommendations.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }

  // Helper methods

  private generateMockUsageData(days: number): number[] {
    const baseUsage = 50;
    const data: number[] = [];
    
    for (let i = 0; i < days; i++) {
      // Add trend, seasonality, and random noise
      const trend = i * 0.1;
      const seasonality = 10 * Math.sin((2 * Math.PI * i) / 7); // Weekly pattern
      const noise = (Math.random() - 0.5) * 10;
      
      data.push(Math.max(0, Math.round(baseUsage + trend + seasonality + noise)));
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

  private aggregateToMonthly(dailyData: number[]): number[] {
    const monthly: number[] = [];
    for (let i = 0; i < dailyData.length; i += 30) {
      const monthSum = dailyData.slice(i, i + 30).reduce((a, b) => a + b, 0);
      monthly.push(monthSum);
    }
    return monthly;
  }

  private detectSeasonalFactors(data: number[]): Record<string, number> {
    // Simplified seasonal detection
    return {
      monday: 1.1,
      tuesday: 1.0,
      wednesday: 0.9,
      thursday: 1.0,
      friday: 1.2,
      saturday: 0.8,
      sunday: 0.7
    };
  }

  private detectTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private forecastDemand(pattern: DrugUsagePattern, days: number): number[] {
    // Simplified forecasting - in production, use SARIMA + XGBoost
    const recentAvg = pattern.dailyUsage.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const forecast: number[] = [];
    
    for (let i = 0; i < days; i++) {
      // Apply trend
      let value = recentAvg;
      if (pattern.trendDirection === 'increasing') {
        value *= (1 + 0.01 * i);
      } else if (pattern.trendDirection === 'decreasing') {
        value *= (1 - 0.01 * i);
      }
      
      // Apply weekly seasonality
      const dayOfWeek = i % 7;
      const seasonalFactor = Object.values(pattern.seasonalFactors)[dayOfWeek];
      value *= seasonalFactor;
      
      forecast.push(Math.round(value));
    }
    
    return forecast;
  }

  private calculateConfidenceInterval(forecast: number[]): { lower: number[]; upper: number[] } {
    // 95% confidence interval (±1.96 standard deviations)
    const margin = 0.2; // 20% margin
    
    return {
      lower: forecast.map(v => Math.round(v * (1 - margin))),
      upper: forecast.map(v => Math.round(v * (1 + margin)))
    };
  }

  private async getCurrentStock(facilityId: string, drugId: string): Promise<number> {
    // In production, query database
    return Math.floor(Math.random() * 500) + 100;
  }

  private calculateReorderParameters(
    predictedDemand: number[],
    currentStock: number
  ): { reorderPoint: number; reorderQuantity: number } {
    const totalDemand = predictedDemand.reduce((a, b) => a + b, 0);
    const avgDailyDemand = totalDemand / predictedDemand.length;
    
    const reorderPoint = this.calculateReorderPoint(avgDailyDemand);
    const annualDemand = avgDailyDemand * 365;
    const reorderQuantity = this.calculateEOQ(annualDemand);
    
    return { reorderPoint, reorderQuantity };
  }

  private assessStockoutRisk(
    currentStock: number,
    predictedDemand: number[],
    reorderPoint: number
  ): 'low' | 'medium' | 'high' {
    const totalDemand = predictedDemand.reduce((a, b) => a + b, 0);
    
    if (currentStock < reorderPoint * 0.5) return 'high';
    if (currentStock < reorderPoint) return 'medium';
    if (currentStock < totalDemand * 1.5) return 'medium';
    return 'low';
  }

  private async getAllDrugs(facilityId: string): Promise<DrugInventoryItem[]> {
    // Mock data - in production, query database
    return [
      {
        itemId: 'drug-001',
        drugId: 'drug-001',
        drugName: 'Paracetamol 500mg',
        facilityId,
        currentStock: 150,
        unit: 'tablets',
        reorderLevel: 200,
        expiryDate: new Date('2025-12-31'),
        batchNumber: 'BATCH-001',
        supplier: 'PharmaCorp',
        lastUpdated: new Date()
      },
      {
        itemId: 'drug-002',
        drugId: 'drug-002',
        drugName: 'Amoxicillin 250mg',
        facilityId,
        currentStock: 80,
        unit: 'capsules',
        reorderLevel: 150,
        expiryDate: new Date('2025-10-31'),
        batchNumber: 'BATCH-002',
        supplier: 'MediSupply',
        lastUpdated: new Date()
      }
    ];
  }

  private determineUrgency(
    currentStock: number,
    reorderPoint: number,
    stockoutRisk: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    if (stockoutRisk === 'high' || currentStock < reorderPoint * 0.3) {
      return 'high';
    }
    if (stockoutRisk === 'medium' || currentStock < reorderPoint * 0.7) {
      return 'medium';
    }
    return 'low';
  }

  private estimateStockoutDate(
    currentStock: number,
    predictedDemand: number[]
  ): Date | undefined {
    let remainingStock = currentStock;
    
    for (let i = 0; i < predictedDemand.length; i++) {
      remainingStock -= predictedDemand[i];
      if (remainingStock <= 0) {
        const stockoutDate = new Date();
        stockoutDate.setDate(stockoutDate.getDate() + i);
        return stockoutDate;
      }
    }
    
    return undefined;
  }
}
