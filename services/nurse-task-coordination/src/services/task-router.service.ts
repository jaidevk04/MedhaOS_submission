import { v4 as uuidv4 } from 'uuid';
import {
  NurseTask,
  Nurse,
  TaskPriority,
  TaskStatus,
  TaskType,
  TaskAssignment,
  TaskRedistribution,
  TaskPrioritizationResult,
  NurseStatus,
} from '../types';
import { config } from '../config';

/**
 * Intelligent Task Router Service
 * 
 * Implements dynamic task prioritization and assignment based on:
 * - Clinical urgency
 * - Nurse availability and workload
 * - Nurse skill level
 * - Patient acuity
 * - Task type and complexity
 * 
 * Requirements: 14.1, 14.2, 14.3
 */
export class TaskRouterService {
  private tasks: Map<string, NurseTask> = new Map();
  private nurses: Map<string, Nurse> = new Map();
  private taskAssignments: TaskAssignment[] = [];
  private redistributions: TaskRedistribution[] = [];

  /**
   * Calculate priority score for a task
   * Higher score = higher priority
   */
  private calculatePriorityScore(task: NurseTask): number {
    let score = 0;

    // Base priority from task priority level
    switch (task.priority) {
      case TaskPriority.CRITICAL:
        score += config.taskRouter.criticalTaskPriority;
        break;
      case TaskPriority.URGENT:
        score += config.taskRouter.urgentTaskPriority;
        break;
      case TaskPriority.ROUTINE:
        score += config.taskRouter.routineTaskPriority;
        break;
      case TaskPriority.SCHEDULED:
        score += 25;
        break;
    }

    // Increase priority for time-sensitive tasks
    if (task.dueTime) {
      const minutesUntilDue = (task.dueTime.getTime() - Date.now()) / (1000 * 60);
      if (minutesUntilDue < 15) {
        score += 30; // Very urgent
      } else if (minutesUntilDue < 30) {
        score += 20; // Moderately urgent
      } else if (minutesUntilDue < 60) {
        score += 10; // Somewhat urgent
      }
    }

    // Increase priority for certain task types
    if (task.taskType === TaskType.EMERGENCY_RESPONSE) {
      score += 50;
    } else if (task.taskType === TaskType.MEDICATION_ADMINISTRATION) {
      score += 15;
    } else if (task.taskType === TaskType.VITAL_SIGNS_CHECK) {
      score += 10;
    }

    // Penalize overdue tasks (increase priority)
    if (task.dueTime && task.dueTime < new Date()) {
      const minutesOverdue = (Date.now() - task.dueTime.getTime()) / (1000 * 60);
      score += Math.min(minutesOverdue * 2, 50); // Cap at +50
    }

    return Math.min(score, 200); // Cap maximum score
  }

  /**
   * Calculate workload score for a nurse
   * Higher score = more overloaded
   */
  private calculateWorkloadScore(nurse: Nurse): number {
    const taskCount = nurse.currentWorkload;
    const maxWorkload = config.taskRouter.maxNurseWorkload;
    
    // Base score from task count
    let score = (taskCount / maxWorkload) * 100;

    // Adjust for nurse status
    if (nurse.status === NurseStatus.BUSY) {
      score += 20;
    } else if (nurse.status === NurseStatus.ON_BREAK) {
      score = 200; // Effectively unavailable
    } else if (nurse.status === NurseStatus.OFF_DUTY) {
      score = 300; // Completely unavailable
    }

    return score;
  }

  /**
   * Find the best nurse for a task based on multiple factors
   */
  private findBestNurse(task: NurseTask, availableNurses: Nurse[]): TaskPrioritizationResult | null {
    if (availableNurses.length === 0) {
      return null;
    }

    const scoredNurses = availableNurses.map((nurse) => {
      let score = 0;

      // Prefer nurses with lower workload
      const workloadScore = this.calculateWorkloadScore(nurse);
      score -= workloadScore; // Lower workload = higher score

      // Prefer nurses already assigned to this patient
      if (nurse.assignedPatients.includes(task.patientId)) {
        score += 30; // Continuity of care bonus
      }

      // Skill level matching
      if (task.priority === TaskPriority.CRITICAL) {
        if (nurse.skillLevel === 'SENIOR' || nurse.skillLevel === 'CHARGE') {
          score += 25;
        }
      } else if (task.priority === TaskPriority.URGENT) {
        if (nurse.skillLevel === 'INTERMEDIATE' || nurse.skillLevel === 'SENIOR') {
          score += 15;
        }
      }

      // Prefer available nurses
      if (nurse.status === NurseStatus.AVAILABLE) {
        score += 20;
      }

      // Location proximity (if available)
      if (nurse.currentLocation && task.patientRoom) {
        // Simple heuristic: same floor/wing
        if (nurse.currentLocation.startsWith(task.patientRoom.charAt(0))) {
          score += 10;
        }
      }

      return {
        nurse,
        score,
      };
    });

    // Sort by score (highest first)
    scoredNurses.sort((a, b) => b.score - a.score);

    const bestNurse = scoredNurses[0].nurse;
    const alternatives = scoredNurses.slice(1, 4).map((sn) => sn.nurse.nurseId);

    return {
      taskId: task.taskId,
      priorityScore: this.calculatePriorityScore(task),
      recommendedNurseId: bestNurse.nurseId,
      alternativeNurseIds: alternatives,
      reasoning: this.generateAssignmentReasoning(task, bestNurse, scoredNurses[0].score),
    };
  }

