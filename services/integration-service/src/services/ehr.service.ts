import axios, { AxiosInstance } from 'axios';
import https from 'https';
import fs from 'fs';
import { config } from '../config';
import {
  PatientSyncRequest,
  FHIRBundle,
  HL7Message,
  HL7Segment,
} from '../types';

/**
 * EHR System Integration Service
 * Handles integration with external Electronic Health Record systems
 * - HL7 FHIR R4 API endpoints
 * - HL7 v2.x message handling
 * - Bidirectional patient data sync
 * - mTLS authentication
 */
export class EHRService {
  private client: AxiosInstance;

  constructor() {
    // Configure mTLS (mutual TLS) authentication
    const httpsAgent = this.createMTLSAgent();

    this.client = axios.create({
      baseURL: config.ehr.fhirBaseUrl,
      timeout: 30000,
      httpsAgent,
      headers: {
        'Content-Type': 'application/fhir+json',
        Accept: 'application/fhir+json',
      },
    });
  }

  /**
   * Create HTTPS agent with mTLS configuration
   */
  private createMTLSAgent(): https.Agent {
    try {
      const cert = fs.readFileSync(config.ehr.clientCertPath);
      const key = fs.readFileSync(config.ehr.clientKeyPath);
      const ca = fs.readFileSync(config.ehr.caCertPath);

      return new https.Agent({
        cert,
        key,
        ca,
        rejectUnauthorized: true,
      });
    } catch (error: any) {
      console.error('Failed to load mTLS certificates:', error.message);
      // Return default agent if certificates are not configured
      return new https.Agent();
    }
  }

  /**
   * Create or update a patient in the EHR system (FHIR)
   */
  async createPatient(patientData: any): Promise<{ id: string; resource: any }> {
    try {
      const fhirPatient = this.transformToFHIRPatient(patientData);

      const response = await this.client.post('/Patient', fhirPatient);

      return {
        id: response.data.id,
        resource: response.data,
      };
    } catch (error: any) {
      console.error('Failed to create patient in EHR:', error.message);
      throw new Error(`EHR patient creation failed: ${error.message}`);
    }
  }

  /**
   * Update existing patient in EHR system
   */
  async updatePatient(
    patientId: string,
    patientData: any
  ): Promise<{ id: string; resource: any }> {
    try {
      const fhirPatient = this.transformToFHIRPatient(patientData);
      fhirPatient.id = patientId;

      const response = await this.client.put(
        `/Patient/${patientId}`,
        fhirPatient
      );

      return {
        id: response.data.id,
        resource: response.data,
      };
    } catch (error: any) {
      console.error('Failed to update patient in EHR:', error.message);
      throw new Error(`EHR patient update failed: ${error.message}`);
    }
  }

