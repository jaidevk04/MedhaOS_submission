# MedhaOS Operational Intelligence Agent

Comprehensive operational intelligence service providing bed occupancy prediction, ICU demand forecasting, staff scheduling optimization, and workflow optimization for healthcare facilities.

## Features

### 1. Bed Occupancy Prediction Agent
- **Prophet + LSTM hybrid forecasting** for 24-72 hour bed availability prediction
- 87% accuracy target (Requirement 6.1)
- Capacity heatmaps for administrator dashboard (Requirement 6.4)
- Automated alerts for predicted bed shortages
- Recommendations for bed reassignments and discharge acceleration (Requirement 6.3)

### 2. ICU Demand Forecasting Agent
- **ARIMA + Neural Network hybrid model** for 6-24 hour ICU demand prediction
- 87% accuracy target (Requirement 6.2)
- ICU admission pattern analysis
- Capacity alert system with severity levels (Requirement 6.3)
- Actionable recommendations for surge capacity management

### 3. Staff Scheduling Optimization Agent
- **Constraint Programming + Reinforcement Learning** for optimal shift assignments
- Considers staff availability, skills, and patient acuity (Requirement 7.1)
- Dynamic task redistribution when workload exceeds thresholds (Requirement 7.2)
- Prioritizes experienced staff for high-acuity patients (Requirement 7.3)
- Rapid response to staff call-ins (<5 minutes) (Requirement 7.4)
- Burnout risk detection and prevention (Requirement 7.5)

### 4. Workflow Optimization Agent
- **Process Mining** for bottleneck detection (Requirement 6.4)
- LLM-powered workflow analysis and recommendations
- Root cause identification for delays and inefficiencies
- Impact simulation for proposed improvements
- Comprehensive optimization reports

## API Endpoints

### Get Operational Metrics
```http
GET /api/operational/metrics/:facilityId
```

Returns current operational metrics including bed occupancy, ICU utilization, wait times, and bottleneck counts.

### Get Capacity Alerts
```http
GET /api/operational/alerts/:facilityId
```

Returns all capacity alerts sorted by severity and predicted time.

### Get Dashboard Data
```http
GET /api/operational/dashboard/:facilityId
```

Returns comprehensive dashboard data including:
- Operational metrics
- Bed capacity heatmap
- ICU demand forecast
- Active alerts
- Workflow bottlenecks
- Staffing status

### Optimize Facility Operations
```http
POST /api/operational/optimize/:facilityId
Content-Type: application/json

{
  "staffMembers": [...],
  "shiftRequirements": [...]
}
```

Generates optimal weekly schedule and provides capacity and workflow recommendations.

### Health Check
```http
GET /api/operational/health
```

## Installation

```bash
cd services/operational-intelligence-agent
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3012
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/medhaos
AWS_REGION=ap-south-1
BED_FORECAST_HORIZON_HOURS=72
ICU_FORECAST_HORIZON_HOURS=24
CAPACITY_ALERT_THRESHOLD=0.8
BURNOUT_RISK_THRESHOLD=0.7
```

## Running the Service

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Architecture

### Bed Occupancy Prediction
- **Data Collection**: Historical occupancy data (90 days)
- **Model**: LSTM with 2 layers (50 units each) + dropout
- **Seasonality**: Prophet-like trend and seasonal adjustments
- **Output**: Hourly predictions for 24-72 hours with confidence scores

### ICU Demand Forecasting
- **Data Collection**: ICU admission patterns (60 days)
- **Model**: LSTM (64/32 units) with 6 features
- **ARIMA Components**: Trend, seasonal, and residual decomposition
- **Output**: Hourly ICU utilization predictions with alert levels

### Staff Scheduling
- **Algorithm**: Constraint programming with scoring
- **Optimization**: Balances coverage, fairness, and burnout prevention
- **Scoring Factors**: Skill match, experience, workload, preferences
- **Constraints**: Availability, max hours, skill requirements

### Workflow Optimization
- **Process Mining**: Event log analysis and pattern detection
- **Bottleneck Detection**: Duration, frequency, and delay analysis
- **Root Cause Analysis**: Resource contention, staff bottlenecks, variability
- **Recommendations**: LLM-powered improvement suggestions

## Model Training

The service includes built-in model training capabilities:

```typescript
// Bed occupancy model
const bedService = new BedOccupancyPredictionService();
const historicalData = await bedService.collectHistoricalData(facilityId, 'general', 90);
await bedService.trainLSTMModel(historicalData);

// ICU demand model
const icuService = new ICUDemandForecastingService();
const icuData = await icuService.collectICUData(facilityId, 60);
await icuService.trainNeuralModel(icuData);
```

## Performance Targets

- **Bed Occupancy Prediction**: 87% accuracy, <3s response time
- **ICU Demand Forecasting**: 87% accuracy, <3s response time
- **Staff Scheduling**: <5 minutes for weekly schedule generation
- **Workflow Analysis**: <10s for bottleneck identification

## Integration

### With Supervisor Agent
The operational intelligence agent integrates with the central supervisor for:
- Capacity crisis escalation
- Staff shortage alerts
- Workflow bottleneck notifications

### With Administrator Dashboard
Provides real-time data for:
- Capacity management overview
- Predictive analytics visualizations
- Alert notifications
- Operational efficiency metrics

## Requirements Mapping

- **Requirement 6.1**: Bed occupancy prediction (24-72 hours, 87% accuracy)
- **Requirement 6.2**: ICU demand forecasting (6-24 hours, 87% accuracy)
- **Requirement 6.3**: Capacity alert system and recommendations
- **Requirement 6.4**: Workflow optimization and capacity heatmaps
- **Requirement 7.1**: Optimal shift assignments
- **Requirement 7.2**: Task redistribution
- **Requirement 7.3**: High-acuity patient prioritization
- **Requirement 7.4**: Rapid call-in response
- **Requirement 7.5**: Burnout risk detection

## License

Part of the MedhaOS Healthcare Intelligence Ecosystem
