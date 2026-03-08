import axios, { AxiosInstance } from 'axios';
import net from 'net';
import { config } from '../config';
import { LabOrderRequest, LabResult, HL7Message, HL7Segment } from '../types';

/**
 * Laboratory Information System (LIS) Integration Service
 * Handles integration with laboratory systems
 * - Lab order placement API
 * - Result retrieval service
 * - HL7 ORU message parsing
 */
export class LISService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.lis.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.lis.apiKey,
      },
    });
  }

  /**
   * Place a lab order
   */
  async placeLabOrder(order: LabOrderRequest): Promise<{
    orderId: string;
    status: string;
    estimatedCompletionTime?: string;
  }> {
    try {
      const response = await this.client.post('/orders', {
        patientId: order.patientId,
        encounterId: order.encounterId,
        tests: order.tests,
        urgency: order.urgency,
        clinicalNotes: order.clinicalNotes,
        orderedAt: new Date().toISOString(),
      });

      return {
        orderId: response.data.orderId,
        status: response.data.status,
        estimatedCompletionTime: response.data.estimatedCompletionTime,
      };
    } catch (error: any) {
      console.error('Failed to place lab order:', error.message);
      throw new Error(`Lab order placement failed: ${error.message}`);
    }
  }

  /**
   * Retrieve lab results for a specific order
   */
  async getLabResults(orderId: string): Promise<LabResult[]> {
    try {
      const response = await this.client.get(`/orders/${orderId}/results`);

      return response.data.results.map((result: any) => ({
        orderId: result.orderId,
        patientId: result.patientId,
        testCode: result.testCode,
        testName: result.testName,
        result: result.result,
        unit: result.unit,
        referenceRange: result.referenceRange,
        abnormalFlag: result.abnormalFlag,
        status: result.status,
        performedAt: result.performedAt,
      }));
    } catch (error: any) {
      console.error('Failed to retrieve lab results:', error.message);
      throw new Error(`Lab result retrieval failed: ${error.message}`);
    }
  }

  /**
   * Retrieve all lab results for a patient
   */
  async getPatientLabResults(
    patientId: string,
    dateRange?: { from: string; to: string }
  ): Promise<LabResult[]> {
    try {
      const params: any = { patientId };

      if (dateRange) {
        params.fromDate = dateRange.from;
        params.toDate = dateRange.to;
      }

      const response = await this.client.get('/results', { params });

      return response.data.results.map((result: any) => ({
        orderId: result.orderId,
        patientId: result.patientId,
        testCode: result.testCode,
        testName: result.testName,
        result: result.result,
        unit: result.unit,
        referenceRange: result.referenceRange,
        abnormalFlag: result.abnormalFlag,
        status: result.status,
        performedAt: result.performedAt,
      }));
    } catch (error: any) {
      console.error('Failed to retrieve patient lab results:', error.message);
      throw new Error(`Patient lab result retrieval failed: ${error.message}`);
    }
  }

  /**
   * Cancel a lab order
   */
  async cancelLabOrder(orderId: string, reason: string): Promise<void> {
    try {
      await this.client.post(`/orders/${orderId}/cancel`, {
        reason,
        cancelledAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Failed to cancel lab order:', error.message);
      throw new Error(`Lab order cancellation failed: ${error.message}`);
    }
  }

  /**
   * Parse HL7 ORU^R01 message (Observation Result)
   */
  parseHL7ORUMessage(hl7String: string): {
    patientId: string;
    orderId: string;
    results: LabResult[];
  } {
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

    // Extract patient ID from PID segment
    const pidSegment = segments.find((s) => s.segmentType === 'PID');
    const patientId = pidSegment?.fields[2] || '';

    // Extract order ID from OBR segment
    const obrSegment = segments.find((s) => s.segmentType === 'OBR');
    const orderId = obrSegment?.fields[1] || '';

    // Extract results from OBX segments
    const obxSegments = segments.filter((s) => s.segmentType === 'OBX');
    const results: LabResult[] = obxSegments.map((obx) => {
      const testInfo = obx.fields[2].split('^');
      const testCode = testInfo[0];
      const testName = testInfo[1] || testCode;

      return {
        orderId,
        patientId,
        testCode,
        testName,
        result: obx.fields[4],
        unit: obx.fields[5],
        referenceRange: obx.fields[6],
        abnormalFlag: obx.fields[7],
        status: obx.fields[10] === 'F' ? 'FINAL' : 'PRELIMINARY',
        performedAt: new Date().toISOString(),
      };
    });

    return {
      patientId,
      orderId,
      results,
    };
  }

  /**
   * Send HL7 message to LIS via TCP/IP
   */
  async sendHL7Message(hl7Message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let response = '';

      client.connect(config.lis.hl7Port, config.lis.hl7Host, () => {
        // Wrap message with MLLP (Minimal Lower Layer Protocol) framing
        const wrappedMessage = `\x0B${hl7Message}\x1C\x0D`;
        client.write(wrappedMessage);
      });

      client.on('data', (data) => {
        response += data.toString();
        // Check for end of message
        if (response.includes('\x1C\x0D')) {
          client.destroy();
        }
      });

      client.on('close', () => {
        // Remove MLLP framing
        const cleanResponse = response.replace(/[\x0B\x1C\x0D]/g, '');
        resolve(cleanResponse);
      });

      client.on('error', (error) => {
        reject(new Error(`HL7 message send failed: ${error.message}`));
      });

      // Set timeout
      client.setTimeout(30000, () => {
        client.destroy();
        reject(new Error('HL7 message send timeout'));
      });
    });
  }

  /**
   * Generate HL7 ORM^O01 message (Order Message)
   */
  generateHL7OrderMessage(order: LabOrderRequest): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const messageControlId = `MSG${Date.now()}`;

    const segments = [
      // MSH - Message Header
      `MSH|^~\\&|MEDHAOS|MEDHAOS_FACILITY|LIS|LIS_FACILITY|${timestamp}||ORM^O01|${messageControlId}|P|2.5`,

      // PID - Patient Identification
      `PID|1||${order.patientId}`,

      // ORC - Common Order
      `ORC|NW|${order.encounterId}|||${order.urgency}`,
    ];

    // Add OBR segments for each test
    order.tests.forEach((test, index) => {
      segments.push(
        `OBR|${index + 1}|${order.encounterId}||${test.testCode}^${test.testName}|||${timestamp}||||||||${order.clinicalNotes || ''}`
      );
    });

    return segments.join('\r') + '\r';
  }

  /**
   * Listen for incoming HL7 messages (for receiving results)
   */
  startHL7Listener(
    port: number,
    onMessage: (message: string) => void
  ): net.Server {
    const server = net.createServer((socket) => {
      let buffer = '';

      socket.on('data', (data) => {
        buffer += data.toString();

        // Check for complete message (MLLP framing)
        if (buffer.includes('\x1C\x0D')) {
          // Remove MLLP framing
          const message = buffer.replace(/[\x0B\x1C\x0D]/g, '');

          // Process message
          onMessage(message);

          // Send ACK
          const ack = this.generateHL7ACK(message);
          const wrappedAck = `\x0B${ack}\x1C\x0D`;
          socket.write(wrappedAck);

          buffer = '';
        }
      });

      socket.on('error', (error) => {
        console.error('HL7 listener socket error:', error.message);
      });
    });

    server.listen(port, () => {
      console.log(`HL7 listener started on port ${port}`);
    });

    return server;
  }

  /**
   * Generate HL7 ACK message
   */
  private generateHL7ACK(originalMessage: string): string {
    const lines = originalMessage.split('\r');
    const mshFields = lines[0].split('|');

    const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
    const messageControlId = mshFields[9];

    return `MSH|^~\\&|${mshFields[5]}|${mshFields[6]}|${mshFields[3]}|${mshFields[4]}|${timestamp}||ACK|${messageControlId}|P|2.5\rMSA|AA|${messageControlId}\r`;
  }

  /**
   * Get available lab tests catalog
   */
  async getLabTestsCatalog(): Promise<
    Array<{
      testCode: string;
      testName: string;
      specimenType: string;
      turnaroundTime: string;
      price: number;
    }>
  > {
    try {
      const response = await this.client.get('/catalog/tests');

      return response.data.tests;
    } catch (error: any) {
      console.error('Failed to retrieve lab tests catalog:', error.message);
      throw new Error(`Lab tests catalog retrieval failed: ${error.message}`);
    }
  }
}
