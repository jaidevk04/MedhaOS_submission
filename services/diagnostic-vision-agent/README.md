# Diagnostic Vision Agent (VLM)

Medical image analysis service using Vision-Language Models for MedhaOS Healthcare Intelligence Ecosystem.

## Overview

The Diagnostic Vision Agent provides AI-powered medical image analysis capabilities including:

- **Medical Image Processing**: DICOM integration, image preprocessing, and storage
- **Anomaly Detection**: Automated detection of abnormalities in medical images
- **Multi-Modal Analysis**: Integration of image data with clinical context
- **Radiology Report Generation**: AI-assisted draft report creation
- **Critical Finding Flagging**: Automatic identification of urgent conditions

## Supported Modalities

- X-ray (CR, DX)
- CT (Computed Tomography)
- MRI (Magnetic Resonance Imaging)
- Ultrasound
- Mammography
- PET (Positron Emission Tomography)
- Nuclear Medicine

## Architecture

### Components

1. **DICOM Service**: Parse and process DICOM medical images
2. **S3 Storage Service**: Secure cloud storage for medical images
3. **Image Preprocessing Service**: Normalize and enhance images for analysis
4. **Vision Model Service**: AI models for image analysis (to be implemented in task 11.2)
5. **Report Generation Service**: Create structured radiology reports (to be implemented in task 11.3)

### Vision Models (Planned)

- **LLaVA**: Vision-Language Model for general medical image understanding
- **BiomedCLIP**: Specialized model for biomedical image-text matching
- **MedSAM**: Medical image segmentation model

## API Endpoints

### Image Upload
```
POST /api/vision/upload
Content-Type: multipart/form-data

Body:
- file: Medical image file (DICOM, JPEG, PNG)
- patientId: Patient identifier
- modality: Image modality (X-ray, CT, MRI, etc.)
- bodyPart: Anatomical region
- clinicalContext: Optional clinical information
```

### Image Analysis
```
POST /api/vision/analyze
Content-Type: application/json

Body:
{
  "imageId": "uuid",
  "clinicalContext": {
    "patientAge": 58,
    "symptoms": ["chest pain"],
    "clinicalQuestion": "Rule out pneumonia"
  },
  "generateReport": true,
  "urgency": "stat"
}
```

### Get Analysis Results
```
GET /api/vision/analysis/:imageId
```

### Generate Report
```
POST /api/vision/report
Content-Type: application/json

Body:
{
  "imageId": "uuid",
  "analysisId": "uuid"
}
```

## Configuration

### Environment Variables

See `.env.example` for all configuration options.

Key configurations:
- `PORT`: Service port (default: 3011)
- `S3_BUCKET_NAME`: AWS S3 bucket for image storage
- `SAGEMAKER_*_ENDPOINT`: SageMaker endpoints for vision models
- `DICOM_SERVER_*`: DICOM server connection details

### AWS Services Required

- **S3**: Medical image storage with encryption
- **SageMaker**: Model hosting and inference
- **Bedrock**: LLM for report generation
- **CloudWatch**: Logging and monitoring

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run in development mode
npm run dev

# Build for production
npm run build

# Run in production
npm start
```

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Clean build artifacts
npm run clean
```

## Security & Compliance

### Data Protection
- All images encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- Patient data anonymization support
- HIPAA-compliant storage

### Access Control
- Role-based access control (RBAC)
- Presigned URLs for secure image access
- Audit logging for all operations

### Compliance
- ABDM (Ayushman Bharat Digital Mission) compliant
- DISHA Act compliance
- ISO 27001 security standards
- DICOM standard compliance

## Performance Targets

- Image upload: < 2 seconds
- Image preprocessing: < 3 seconds
- AI analysis: < 8 seconds (90th percentile)
- Total processing time: < 10 seconds
- Confidence threshold: 75% minimum
- Critical finding threshold: 85%

## Error Handling

### Confidence-Based Escalation
- Confidence < 75%: Escalate to human radiologist
- Confidence 75-85%: Request human review
- Confidence > 85%: Proceed autonomously

### Critical Findings
- Automatic flagging of urgent conditions
- Immediate notification to clinicians
- Priority queue for radiologist review

## Integration

### DICOM Server Integration
The service can integrate with existing DICOM PACS systems for:
- C-FIND: Query for studies
- C-MOVE/C-GET: Retrieve images
- C-STORE: Store processed images

### EHR Integration
- HL7 FHIR R4 compliant
- Diagnostic report resources
- Imaging study references

## Monitoring

### Metrics
- Image processing latency
- Model inference time
- Confidence score distribution
- Critical finding detection rate
- Error rates by modality

### Alerts
- Processing failures
- Low confidence detections
- Critical findings detected
- Storage capacity warnings

## Future Enhancements

1. **Real-time Streaming**: Live image analysis during procedures
2. **3D Reconstruction**: Volume rendering for CT/MRI
3. **Comparison Analysis**: Compare with previous studies
4. **Multi-Image Analysis**: Analyze image series together
5. **Federated Learning**: Privacy-preserving model training

## References

- DICOM Standard: https://www.dicomstandard.org/
- HL7 FHIR: https://www.hl7.org/fhir/
- AWS SageMaker: https://aws.amazon.com/sagemaker/
- Medical Image Analysis: https://www.sciencedirect.com/journal/medical-image-analysis

## Support

For issues or questions, contact the MedhaOS development team.

## License

Proprietary - MedhaOS Healthcare Intelligence Ecosystem
