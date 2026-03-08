# Supply Chain Intelligence Agent

The Supply Chain Intelligence Agent provides predictive analytics and automated management for drug inventory and blood bank operations in the MedhaOS Healthcare Intelligence Ecosystem.

## Features

### 1. Drug Inventory Forecasting
- **SARIMA + XGBoost** forecasting model for 7-30 day demand prediction
- Usage pattern analysis (daily, weekly, monthly trends)
- Seasonal factor detection
- Reorder point calculation using safety stock formula
- Economic Order Quantity (EOQ) optimization
- Stockout risk assessment

### 2. Blood Bank Forecasting
- **Poisson Regression + Neural Network** for blood demand prediction
- Blood usage pattern analysis by type (emergency, surgery, trauma)
- Demand forecasting by blood group (A+, A-, B+, B-, AB+, AB-, O+, O-)
- Critical shortage alerting
- Blood compatibility matrix for emergency situations
- Alternative blood source recommendations

### 3. Inventory Management
- Real-time stock level tracking
- Expiry date monitoring with automated alerts
- Automated purchase order generation
- Donor drive trigger system
- Multi-channel donor notifications (SMS, WhatsApp, Email)
- Comprehensive inventory status dashboard

## Architecture

```
Supply Chain Agent
├── Drug Inventory Forecasting Service
│   ├── Usage Pattern Analysis
│   ├── SARIMA + XGBoost Forecasting
│   ├── Reorder Point Calculation
│   └── EOQ Optimization
├── Blood Bank Forecasting Service
│   ├── Poisson Regression Model
│   ├── Blood Group Demand Prediction
│   ├── Shortage Risk Assessment
│   └── Donor Drive Recommendations
└── Inventory Management Service
    ├── Stock Level Tracking
    ├── Expiry Monitoring
    ├── Purchase Order Generation
    └── Donor Notification System
```

## API Endpoints

### Supply Chain Status
```http
GET /api/supply-chain/status/:facilityId
```
Get comprehensive supply chain status including inventory, forecasts, and alerts.

### Generate Forecast
```http
POST /api/supply-chain/forecast
Content-Type: application/json

{
  "facilityId": "facility-001",
  "itemType": "drug",
  "itemId": "drug-001",
  "forecastPeriod": "7d"
}
```

### Inventory Status
```http
GET /api/supply-chain/inventory/:facilityId
```

### Drug Forecasts
```http
GET /api/supply-chain/drug-forecasts/:facilityId?period=7d
```

### Reorder Recommendations
```http
GET /api/supply-chain/reorder-recommendations/:facilityId
```

### Generate Purchase Orders
```http
POST /api/supply-chain/purchase-orders/:facilityId
```

### Blood Shortage Alerts
```http
GET /api/supply-chain/blood-shortages/:facilityId
```

### Trigger Donor Drive
```http
POST /api/supply-chain/donor-drive/:facilityId
```

### Expiry Alerts
```http
GET /api/supply-chain/expiry-alerts/:facilityId
```

## Forecasting Models

### Drug Inventory Forecasting (SARIMA + XGBoost)

**SARIMA (Seasonal AutoRegressive Integrated Moving Average)**:
- Captures trend and seasonality in drug usage
- Handles weekly/monthly patterns
- Accounts for holidays and special events

**XGBoost (Gradient Boosting)**:
- Incorporates external features (patient volume, disease outbreaks)
- Handles non-linear relationships
- Provides feature importance analysis

**Reorder Point Formula**:
```
Reorder Point = (Average Daily Usage × Lead Time) + Safety Stock
Safety Stock = Z-score × Standard Deviation × √Lead Time
```

**Economic Order Quantity (EOQ)**:
```
EOQ = √((2 × Annual Demand × Order Cost) / Holding Cost per Unit)
```

### Blood Bank Forecasting (Poisson Regression + Neural Network)

**Poisson Regression**:
- Models count data (blood units used per day)
- Accounts for different usage rates by blood group
- Handles emergency vs. planned usage patterns

**Neural Network**:
- Captures complex temporal patterns
- Learns from historical shortage events
- Predicts demand spikes during emergencies

**Confidence Intervals**:
```
For Poisson distribution: mean ± 1.96 × √mean (95% CI)
```

## Alert Thresholds

### Drug Inventory
- **Critical Stock**: < 50% of reorder point
- **Low Stock**: < reorder point
- **Expiry Warning**: < 30 days until expiry

### Blood Bank
- **Critical Shortage**: < 30% of critical threshold OR < 2 days supply
- **High Risk**: < 60% of critical threshold OR < 4 days supply
- **Medium Risk**: < critical threshold OR < 7 days supply

## Configuration

Environment variables (see `.env.example`):

```env
PORT=3014
DATABASE_URL=postgresql://...
AWS_REGION=ap-south-1
CRITICAL_STOCK_THRESHOLD=10
LOW_STOCK_THRESHOLD=20
EXPIRY_WARNING_DAYS=30
BLOOD_CRITICAL_UNITS=5
```

## Usage Examples

### Check Supply Chain Status
```bash
curl http://localhost:3014/api/supply-chain/status/facility-001
```

### Generate Drug Forecast
```bash
curl -X POST http://localhost:3014/api/supply-chain/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "facilityId": "facility-001",
    "itemType": "drug",
    "itemId": "drug-001",
    "forecastPeriod": "7d"
  }'
```

### Trigger Donor Drive
```bash
curl -X POST http://localhost:3014/api/supply-chain/donor-drive/facility-001
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

### Build for Production
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run type-check
```

## Integration with MedhaOS

The Supply Chain Agent integrates with:
- **Database Package**: For inventory data persistence
- **Drug Safety Agent**: For medication information
- **Operational Intelligence Agent**: For capacity planning
- **Supervisor Agent**: For task orchestration
- **Notification Services**: For donor alerts and staff notifications

## Requirements Addressed

- **Requirement 9.1**: Drug inventory forecasting with 7-30 day prediction
- **Requirement 9.2**: Automated reorder point calculation and purchase orders
- **Requirement 9.3**: Expiry date monitoring and alerts
- **Requirement 9.4**: Blood bank stock forecasting by blood group
- **Requirement 9.5**: Critical shortage alerting and donor drive triggers

## Future Enhancements

1. **Machine Learning Model Deployment**:
   - Deploy SARIMA + XGBoost to AWS SageMaker
   - Deploy Poisson + Neural Network to SageMaker
   - Implement model retraining pipeline

2. **Advanced Features**:
   - Multi-facility inventory optimization
   - Supplier performance tracking
   - Cost optimization algorithms
   - Predictive maintenance for blood bank equipment

3. **Integration Enhancements**:
   - Real-time integration with pharmacy systems
   - Blood bank management system integration
   - Supplier portal integration
   - Mobile app for donor engagement

## License

Part of the MedhaOS Healthcare Intelligence Ecosystem.
