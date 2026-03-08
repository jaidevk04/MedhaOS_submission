import sharp from 'sharp';
import { ImageMetadata, ImagePreprocessingResult } from '../types';
import { config } from '../config';
import { S3StorageService } from './s3-storage.service';
import { DicomService } from './dicom.service';

export class ImagePreprocessingService {
  private s3Service: S3StorageService;
  private dicomService: DicomService;

  constructor() {
    this.s3Service = new S3StorageService();
    this.dicomService = new DicomService();
  }

  /**
   * Preprocess medical image for analysis
   */
  async preprocessImage(
    buffer: Buffer,
    patientId: string,
    imageId: string,
    format: string
  ): Promise<ImagePreprocessingResult> {
    const startTime = Date.now();

    try {
      // Handle DICOM files
      if (format === 'dcm' || format === 'dicom') {
        buffer = await this.preprocessDicomImage(buffer);
      }

      // Get original image metadata
      const metadata = await this.getImageMetadata(buffer);

      // Normalize image (resize, enhance, convert to standard format)
      const normalizedBuffer = await this.normalizeImage(buffer);

      // Generate thumbnail
      const thumbnailBuffer = await this.generateThumbnail(buffer);

      // Upload processed images to S3
      const [processedUpload, normalizedUpload, thumbnailUpload] = await Promise.all([
        this.s3Service.uploadImage(buffer, patientId, imageId, 'image/jpeg', {
          type: 'original',
          format: format
        }),
        this.s3Service.uploadImage(normalizedBuffer, patientId, `${imageId}_normalized`, 'image/jpeg', {
          type: 'normalized'
        }),
        this.s3Service.uploadThumbnail(thumbnailBuffer, patientId, imageId, 'image/jpeg')
      ]);

      const preprocessingTime = (Date.now() - startTime) / 1000;

      return {
        processedImageUrl: processedUpload.url,
        normalizedImageUrl: normalizedUpload.url,
        thumbnailUrl: thumbnailUpload.url,
        metadata,
        preprocessingTime
      };
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw new Error('Failed to preprocess image');
    }
  }

  /**
   * Preprocess DICOM image
   */
  private async preprocessDicomImage(buffer: Buffer): Promise<Buffer> {
    try {
      // Extract pixel data from DICOM
      const pixelData = this.dicomService.extractPixelData(buffer);
      
      // Convert to standard image format
      // Note: This is a simplified version. Real implementation would need
      // to handle different DICOM transfer syntaxes, photometric interpretations, etc.
      return pixelData;
    } catch (error) {
      console.error('Error preprocessing DICOM image:', error);
      throw new Error('Failed to preprocess DICOM image');
    }
  }

  /**
   * Normalize image for model input
   */
  private async normalizeImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .normalize() // Normalize contrast
        .sharpen() // Enhance edges
        .jpeg({
          quality: config.imageProcessing.imageQuality,
          progressive: true
        })
        .toBuffer();
    } catch (error) {
      console.error('Error normalizing image:', error);
      throw new Error('Failed to normalize image');
    }
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      const thumbnailSize = config.imageProcessing.thumbnailSize;
      
      return await sharp(buffer)
        .resize(thumbnailSize, thumbnailSize, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({
          quality: 80,
          progressive: true
        })
        .toBuffer();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }

  /**
   * Get image metadata
   */
  private async getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(buffer).metadata();

      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        sizeBytes: buffer.length,
        colorSpace: metadata.space,
        bitDepth: metadata.depth
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw new Error('Failed to get image metadata');
    }
  }

  /**
   * Validate image format
   */
  validateImageFormat(format: string): boolean {
    return config.imageProcessing.supportedFormats.includes(format.toLowerCase());
  }

  /**
   * Validate image size
   */
  validateImageSize(sizeBytes: number): boolean {
    const maxSizeBytes = config.imageProcessing.maxImageSizeMB * 1024 * 1024;
    return sizeBytes <= maxSizeBytes;
  }

  /**
   * Apply medical image enhancements
   */
  async enhanceForModality(buffer: Buffer, modality: string): Promise<Buffer> {
    try {
      let sharpInstance = sharp(buffer);

      // Apply modality-specific enhancements
      switch (modality.toLowerCase()) {
        case 'x-ray':
        case 'ct':
          // Enhance bone and tissue contrast
          sharpInstance = sharpInstance
            .normalize()
            .linear(1.2, 0) // Increase contrast
            .sharpen({ sigma: 1.5 });
          break;

        case 'mri':
          // Enhance soft tissue contrast
          sharpInstance = sharpInstance
            .normalize()
            .modulate({ brightness: 1.1 })
            .sharpen({ sigma: 1.0 });
          break;

        case 'ultrasound':
          // Reduce speckle noise
          sharpInstance = sharpInstance
            .median(3) // Median filter for noise reduction
            .sharpen({ sigma: 0.5 });
          break;

        default:
          // Default enhancement
          sharpInstance = sharpInstance.normalize();
      }

      return await sharpInstance
        .jpeg({ quality: config.imageProcessing.imageQuality })
        .toBuffer();
    } catch (error) {
      console.error('Error enhancing image:', error);
      throw new Error('Failed to enhance image');
    }
  }

  /**
   * Convert image to grayscale (for certain analyses)
   */
  async convertToGrayscale(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .grayscale()
        .jpeg({ quality: config.imageProcessing.imageQuality })
        .toBuffer();
    } catch (error) {
      console.error('Error converting to grayscale:', error);
      throw new Error('Failed to convert image to grayscale');
    }
  }

  /**
   * Extract region of interest from image
   */
  async extractROI(
    buffer: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .extract({ left: x, top: y, width, height })
        .jpeg({ quality: config.imageProcessing.imageQuality })
        .toBuffer();
    } catch (error) {
      console.error('Error extracting ROI:', error);
      throw new Error('Failed to extract region of interest');
    }
  }
}
