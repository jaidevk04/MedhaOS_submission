import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { NurseCoordinationService } from '../services/nurse-coordination.service';
import { TaskType, TaskPriority, TaskStatus, NurseStatus } from '../types';

const router = Router();
const coordinationService = new NurseCoordinationService();

// Start monitoring on service initialization
coordinationService.startMonitoring(30);

/**
 * Validation middleware
 */
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/nurses/register
 * Register a new nurse
 */
router.post(
  '/register',
  [
    body('nurseId').isString().notEmpty(),
    body('name').isString().notEmpty(),
    body('skillLevel').isIn(['JUNIOR', 'INTERMEDIATE', 'SENIOR', 'CHARGE']),
    body('status').isIn(Object.values(NurseStatus)),
    body('shiftStart').isISO8601(),
    body('shiftEnd').isISO8601(),
  ],
  validate,
  (req: Request, res: Response) => {
    try {
      const nurse = {
        ...req.body,
        currentWorkload: 0,
        assignedPatients: [],
        shiftStart: new Date(req.body.shiftStart),
        shiftEnd: new Date(req.body.shiftEnd),
      };

      coordinationService.registerNurse(nurse);

      res.status(201).json({
        success: true,
        message: 'Nurse registered successfully',
        nurse,
      });
    } catch (error) {
      console.error('Error registering nurse:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register nurse',
      });
    }
  }
);

/**
 * GET /api/nurses
 * Get all nurses
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const nurses = coordinationService.getAllNurses();
    res.json({
      success: true,
      count: nurses.length,
      nurses,
    });
  } catch (error) {
    console.error('Error fetching nurses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nurses',
    });
  }
});

/**
 * GET /api/nurses/:nurseId
 * Get nurse by ID
 */
router.get('/:nurseId', (req: Request, res: Response) => {
  try {
    const nurse = coordinationService.getNurse(req.params.nurseId);
    if (!nurse) {
      return res.status(404).json({
        success: false,
        error: 'Nurse not found',
      });
    }

    res.json({
      success: true,
      nurse,
    });
  } catch (error) {
    console.error('Error fetching nurse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nurse',
    });
  }
});

/**
 * GET /api/nurses/:nurseId/tasks
 * Get tasks for a specific nurse
 */
router.get('/:nurseId/tasks', (req: Request, res: Response) => {
  try {
    const tasks = coordinationService.getTasksForNurse(req.params.nurseId);
    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Error fetching nurse tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nurse tasks',
    });
  }
});

/**
 * GET /api/nurses/:nurseId/workload
 * Get workload metrics for a nurse
 */
router.get('/:nurseId/workload', (req: Request, res: Response) => {
  try {
    const metrics = coordinationService.getWorkloadMetrics(req.params.nurseId);
    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Nurse not found',
      });
    }

    res.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching workload metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workload metrics',
    });
  }
});

/**
 * POST /api/tasks
 * Create and assign a new task
 */
router.post(
  '/tasks',
  [
    body('patientId').isString().notEmpty(),
    body('patientName').isString().notEmpty(),
    body('patientRoom').isString().notEmpty(),
    body('taskType').isIn(Object.values(TaskType)),
    body('priority').isIn(Object.values(TaskPriority)),
    body('description').isString().notEmpty(),
    body('estimatedDurationMinutes').isInt({ min: 1 }),
    body('dueTime').optional().isISO8601(),
    body('requiresBarcodeScan').optional().isBoolean(),
    body('medicationDetails').optional().isObject(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const taskData = {
        ...req.body,
        dueTime: req.body.dueTime ? new Date(req.body.dueTime) : undefined,
      };

      const result = await coordinationService.createAndAssignTask(taskData);

      res.status(201).json({
        success: true,
        message: 'Task created and assigned successfully',
        task: result.task,
        assignment: result.assignment,
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create task',
      });
    }
  }
);

/**
 * GET /api/tasks
 * Get all tasks
 */
router.get('/tasks', (req: Request, res: Response) => {
  try {
    const tasks = coordinationService.getAllTasks();
    res.json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
    });
  }
});

/**
 * GET /api/tasks/:taskId
 * Get task by ID
 */
router.get('/tasks/:taskId', (req: Request, res: Response) => {
  try {
    const task = coordinationService.getTask(req.params.taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
    });
  }
});

/**
 * PATCH /api/tasks/:taskId/status
 * Update task status
 */
router.patch(
  '/tasks/:taskId/status',
  [body('status').isIn(Object.values(TaskStatus))],
  validate,
  (req: Request, res: Response) => {
    try {
      const task = coordinationService.updateTaskStatus(
        req.params.taskId,
        req.body.status
      );

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found',
        });
      }

      res.json({
        success: true,
        message: 'Task status updated successfully',
        task,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task status',
      });
    }
  }
);

/**
 * GET /api/workload
 * Get workload metrics for all nurses
 */
router.get('/workload', (req: Request, res: Response) => {
  try {
    const metrics = coordinationService.getAllWorkloadMetrics();
    res.json({
      success: true,
      count: metrics.length,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching workload metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workload metrics',
    });
  }
});

/**
 * GET /api/alerts
 * Get active overload alerts
 */
router.get('/alerts', (req: Request, res: Response) => {
  try {
    const alerts = coordinationService.getActiveAlerts();
    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
    });
  }
});

/**
 * POST /api/nurses/:nurseId/redistribute
 * Manually trigger task redistribution for an overloaded nurse
 */
router.post('/:nurseId/redistribute', async (req: Request, res: Response) => {
  try {
    const redistributions = await coordinationService.redistributeTasks(
      req.params.nurseId
    );

    res.json({
      success: true,
      message: `Redistributed ${redistributions.length} tasks`,
      redistributions,
    });
  } catch (error) {
    console.error('Error redistributing tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to redistribute tasks',
    });
  }
});

/**
 * POST /api/high-acuity-patient
 * Assign tasks for a high-acuity patient to a senior nurse
 */
router.post(
  '/high-acuity-patient',
  [
    body('patientId').isString().notEmpty(),
    body('tasks').isArray().notEmpty(),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { patientId, tasks } = req.body;
      const assignments = await coordinationService.assignHighAcuityPatient(
        patientId,
        tasks
      );

      res.json({
        success: true,
        message: `Assigned ${assignments.length} tasks to senior nurse`,
        assignments,
      });
    } catch (error) {
      console.error('Error assigning high-acuity patient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign high-acuity patient',
      });
    }
  }
);

export default router;
