import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3012', 10),
  wsPort: parseInt(process.env.WS_PORT || '3013', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/medhaos',
  },
  
  dynamodb: {
    region: process.env.AWS_REGION || 'ap-south-1',
    endpoint: process.env.DYNAMODB_ENDPOINT,
    tasksTable: process.env.DYNAMODB_TASKS_TABLE || 'nurse-tasks',
    workloadTable: process.env.DYNAMODB_WORKLOAD_TABLE || 'nurse-workload',
  },
  
  taskRouter: {
    maxNurseWorkload: parseInt(process.env.MAX_NURSE_WORKLOAD || '8', 10),
    taskRedistributionThreshold: parseInt(process.env.TASK_REDISTRIBUTION_THRESHOLD || '7', 10),
    criticalTaskPriority: parseInt(process.env.CRITICAL_TASK_PRIORITY || '100', 10),
    urgentTaskPriority: parseInt(process.env.URGENT_TASK_PRIORITY || '75', 10),
    routineTaskPriority: parseInt(process.env.ROUTINE_TASK_PRIORITY || '50', 10),
    overloadAlertThreshold: parseInt(process.env.OVERLOAD_ALERT_THRESHOLD || '8', 10),
    escalationTimeoutMinutes: parseInt(process.env.ESCALATION_TIMEOUT_MINUTES || '5', 10),
  },
};