  /**
   * Generate human-readable reasoning for task assignment
   */
  private generateAssignmentReasoning(task: NurseTask, nurse: Nurse, score: number): string {
    const reasons: string[] = [];

    if (nurse.assignedPatients.includes(task.patientId)) {
      reasons.push('continuity of care');
    }

    if (nurse.currentWorkload < config.taskRouter.taskRedistributionThreshold) {
      reasons.push('available capacity');
    }

    if (task.priority === TaskPriority.CRITICAL && (nurse.skillLevel === 'SENIOR' || nurse.skillLevel === 'CHARGE')) {
      reasons.push('senior skill level for critical task');
    }

    if (nurse.status === NurseStatus.AVAILABLE) {
      reasons.push('currently available');
    }

    if (reasons.length === 0) {
      reasons.push('best available option');
    }

    return `Assigned based on: ${reasons.join(', ')}`;
  }

  /**
   * Assign a task to a nurse
   * Requirement 14.1: Dynamic task assignment based on urgency and workload
   */
  public async assignTask(task: NurseTask): Promise<TaskAssignment | null> {
    // Calculate priority score
    task.priorityScore = this.calculatePriorityScore(task);

    // Get available nurses
    const availableNurses = Array.from(this.nurses.values()).filter(
      (nurse) => nurse.status !== NurseStatus.OFF_DUTY
    );

    if (availableNurses.length === 0) {
      console.error('No available nurses for task assignment');
      return null;
    }

    // Find best nurse
    const result = this.findBestNurse(task, availableNurses);
    if (!result) {
      return null;
    }

    // Create assignment
    const assignment: TaskAssignment = {
      taskId: task.taskId,
      nurseId: result.recommendedNurseId,
      assignedAt: new Date(),
      reason: result.reasoning,
      confidence: 0.85, // High confidence in algorithm
    };

    // Update task
    task.assignedNurseId = result.recommendedNurseId;
    task.status = TaskStatus.ASSIGNED;
    task.updatedAt = new Date();
    this.tasks.set(task.taskId, task);

    // Update nurse workload
    const nurse = this.nurses.get(result.recommendedNurseId);
    if (nurse) {
      nurse.currentWorkload += 1;
      if (!nurse.assignedPatients.includes(task.patientId)) {
        nurse.assignedPatients.push(task.patientId);
      }
      this.nurses.set(nurse.nurseId, nurse);
    }

    // Store assignment
    this.taskAssignments.push(assignment);

    return assignment;
  }

