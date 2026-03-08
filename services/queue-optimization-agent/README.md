# Queue Optimization Agent

The Queue Optimization Agent is a core component of the MedhaOS Healthcare Intelligence Ecosystem, responsible for managing ED/OPD queues, predicting wait times, and scheduling appointments.

## Features

### Queue Management
- **Dynamic Queue Ordering**: Automatically reorders queues based on urgency scores and priority levels
- **Real-time Position Tracking**: Provides patients with up-to-date queue position information
- **Priority Handling**: Supports CRITICAL, URGENT, ROUTINE, and SCHEDULED priority levels
- **Queue Metrics**: Tracks average wait times, throughput, and queue performance

### Wait Time Prediction
- **Historical Analysis**: Analyzes past wait time patterns by hour and day of week
- **Multi-factor Prediction**: Considers queue length, service times, priority, and staff availability
- **Confidence Scoring**: Provides confidence levels for predictions
- **Real-time Updates**: Continuously updates wait time estimates as queue conditions change

### Appointment Scheduling
- **Conflict Detection**: Identifies double bookings and provider unavailability
- **Slot Management**: Generates available appointment slots based on provider schedules
- **Automated Notifications**: Sends confirmations and reminders via SMS, WhatsApp, and email
- **Calendar Integration**: Supports Google Calendar, Outlook, and Apple Calendar

## Architecture

### Services
- **QueueManagementService**: Core queue operations and reordering logic
- **WaitTimePredictionService**: Wait time forecasting and historical analysis
- **AppointmentSchedulingService**: Appointment booking and conflict resolution

### Data Storage
- **DynamoDB**: Real-time queue data and operational metrics
- **PostgreSQL**: Appointment records and historical data

## API Endpoints

### Queue Management

#### Add Patient to Queue
```http
POST /api/queue
Content-Type: application/json

{
  "patientId": "uuid",
  "facilityId": "uuid",
  "queueType": "ED" | "OPD",
  "urgencyScore": 0-100,
  "specialty": "string",
  "chiefComplaint": "string"
}
```

#### Get Queue
```http
GET /api/queue/:facilityId/:queueType
```

#### Get Queue Position
```http
GET /api/queue/position/:queueEntryId
```

#### Update Queue Status
```http
PATCH /api/queue/:queueEntryId/status
Content-Type: application/json

{
  "status": "WAITING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
  "assignedProviderId": "uuid"
}
```

#### Reorder Queue
```http
POST /api/queue/:facilityId/:queueType/reorder
Content-Type: application/json

{
  "reason": "string"
}
```

#### Get Queue Metrics
```http
GET /api/queue/:facilityId/:queueType/metrics
```

### Wait Time Prediction

#### Predict Wait Time
```http
GET /api/queue/wait-time/:queueEntryId
```

#### Get Real-time Wait Times
```http
GET /api/queue/:facilityId/:queueType/wait-times
```

#### Analyze Historical Wait Times
```http
GET /api/queue/:facilityId/:queueType/historical?startDate=2024-01-01&endDate=2024-01-31
```

### Appointment Scheduling

#### Book Appointment
```http
POST /api/appointments
Content-Type: application/json

{
  "patientId": "uuid",
  "facilityId": "uuid",
  "providerId": "uuid",
  "specialty": "string",
  "scheduledTime": "ISO8601",
  "duration": 30,
  "urgencyScore": 0-100,
  "chiefComplaint": "string"
}
```

#### Get Available Slots
```http
GET /api/appointments/slots?facilityId=uuid&providerId=uuid&specialty=string&date=2024-01-01&duration=30
```

#### Check Conflicts
```http
POST /api/appointments/check-conflicts
Content-Type: application/json

{
  "facilityId": "uuid",
  "providerId": "uuid",
  "startTime": "ISO8601",
  "endTime": "ISO8601"
}
```

#### Confirm Appointment
```http
POST /api/appointments/:appointmentId/confirm
```

#### Cancel Appointment
```http
POST /api/appointments/:appointmentId/cancel
Content-Type: application/json

{
  "reason": "string"
}
```

#### Reschedule Appointment
```http
POST /api/appointments/:appointmentId/reschedule
Content-Type: application/json

{
  "newScheduledTime": "ISO8601"
}
```

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3050
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medhaos

# DynamoDB Configuration
AWS_REGION=ap-south-1
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Queue Configuration
MAX_QUEUE_SIZE=100
REORDER_INTERVAL_MS=30000
WAIT_TIME_PREDICTION_WINDOW_HOURS=24
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

## Queue Optimization Algorithm

The queue reordering algorithm uses a multi-factor approach:

1. **Priority Level**: CRITICAL > URGENT > ROUTINE > SCHEDULED
2. **Urgency Score**: Within same priority, higher urgency scores get precedence
3. **Check-in Time**: FIFO for patients with same priority and urgency
4. **Dynamic Reordering**: Automatically triggers when critical patients are added

### Example
```
Before:
1. Patient A (ROUTINE, score: 30, checked in: 9:00 AM)
2. Patient B (URGENT, score: 50, checked in: 9:15 AM)
3. Patient C (CRITICAL, score: 85, checked in: 9:20 AM)

After Reordering:
1. Patient C (CRITICAL, score: 85) - moved to front
2. Patient B (URGENT, score: 50)
3. Patient A (ROUTINE, score: 30)
```

## Wait Time Prediction Model

The wait time prediction uses a weighted multi-factor model:

```
Predicted Wait Time = Base Wait Time + Historical Adjustment + Staff Adjustment - Priority Adjustment

Where:
- Base Wait Time = Patients Ahead × Average Service Time
- Historical Adjustment = Historical Pattern × 0.2
- Staff Adjustment = (1 - Staff Availability) × Average Service Time × 0.3
- Priority Adjustment = Based on priority level (0-10 minutes)
```

### Confidence Calculation
```
Confidence = Base (0.5) + Queue Data (0.2) + Historical Data (0.2) + Staff Data (0.1)
```

## Integration

### With Triage Agent
The Queue Optimization Agent receives urgency scores from the Triage Agent and uses them to prioritize patients in the queue.

### With Supervisor Agent
Reports queue metrics and capacity information to the Supervisor Agent for system-wide orchestration.

### With Notification Services
Sends appointment confirmations, reminders, and queue updates to patients via multiple channels.

## Performance Targets

- **Queue Reordering**: < 2 seconds for queues up to 100 patients
- **Wait Time Prediction**: < 1 second per patient
- **Appointment Booking**: < 3 seconds including conflict detection
- **Queue Metrics**: Real-time updates every 30 seconds
- **Wait Time Reduction**: Target 21% reduction through optimization

## Requirements Addressed

This implementation addresses the following requirements from the design document:

- **Requirement 2.3**: Dynamic queue reordering to minimize total wait time
- **Requirement 2.4**: Real-time queue position tracking and wait time updates
- **Requirement 2.5**: Queue metrics and performance monitoring
- **Requirement 2.2**: Appointment scheduling with conflict detection
- **Requirement 2.4**: Automated notification service for confirmations

## Future Enhancements

- Machine learning models for more accurate wait time predictions (XGBoost, LSTM)
- Integration with staff scheduling system for better availability tracking
- Advanced conflict resolution with automatic rescheduling suggestions
- Multi-facility queue balancing and patient transfer recommendations
- Predictive capacity management with 24-72 hour forecasting
