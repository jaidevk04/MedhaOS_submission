import { v4 as uuidv4 } from 'uuid';
import {
  RekognitionClient,
  DetectLabelsCommand,
  DetectTextCommand,
  RecognizeCelebritiesCommand,
} from '@aws-sdk/client-rekognition';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  MedicationVerification,
  MedicationSchedule,
  AdherenceRecord,
} from '../types';
import { config } from '../config';

/**
 * Medication Verification Service
 * Provides image recognition for pill identification and medication verification
 * Uses AWS Rekognition for image analysis and custom ML models for pill matching
 */
export class MedicationVerificationService {
  private rekognitionClient: RekognitionClient;
  private s3Client: S3Client;

  constructor() {
    this.rekognitionClient = new RekognitionClient({
      region: config.aws.region,
    });
    this.s3Client = new S3Client({
      region: config.aws.region,
    });
  }

  /**
   * Verify medication from uploaded image
   * Performs OCR and visual analysis to match against prescribed medication
   */
  async verifyMedication(
    patientId: string,
    medicationScheduleId: string,
    imageBuffer: Buffer,
    fileName: string
  ): Promise<MedicationVerification> {
    try {
      // Upload image to S3
      const imageUrl = await this.uploadImage(patientId, imageBuffer, fileName);

      // Get prescribed medication details
      const prescribedMedication = await this.getMedicationSchedule(medicationScheduleId);
      
      if (!prescribedMedication) {
        throw new Error('Prescribed medication not found');
      }

      // Perform image analysis
      const analysisResult = await this.analyzeImage(imageBuffer);

      // Match detected medication with prescribed medication
      const matchResult = this.matchMedication(
        analysisResult,
        prescribedMedication
      );

      // Create verification record
      const verification: MedicationVerification = {
        id: uuidv4(),
        patientId,
        medicationScheduleId,
        imageUrl,
        verificationStatus: matchResult.matched ? 'verified' : 'mismatch',
        confidence: matchResult.confidence,
        detectedMedication: matchResult.detectedMedication,
        matchResult: matchResult.matched,
        verifiedAt: new Date(),
        notes: matchResult.notes,
      };

      // Save verification record
      await this.saveVerification(verification);

      // If verified, record adherence
      if (matchResult.matched && matchResult.confidence >= config.medicationVerification.minConfidence) {
        await this.recordAdherence(patientId, medicationScheduleId, 'image', imageUrl);
      }

      console.log(`✅ Medication verification completed: ${verification.verificationStatus} (confidence: ${verification.confidence}%)`);
      
      return verification;
    } catch (error) {
      console.error('Error verifying medication:', error);
      throw error;
    }
  }

