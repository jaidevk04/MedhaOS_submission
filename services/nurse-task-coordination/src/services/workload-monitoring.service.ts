import { v4 as uuidv4 } from 'uuid';
import {
  Nurse,
  NurseTask,
  WorkloadMetrics,
  OverloadAlert,
  TaskStatus,
  NurseStatus,
} from '../types';
import { config } from '../config';
import { TaskRouterService } from './task-router.service';

/**
 * Workload Monitoring Service
 * 
 * Monitors nurse workload in real-time and triggers alerts/escalations
 * when workload exceeds safe thresholds
 * 
 * Requirements: 14.2, 14.3
 */
export class WorkloadMonitoringService {
  private taskRouter: TaskRouterService;
  private alerts: Map<string, OverloadAlert> = new Map();
  private workloadHistory: Map<string, WorkloadMetrics[]> = new Map();
  private alertCallbacks: Array<(alert: OverloadAlert) => void> = [];

  constructor(taskRouter: TaskRouterService) {
    this.taskRouter = taskRouter;
  }

  /**
   * Calculate comprehensive workload metrics for a nurse
   * Requirement 14.2: Nurse workload tracking
   */
  public calculateWorkloadMetrics(nurseId: string): WorkloadMetrics | null {
    const nurse = this.taskRouter.getNurse(nurseId);
    if (!nurse) {
      return null;
    }

    const nurseTasks = this.taskRouter.getTasksForNurse(nurseId);
    const allNurseTasks = this.taskRouter.getAllTasks().filter(
      (task) => task.assignedNurseId === nurseId
    );

    // Count tasks by status
    const pendingTasks = nurseTasks.filter((t) => t.status === TaskStatus.PENDING).length;
    const inProgressTasks = nurseTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const completedTasksToday = allNurseTasks.filter(
      (t) =>
        t.status === TaskStatus.COMPLETED &&
        t.completedAt &&
        this.isToday(t.completedAt)
    ).length;

    // Calculate average task completion time
    const completedTasks = allNurseTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED && t.completedAt && t.createdAt
    );
    
