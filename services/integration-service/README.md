# MedhaOS Integration Service

External system integration service for the MedhaOS Healthcare Intelligence Ecosystem. Provides unified APIs for integrating with ABDM, EHR systems, Laboratory Information Systems (LIS), PACS, and multi-channel notifications.

## Features

### 1. ABDM Integration
- ABHA ID verification
- Health record retrieval from ABDM
- FHIR R4 data transformation
- OAuth 2.0 authentication with ABDM

### 2. EHR System Integration
- HL7 FHIR API endpoints
- HL7 v2.x message handling
- Bidirectional patient data sync
- mTLS authentication

### 3. Laboratory Information System (LIS) Integration
- Lab order placement API
- Result retrieval service
- HL7 ORU message parsing
- Patient lab history

### 4. PACS Integration
- DICOM protocol support
- Image storage and retrieval
- DICOM security layer
- Study and series management

### 5. Multi-Channel Notifications
- **AWS SNS**: Push notifications (iOS/Android)
- **Twilio**: SMS messaging
- **WhatsApp Business API**: WhatsApp messages
- **Email**: SMTP with templates

## Installation

```bash
cd services/integration-service
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Environment Variables

#### Server
- `PORT`: Service port (default: 3020)
- `NODE_ENV`: Environment (development/production)

#### ABDM
- `ABDM_BASE_URL`: ABDM API base URL
- `ABDM_CLIENT_ID`: ABDM client ID
- `ABDM_CLIENT_SECRET`: ABDM client secret
- `ABDM_REDIRECT_URI`: OAuth redirect URI

#### EHR
- `EHR_FHIR_BASE_URL`: EHR FHIR server URL
- `EHR_CLIENT_CERT_PATH`: mTLS client certificate
- `EHR_CLIENT_KEY_PATH`: mTLS client key
- `EHR_CA_CERT_PATH`: mTLS CA certificate

#### LIS
- `LIS_BASE_URL`: LIS API base URL
- `LIS_API_KEY`: LIS API key
- `LIS_HL7_HOST`: HL7 server host
- `LIS_HL7_PORT`: HL7 server port

#### PACS
- `PACS_AE_TITLE`: PACS Application Entity title
- `PACS_HOST`: PACS server host
- `PACS_PORT`: PACS server port
- `PACS_CALLING_AE_TITLE`: Calling AE title
- `PACS_S3_BUCKET`: S3 bucket for DICOM storage

#### AWS SNS
- `AWS_REGION`: AWS region
- `AWS_SNS_TOPIC_ARN`: SNS topic ARN for push notifications

#### Twilio
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

#### WhatsApp
- `WHATSAPP_API_URL`: WhatsApp Business API URL
- `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp phone number ID
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp access token

#### Email
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_SECURE`: Use TLS (true/false)
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `EMAIL_FROM`: From email address

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### ABDM Integration

#### Verify ABHA ID
```http
POST /api/abdm/verify
Content-Type: application/json

{
  "abhaId": "12-3456-7890-1234",
  "purpose": "CARE_MANAGEMENT"
}
```

#### Retrieve Health Records
```http
POST /api/abdm/health-records
Content-Type: application/json

{
  "abhaId": "12-3456-7890-1234",
  "consentId": "consent-123",
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-12-31"
  }
}
```

### EHR Integration

#### Sync Patient Data
```http
POST /api/ehr/sync
Content-Type: application/json

{
  "patientId": "patient-123",
  "includeHistory": true
}
```

#### Get FHIR Resource
```http
GET /api/ehr/fhir/Patient/patient-123
```

### LIS Integration

#### Place Lab Order
```http
POST /api/lis/orders
Content-Type: application/json

{
  "patientId": "patient-123",
  "encounterId": "encounter-456",
  "tests": [
    {
      "testCode": "CBC",
      "testName": "Complete Blood Count",
      "specimenType": "Blood"
    }
  ],
  "urgency": "ROUTINE"
}
```

#### Get Lab Results
```http
GET /api/lis/results/order-123
```

### PACS Integration

#### Query Studies
```http
GET /api/pacs/studies?patientId=patient-123&modality=CT
```

#### Store DICOM Image
```http
POST /api/pacs/images
Content-Type: application/json

