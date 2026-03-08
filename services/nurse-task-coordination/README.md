# Nurse Task Coordination System

Intelligent task routing and workload management system for nursing staff in MedhaOS Healthcare Platform.

## Overview

The Nurse Task Coordination System implements:

1. **Intelligent Task Router** - Dynamic task prioritization and assignment based on urgency, nurse workload, and skill level
2. **Workload Monitoring** - Real-time tracking of nurse workload with automated alerts and escalation
3. **Task Redistribution** - Automatic rebalancing of tasks when nurses become overloaded

## Features

### Task Prioritization Algorithm
- Multi-factor priority scoring (urgency, due time, task type)
- Dynamic priority adjustment based on overdue status
- Emergency task handling with highest priority

### Dynamic Task Assignment
- Considers nurse availability and current workload
- Matches task complexity with nurse skill level
- Prioritizes continuity of care (same nurse for same patient)
- Location-aware assignment when possible

### Real-Time Workload Monitoring
- Continuous tracking of nurse task load
- Workload score calculation (0-100)
- Predictive overload detection
- Historical workload trending

### Automated Alerts and Escalation
- WARNING alerts when workload exceeds threshold
- CRITICAL alerts for severe overload
- Automatic escalation to charge nurse
- Task redistribution triggers

## Requirements Addressed

- **Requirement 14.1**: Intelligent task prioritization and dynamic assignment
- **Requirement 14.2**: Real-time task redistribution and workload tracking
- **Requirement 14.3**: Alert system and escalation to charge nurse

## API Endpoints

### Nurse Management

#### Register Nurse
```http
POST /api/nurses/register
Content-Type: application/json

{
  "nurseId": "nurse-001",
  "name": "Jane Doe",
  "skillLevel": "SENIOR",
  "status": "AVAILABLE",
  "shiftStart": "2024-01-01T08:00:00Z",
  "shiftEnd": "2024-01-01T20:00:00Z"
}
```

#### Get All Nurses
```http
GET /api/nurses
```

#### Get Nurse by ID
```http
GET /api/nurses/:nurseId
```

#### Get Nurse Tasks
```http
GET /api/nurses/:nurseId/tasks
```

#### Get Nurse Workload
```http
GET /api/nurses/:nurseId/workload
```

### Task Management

#### Create and Assign Task
```http
POST /api/nurses/tasks
Content-Type: application/json

{
  "patientId": "patient-001",
  "patientName": "John Smith",
  "patientRoom": "ICU-201",
  "taskType": "MEDICATION_ADMINISTRATION",
  "priority": "URGENT",
  "description": "Administer insulin 10 units",
  "estimatedDurationMinutes": 15,
  "dueTime": "2024-01-01T14:00:00Z",
  "requiresBarcodeScan": true,
  "medicationDetails": {
    "medicationName": "Insulin",
    "dosage": "10 units",
    "route": "subcutaneous",
    "barcode": "12345678"
  }
}
```

#### Get All Tasks
```http
GET /api/nurses/tasks
```

#### Get Task by ID
```http
GET /api/nurses/tasks/:taskId
```

#### Update Task Status
```http
PATCH /api/nurses/tasks/:taskId/status
Content-Type: application/json

{
  "status": "COMPLETED"
}
```

### Workload Management

#### Get All Workload Metrics
```http
GET /api/nurses/workload
```

#### Get Active Alerts
```http
GET /api/nurses/alerts
```

#### Manually Redistribute Tasks
```http
POST /api/nurses/:nurseId/redistribute
```

#### Assign High-Acuity Patient
```http
POST /api/nurses/high-acuity-patient
Content-Type: application/json

{
  "patientId": "patient-002",
  "tasks": [
    {
      "patientId": "patient-002",
      "patientName": "Emergency Patient",
      "patientRoom": "ED-101",
      "taskType": "EMERGENCY_RESPONSE",
      "priority": "CRITICAL",
      "description": "Stabilize patient",
      "estimatedDurationMinutes": 30
    }
  ]
}
```

## Task Types

- `MEDICATION_ADMINISTRATION` - Administering medications
- `VITAL_SIGNS_CHECK` - Checking vital signs
- `WOUND_CARE` - Wound dressing and care
- `PATIENT_ASSESSMENT` - Patient assessment
- `IV_MANAGEMENT` - IV line management
- `PATIENT_TRANSPORT` - Transporting patients
- `DOCUMENTATION` - Clinical documentation
- `PATIENT_EDUCATION` - Patient education
- `SPECIMEN_COLLECTION` - Collecting specimens
- `EMERGENCY_RESPONSE` - Emergency situations

## Task Priorities

- `CRITICAL` (100 points) - Immediate attention required
- `URGENT` (75 points) - Attention needed soon
- `ROUTINE` (50 points) - Standard care tasks
- `SCHEDULED` (25 points) - Scheduled activities

## Nurse Skill Levels

- `JUNIOR` - Entry-level nurses
- `INTERMEDIATE` - Experienced nurses
- `SENIOR` - Highly experienced nurses
- `CHARGE` - Charge nurses (supervisory)

## Configuration

Environment variables (see `.env.example`):

```env
# Task Router Configuration
MAX_NURSE_WORKLOAD=8                    # Maximum tasks per nurse
TASK_REDISTRIBUTION_THRESHOLD=7         # Trigger redistribution at this level
CRITICAL_TASK_PRIORITY=100              # Priority score for critical tasks
URGENT_TASK_PRIORITY=75                 # Priority score for urgent tasks
ROUTINE_TASK_PRIORITY=50                # Priority score for routine tasks

# Alert Configuration
OVERLOAD_ALERT_THRESHOLD=8              # Alert when workload reaches this
ESCALATION_TIMEOUT_MINUTES=5            # Time before escalation
```

## Algorithm Details

### Priority Score Calculation

```
Base Score (by priority level):
- CRITICAL: 100
- URGENT: 75
- ROUTINE: 50
- SCHEDULED: 25

Time-based adjustments:
- Due in < 15 min: +30
- Due in < 30 min: +20
- Due in < 60 min: +10
- Overdue: +2 per minute (max +50)

Task type adjustments:
- EMERGENCY_RESPONSE: +50
- MEDICATION_ADMINISTRATION: +15
- VITAL_SIGNS_CHECK: +10

Maximum score: 200
```

### Nurse Selection Algorithm

```
Nurse Score Calculation:
- Base: -(workload_score)
- Same patient: +30
- Skill match (critical task + senior nurse): +25
- Skill match (urgent task + intermediate/senior): +15
- Available status: +20
- Same location/floor: +10

Best nurse = highest score
```

### Workload Score Calculation

```
Workload Score (0-100):
- Task count ratio: (current_tasks / max_tasks) * 50
- Critical tasks: +10 per task
- Urgent tasks: +5 per task
- Overdue tasks: +5 per task
- Cap at 100
```

## Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Run in Production
```bash
npm start
```

### Type Check
```bash
npm run type-check
```

## Integration

This service integrates with:
- **Supervisor Agent** - Receives task creation events
- **Patient Management System** - Patient data
- **EHR System** - Clinical documentation
- **Notification Service** - Alert delivery
- **WebSocket Server** - Real-time updates to nurse tablets

## Monitoring

The service provides:
- Real-time workload metrics
- Alert history
- Task completion statistics
- Redistribution logs
- Workload trends

## Future Enhancements

- Machine learning for workload prediction
- Integration with nurse location tracking
- Shift handoff optimization
- Burnout risk prediction
- Performance analytics dashboard
