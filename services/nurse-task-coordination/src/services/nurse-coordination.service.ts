import { TaskRouterService } from './task-router.service';
import { WorkloadMonitoringService } from './workload-monitoring.service';
import {
  NurseTask,
  Nurse,
  TaskAssignment,
  WorkloadMetrics,
  OverloadAlert,
  TaskStatus,
} from '../types';

/**
 * Main Nurse Task Coordination Service
 * 
 * Orchestrates task routing and workload monitoring
 */
export class NurseCoordinationService {
  private taskRouter: TaskRouterService;
  private workloadMonitor: WorkloadMonitoringService;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.taskRouter = new TaskRouterService();
    this.workloadMonitor = new WorkloadMonitoringService(this.taskRouter);

    // Set up alert handler
    this.workloadMonitor.onAlert((alert) => {
      console.log(`⚠️  Workload Alert: ${alert.nurseName} is ${alert.severity} overloaded`);
      console.log(`   Current workload: ${alert.currentWorkload} tasks (threshold: ${alert.threshold})`);
    });
  }

  /**
   * Start real-time monitoring
   */
  public startMonitoring(intervalSeconds: number = 30): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    console.log(`Starting workload monitoring (interval: ${intervalSeconds}s)`);
    
    this.monitoringInterval = setInterval(() => {
      this.workloadMonitor.monitorAllNurses();
    }, intervalSeconds * 1000);
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Workload monitoring stopped');
    }
  }

  /**
   * Create and assign a new task
   */
  public async createAndAssignTask(
    taskData: Omit<NurseTask, 'taskId' | 'createdAt' | 'updatedAt' | 'status' | 'priorityScore'>
  ): Promise<{ task: NurseTask; assignment: TaskAssignment | null }> {
    // Create task
    const task = this.taskRouter.createTask(taskData);

    // Assign task
    const assignment = await this.taskRouter.assignTask(task);

    // Check if assignment caused overload
    if (assignment) {
      const metrics = this.workloadMonitor.calculateWorkloadMetrics(assignment.nurseId);
      if (metrics?.isOverloaded) {
        // Trigger immediate monitoring check
        this.workloadMonitor.monitorAllNurses();
      }
    }

    return { task, assignment };
  }

  /**
   * Update task status
   */
  public updateTaskStatus(taskId: string, status: TaskStatus): NurseTask | null {
    const task = this.taskRouter.updateTaskStatus(taskId, status);
    
    if (task && task.assignedNurseId) {
      // Recalculate workload metrics
      this.workloadMonitor.calculateWorkloadMetrics(task.assignedNurseId);
    }

    return task;
  }

  /**
   * Register a nurse
   */
  public registerNurse(nurse: Nurse): void {
    this.taskRouter.registerNurse(nurse);
  }

  /**
   * Get tasks for a nurse (prioritized)
   */
  public getTasksForNurse(nurseId: string): NurseTask[] {
    return this.taskRouter.getTasksForNurse(nurseId);
  }

  /**
   * Get workload metrics for a nurse
   */
  public getWorkloadMetrics(nurseId: string): WorkloadMetrics | null {
    return this.workloadMonitor.calculateWorkloadMetrics(nurseId);
  }

  /**
   * Get all workload metrics
   */
  public getAllWorkloadMetrics(): WorkloadMetrics[] {
    return this.workloadMonitor.getAllWorkloadMetrics();
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): OverloadAlert[] {
    return this.workloadMonitor.getActiveAlerts();
  }

  /**
   * Get all nurses
   */
  public getAllNurses(): Nurse[] {
    return this.taskRouter.getAllNurses();
  }

  /**
   * Get all tasks
   */
  public getAllTasks(): NurseTask[] {
    return this.taskRouter.getAllTasks();
  }

  /**
   * Get task by ID
   */
  public getTask(taskId: string): NurseTask | undefined {
    return this.taskRouter.getTask(taskId);
  }

  /**
   * Get nurse by ID
   */
  public getNurse(nurseId: string): Nurse | undefined {
    return this.taskRouter.getNurse(nurseId);
  }

  /**
   * Manually trigger task redistribution
   */
  public async redistributeTasks(nurseId: string) {
    return this.taskRouter.redistributeTasks(nurseId);
  }

  /**
   * Handle high-acuity patient admission
   */
  public async assignHighAcuityPatient(patientId: string, tasks: NurseTask[]) {
    return this.taskRouter.assignHighAcuityPatient(patientId, tasks);
  }
}