{
  "studyInstanceUID": "1.2.3.4.5",
  "patientId": "patient-123",
  "imageData": "base64-encoded-dicom-data",
  "metadata": {}
}
```

### Notification Service

#### Send Single Notification
```http
POST /api/notifications/send
Content-Type: application/json

{
  "recipient": "+919876543210",
  "channel": "SMS",
  "template": "appointment_confirmation",
  "data": {
    "patientName": "John Doe",
    "appointmentDate": "2024-03-15",
    "appointmentTime": "10:00 AM",
    "doctorName": "Dr. Smith",
    "facilityName": "City Hospital"
  }
}
```

#### Send Bulk Notifications
```http
POST /api/notifications/bulk
Content-Type: application/json

{
  "notifications": [
    {
      "recipient": "+919876543210",
      "channel": "SMS",
      "template": "medication_reminder",
      "data": {
        "patientName": "John Doe",
        "medicationName": "Aspirin",
        "dosage": "100mg",
        "time": "9:00 AM"
      }
    }
  ]
}
```

#### Send SMS
```http
POST /api/notifications/sms
Content-Type: application/json

{
  "to": "+919876543210",
  "body": "Your appointment is confirmed for tomorrow at 10:00 AM"
}
```

#### Send Email
```http
POST /api/notifications/email
Content-Type: application/json

{
  "to": "patient@example.com",
  "template": "lab_results_ready",
  "data": {
    "patientName": "John Doe",
    "testName": "Blood Test",
    "testDate": "2024-03-10"
  }
}
```

#### Send WhatsApp Message
```http
POST /api/notifications/whatsapp
Content-Type: application/json

{
  "to": "+919876543210",
  "type": "text",
  "text": {
    "body": "Your lab results are ready. Please log in to view them."
  }
}
```

#### Send Push Notification
```http
POST /api/notifications/push
Content-Type: application/json

{
  "title": "Appointment Reminder",
  "body": "You have an appointment tomorrow at 10:00 AM",
  "data": {
    "appointmentId": "appt-123",
    "type": "reminder"
  }
}
```

#### Schedule Notification
```http
POST /api/notifications/schedule
Content-Type: application/json

{
  "recipient": "+919876543210",
  "channel": "SMS",
  "template": "medication_reminder",
  "data": {
    "patientName": "John Doe",
    "medicationName": "Aspirin",
    "dosage": "100mg",
    "time": "9:00 AM"
  },
  "scheduledTime": "2024-03-15T09:00:00Z"
}
```

#### Get Notification Status
```http
GET /api/notifications/status/message-id-123
```

## Email Templates

Available email templates:
- `appointment_confirmation`: Appointment confirmation email
- `medication_reminder`: Medication reminder email
- `lab_results_ready`: Lab results notification
- `discharge_summary`: Discharge summary email

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Integration Service                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   ABDM   │  │   EHR    │  │   LIS    │  │   PACS   │   │
│  │Integration│  │Integration│  │Integration│  │Integration│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Notification Service                          │  │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │  │
│  │  │ SNS  │  │Twilio│  │WhatsApp│ │Email │            │  │
│  │  └──────┘  └──────┘  └──────┘  └──────┘            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Security

- All external communications use TLS 1.3
- mTLS for EHR integration
- OAuth 2.0 for ABDM authentication
- API key authentication for LIS
- DICOM security layer for PACS
- Input validation on all endpoints
- Rate limiting (configured at API Gateway level)

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Monitoring

Health check endpoint:
```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "integration-service",
  "version": "1.0.0",
  "timestamp": "2024-03-10T10:00:00Z",
  "integrations": {
    "abdm": "enabled",
    "ehr": "enabled",
    "lis": "enabled",
    "pacs": "enabled",
    "notifications": "enabled"
  }
}
```

## Testing

```bash
npm test
```

## License

Proprietary - MedhaOS Healthcare Intelligence Ecosystem