  /**
   * Prioritize multiple tasks
   * Requirement 14.1: Task prioritization algorithm
   */
  public prioritizeTasks(tasks: NurseTask[]): NurseTask[] {
    // Calculate priority scores for all tasks
    tasks.forEach((task) => {
      task.priorityScore = this.calculatePriorityScore(task);
    });

    // Sort by priority score (highest first)
    return tasks.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Redistribute tasks when a nurse becomes overloaded
   * Requirement 14.2: Real-time task redistribution
   */
  public async redistributeTasks(overloadedNurseId: string): Promise<TaskRedistribution[]> {
    const overloadedNurse = this.nurses.get(overloadedNurseId);
    if (!overloadedNurse) {
      return [];
    }

    // Get tasks assigned to overloaded nurse
    const nurseTasks = Array.from(this.tasks.values()).filter(
      (task) =>
        task.assignedNurseId === overloadedNurseId &&
        (task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.PENDING)
    );

    // Sort by priority (lowest priority tasks will be redistributed first)
    const sortedTasks = this.prioritizeTasks(nurseTasks);
    sortedTasks.reverse(); // Lowest priority first

    // Get other available nurses
    const availableNurses = Array.from(this.nurses.values()).filter(
      (nurse) =>
        nurse.nurseId !== overloadedNurseId &&
        nurse.status !== NurseStatus.OFF_DUTY &&
        nurse.currentWorkload < config.taskRouter.taskRedistributionThreshold
    );

    const redistributions: TaskRedistribution[] = [];

    // Redistribute tasks until workload is acceptable
    for (const task of sortedTasks) {
      if (overloadedNurse.currentWorkload <= config.taskRouter.taskRedistributionThreshold) {
        break; // Workload is now acceptable
      }

      const result = this.findBestNurse(task, availableNurses);
      if (!result) {
        continue; // No suitable nurse found
      }

      // Create redistribution record
      const redistribution: TaskRedistribution = {
        taskId: task.taskId,
        fromNurseId: overloadedNurseId,
        toNurseId: result.recommendedNurseId,
        reason: `Workload balancing: ${result.reasoning}`,
        timestamp: new Date(),
      };

      // Update task assignment
      task.assignedNurseId = result.recommendedNurseId;
      task.updatedAt = new Date();
      this.tasks.set(task.taskId, task);

      // Update nurse workloads
      overloadedNurse.currentWorkload -= 1;
      const newNurse = this.nurses.get(result.recommendedNurseId);
      if (newNurse) {
        newNurse.currentWorkload += 1;
        if (!newNurse.assignedPatients.includes(task.patientId)) {
          newNurse.assignedPatients.push(task.patientId);
        }
        this.nurses.set(newNurse.nurseId, newNurse);
      }

      redistributions.push(redistribution);
      this.redistributions.push(redistribution);
    }

    this.nurses.set(overloadedNurseId, overloadedNurse);

    return redistributions;
  }

  /**
   * Handle high-acuity patient admission
   * Requirement 14.2: Prioritize assignments to experienced nurses
   */
  public async assignHighAcuityPatient(patientId: string, tasks: NurseTask[]): Promise<TaskAssignment[]> {
    // Get senior nurses
    const seniorNurses = Array.from(this.nurses.values()).filter(
      (nurse) =>
        (nurse.skillLevel === 'SENIOR' || nurse.skillLevel === 'CHARGE') &&
        nurse.status !== NurseStatus.OFF_DUTY
    );

    if (seniorNurses.length === 0) {
      // Fallback to any available nurse
      return Promise.all(tasks.map((task) => this.assignTask(task))).then((results) =>
        results.filter((r): r is TaskAssignment => r !== null)
      );
    }

    // Find nurse with lowest workload
    seniorNurses.sort((a, b) => a.currentWorkload - b.currentWorkload);
    const assignedNurse = seniorNurses[0];

    // Assign all tasks to this nurse for continuity
    const assignments: TaskAssignment[] = [];
    for (const task of tasks) {
      task.assignedNurseId = assignedNurse.nurseId;
      task.status = TaskStatus.ASSIGNED;
      task.updatedAt = new Date();
      this.tasks.set(task.taskId, task);

      const assignment: TaskAssignment = {
        taskId: task.taskId,
        nurseId: assignedNurse.nurseId,
        assignedAt: new Date(),
        reason: 'High-acuity patient assigned to senior nurse',
        confidence: 0.9,
      };

      assignments.push(assignment);
      this.taskAssignments.push(assignment);
    }

    // Update nurse workload
    assignedNurse.currentWorkload += tasks.length;
    if (!assignedNurse.assignedPatients.includes(patientId)) {
      assignedNurse.assignedPatients.push(patientId);
    }
    this.nurses.set(assignedNurse.nurseId, assignedNurse);

    return assignments;
  }

  /**
   * Get tasks for a specific nurse
   */
  public getTasksForNurse(nurseId: string): NurseTask[] {
    return Array.from(this.tasks.values())
      .filter((task) => task.assignedNurseId === nurseId && task.status !== TaskStatus.COMPLETED)
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Update task status
   */
  public updateTaskStatus(taskId: string, status: TaskStatus): NurseTask | null {
    const task = this.tasks.get(taskId);
    if (!task) {
      return null;
    }

    const previousStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();

    if (status === TaskStatus.COMPLETED) {
      task.completedAt = new Date();
      
      // Update nurse workload
      if (task.assignedNurseId) {
        const nurse = this.nurses.get(task.assignedNurseId);
        if (nurse && nurse.currentWorkload > 0) {
          nurse.currentWorkload -= 1;
          this.nurses.set(nurse.nurseId, nurse);
        }
      }
    }

    this.tasks.set(taskId, task);
    return task;
  }

  /**
   * Register a nurse in the system
   */
  public registerNurse(nurse: Nurse): void {
    this.nurses.set(nurse.nurseId, nurse);
  }

  /**
   * Update nurse status
   */
  public updateNurseStatus(nurseId: string, status: NurseStatus): Nurse | null {
    const nurse = this.nurses.get(nurseId);
    if (!nurse) {
      return null;
    }

    nurse.status = status;
    this.nurses.set(nurseId, nurse);
    return nurse;
  }

  /**
   * Create a new task
   */
  public createTask(taskData: Omit<NurseTask, 'taskId' | 'createdAt' | 'updatedAt' | 'status' | 'priorityScore'>): NurseTask {
    const task: NurseTask = {
      ...taskData,
      taskId: uuidv4(),
      status: TaskStatus.PENDING,
      priorityScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    task.priorityScore = this.calculatePriorityScore(task);
    this.tasks.set(task.taskId, task);
    return task;
  }

  /**
   * Get all tasks
   */
  public getAllTasks(): NurseTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get all nurses
   */
  public getAllNurses(): Nurse[] {
    return Array.from(this.nurses.values());
  }

  /**
   * Get task by ID
   */
  public getTask(taskId: string): NurseTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get nurse by ID
   */
  public getNurse(nurseId: string): Nurse | undefined {
    return this.nurses.get(nurseId);
  }
}