  /**
   * Retrieve patient data from EHR system
   */
  async getPatient(patientId: string): Promise<any> {
    try {
      const response = await this.client.get(`/Patient/${patientId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to retrieve patient from EHR:', error.message);
      throw new Error(`EHR patient retrieval failed: ${error.message}`);
    }
  }

  /**
   * Sync patient data bidirectionally
   */
  async syncPatient(request: PatientSyncRequest): Promise<FHIRBundle> {
    try {
      const params: any = {
        _id: request.patientId,
        _revinclude: ['Encounter:patient', 'Condition:patient'],
      };

      if (request.includeHistory) {
        params._revinclude.push(
          'MedicationRequest:patient',
          'Observation:patient',
          'DiagnosticReport:patient'
        );
      }

      const response = await this.client.get('/Patient', { params });

      return response.data as FHIRBundle;
    } catch (error: any) {
      console.error('Failed to sync patient data:', error.message);
      throw new Error(`Patient sync failed: ${error.message}`);
    }
  }

  /**
   * Create an encounter in the EHR system
   */
  async createEncounter(encounterData: any): Promise<{ id: string }> {
    try {
      const fhirEncounter = this.transformToFHIREncounter(encounterData);

      const response = await this.client.post('/Encounter', fhirEncounter);

      return { id: response.data.id };
    } catch (error: any) {
      console.error('Failed to create encounter in EHR:', error.message);
      throw new Error(`EHR encounter creation failed: ${error.message}`);
    }
  }

  /**
   * Create a diagnostic report in the EHR system
   */
  async createDiagnosticReport(reportData: any): Promise<{ id: string }> {
    try {
      const fhirReport = this.transformToFHIRDiagnosticReport(reportData);

      const response = await this.client.post('/DiagnosticReport', fhirReport);

      return { id: response.data.id };
    } catch (error: any) {
      console.error('Failed to create diagnostic report in EHR:', error.message);
      throw new Error(`EHR diagnostic report creation failed: ${error.message}`);
    }
  }

  /**
   * Parse HL7 v2.x message
   */
  parseHL7Message(hl7String: string): HL7Message {
    const lines = hl7String.split('\r');
    const segments: HL7Segment[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      const fields = line.split('|');
      const segmentType = fields[0];

      segments.push({
        segmentType,
        fields: fields.slice(1),
      });
    }

    // Extract MSH (Message Header) segment
    const msh = segments.find((s) => s.segmentType === 'MSH');

    return {
      messageType: msh?.fields[7] || '',
      messageControlId: msh?.fields[8] || '',
      sendingApplication: msh?.fields[1] || '',
      sendingFacility: msh?.fields[2] || '',
      receivingApplication: msh?.fields[3] || '',
      receivingFacility: msh?.fields[4] || '',
      timestamp: msh?.fields[5] || '',
      segments,
    };
  }

  /**
   * Generate HL7 v2.x ADT^A01 message (Patient Admission)
   */
  generateHL7ADTMessage(patientData: any, encounterData: any): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const messageControlId = `MSG${Date.now()}`;

    const segments = [
      // MSH - Message Header
      `MSH|^~\\&|MEDHAOS|MEDHAOS_FACILITY|EHR|EHR_FACILITY|${timestamp}||ADT^A01|${messageControlId}|P|2.5`,

      // EVN - Event Type
      `EVN|A01|${timestamp}`,

      // PID - Patient Identification
      `PID|1||${patientData.patientId}||${patientData.lastName}^${patientData.firstName}||${patientData.dateOfBirth}|${patientData.gender}|||${patientData.address}||${patientData.phone}`,

      // PV1 - Patient Visit
      `PV1|1|${encounterData.encounterType}|${encounterData.location}|||${encounterData.attendingDoctor}||||||||||${encounterData.admissionType}`,
    ];

    return segments.join('\r') + '\r';
  }

  /**
   * Generate HL7 v2.x ORU^R01 message (Observation Result)
   */
  generateHL7ORUMessage(patientData: any, observations: any[]): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const messageControlId = `MSG${Date.now()}`;

    const segments = [
      // MSH - Message Header
      `MSH|^~\\&|MEDHAOS|MEDHAOS_FACILITY|EHR|EHR_FACILITY|${timestamp}||ORU^R01|${messageControlId}|P|2.5`,

      // PID - Patient Identification
      `PID|1||${patientData.patientId}||${patientData.lastName}^${patientData.firstName}||${patientData.dateOfBirth}|${patientData.gender}`,

      // OBR - Observation Request
      `OBR|1|${observations[0]?.orderId}||${observations[0]?.testCode}|||${timestamp}`,
    ];

    // Add OBX segments for each observation
    observations.forEach((obs, index) => {
      segments.push(
        `OBX|${index + 1}|NM|${obs.testCode}^${obs.testName}||${obs.value}|${obs.unit}|${obs.referenceRange}|${obs.abnormalFlag || ''}|||F`
      );
    });

    return segments.join('\r') + '\r';
  }

  /**
   * Transform internal patient data to FHIR Patient resource
   */
  private transformToFHIRPatient(patientData: any): any {
    return {
      resourceType: 'Patient',
      identifier: [
        {
          system: 'https://medhaos.health/patient-id',
          value: patientData.patientId,
        },
      ],
      name: [
        {
          use: 'official',
          family: patientData.lastName,
          given: [patientData.firstName],
          text: `${patientData.firstName} ${patientData.lastName}`,
        },
      ],
      gender: patientData.gender?.toLowerCase(),
      birthDate: patientData.dateOfBirth,
      telecom: [
        {
          system: 'phone',
          value: patientData.phone,
          use: 'mobile',
        },
        {
          system: 'email',
          value: patientData.email,
        },
      ],
      address: [
        {
          use: 'home',
          text: patientData.address,
          city: patientData.city,
          state: patientData.state,
          postalCode: patientData.postalCode,
          country: 'IN',
        },
      ],
    };
  }

  /**
   * Transform internal encounter data to FHIR Encounter resource
   */
  private transformToFHIREncounter(encounterData: any): any {
    return {
      resourceType: 'Encounter',
      status: encounterData.status || 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: encounterData.encounterType,
        display: encounterData.encounterType,
      },
      subject: {
        reference: `Patient/${encounterData.patientId}`,
      },
      period: {
        start: encounterData.startTime,
        end: encounterData.endTime,
      },
      reasonCode: [
        {
          text: encounterData.chiefComplaint,
        },
      ],
    };
  }

  /**
   * Transform internal diagnostic report to FHIR DiagnosticReport resource
   */
  private transformToFHIRDiagnosticReport(reportData: any): any {
    return {
      resourceType: 'DiagnosticReport',
      status: reportData.status || 'final',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: reportData.testCode,
            display: reportData.testName,
          },
        ],
      },
      subject: {
        reference: `Patient/${reportData.patientId}`,
      },
      effectiveDateTime: reportData.performedAt,
      issued: reportData.issuedAt,
      conclusion: reportData.conclusion,
      conclusionCode: reportData.conclusionCodes?.map((code: string) => ({
        coding: [
          {
            system: 'http://snomed.info/sct',
            code,
          },
        ],
      })),
    };
  }
}
