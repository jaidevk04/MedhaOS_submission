import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import {
  ABHAVerificationRequest,
  ABHAVerificationResponse,
  HealthRecordRequest,
  FHIRBundle,
} from '../types';

/**
 * ABDM Integration Service
 * Handles integration with Ayushman Bharat Digital Mission (ABDM)
 * - ABHA ID verification
 * - Health record retrieval
 * - FHIR R4 data transformation
 * - OAuth 2.0 authentication
 */
export class ABDMService {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: config.abdm.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with ABDM using OAuth 2.0 client credentials flow
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await this.client.post('/v1/auth/token', {
        clientId: config.abdm.clientId,
        clientSecret: config.abdm.clientSecret,
        grantType: 'client_credentials',
      });

      this.accessToken = response.data.accessToken;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expiresIn - 300) * 1000;

      return this.accessToken;
    } catch (error: any) {
      console.error('ABDM authentication failed:', error.message);
      throw new Error('Failed to authenticate with ABDM');
    }
  }

  /**
   * Verify ABHA ID and retrieve basic patient information
   */
  async verifyABHAId(
    request: ABHAVerificationRequest
  ): Promise<ABHAVerificationResponse> {
    try {
      const token = await this.authenticate();

      const response = await this.client.post(
        '/v1/verification/abha',
        {
          abhaId: request.abhaId,
          purpose: request.purpose,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        verified: response.data.verified,
        abhaId: response.data.abhaId,
        name: response.data.name,
        gender: response.data.gender,
        dateOfBirth: response.data.dateOfBirth,
        address: response.data.address,
        mobile: response.data.mobile,
        email: response.data.email,
      };
    } catch (error: any) {
      console.error('ABHA verification failed:', error.message);
      throw new Error(`Failed to verify ABHA ID: ${error.message}`);
    }
  }

  /**
   * Retrieve health records from ABDM for a patient
   * Requires valid consent from the patient
   */
  async getHealthRecords(request: HealthRecordRequest): Promise<FHIRBundle> {
    try {
      const token = await this.authenticate();

      const response = await this.client.post(
        '/v1/health-information/fetch',
        {
          abhaId: request.abhaId,
          consentId: request.consentId,
          dateRange: {
            from: request.dateRange.from,
            to: request.dateRange.to,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ABDM returns health records in FHIR R4 format
      return response.data as FHIRBundle;
    } catch (error: any) {
      console.error('Health record retrieval failed:', error.message);
      throw new Error(`Failed to retrieve health records: ${error.message}`);
    }
  }

  /**
   * Request consent from patient to access their health records
   */
  async requestConsent(
    abhaId: string,
    purpose: string,
    dateRange: { from: string; to: string }
  ): Promise<{ consentId: string; status: string }> {
    try {
      const token = await this.authenticate();

      const response = await this.client.post(
        '/v1/consent/request',
        {
          abhaId,
          purpose,
          dateRange,
          requester: {
            name: 'MedhaOS Healthcare Platform',
            identifier: config.abdm.clientId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        consentId: response.data.consentId,
        status: response.data.status,
      };
    } catch (error: any) {
      console.error('Consent request failed:', error.message);
      throw new Error(`Failed to request consent: ${error.message}`);
    }
  }

  /**
   * Check consent status
   */
  async getConsentStatus(consentId: string): Promise<{
    status: 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED';
    grantedAt?: string;
    expiresAt?: string;
  }> {
    try {
      const token = await this.authenticate();

      const response = await this.client.get(
        `/v1/consent/status/${consentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        status: response.data.status,
        grantedAt: response.data.grantedAt,
        expiresAt: response.data.expiresAt,
      };
    } catch (error: any) {
      console.error('Consent status check failed:', error.message);
      throw new Error(`Failed to check consent status: ${error.message}`);
    }
  }

  /**
   * Transform FHIR Bundle to MedhaOS internal format
   */
  transformFHIRToInternal(fhirBundle: FHIRBundle): any {
    const transformed: any = {
      patient: null,
      encounters: [],
      conditions: [],
      medications: [],
      observations: [],
      diagnosticReports: [],
    };

    for (const entry of fhirBundle.entry) {
      const resource = entry.resource;

      switch (resource.resourceType) {
        case 'Patient':
          transformed.patient = this.transformPatient(resource);
          break;
        case 'Encounter':
          transformed.encounters.push(this.transformEncounter(resource));
          break;
        case 'Condition':
          transformed.conditions.push(this.transformCondition(resource));
          break;
        case 'MedicationRequest':
          transformed.medications.push(this.transformMedication(resource));
          break;
        case 'Observation':
          transformed.observations.push(this.transformObservation(resource));
          break;
        case 'DiagnosticReport':
          transformed.diagnosticReports.push(
            this.transformDiagnosticReport(resource)
          );
          break;
      }
    }

    return transformed;
  }

  private transformPatient(fhirPatient: any): any {
    return {
      abhaId: fhirPatient.identifier?.find(
        (id: any) => id.system === 'https://healthid.ndhm.gov.in'
      )?.value,
      name: fhirPatient.name?.[0]?.text,
      gender: fhirPatient.gender,
      dateOfBirth: fhirPatient.birthDate,
      phone: fhirPatient.telecom?.find((t: any) => t.system === 'phone')
        ?.value,
      email: fhirPatient.telecom?.find((t: any) => t.system === 'email')
        ?.value,
      address: fhirPatient.address?.[0]?.text,
    };
  }

  private transformEncounter(fhirEncounter: any): any {
    return {
      encounterId: fhirEncounter.id,
      type: fhirEncounter.class?.code,
      status: fhirEncounter.status,
      period: {
        start: fhirEncounter.period?.start,
        end: fhirEncounter.period?.end,
      },
      reasonCode: fhirEncounter.reasonCode?.[0]?.text,
    };
  }

  private transformCondition(fhirCondition: any): any {
    return {
      conditionId: fhirCondition.id,
      code: fhirCondition.code?.coding?.[0]?.code,
      display: fhirCondition.code?.coding?.[0]?.display,
      clinicalStatus: fhirCondition.clinicalStatus?.coding?.[0]?.code,
      onsetDateTime: fhirCondition.onsetDateTime,
      recordedDate: fhirCondition.recordedDate,
    };
  }

  private transformMedication(fhirMedication: any): any {
    return {
      medicationId: fhirMedication.id,
      medication: fhirMedication.medicationCodeableConcept?.text,
      dosage: fhirMedication.dosageInstruction?.[0]?.text,
      status: fhirMedication.status,
      authoredOn: fhirMedication.authoredOn,
    };
  }

  private transformObservation(fhirObservation: any): any {
    return {
      observationId: fhirObservation.id,
      code: fhirObservation.code?.coding?.[0]?.code,
      display: fhirObservation.code?.coding?.[0]?.display,
      value: fhirObservation.valueQuantity?.value,
      unit: fhirObservation.valueQuantity?.unit,
      effectiveDateTime: fhirObservation.effectiveDateTime,
      status: fhirObservation.status,
    };
  }

  private transformDiagnosticReport(fhirReport: any): any {
    return {
      reportId: fhirReport.id,
      code: fhirReport.code?.coding?.[0]?.code,
      display: fhirReport.code?.coding?.[0]?.display,
      status: fhirReport.status,
      effectiveDateTime: fhirReport.effectiveDateTime,
      conclusion: fhirReport.conclusion,
    };
  }
}