    let averageCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const duration = task.completedAt!.getTime() - task.createdAt.getTime();
        return sum + duration;
      }, 0);
      averageCompletionTime = totalTime / completedTasks.length / (1000 * 60); // Convert to minutes
    }

    // Calculate workload score (0-100)
    const workloadScore = this.calculateWorkloadScore(nurse, nurseTasks);

    // Determine if overloaded
    const isOverloaded = nurse.currentWorkload >= config.taskRouter.overloadAlertThreshold;

    const metrics: WorkloadMetrics = {
      nurseId: nurse.nurseId,
      nurseName: nurse.name,
      currentTasks: nurse.currentWorkload,
      pendingTasks,
      inProgressTasks,
      completedTasksToday,
      averageTaskCompletionTime: Math.round(averageCompletionTime),
      workloadScore,
      isOverloaded,
      lastUpdated: new Date(),
    };

    // Store in history
    const history = this.workloadHistory.get(nurseId) || [];
    history.push(metrics);
    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }
    this.workloadHistory.set(nurseId, history);

    return metrics;
  }

  /**
   * Calculate workload score considering multiple factors
   */
  private calculateWorkloadScore(nurse: Nurse, tasks: NurseTask[]): number {
    let score = 0;

    // Base score from task count (0-50 points)
    const taskRatio = nurse.currentWorkload / config.taskRouter.maxNurseWorkload;
    score += Math.min(taskRatio * 50, 50);

    // Add points for high-priority tasks (0-30 points)
    const criticalTasks = tasks.filter((t) => t.priority === 'CRITICAL').length;
    const urgentTasks = tasks.filter((t) => t.priority === 'URGENT').length;
    score += criticalTasks * 10;
    score += urgentTasks * 5;
    score = Math.min(score, 80); // Cap at 80 before time factor

    // Add points for overdue tasks (0-20 points)
    const overdueTasks = tasks.filter((t) => t.dueTime && t.dueTime < new Date()).length;
    score += overdueTasks * 5;

    return Math.min(score, 100);
  }

  /**
   * Check if a date is today
   */
  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Monitor all nurses and trigger alerts for overload conditions
   * Requirement 14.2: Alert system for overload conditions
   */
  public monitorAllNurses(): OverloadAlert[] {
    const nurses = this.taskRouter.getAllNurses();
    const newAlerts: OverloadAlert[] = [];

    for (const nurse of nurses) {
      // Skip off-duty nurses
      if (nurse.status === NurseStatus.OFF_DUTY) {
        continue;
      }

      const metrics = this.calculateWorkloadMetrics(nurse.nurseId);
      if (!metrics) {
        continue;
      }

      // Check if nurse is overloaded
      if (metrics.isOverloaded) {
        // Check if alert already exists and is unresolved
        const existingAlert = Array.from(this.alerts.values()).find(
          (alert) => alert.nurseId === nurse.nurseId && !alert.resolved
        );

        if (!existingAlert) {
          // Create new alert
          const severity = nurse.currentWorkload >= config.taskRouter.maxNurseWorkload + 2
            ? 'CRITICAL'
            : 'WARNING';

          const alert: OverloadAlert = {
            alertId: uuidv4(),
            nurseId: nurse.nurseId,
            nurseName: nurse.name,
            currentWorkload: nurse.currentWorkload,
            threshold: config.taskRouter.overloadAlertThreshold,
            severity,
            timestamp: new Date(),
            escalatedToChargeNurse: false,
            resolved: false,
          };

          this.alerts.set(alert.alertId, alert);
          newAlerts.push(alert);

          // Trigger callbacks
          this.alertCallbacks.forEach((callback) => callback(alert));

          // Auto-escalate critical alerts
          if (severity === 'CRITICAL') {
            this.escalateToChargeNurse(alert.alertId);
          }
        }
      } else {
        // Resolve any existing alerts for this nurse
        Array.from(this.alerts.values())
          .filter((alert) => alert.nurseId === nurse.nurseId && !alert.resolved)
          .forEach((alert) => {
            alert.resolved = true;
            this.alerts.set(alert.alertId, alert);
          });
      }
    }

    return newAlerts;
  }

  /**
   * Escalate alert to charge nurse
   * Requirement 14.3: Escalation to charge nurse
   */
  public async escalateToChargeNurse(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    // Find charge nurse
    const chargeNurse = this.taskRouter
      .getAllNurses()
      .find((nurse) => nurse.skillLevel === 'CHARGE' && nurse.status !== NurseStatus.OFF_DUTY);

    if (!chargeNurse) {
      console.error('No charge nurse available for escalation');
      return false;
    }

    // Mark alert as escalated
    alert.escalatedToChargeNurse = true;
    this.alerts.set(alertId, alert);

    // Trigger task redistribution
    await this.taskRouter.redistributeTasks(alert.nurseId);

    console.log(
      `Alert ${alertId} escalated to charge nurse ${chargeNurse.name}. ` +
      `Nurse ${alert.nurseName} has ${alert.currentWorkload} tasks (threshold: ${alert.threshold})`
    );

    return true;
  }

  /**
   * Get workload metrics for all nurses
   */
  public getAllWorkloadMetrics(): WorkloadMetrics[] {
    const nurses = this.taskRouter.getAllNurses();
    return nurses
      .map((nurse) => this.calculateWorkloadMetrics(nurse.nurseId))
      .filter((metrics): metrics is WorkloadMetrics => metrics !== null);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): OverloadAlert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Get all alerts
   */
  public getAllAlerts(): OverloadAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get alerts for a specific nurse
   */
  public getAlertsForNurse(nurseId: string): OverloadAlert[] {
    return Array.from(this.alerts.values()).filter((alert) => alert.nurseId === nurseId);
  }

  /**
   * Resolve an alert manually
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    this.alerts.set(alertId, alert);
    return true;
  }

  /**
   * Register a callback for new alerts
   */
  public onAlert(callback: (alert: OverloadAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get workload history for a nurse
   */
  public getWorkloadHistory(nurseId: string, limit: number = 50): WorkloadMetrics[] {
    const history = this.workloadHistory.get(nurseId) || [];
    return history.slice(-limit);
  }

  /**
   * Get workload trend (increasing, stable, decreasing)
   */
  public getWorkloadTrend(nurseId: string): 'INCREASING' | 'STABLE' | 'DECREASING' | 'UNKNOWN' {
    const history = this.getWorkloadHistory(nurseId, 10);
    if (history.length < 3) {
      return 'UNKNOWN';
    }

    const recent = history.slice(-3);
    const scores = recent.map((m) => m.workloadScore);

    const avgChange = (scores[2] - scores[0]) / 2;

    if (avgChange > 5) {
      return 'INCREASING';
    } else if (avgChange < -5) {
      return 'DECREASING';
    } else {
      return 'STABLE';
    }
  }

  /**
   * Predict if nurse will be overloaded in next N minutes
   */
  public predictOverload(nurseId: string, minutesAhead: number = 30): boolean {
    const nurse = this.taskRouter.getNurse(nurseId);
    if (!nurse) {
      return false;
    }

    const tasks = this.taskRouter.getTasksForNurse(nurseId);
    
    // Count tasks due in the next N minutes
    const upcomingTasks = tasks.filter((task) => {
      if (!task.dueTime) return false;
      const minutesUntilDue = (task.dueTime.getTime() - Date.now()) / (1000 * 60);
      return minutesUntilDue > 0 && minutesUntilDue <= minutesAhead;
    });

    const projectedWorkload = nurse.currentWorkload + upcomingTasks.length;
    return projectedWorkload >= config.taskRouter.overloadAlertThreshold;
  }
}
