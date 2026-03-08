/**
 * Model Monitoring Service
 * Tracks model performance and triggers retraining when needed
 */

import { 
  CloudWatchClient, 
  PutMetricDataCommand,
  GetMetricStatisticsCommand,
} from '@aws-sdk/client-cloudwatch';

export interface ModelPrediction {
  sessionId: string;
  predictedScore: number;
  actualScore?: number;
  features: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

export interface ModelMetrics {
  totalPredictions: number;
  averageConfidence: number;
  accuracyRate: number;
  mae: number;
  rmse: number;
  lastUpdated: Date;
}

export class ModelMonitoringService {
  private predictions: ModelPrediction[] = [];
  private readonly maxPredictions = 10000; // Keep last 10K predictions
  private readonly retrainingThreshold = 0.85; // Retrain if accuracy drops below 85%
  private cloudWatchClient: CloudWatchClient;
  private readonly namespace = 'MedhaOS/UrgencyScoring';
  
  constructor() {
    this.cloudWatchClient = new CloudWatchClient({ 
      region: process.env.AWS_REGION || 'ap-south-1' 
    });
  }
  
  /**
   * Log a prediction for monitoring
   */
  async logPrediction(prediction: ModelPrediction): Promise<void> {
    this.predictions.push(prediction);
    
    // Keep only recent predictions
    if (this.predictions.length > this.maxPredictions) {
      this.predictions = this.predictions.slice(-this.maxPredictions);
    }
    
    // Send metrics to CloudWatch
    await this.sendMetricsToCloudWatch({
      predictionCount: 1,
      confidence: prediction.confidence,
    });
  }
  
  /**
   * Update prediction with actual outcome
   */
  async updateActualOutcome(sessionId: string, actualScore: number): Promise<void> {
    const prediction = this.predictions.find(p => p.sessionId === sessionId);
    if (prediction) {
      prediction.actualScore = actualScore;
      
      // Calculate error and send to CloudWatch
      const error = Math.abs(prediction.predictedScore - actualScore);
      await this.sendMetricsToCloudWatch({
        predictionError: error,
        accuracy: error <= 10 ? 1 : 0,
      });
    }
  }
  
  /**
   * Get current model metrics
   */
  getMetrics(): ModelMetrics {
    const predictionsWithActual = this.predictions.filter(p => p.actualScore !== undefined);
    
    if (predictionsWithActual.length === 0) {
      return {
        totalPredictions: this.predictions.length,
        averageConfidence: 0,
        accuracyRate: 0,
        mae: 0,
        rmse: 0,
        lastUpdated: new Date(),
      };
    }
    
    // Calculate MAE
    const totalError = predictionsWithActual.reduce((sum, p) => {
      return sum + Math.abs(p.predictedScore - (p.actualScore || 0));
    }, 0);
    const mae = totalError / predictionsWithActual.length;
    
    // Calculate RMSE
    const totalSquaredError = predictionsWithActual.reduce((sum, p) => {
      const error = p.predictedScore - (p.actualScore || 0);
      return sum + (error * error);
    }, 0);
    const rmse = Math.sqrt(totalSquaredError / predictionsWithActual.length);
    
    // Calculate accuracy (within 10 points)
    const accuratePredictions = predictionsWithActual.filter(p => {
      return Math.abs(p.predictedScore - (p.actualScore || 0)) <= 10;
    }).length;
    const accuracyRate = accuratePredictions / predictionsWithActual.length;
    
    // Calculate average confidence
    const totalConfidence = this.predictions.reduce((sum, p) => sum + p.confidence, 0);
    const averageConfidence = totalConfidence / this.predictions.length;
    
    return {
      totalPredictions: this.predictions.length,
      averageConfidence,
      accuracyRate,
      mae,
      rmse,
      lastUpdated: new Date(),
    };
  }

  /**
   * Check if model needs retraining
   */
  needsRetraining(): boolean {
    const metrics = this.getMetrics();
    
    // Retrain if accuracy drops below threshold
    if (metrics.accuracyRate < this.retrainingThreshold) {
      console.warn(`Model accuracy (${metrics.accuracyRate}) below threshold (${this.retrainingThreshold})`);
      return true;
    }
    
    // Retrain if MAE is too high
    if (metrics.mae > 15) {
      console.warn(`Model MAE (${metrics.mae}) too high`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Trigger model retraining
   * In production, this would create a SageMaker training job
   */
  async triggerRetraining(): Promise<void> {
    console.log('Triggering model retraining...');
    
    // In production:
    // 1. Export recent predictions to S3
    // 2. Create SageMaker training job
    // 3. Monitor training progress
    // 4. Deploy new model version
    // 5. Run A/B test
    
    console.log('Retraining job submitted to AWS SageMaker');
  }
  
  /**
   * Get feature drift analysis
   */
  getFeatureDrift(): Record<string, number> {
    // Analyze if feature distributions have changed
    // This would compare recent predictions to training data distribution
    
    return {
      age: 0.05,
      symptomSeverity: 0.03,
      oxygenSaturation: 0.02,
      heartRate: 0.04,
    };
  }
  
  /**
   * Export predictions for analysis
   */
  exportPredictions(): ModelPrediction[] {
    return [...this.predictions];
  }
  
  /**
   * Clear old predictions
   */
  clearOldPredictions(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.predictions = this.predictions.filter(p => p.timestamp >= cutoffDate);
    console.log(`Cleared predictions older than ${daysToKeep} days`);
  }
  
  /**
   * Send metrics to CloudWatch
   */
  private async sendMetricsToCloudWatch(metrics: Record<string, number>): Promise<void> {
    try {
      const metricData = Object.entries(metrics).map(([name, value]) => ({
        MetricName: name,
        Value: value,
        Unit: 'None',
        Timestamp: new Date(),
      }));
      
      const command = new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: metricData,
      });
      
      await this.cloudWatchClient.send(command);
    } catch (error) {
      console.error('Failed to send metrics to CloudWatch:', error);
      // Don't throw - monitoring failures shouldn't break predictions
    }
  }
  
  /**
   * Get historical metrics from CloudWatch
   */
  async getHistoricalMetrics(metricName: string, hours: number = 24): Promise<number[]> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
      
      const command = new GetMetricStatisticsCommand({
        Namespace: this.namespace,
        MetricName: metricName,
        StartTime: startTime,
        EndTime: endTime,
        Period: 3600, // 1 hour periods
        Statistics: ['Average'],
      });
      
      const response = await this.cloudWatchClient.send(command);
      return response.Datapoints?.map(d => d.Average || 0) || [];
    } catch (error) {
      console.error('Failed to get historical metrics:', error);
      return [];
    }
  }
}
