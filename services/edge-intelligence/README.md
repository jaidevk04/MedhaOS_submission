# Edge Intelligence Service

Edge Intelligence and Offline Capability service for MedhaOS Healthcare Platform. Enables healthcare delivery in areas with unreliable internet connectivity through edge computing, local inference, and intelligent synchronization.

## Features

### 1. Edge Deployment Infrastructure
- **AWS IoT Greengrass Integration**: Deploy and manage edge devices at scale
- **Device Provisioning**: Automated device registration and certificate management
- **Remote Management**: Update models and configurations remotely
- **Shadow Sync**: Maintain device state synchronization

### 2. Small Language Model Deployment
- **Local Inference**: Run AI models offline using ONNX Runtime
- **Model Optimization**: Quantization and compression for edge deployment
- **Supported Models**:
  - Phi-2 (2.7GB → 1.5GB optimized)
  - Gemma (2GB → 1GB optimized)
  - TinyLlama (1.1GB → 600MB optimized)
- **Inference Types**:
  - Triage urgency scoring
  - Clinical documentation generation

### 3. Offline-Online Synchronization
- **Local Storage**: SQLite database for offline data persistence
- **Progressive Sync**: Automatic synchronization when connectivity restored
- **Conflict Resolution**: Configurable strategies (server-wins, local-wins, merge)
- **Batch Operations**: Efficient bulk data transfer
- **Sync Monitoring**: Real-time sync status and alerts

### 4. Monitoring and Health Checks
- **Device Metrics**: CPU, memory, disk usage tracking
- **Inference Metrics**: Performance and accuracy monitoring
- **Connectivity Monitoring**: Automatic online/offline detection
- **Health Checks**: Comprehensive system health validation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ API Gateway  │  │ IoT Core     │  │ S3 Models    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ▲ │
                  Sync    │ │ Deploy
                          │ ▼
┌─────────────────────────────────────────────────────────┐
│              Edge Device (Greengrass Core)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Edge Intelligence Service                       │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │ Inference  │  │ Offline    │  │ Sync       │ │  │
│  │  │ Engine     │  │ Storage    │  │ Service    │ │  │
│  │  └────────────┘  └────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Local Models (ONNX)                             │  │
│  │  • Triage Model                                  │  │
│  │  • Documentation Model                           │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Local Database (SQLite)                         │  │
│  │  • Patient data                                  │  │
│  │  • Encounters                                    │  │
│  │  • Inference results                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites
- Node.js 18+
- AWS Account with IoT Core and Greengrass enabled
- AWS CLI configured
- Edge device (Raspberry Pi, Intel NUC, or similar)

### Setup

1. **Install dependencies**:
```bash
cd services/edge-intelligence
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your AWS credentials and configuration
```

3. **Provision edge device**:
```bash
npm run provision:device
```

This will:
- Create IoT Thing in AWS
- Generate certificates
- Create Greengrass group
- Save device configuration

4. **Deploy models**:
```bash
npm run deploy:greengrass
```

This will:
- Upload models to S3
- Create Greengrass deployment
- Deploy to edge device

5. **Start the service**:
```bash
npm run build
npm start
```

## Usage

### Running Inference Offline

**Triage Inference**:
```bash
curl -X POST http://localhost:3000/inference/triage \
  -H "Content-Type: application/json" \
  -d '{
    "age": 58,
    "gender": "male",
    "temperature": 99.5,
    "bloodPressureSystolic": 145,
    "bloodPressureDiastolic": 92,
    "heartRate": 98,
    "respiratoryRate": 18,
    "spo2": 96,
    "symptoms": ["chest_pain", "shortness_of_breath"],
    "medicalHistory": ["diabetes", "hypertension"]
  }'
```

**Documentation Inference**:
```bash
curl -X POST http://localhost:3000/inference/documentation \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": "Patient reports chest pain for 2 hours..."
  }'
```

### Checking Sync Status

```bash
curl http://localhost:3000/sync/status
```

### Forcing Immediate Sync

```bash
curl -X POST http://localhost:3000/sync/force
```

### Health Check

```bash
curl http://localhost:3000/health
```

### Viewing Metrics

```bash
curl http://localhost:3000/metrics
```

## API Endpoints

### Device Management
- `GET /health` - Health check
- `GET /device/info` - Device information
- `GET /connectivity` - Connectivity status

### Inference
- `POST /inference/triage` - Run triage inference
- `POST /inference/documentation` - Run documentation inference
- `GET /models/info` - Get model information

### Offline Storage
- `POST /storage/:entityType` - Save entity
- `GET /storage/:entityType/:entityId` - Get entity
- `GET /storage/:entityType` - Get entities by type
- `GET /storage/stats` - Storage statistics

