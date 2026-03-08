import { v4 as uuidv4 } from 'uuid';
import { QueueDynamoRepository } from '@medhaos/database/dynamodb';
import {
  QueueEntry,
  QueueType,
  QueueStatus,
  Priority,
  QueueMetrics,
  ReorderRequest,
  ReorderResult,
} from '../types';

export class QueueManagementService {
  private queueRepository: QueueDynamoRepository;
  private reorderIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.queueRepository = new QueueDynamoRepository();
  }

  /**
   * Add a patient to the queue
   */
  async addToQueue(data: {
    patientId: string;
    facilityId: string;
    queueType: QueueType;
    urgencyScore: number;
    specialty?: string;
    chiefComplaint?: string;
    metadata?: Record<string, any>;
  }): Promise<QueueEntry> {
    const priority = this.calculatePriority(data.urgencyScore);
    const checkInTime = new Date();

    // Get current queue for position calculation
    const currentQueue = await this.getQueue(data.facilityId, data.queueType);
    const position = this.calculateInitialPosition(currentQueue, priority, data.urgencyScore);

    const queueEntry: QueueEntry = {
      id: uuidv4(),
      patientId: data.patientId,
      facilityId: data.facilityId,
      queueType: data.queueType,
      priority,
      urgencyScore: data.urgencyScore,
      status: QueueStatus.WAITING,
      position,
      estimatedWaitTime: 0, // Will be calculated
      checkInTime,
      expectedServiceTime: checkInTime,
      specialty: data.specialty,
      chiefComplaint: data.chiefComplaint,
      metadata: data.metadata,
    };

    // Calculate estimated wait time
    queueEntry.estimatedWaitTime = await this.calculateEstimatedWaitTime(
      data.facilityId,
      data.queueType,
      position
    );
    queueEntry.expectedServiceTime = new Date(
      checkInTime.getTime() + queueEntry.estimatedWaitTime * 60000
    );

    // Save to DynamoDB
    await this.queueRepository.createQueueEntry(queueEntry);

    // Trigger queue reordering if needed
    await this.triggerReorderIfNeeded(data.facilityId, data.queueType);

    return queueEntry;
  }

  /**
   * Get current queue for a facility
   */
  async getQueue(facilityId: string, queueType: QueueType): Promise<QueueEntry[]> {
    const entries = await this.queueRepository.getQueueByFacility(facilityId, queueType);
    return entries
      .filter((e) => e.status === QueueStatus.WAITING || e.status === QueueStatus.IN_PROGRESS)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Get queue position for a specific patient
   */
  async getQueuePosition(queueEntryId: string): Promise<QueueEntry | null> {
    return await this.queueRepository.getQueueEntry(queueEntryId);
  }

  /**
   * Update queue entry status
   */
  async updateQueueStatus(
    queueEntryId: string,
    status: QueueStatus,
    assignedProviderId?: string
  ): Promise<QueueEntry> {
    const entry = await this.queueRepository.getQueueEntry(queueEntryId);
    if (!entry) {
      throw new Error('Queue entry not found');
    }

    const updates: Partial<QueueEntry> = { status };

    if (status === QueueStatus.IN_PROGRESS) {
      updates.actualServiceTime = new Date();
      if (assignedProviderId) {
        updates.assignedProviderId = assignedProviderId;
      }
    } else if (status === QueueStatus.COMPLETED || status === QueueStatus.CANCELLED) {
      updates.completedTime = new Date();
    }

    const updatedEntry = await this.queueRepository.updateQueueEntry(queueEntryId, updates);

    // Reorder queue after status change
    await this.reorderQueue({ facilityId: entry.facilityId, queueType: entry.queueType, reason: 'status_change' });

    return updatedEntry;
  }

  /**
   * Reorder queue based on priority and urgency
   */
  async reorderQueue(request: ReorderRequest): Promise<ReorderResult> {
    const queue = await this.getQueue(request.facilityId, request.queueType);
    
    if (queue.length === 0) {
      return {
        facilityId: request.facilityId,
        queueType: request.queueType,
        reorderedCount: 0,
        averageWaitTimeReduction: 0,
        timestamp: new Date(),
      };
    }

    // Calculate current average wait time
    const currentAvgWaitTime = queue.reduce((sum, e) => sum + e.estimatedWaitTime, 0) / queue.length;

    // Sort by priority and urgency score
    const reorderedQueue = this.sortQueueByPriority(queue);

    // Update positions and recalculate wait times
    let reorderedCount = 0;
    for (let i = 0; i < reorderedQueue.length; i++) {
      const entry = reorderedQueue[i];
      const newPosition = i + 1;

      if (entry.position !== newPosition) {
        reorderedCount++;
      }

      const newWaitTime = await this.calculateEstimatedWaitTime(
        request.facilityId,
        request.queueType,
        newPosition
      );

      await this.queueRepository.updateQueueEntry(entry.id, {
        position: newPosition,
        estimatedWaitTime: newWaitTime,
        expectedServiceTime: new Date(entry.checkInTime.getTime() + newWaitTime * 60000),
      });
    }

    // Calculate new average wait time
    const newQueue = await this.getQueue(request.facilityId, request.queueType);
    const newAvgWaitTime = newQueue.reduce((sum, e) => sum + e.estimatedWaitTime, 0) / newQueue.length;

    return {
      facilityId: request.facilityId,
      queueType: request.queueType,
      reorderedCount,
      averageWaitTimeReduction: currentAvgWaitTime - newAvgWaitTime,
      timestamp: new Date(),
    };
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(facilityId: string, queueType: QueueType): Promise<QueueMetrics> {
    const allEntries = await this.queueRepository.getQueueByFacility(facilityId, queueType);
    
    const waitingPatients = allEntries.filter((e) => e.status === QueueStatus.WAITING);
    const inProgressPatients = allEntries.filter((e) => e.status === QueueStatus.IN_PROGRESS);
    const completedToday = allEntries.filter(
      (e) =>
        e.status === QueueStatus.COMPLETED &&
        e.completedTime &&
        this.isToday(e.completedTime)
    );

    // Calculate wait times
    const waitTimes = waitingPatients.map((e) => e.estimatedWaitTime);
    const averageWaitTime = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
    const medianWaitTime = this.calculateMedian(waitTimes);
    const longestWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    // Calculate service times
    const serviceTimes = completedToday
      .filter((e) => e.actualServiceTime && e.completedTime)
      .map((e) => {
        const start = e.actualServiceTime!.getTime();
        const end = e.completedTime!.getTime();
        return (end - start) / 60000; // Convert to minutes
      });
    const averageServiceTime = serviceTimes.length > 0 ? serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length : 0;

    // Calculate throughput (patients per hour)
    const throughputPerHour = completedToday.length / 24; // Simplified

    return {
      facilityId,
      queueType,
      totalPatients: allEntries.length,
      waitingPatients: waitingPatients.length,
      inProgressPatients: inProgressPatients.length,
      averageWaitTime,
      medianWaitTime,
      longestWaitTime,
      averageServiceTime,
      throughputPerHour,
      timestamp: new Date(),
    };
  }

  /**
   * Start automatic queue reordering
   */
  startAutoReorder(facilityId: string, queueType: QueueType, intervalMs: number): void {
    const key = `${facilityId}-${queueType}`;
    
    // Clear existing interval if any
    if (this.reorderIntervals.has(key)) {
      clearInterval(this.reorderIntervals.get(key)!);
    }

    // Set up new interval
    const interval = setInterval(async () => {
      try {
        await this.reorderQueue({ facilityId, queueType, reason: 'automatic' });
      } catch (error) {
        console.error(`Auto-reorder failed for ${key}:`, error);
      }
    }, intervalMs);

    this.reorderIntervals.set(key, interval);
  }

  /**
   * Stop automatic queue reordering
   */
  stopAutoReorder(facilityId: string, queueType: QueueType): void {
    const key = `${facilityId}-${queueType}`;
    if (this.reorderIntervals.has(key)) {
      clearInterval(this.reorderIntervals.get(key)!);
      this.reorderIntervals.delete(key);
    }
  }

  // Private helper methods

  private calculatePriority(urgencyScore: number): Priority {
    if (urgencyScore >= 70) return Priority.CRITICAL;
    if (urgencyScore >= 40) return Priority.URGENT;
    return Priority.ROUTINE;
  }

  private calculateInitialPosition(
    currentQueue: QueueEntry[],
    priority: Priority,
    urgencyScore: number
  ): number {
    if (currentQueue.length === 0) return 1;

    // Find position based on priority and urgency score
    let position = 1;
    for (const entry of currentQueue) {
      if (this.shouldInsertBefore(priority, urgencyScore, entry.priority, entry.urgencyScore)) {
        break;
      }
      position++;
    }

    return position;
  }

  private shouldInsertBefore(
    newPriority: Priority,
    newUrgency: number,
    existingPriority: Priority,
    existingUrgency: number
  ): boolean {
    const priorityOrder = { CRITICAL: 3, URGENT: 2, ROUTINE: 1, SCHEDULED: 0 };
    
    if (priorityOrder[newPriority] > priorityOrder[existingPriority]) {
      return true;
    }
    
    if (priorityOrder[newPriority] === priorityOrder[existingPriority]) {
      return newUrgency > existingUrgency;
    }
    
    return false;
  }

  private sortQueueByPriority(queue: QueueEntry[]): QueueEntry[] {
    return [...queue].sort((a, b) => {
      const priorityOrder = { CRITICAL: 3, URGENT: 2, ROUTINE: 1, SCHEDULED: 0 };
      
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by urgency score
      const urgencyDiff = b.urgencyScore - a.urgencyScore;
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Finally by check-in time (FIFO for same priority/urgency)
      return a.checkInTime.getTime() - b.checkInTime.getTime();
    });
  }

  private async calculateEstimatedWaitTime(
    facilityId: string,
    queueType: QueueType,
    position: number
  ): Promise<number> {
    // Get historical average service time
    const metrics = await this.getQueueMetrics(facilityId, queueType);
    const avgServiceTime = metrics.averageServiceTime || 15; // Default 15 minutes

    // Simple calculation: position * average service time
    // In production, this would use ML model for better prediction
    return Math.round(position * avgServiceTime);
  }

  private async triggerReorderIfNeeded(facilityId: string, queueType: QueueType): Promise<void> {
    const queue = await this.getQueue(facilityId, queueType);
    
    // Trigger reorder if there are critical patients not at the front
    const hasCriticalNotFirst = queue.some(
      (e, index) => e.priority === Priority.CRITICAL && index > 0
    );
    
    if (hasCriticalNotFirst) {
      await this.reorderQueue({ facilityId, queueType, reason: 'critical_patient_added' });
    }
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
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
