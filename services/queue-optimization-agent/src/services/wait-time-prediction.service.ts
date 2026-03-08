import { QueueDynamoRepository } from '@medhaos/database/dynamodb';
import {
  QueueEntry,
  QueueType,
  QueueStatus,
  WaitTimePrediction,
  Priority,
} from '../types';

interface HistoricalWaitTimeData {
  facilityId: string;
  queueType: QueueType;
  hour: number;
  dayOfWeek: number;
  averageWaitTime: number;
  averageServiceTime: number;
  patientVolume: number;
}

export class WaitTimePredictionService {
  private queueRepository: QueueDynamoRepository;
  private historicalData: Map<string, HistoricalWaitTimeData[]> = new Map();

  constructor() {
    this.queueRepository = new QueueDynamoRepository();
  }

  /**
   * Predict wait time for a specific patient in queue
   */
  async predictWaitTime(queueEntryId: string): Promise<WaitTimePrediction> {
    const entry = await this.queueRepository.getQueueEntry(queueEntryId);
    if (!entry) {
      throw new Error('Queue entry not found');
    }

    // Get current queue state
    const currentQueue = await this.getCurrentQueue(entry.facilityId, entry.queueType);
    const patientsAhead = currentQueue.filter((e) => e.position < entry.position);

    // Get historical patterns
    const historicalPattern = await this.getHistoricalPattern(
      entry.facilityId,
      entry.queueType,
      new Date()
    );

    // Get staff availability factor
    const staffAvailability = await this.getStaffAvailabilityFactor(
      entry.facilityId,
      entry.queueType
    );

    // Calculate average service time
    const averageServiceTime = await this.calculateAverageServiceTime(
      entry.facilityId,
      entry.queueType
    );

    // Calculate priority adjustment
    const priorityAdjustment = this.calculatePriorityAdjustment(entry.priority, patientsAhead);

    // Predict wait time using weighted factors
    const baseWaitTime = patientsAhead.length * averageServiceTime;
    const historicalAdjustment = historicalPattern * 0.2; // 20% weight
    const staffAdjustment = (1 - staffAvailability) * averageServiceTime * 0.3; // 30% weight
    
    const predictedWaitTime = Math.max(
      0,
      baseWaitTime + historicalAdjustment + staffAdjustment - priorityAdjustment
    );

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence({
      queueLength: currentQueue.length,
      historicalDataPoints: historicalPattern > 0 ? 1 : 0,
      staffDataAvailable: staffAvailability > 0 ? 1 : 0,
    });

    return {
      patientId: entry.patientId,
      queueEntryId: entry.id,
      predictedWaitTime: Math.round(predictedWaitTime),
      confidence,
      factors: {
        currentQueueLength: patientsAhead.length,
        averageServiceTime,
        priorityAdjustment,
        historicalPattern,
        staffAvailability,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Update wait time predictions for all patients in queue
   */
  async updateAllWaitTimes(facilityId: string, queueType: QueueType): Promise<WaitTimePrediction[]> {
    const queue = await this.getCurrentQueue(facilityId, queueType);
    const predictions: WaitTimePrediction[] = [];

    for (const entry of queue) {
      try {
        const prediction = await this.predictWaitTime(entry.id);
        predictions.push(prediction);

        // Update the queue entry with new prediction
        await this.queueRepository.updateQueueEntry(entry.id, {
          estimatedWaitTime: prediction.predictedWaitTime,
          expectedServiceTime: new Date(
            entry.checkInTime.getTime() + prediction.predictedWaitTime * 60000
          ),
        });
      } catch (error) {
        console.error(`Failed to predict wait time for entry ${entry.id}:`, error);
      }
    }

    return predictions;
  }

  /**
   * Analyze historical wait time patterns
   */
  async analyzeHistoricalWaitTimes(
    facilityId: string,
    queueType: QueueType,
    startDate: Date,
    endDate: Date
  ): Promise<HistoricalWaitTimeData[]> {
    const allEntries = await this.queueRepository.getQueueByFacility(facilityId, queueType);
    
    // Filter entries within date range and completed
    const completedEntries = allEntries.filter(
      (e) =>
        e.status === QueueStatus.COMPLETED &&
        e.checkInTime >= startDate &&
        e.checkInTime <= endDate &&
        e.actualServiceTime &&
        e.completedTime
    );

    // Group by hour and day of week
    const groupedData = new Map<string, QueueEntry[]>();
    
    for (const entry of completedEntries) {
      const hour = entry.checkInTime.getHours();
      const dayOfWeek = entry.checkInTime.getDay();
      const key = `${dayOfWeek}-${hour}`;
      
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(entry);
    }

    // Calculate statistics for each group
    const historicalData: HistoricalWaitTimeData[] = [];
    
    for (const [key, entries] of groupedData) {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      
      const waitTimes = entries.map((e) => {
        const waitTime = (e.actualServiceTime!.getTime() - e.checkInTime.getTime()) / 60000;
        return waitTime;
      });
      
      const serviceTimes = entries.map((e) => {
        const serviceTime = (e.completedTime!.getTime() - e.actualServiceTime!.getTime()) / 60000;
        return serviceTime;
      });
      
      historicalData.push({
        facilityId,
        queueType,
        hour,
        dayOfWeek,
        averageWaitTime: this.calculateAverage(waitTimes),
        averageServiceTime: this.calculateAverage(serviceTimes),
        patientVolume: entries.length,
      });
    }

    // Cache the historical data
    const cacheKey = `${facilityId}-${queueType}`;
    this.historicalData.set(cacheKey, historicalData);

    return historicalData;
  }

  /**
   * Get real-time wait time updates for a facility
   */
  async getRealTimeWaitTimes(
    facilityId: string,
    queueType: QueueType
  ): Promise<{ queueEntry: QueueEntry; prediction: WaitTimePrediction }[]> {
    const queue = await this.getCurrentQueue(facilityId, queueType);
    const results: { queueEntry: QueueEntry; prediction: WaitTimePrediction }[] = [];

    for (const entry of queue) {
      try {
        const prediction = await this.predictWaitTime(entry.id);
        results.push({ queueEntry: entry, prediction });
      } catch (error) {
        console.error(`Failed to get wait time for entry ${entry.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Build wait time prediction model (simplified version)
   * In production, this would use ML models like XGBoost or LSTM
   */
  async buildPredictionModel(
    facilityId: string,
    queueType: QueueType
  ): Promise<{ accuracy: number; features: string[] }> {
    // Analyze last 30 days of data
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const historicalData = await this.analyzeHistoricalWaitTimes(
      facilityId,
      queueType,
      startDate,
      endDate
    );

    // Calculate model accuracy (simplified)
    // In production, this would involve train/test split and proper validation
    const accuracy = historicalData.length > 0 ? 0.85 : 0.5; // Placeholder

    const features = [
      'current_queue_length',
      'average_service_time',
      'priority_level',
      'hour_of_day',
      'day_of_week',
      'staff_availability',
      'historical_pattern',
    ];

    return { accuracy, features };
  }

  // Private helper methods

  private async getCurrentQueue(facilityId: string, queueType: QueueType): Promise<QueueEntry[]> {
    const entries = await this.queueRepository.getQueueByFacility(facilityId, queueType);
    return entries
      .filter((e) => e.status === QueueStatus.WAITING || e.status === QueueStatus.IN_PROGRESS)
      .sort((a, b) => a.position - b.position);
  }

  private async getHistoricalPattern(
    facilityId: string,
    queueType: QueueType,
    currentTime: Date
  ): Promise<number> {
    const cacheKey = `${facilityId}-${queueType}`;
    const historicalData = this.historicalData.get(cacheKey);

    if (!historicalData || historicalData.length === 0) {
      // Try to load historical data if not cached
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      await this.analyzeHistoricalWaitTimes(facilityId, queueType, startDate, endDate);
      return 0;
    }

    // Find matching historical pattern
    const hour = currentTime.getHours();
    const dayOfWeek = currentTime.getDay();
    
    const matchingData = historicalData.find(
      (d) => d.hour === hour && d.dayOfWeek === dayOfWeek
    );

    return matchingData ? matchingData.averageWaitTime : 0;
  }

  private async getStaffAvailabilityFactor(
    facilityId: string,
    queueType: QueueType
  ): Promise<number> {
    // In production, this would query staff scheduling system
    // For now, return a default value based on time of day
    const hour = new Date().getHours();
    
    // Peak hours (9 AM - 5 PM): higher availability
    if (hour >= 9 && hour <= 17) {
      return 0.9;
    }
    // Off-peak hours: lower availability
    return 0.6;
  }

  private async calculateAverageServiceTime(
    facilityId: string,
    queueType: QueueType
  ): Promise<number> {
    const allEntries = await this.queueRepository.getQueueByFacility(facilityId, queueType);
    
    const completedToday = allEntries.filter(
      (e) =>
        e.status === QueueStatus.COMPLETED &&
        e.actualServiceTime &&
        e.completedTime &&
        this.isToday(e.checkInTime)
    );

    if (completedToday.length === 0) {
      // Default service time based on queue type
      return queueType === QueueType.ED ? 20 : 15;
    }

    const serviceTimes = completedToday.map((e) => {
      const start = e.actualServiceTime!.getTime();
      const end = e.completedTime!.getTime();
      return (end - start) / 60000; // Convert to minutes
    });

    return this.calculateAverage(serviceTimes);
  }

  private calculatePriorityAdjustment(priority: Priority, patientsAhead: QueueEntry[]): number {
    // Critical patients get faster service
    if (priority === Priority.CRITICAL) {
      return 10; // 10 minutes reduction
    }
    
    // Urgent patients get moderate adjustment
    if (priority === Priority.URGENT) {
      return 5; // 5 minutes reduction
    }
    
    // Routine patients: no adjustment
    return 0;
  }

  private calculateConfidence(factors: {
    queueLength: number;
    historicalDataPoints: number;
    staffDataAvailable: number;
  }): number {
    let confidence = 0.5; // Base confidence

    // More data points increase confidence
    if (factors.queueLength > 0) confidence += 0.2;
    if (factors.historicalDataPoints > 0) confidence += 0.2;
    if (factors.staffDataAvailable > 0) confidence += 0.1;

    return Math.min(1.0, confidence);
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }
}