  /**
   * Analyze medication image using AWS Rekognition
   * Extracts text (OCR) and visual features from the image
   */
  private async analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult> {
    try {
      // Detect text in image (medication name, dosage, etc.)
      const textDetection = await this.detectText(imageBuffer);

      // Detect labels (pill shape, color, packaging)
      const labelDetection = await this.detectLabels(imageBuffer);

      return {
        detectedText: textDetection,
        detectedLabels: labelDetection,
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Detect text in image using AWS Rekognition OCR
   */
  private async detectText(imageBuffer: Buffer): Promise<string[]> {
    try {
      const command = new DetectTextCommand({
        Image: {
          Bytes: imageBuffer,
        },
      });

      const response = await this.rekognitionClient.send(command);
      
      const detectedText: string[] = [];
      
      if (response.TextDetections) {
        for (const detection of response.TextDetections) {
          if (detection.Type === 'LINE' && detection.DetectedText && detection.Confidence && detection.Confidence > 80) {
            detectedText.push(detection.DetectedText.toLowerCase());
          }
        }
      }

      console.log('Detected text:', detectedText);
      return detectedText;
    } catch (error) {
      console.error('Error detecting text:', error);
      return [];
    }
  }

  /**
   * Detect labels (visual features) in image
   */
  private async detectLabels(imageBuffer: Buffer): Promise<string[]> {
    try {
      const command = new DetectLabelsCommand({
        Image: {
          Bytes: imageBuffer,
        },
        MaxLabels: 20,
        MinConfidence: 70,
      });

      const response = await this.rekognitionClient.send(command);
      
      const detectedLabels: string[] = [];
      
      if (response.Labels) {
        for (const label of response.Labels) {
          if (label.Name) {
            detectedLabels.push(label.Name.toLowerCase());
          }
        }
      }

      console.log('Detected labels:', detectedLabels);
      return detectedLabels;
    } catch (error) {
      console.error('Error detecting labels:', error);
      return [];
    }
  }

  /**
   * Match detected medication with prescribed medication
   * Uses fuzzy matching and confidence scoring
   */
  private matchMedication(
    analysisResult: ImageAnalysisResult,
    prescribedMedication: MedicationSchedule
  ): MatchResult {
    const medicationName = prescribedMedication.medicationName.toLowerCase();
    const dosage = prescribedMedication.dosage.toLowerCase();
    
    let confidence = 0;
    let detectedMedication = '';
    let notes: string[] = [];

    // Check for exact medication name match
    const nameMatch = analysisResult.detectedText.some(text => 
      text.includes(medicationName) || medicationName.includes(text)
    );

    if (nameMatch) {
      confidence += 60;
      detectedMedication = medicationName;
      notes.push('Medication name matched');
    }

    // Check for dosage match
    const dosageMatch = analysisResult.detectedText.some(text => 
      text.includes(dosage.replace(/\s+/g, ''))
    );

    if (dosageMatch) {
      confidence += 30;
      notes.push('Dosage matched');
    }

    // Check for medication-related labels
    const medicationLabels = ['pill', 'tablet', 'capsule', 'medicine', 'medication', 'drug', 'pharmaceutical'];
    const hasRelevantLabels = analysisResult.detectedLabels.some(label =>
      medicationLabels.some(medLabel => label.includes(medLabel))
    );

    if (hasRelevantLabels) {
      confidence += 10;
      notes.push('Image contains medication-related objects');
    }

    // Fuzzy matching for partial matches
    if (!nameMatch && confidence < 60) {
      const partialMatch = this.findPartialMatch(
        medicationName,
        analysisResult.detectedText
      );
      
      if (partialMatch.found) {
        confidence += partialMatch.score;
        detectedMedication = partialMatch.matchedText;
        notes.push(`Partial match found: ${partialMatch.matchedText}`);
      }
    }

    // Determine if match is acceptable
    const matched = confidence >= config.medicationVerification.minConfidence;

    if (!matched && confidence > 0) {
      notes.push('Confidence too low for automatic verification');
    } else if (!matched) {
      notes.push('No medication detected in image');
    }

    return {
      matched,
      confidence: Math.min(confidence, 100),
      detectedMedication: detectedMedication || 'Unknown',
      notes: notes.join('; '),
    };
  }

  /**
   * Find partial matches using fuzzy string matching
   */
  private findPartialMatch(
    target: string,
    candidates: string[]
  ): { found: boolean; score: number; matchedText: string } {
    let bestScore = 0;
    let bestMatch = '';

    for (const candidate of candidates) {
      const score = this.calculateSimilarity(target, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    // Consider it a partial match if similarity > 50%
    const found = bestScore > 50;
    
    return {
      found,
      score: Math.round(bestScore * 0.5), // Scale down for partial matches
      matchedText: bestMatch,
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 100;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return ((longer.length - distance) / longer.length) * 100;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Upload medication image to S3
   */
  private async uploadImage(
    patientId: string,
    imageBuffer: Buffer,
    fileName: string
  ): Promise<string> {
    try {
      const key = `medication-verification/${patientId}/${Date.now()}-${fileName}`;
      
      const command = new PutObjectCommand({
        Bucket: config.aws.s3.medicationImagesBucket,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          patientId,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Generate signed URL for access
      const getCommand = new GetObjectCommand({
        Bucket: config.aws.s3.medicationImagesBucket,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: 7 * 24 * 60 * 60, // 7 days
      });

      console.log(`✅ Image uploaded to S3: ${key}`);
      return signedUrl;
    } catch (error) {
      console.error('Error uploading image to S3:', error);
      throw error;
    }
  }

  /**
   * Get adherence tracking for a patient
   */
  async getAdherenceTracking(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AdherenceTrackingResult> {
    try {
      const records = await this.getAdherenceRecords(patientId, startDate, endDate);
      const verifications = await this.getVerifications(patientId, startDate, endDate);

      const totalScheduled = records.length;
      const taken = records.filter(r => r.status === 'taken').length;
      const missed = records.filter(r => r.status === 'missed').length;
      const verified = verifications.filter(v => v.verificationStatus === 'verified').length;

      const adherenceRate = totalScheduled > 0 ? (taken / totalScheduled) * 100 : 0;
      const verificationRate = taken > 0 ? (verified / taken) * 100 : 0;

      return {
        patientId,
        period: {
          startDate: startDate || new Date(0),
          endDate: endDate || new Date(),
        },
        totalScheduled,
        taken,
        missed,
        verified,
        adherenceRate: Math.round(adherenceRate * 100) / 100,
        verificationRate: Math.round(verificationRate * 100) / 100,
        recentVerifications: verifications.slice(0, 10),
      };
    } catch (error) {
      console.error('Error getting adherence tracking:', error);
      throw error;
    }
  }

  /**
   * Get verification history for a patient
   */
  async getVerificationHistory(
    patientId: string,
    limit: number = 20
  ): Promise<MedicationVerification[]> {
    try {
      return await this.getVerifications(patientId, undefined, undefined, limit);
    } catch (error) {
      console.error('Error getting verification history:', error);
      throw error;
    }
  }

  /**
   * Reprocess failed verification
   */
  async reprocessVerification(verificationId: string): Promise<MedicationVerification> {
    try {
      const verification = await this.getVerificationById(verificationId);
      
      if (!verification) {
        throw new Error('Verification not found');
      }

      // Download image from S3
      const imageBuffer = await this.downloadImage(verification.imageUrl);

      // Reanalyze
      const analysisResult = await this.analyzeImage(imageBuffer);
      const prescribedMedication = await this.getMedicationSchedule(verification.medicationScheduleId);
      
      if (!prescribedMedication) {
        throw new Error('Prescribed medication not found');
      }

      const matchResult = this.matchMedication(analysisResult, prescribedMedication);

      // Update verification
      verification.verificationStatus = matchResult.matched ? 'verified' : 'mismatch';
      verification.confidence = matchResult.confidence;
      verification.detectedMedication = matchResult.detectedMedication;
      verification.matchResult = matchResult.matched;
      verification.notes = matchResult.notes;
      verification.verifiedAt = new Date();

      await this.updateVerification(verification);

      console.log(`✅ Reprocessed verification: ${verification.id}`);
      return verification;
    } catch (error) {
      console.error('Error reprocessing verification:', error);
      throw error;
    }
  }

  // Database operations (would use Prisma in production)

  private async saveVerification(verification: MedicationVerification): Promise<void> {
    console.log('Saving verification:', verification.id);
    // await prisma.medicationVerification.create({ data: verification });
  }

  private async updateVerification(verification: MedicationVerification): Promise<void> {
    console.log('Updating verification:', verification.id);
    // await prisma.medicationVerification.update({
    //   where: { id: verification.id },
    //   data: verification
    // });
  }

  private async getVerificationById(id: string): Promise<MedicationVerification | null> {
    // return await prisma.medicationVerification.findUnique({ where: { id } });
    return null;
  }

  private async getVerifications(
    patientId: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number
  ): Promise<MedicationVerification[]> {
    // return await prisma.medicationVerification.findMany({
    //   where: {
    //     patientId,
    //     verifiedAt: {
    //       gte: startDate,
    //       lte: endDate,
    //     },
    //   },
    //   orderBy: { verifiedAt: 'desc' },
    //   take: limit,
    // });
    return [];
  }

  private async getMedicationSchedule(id: string): Promise<MedicationSchedule | null> {
    // return await prisma.medicationSchedule.findUnique({ where: { id } });
    return null;
  }

  private async recordAdherence(
    patientId: string,
    medicationScheduleId: string,
    verificationMethod: 'image',
    imageUrl: string
  ): Promise<void> {
    const record: AdherenceRecord = {
      id: uuidv4(),
      patientId,
      medicationScheduleId,
      scheduledTime: new Date(),
      takenTime: new Date(),
      status: 'taken',
      verificationMethod,
      imageUrl,
      createdAt: new Date(),
    };

    console.log('Recording adherence:', record.id);
    // await prisma.adherenceRecord.create({ data: record });
  }

  private async getAdherenceRecords(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AdherenceRecord[]> {
    // return await prisma.adherenceRecord.findMany({
    //   where: {
    //     patientId,
    //     createdAt: {
    //       gte: startDate,
    //       lte: endDate,
    //     },
    //   },
    //   orderBy: { createdAt: 'desc' },
    // });
    return [];
  }

  private async downloadImage(url: string): Promise<Buffer> {
    // In production, download from S3 using the URL
    // For now, return empty buffer
    return Buffer.from('');
  }
}

// Types

interface ImageAnalysisResult {
  detectedText: string[];
  detectedLabels: string[];
}

interface MatchResult {
  matched: boolean;
  confidence: number;
  detectedMedication: string;
  notes: string;
}

interface AdherenceTrackingResult {
  patientId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalScheduled: number;
  taken: number;
  missed: number;
  verified: number;
  adherenceRate: number;
  verificationRate: number;
  recentVerifications: MedicationVerification[];
}
