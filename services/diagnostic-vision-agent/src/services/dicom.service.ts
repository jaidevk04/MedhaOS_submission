import * as dicomParser from 'dicom-parser';
import { DicomMetadata } from '../types';
import { config } from '../config';

export class DicomService {
  private serverConfig = config.dicom;

  /**
   * Parse DICOM file buffer and extract metadata
   */
  parseDicomFile(buffer: Buffer): DicomMetadata {
    try {
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      const metadata: DicomMetadata = {
        studyInstanceUID: this.getTagValue(dataSet, 'x0020000d') || '',
        seriesInstanceUID: this.getTagValue(dataSet, 'x0020000e') || '',
        sopInstanceUID: this.getTagValue(dataSet, 'x00080018') || '',
        patientName: this.getTagValue(dataSet, 'x00100010'),
        patientID: this.getTagValue(dataSet, 'x00100020'),
        patientBirthDate: this.getTagValue(dataSet, 'x00100030'),
        patientSex: this.getTagValue(dataSet, 'x00100040'),
        studyDate: this.getTagValue(dataSet, 'x00080020'),
        studyTime: this.getTagValue(dataSet, 'x00080030'),
        modality: this.getTagValue(dataSet, 'x00080060'),
        manufacturer: this.getTagValue(dataSet, 'x00080070'),
        institutionName: this.getTagValue(dataSet, 'x00080080'),
        bodyPartExamined: this.getTagValue(dataSet, 'x00180015'),
        studyDescription: this.getTagValue(dataSet, 'x00081030'),
        seriesDescription: this.getTagValue(dataSet, 'x0008103e')
      };

      return metadata;
    } catch (error) {
      console.error('Error parsing DICOM file:', error);
      throw new Error('Failed to parse DICOM file');
    }
  }

  /**
   * Extract pixel data from DICOM file
   */
  extractPixelData(buffer: Buffer): Buffer {
    try {
      const byteArray = new Uint8Array(buffer);
      const dataSet = dicomParser.parseDicom(byteArray);

      const pixelDataElement = dataSet.elements.x7fe00010;
      if (!pixelDataElement) {
        throw new Error('No pixel data found in DICOM file');
      }

      const pixelData = new Uint8Array(
        dataSet.byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length
      );

      return Buffer.from(pixelData);
    } catch (error) {
      console.error('Error extracting pixel data:', error);
      throw new Error('Failed to extract pixel data from DICOM file');
    }
  }

  /**
   * Validate DICOM file format
   */
  validateDicomFile(buffer: Buffer): boolean {
    try {
      // Check for DICOM preamble (128 bytes) and DICM prefix
      if (buffer.length < 132) {
        return false;
      }

      const dicmPrefix = buffer.toString('ascii', 128, 132);
      return dicmPrefix === 'DICM';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get DICOM tag value as string
   */
  private getTagValue(dataSet: any, tag: string): string | undefined {
    try {
      const element = dataSet.elements[tag];
      if (!element) {
        return undefined;
      }

      return dataSet.string(tag);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Convert DICOM modality code to readable format
   */
  convertModalityCode(code: string): string {
    const modalityMap: Record<string, string> = {
      'CR': 'X-ray',
      'DX': 'X-ray',
      'CT': 'CT',
      'MR': 'MRI',
      'US': 'Ultrasound',
      'MG': 'Mammography',
      'PT': 'PET',
      'NM': 'Nuclear Medicine',
      'XA': 'X-ray Angiography'
    };

    return modalityMap[code] || code;
  }

  /**
   * Anonymize DICOM metadata (remove PHI)
   */
  anonymizeDicomMetadata(metadata: DicomMetadata): DicomMetadata {
    return {
      ...metadata,
      patientName: undefined,
      patientID: 'ANONYMIZED',
      patientBirthDate: undefined,
      institutionName: undefined
    };
  }

  /**
   * Query DICOM server for studies (placeholder for future implementation)
   */
  async queryStudies(patientId: string): Promise<any[]> {
    // This would implement C-FIND query to DICOM server
    // For now, return empty array as placeholder
    console.log(`Querying DICOM server for patient: ${patientId}`);
    return [];
  }

  /**
   * Retrieve DICOM images from server (placeholder for future implementation)
   */
  async retrieveImages(studyInstanceUID: string): Promise<Buffer[]> {
    // This would implement C-MOVE or C-GET to retrieve images
    // For now, return empty array as placeholder
    console.log(`Retrieving images for study: ${studyInstanceUID}`);
    return [];
  }

  /**
   * Store DICOM image to server (placeholder for future implementation)
   */
  async storeImage(buffer: Buffer): Promise<boolean> {
    // This would implement C-STORE to send images to DICOM server
    // For now, return true as placeholder
    console.log('Storing image to DICOM server');
    return true;
  }
}