### Synchronization
- `GET /sync/status` - Sync status
- `POST /sync/force` - Force immediate sync

### Monitoring
- `GET /metrics` - Latest metrics
- `GET /metrics/history` - Metrics history

## Configuration

### Environment Variables

```bash
# AWS IoT Greengrass
AWS_REGION=ap-south-1
AWS_IOT_ENDPOINT=your-iot-endpoint.iot.ap-south-1.amazonaws.com
GREENGRASS_GROUP_ID=your-greengrass-group-id

# Edge Device
DEVICE_ID=edge-device-001
FACILITY_ID=facility-001
DEVICE_TYPE=clinic-terminal

# Models
MODEL_STORAGE_PATH=/opt/medhaos/models
TRIAGE_MODEL_PATH=/opt/medhaos/models/triage-model.onnx
DOCUMENTATION_MODEL_PATH=/opt/medhaos/models/documentation-model.onnx

# Sync
SYNC_INTERVAL_MS=300000  # 5 minutes
SYNC_BATCH_SIZE=100
CONFLICT_RESOLUTION_STRATEGY=server-wins

# Storage
LOCAL_DB_PATH=/opt/medhaos/data/local.db

# Monitoring
METRICS_ENABLED=true
LOG_LEVEL=info
HEARTBEAT_INTERVAL_MS=60000  # 1 minute
```

### Conflict Resolution Strategies

- **server-wins**: Server version always takes precedence
- **local-wins**: Local version always takes precedence
- **merge**: Attempt to merge both versions
- **manual**: Flag for manual resolution

## Model Optimization

### Optimizing Custom Models

```typescript
import { ModelOptimizationService } from './services/model-optimization.service';

const optimizer = new ModelOptimizationService();

// Optimize Phi-2 model
await optimizer.optimizeSLM(
  'phi-2',
  '/path/to/phi-2-model.pt',
  '/path/to/phi-2-optimized.onnx'
);

// Validate accuracy
const validation = await optimizer.validateModelAccuracy(
  '/path/to/original-model.pt',
  '/path/to/optimized-model.onnx',
  '/path/to/test-data.json'
);

console.log(`Accuracy drop: ${validation.accuracyDrop}%`);
console.log(`Latency improvement: ${validation.latencyImprovement}x`);
console.log(`Size reduction: ${validation.sizeReduction}%`);
```

## Deployment

### Production Deployment

1. **Build the service**:
```bash
npm run build
```

2. **Create systemd service** (Linux):
```bash
sudo nano /etc/systemd/system/medhaos-edge.service
```

```ini
[Unit]
Description=MedhaOS Edge Intelligence Service
After=network.target

[Service]
Type=simple
User=medhaos
WorkingDirectory=/opt/medhaos/edge-intelligence
ExecStart=/usr/bin/node /opt/medhaos/edge-intelligence/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. **Enable and start**:
```bash
sudo systemctl enable medhaos-edge
sudo systemctl start medhaos-edge
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY dist ./dist
COPY models ./models

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## Monitoring

### CloudWatch Integration

Metrics are automatically sent to CloudWatch when online:
- Device health status
- Inference performance
- Sync operations
- Resource utilization

### Grafana Dashboard

Import the provided Grafana dashboard for visualization:
- Real-time device metrics
- Inference latency trends
- Sync status monitoring
- Alert management

## Troubleshooting

### Models Not Loading

```bash
# Check model files exist
ls -lh /opt/medhaos/models/

# Check model format
file /opt/medhaos/models/triage-model.onnx

# Check logs
tail -f logs/combined.log
```

### Sync Not Working

```bash
# Check connectivity
curl http://localhost:3000/connectivity

# Check sync status
curl http://localhost:3000/sync/status

# Force sync
curl -X POST http://localhost:3000/sync/force

# Check pending operations
curl http://localhost:3000/storage/stats
```

### High Resource Usage

```bash
# Check metrics
curl http://localhost:3000/metrics

# Clear old cache
# (Automatically done every 7 days)

# Restart service
sudo systemctl restart medhaos-edge
```

## Performance

### Benchmarks

**Inference Performance** (on Raspberry Pi 4):
- Triage inference: ~200ms
- Documentation inference: ~500ms

**Storage Performance**:
- Write operations: ~1000 ops/sec
- Read operations: ~5000 ops/sec

**Sync Performance**:
- Upload: ~100 entities/sec
- Download: ~150 entities/sec

## Security

- TLS 1.3 for all cloud communications
- Certificate-based device authentication
- Encrypted local storage (optional)
- Audit logging for all operations
- Regular security updates via Greengrass

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/medhaos/edge-intelligence/issues
- Documentation: https://docs.medhaos.health/edge-intelligence
- Email: support@medhaos.health
