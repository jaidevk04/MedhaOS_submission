import { 
  ImageUploadRequest, 
  ImageAnalysisRequest, 
  ImageAnalysisResponse,
  VisionModelInput,
  MedicalImage,
  RadiologyReport
} from '../types';
import { DicomService } from './dicom.service';
import { S3StorageService } from './s3-storage.service';
import { ImagePreprocessingService } from './image-preprocessing.service';
import { VisionAnalysisService } from './vision-analysis.service';
import { ReportGenerationService } from './report-generation.service';
import { v4 as uuidv4 } from 'uuid';

export class DiagnosticVisionService {
  private dicomService: DicomService;
  private s3Service: S3StorageService;
  private preprocessingService: ImagePreprocessingService;
  private analysisService: VisionAnalysisService;
  private reportService: ReportGenerationService;

  constructor() {
    this.dicomService = new DicomService();
    this.s3Service = new S3StorageService();
    this.preprocessingService = new ImagePreprocessingService();
    this.analysisService = new VisionAnalysisService();
    this.reportService = new ReportGenerationService();
  }

  /**
   * Upload and process medical image
   */
  async uploadImage(
    buffer: Buffer,
    request: ImageUploadRequest,
    filename: string
  ): Promise<MedicalImage> {
    try {
      const imageId = uuidv4();
      const format = filename.split('.').pop()?.toLowerCase() || 'jpg';

      // Validate format
      if (!this.preprocessingService.validateImageFormat(format)) {
        throw new Error(`Unsupported image format: ${format}`);
      }

      // Validate size
      if (!this.preprocessingService.validateImageSize(buffer.length)) {
        throw new Error('Image size exceeds maximum allowed size');
      }

      // Handle DICOM files
      let dicomMetadata;
      if (format === 'dcm' || format === 'dicom') {
        if (!this.dicomService.validateDicomFile(buffer)) {
          throw new Error('Invalid DICOM file');
        }
        dicomMetadata = this.dicomService.parseDicomFile(buffer);
      }

      // Preprocess image
      const preprocessResult = await this.preprocessingService.preprocessImage(
        buffer,
        request.patientId,
        imageId,
        format
      );

      // Create medical image record
      const medicalImage: MedicalImage = {
        imageId,
        patientId: request.patientId,
        encounterId: request.encounterId,
        modality: request.modality,
        bodyPart: request.bodyPart,
        studyDate: request.studyDate || new Date(),
        imageUrl: preprocessResult.processedImageUrl,
        thumbnailUrl: preprocessResult.thumbnailUrl,
        metadata: preprocessResult.metadata,
        dicomTags: dicomMetadata,
        uploadedAt: new Date()
      };

      console.log(`Image uploaded successfully: ${imageId}`);
      return medicalImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Analyze medical image
   */
  async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse> {
    const startTime = Date.now();

    try {
      // Get image details (in real implementation, fetch from database)
      const imageUrl = await this.getImageUrl(request.imageId);
      const imageDetails = await this.getImageDetails(request.imageId);

      // Prepare vision model input
      const visionInput: VisionModelInput = {
        imageUrl,
        modality: imageDetails.modality,
        bodyPart: imageDetails.bodyPart,
        clinicalContext: request.clinicalContext
      };

      // Perform vision analysis
      const analysis = await this.analysisService.analyzeImage(visionInput);

      // Generate report if requested
      let report: RadiologyReport | undefined;
      if (request.generateReport) {
        report = await this.reportService.generateReport(
          request.imageId,
          imageDetails.patientId,
          analysis,
          request.clinicalContext,
          imageDetails.encounterId
        );
      }

      // Check if requires human review
      const requiresReview = this.analysisService.requiresHumanReview(analysis);
      if (requiresReview) {
        console.log(`Analysis for ${request.imageId} requires human review`);
        // In real implementation, trigger notification to radiologist
      }

      // Check for critical findings
      const criticalFindings = this.analysisService.identifyCriticalFindings(analysis);
      if (criticalFindings.length > 0) {
        console.log(`Critical findings detected for ${request.imageId}`);
        // In real implementation, trigger urgent notification
        await this.notifyCriticalFindings(request.imageId, criticalFindings);
      }

      const processingTime = (Date.now() - startTime) / 1000;

      const response: ImageAnalysisResponse = {
        imageId: request.imageId,
        analysis,
        report,
        processingTimeSeconds: processingTime,
        timestamp: new Date()
      };

      return response;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Get presigned URL for image
   */
  private async getImageUrl(imageId: string): Promise<string> {
    // In real implementation, fetch S3 key from database
    // For now, generate a placeholder key
    const key = `medical-images/placeholder/${imageId}.jpg`;
    return await this.s3Service.getPresignedUrl(key);
  }

  /**
   * Get image details (placeholder)
   */
  private async getImageDetails(imageId: string): Promise<any> {
    // In real implementation, fetch from database
    return {
      imageId,
      patientId: 'placeholder-patient-id',
      encounterId: 'placeholder-encounter-id',
      modality: 'X-ray',
      bodyPart: 'chest'
    };
  }

  /**
   * Notify about critical findings
   */
  private async notifyCriticalFindings(imageId: string, findings: any[]): Promise<void> {
    // In real implementation, send notifications via SNS, email, etc.
    console.log(`CRITICAL FINDINGS for ${imageId}:`, findings);
    
    // Log for audit trail
    console.log({
      event: 'critical_finding_detected',
      imageId,
      findingsCount: findings.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get analysis results by image ID
   */
  async getAnalysisResults(imageId: string): Promise<ImageAnalysisResponse | null> {
    // In real implementation, fetch from database
    console.log(`Fetching analysis results for ${imageId}`);
    return null;
  }

  /**
   * Get report by image ID
   */
  async getReport(imageId: string): Promise<RadiologyReport | null> {
    // In real implementation, fetch from database
    console.log(`Fetching report for ${imageId}`);
    return null;
  }

  /**
   * Update report status
   */
  async updateReportStatus(
    reportId: string,
    status: 'draft' | 'ai_completed' | 'under_review' | 'verified' | 'finalized',
    verifiedBy?: string
  ): Promise<void> {
    // In real implementation, update database
    console.log(`Updating report ${reportId} status to ${status}`);
    
    if (status === 'verified' || status === 'finalized') {
      console.log(`Report ${reportId} verified by ${verifiedBy}`);
    }
  }

  /**
   * Get statistics for monitoring
   */
  async getStatistics(timeRange: 'day' | 'week' | 'month'): Promise<any> {
    // In real implementation, query database for statistics
    return {
      totalImages: 0,
      totalAnalyses: 0,
      averageConfidence: 0,
      criticalFindingsCount: 0,
      averageProcessingTime: 0,
      modalityBreakdown: {},
      timeRange
    };
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
  }> {
    const services = {
      s3: false,
      dicom: false,
      preprocessing: false,
      analysis: false,
      reporting: false
    };

    try {
      // Check S3 connectivity
      services.s3 = await this.checkS3Health();
      
      // Other services are always available (local processing)
      services.dicom = true;
      services.preprocessing = true;
      services.analysis = true;
      services.reporting = true;

      const allHealthy = Object.values(services).every(s => s);
      const someHealthy = Object.values(services).some(s => s);

      return {
        status: allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy',
        services
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unhealthy',
        services
      };
    }
  }

  /**
   * Check S3 health
   */
  private async checkS3Health(): Promise<boolean> {
    try {
      // Try to list bucket (minimal operation)
      // In real implementation, use S3 ListBuckets or HeadBucket
      return true;
    } catch (error) {
      return false;
    }
  }
}
