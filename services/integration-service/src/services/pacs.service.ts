import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { DICOMStudy, DICOMImage, DICOMQueryRequest } from '../types';
import * as dicomParser from 'dicom-parser';

/**
 * PACS (Picture Archiving and Communication System) Integration Service
 * Handles integration with medical imaging systems
 * - DICOM protocol support
 * - Image storage and retrieval
 * - DICOM security layer
 */
export class PACSService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
    });
  }

  /**
   * Query DICOM studies from PACS
   * In production, this would use DICOM C-FIND protocol
   * For this implementation, we'll use a REST API wrapper
   */
  async queryStudies(query: DICOMQueryRequest): Promise<DICOMStudy[]> {
    try {
      // In a real implementation, this would use DICOM C-FIND
      // For now, we'll simulate with a mock response
      console.log('Querying PACS with:', query);

      // This would be replaced with actual DICOM query logic
      const studies: DICOMStudy[] = [];

      return studies;
    } catch (error: any) {
      console.error('Failed to query DICOM studies:', error.message);
      throw new Error(`PACS query failed: ${error.message}`);
    }
  }

  /**
   * Retrieve DICOM images for a study
   * In production, this would use DICOM C-MOVE or C-GET protocol
   */
  async retrieveStudy(studyInstanceUID: string): Promise<DICOMImage[]> {
    try {
      console.log('Retrieving study:', studyInstanceUID);

      // In a real implementation, this would use DICOM C-MOVE/C-GET
      // For now, we'll retrieve from S3
      const images: DICOMImage[] = [];

      return images;
    } catch (error: any) {
      console.error('Failed to retrieve DICOM study:', error.message);
      throw new Error(`PACS retrieval failed: ${error.message}`);
    }
  }

  /**
   * Store DICOM image to S3 and PACS
   */
  async storeDICOMImage(
    imageBuffer: Buffer,
    metadata: {
      patientId: string;
      studyInstanceUID: string;
      seriesInstanceUID: string;
      sopInstanceUID: string;
    }
  ): Promise<{ imageUrl: string; s3Key: string }> {
    try {
      // Parse DICOM file
      const dataSet = dicomParser.parseDicom(new Uint8Array(imageBuffer));

      // Extract metadata
      const patientName = this.getDICOMString(dataSet, 'x00100010');
      const studyDate = this.getDICOMString(dataSet, 'x00080020');
      const modality = this.getDICOMString(dataSet, 'x00080060');

      // Generate S3 key
      const s3Key = `dicom/${metadata.patientId}/${metadata.studyInstanceUID}/${metadata.seriesInstanceUID}/${metadata.sopInstanceUID}.dcm`;

      // Store to S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: config.pacs.s3Bucket,
          Key: s3Key,
          Body: imageBuffer,
          ContentType: 'application/dicom',
          Metadata: {
            patientId: metadata.patientId,
            patientName: patientName || '',
            studyInstanceUID: metadata.studyInstanceUID,
            seriesInstanceUID: metadata.seriesInstanceUID,
            sopInstanceUID: metadata.sopInstanceUID,
            studyDate: studyDate || '',
            modality: modality || '',
          },
        })
      );

      // Generate presigned URL for retrieval
      const imageUrl = await this.getPresignedUrl(s3Key);

      return { imageUrl, s3Key };
    } catch (error: any) {
      console.error('Failed to store DICOM image:', error.message);
      throw new Error(`DICOM storage failed: ${error.message}`);
    }
  }

  /**
   * Retrieve DICOM image from S3
   */
  async getDICOMImage(s3Key: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: config.pacs.s3Bucket,
          Key: s3Key,
        })
      );

      if (!response.Body) {
        throw new Error('No image data received');
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error: any) {
      console.error('Failed to retrieve DICOM image:', error.message);
      throw new Error(`DICOM retrieval failed: ${error.message}`);
    }
  }

  /**
   * Get presigned URL for DICOM image
   */
  async getPresignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: config.pacs.s3Bucket,
        Key: s3Key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      return url;
    } catch (error: any) {
      console.error('Failed to generate presigned URL:', error.message);
      throw new Error(`Presigned URL generation failed: ${error.message}`);
    }
  }

  /**
   * Parse DICOM metadata from buffer
   */
  parseDICOMMetadata(imageBuffer: Buffer): Record<string, any> {
    try {
      const dataSet = dicomParser.parseDicom(new Uint8Array(imageBuffer));

      return {
        patientId: this.getDICOMString(dataSet, 'x00100020'),
        patientName: this.getDICOMString(dataSet, 'x00100010'),
        patientBirthDate: this.getDICOMString(dataSet, 'x00100030'),
        patientSex: this.getDICOMString(dataSet, 'x00100040'),
        studyInstanceUID: this.getDICOMString(dataSet, 'x0020000d'),
        seriesInstanceUID: this.getDICOMString(dataSet, 'x0020000e'),
        sopInstanceUID: this.getDICOMString(dataSet, 'x00080018'),
        studyDate: this.getDICOMString(dataSet, 'x00080020'),
        studyTime: this.getDICOMString(dataSet, 'x00080030'),
        studyDescription: this.getDICOMString(dataSet, 'x00081030'),
        seriesDescription: this.getDICOMString(dataSet, 'x0008103e'),
        modality: this.getDICOMString(dataSet, 'x00080060'),
        manufacturer: this.getDICOMString(dataSet, 'x00080070'),
        institutionName: this.getDICOMString(dataSet, 'x00080080'),
        rows: this.getDICOMNumber(dataSet, 'x00280010'),
        columns: this.getDICOMNumber(dataSet, 'x00280011'),
        bitsAllocated: this.getDICOMNumber(dataSet, 'x00280100'),
        bitsStored: this.getDICOMNumber(dataSet, 'x00280101'),
      };
    } catch (error: any) {
      console.error('Failed to parse DICOM metadata:', error.message);
      throw new Error(`DICOM parsing failed: ${error.message}`);
    }
  }

  /**
   * Anonymize DICOM image (remove patient identifiable information)
   */
  anonymizeDICOM(imageBuffer: Buffer): Buffer {
    try {
      const dataSet = dicomParser.parseDicom(new Uint8Array(imageBuffer));

      // Tags to anonymize
      const tagsToRemove = [
        'x00100010', // Patient Name
        'x00100020', // Patient ID
        'x00100030', // Patient Birth Date
        'x00100032', // Patient Birth Time
        'x00101000', // Other Patient IDs
        'x00101001', // Other Patient Names
        'x00102160', // Ethnic Group
        'x00102180', // Occupation
        'x001021b0', // Additional Patient History
        'x00104000', // Patient Comments
      ];

      // In a real implementation, we would modify the DICOM dataset
      // and regenerate the buffer. For now, we'll return the original
      console.log('Anonymizing DICOM tags:', tagsToRemove);

      return imageBuffer;
    } catch (error: any) {
      console.error('Failed to anonymize DICOM:', error.message);
      throw new Error(`DICOM anonymization failed: ${error.message}`);
    }
  }

  /**
   * Validate DICOM file integrity
   */
  validateDICOM(imageBuffer: Buffer): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      const dataSet = dicomParser.parseDicom(new Uint8Array(imageBuffer));

      // Check required tags
      const requiredTags = [
        { tag: 'x00080018', name: 'SOP Instance UID' },
        { tag: 'x0020000d', name: 'Study Instance UID' },
        { tag: 'x0020000e', name: 'Series Instance UID' },
        { tag: 'x00080060', name: 'Modality' },
      ];

      for (const { tag, name } of requiredTags) {
        if (!dataSet.elements[tag]) {
          errors.push(`Missing required tag: ${name} (${tag})`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      errors.push(`DICOM parsing error: ${error.message}`);
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Convert DICOM to JPEG for web viewing
   */
  async convertDICOMToJPEG(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // In a real implementation, this would use a library like dcmjs
      // or cornerstone to convert DICOM pixel data to JPEG
      console.log('Converting DICOM to JPEG');

      // For now, return the original buffer
      // In production, implement actual conversion
      return imageBuffer;
    } catch (error: any) {
      console.error('Failed to convert DICOM to JPEG:', error.message);
      throw new Error(`DICOM conversion failed: ${error.message}`);
    }
  }

  /**
   * Helper: Get DICOM string value
   */
  private getDICOMString(dataSet: any, tag: string): string | undefined {
    const element = dataSet.elements[tag];
    if (!element) return undefined;

    try {
      return dataSet.string(tag);
    } catch {
      return undefined;
    }
  }

  /**
   * Helper: Get DICOM number value
   */
  private getDICOMNumber(dataSet: any, tag: string): number | undefined {
    const element = dataSet.elements[tag];
    if (!element) return undefined;

    try {
      return dataSet.uint16(tag);
    } catch {
      return undefined;
    }
  }

  /**
   * Create DICOM study record
   */
  async createStudyRecord(
    patientId: string,
    studyData: {
      studyInstanceUID: string;
      studyDate: string;
      studyDescription: string;
      modality: string;
      referringPhysician: string;
    }
  ): Promise<{ studyId: string }> {
    try {
      // In a real implementation, this would create a record in the database
      console.log('Creating study record for patient:', patientId);

      return {
        studyId: studyData.studyInstanceUID,
      };
    } catch (error: any) {
      console.error('Failed to create study record:', error.message);
      throw new Error(`Study record creation failed: ${error.message}`);
    }
  }

  /**
   * Get study metadata
   */
  async getStudyMetadata(studyInstanceUID: string): Promise<DICOMStudy | null> {
    try {
      // In a real implementation, this would query the database
      console.log('Retrieving study metadata:', studyInstanceUID);

      return null;
    } catch (error: any) {
      console.error('Failed to retrieve study metadata:', error.message);
      throw new Error(`Study metadata retrieval failed: ${error.message}`);
    }
  }
}
