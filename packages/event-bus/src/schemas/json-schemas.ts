/**
 * JSON Schema definitions for event validation using AJV
 */

export const baseEventSchema = {
  type: 'object',
  required: ['eventId', 'eventType', 'source', 'timestamp', 'correlationId', 'version', 'data'],
  properties: {
    eventId: { type: 'string', format: 'uuid' },
    eventType: { type: 'string' },
    source: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
    correlationId: { type: 'string', format: 'uuid' },
    version: { type: 'string' },
    metadata: { type: 'object' },
    data: { type: 'object' },
  },
};

export const eventSchemas: Record<string, any> = {
  'patient.registered': {
    ...baseEventSchema,
    properties: {
      ...baseEventSchema.properties,
      eventType: { const: 'patient.registered' },
      data: {
        type: 'object',
        required: ['patientId', 'demographics'],
        properties: {
          patientId: { type: 'string' },
          abhaId: { type: 'string' },
          demographics: {
            type: 'object',
            required: ['name', 'age', 'gender', 'language', 'contact'],
            properties: {
              name: { type: 'string' },
              age: { type: 'number', minimum: 0, maximum: 150 },
              gender: { type: 'string' },
              language: { type: 'string' },
              contact: {
                type: 'object',
                required: ['phone'],
                properties: {
                  phone: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
      },
    },
  },

  'triage.completed': {
    ...baseEventSchema,
    properties: {
      ...baseEventSchema.properties,
      eventType: { const: 'triage.completed' },
      data: {
        type: 'object',
        required: ['patientId', 'encounterId', 'urgencyScore', 'symptoms', 'recommendedSpecialty', 'recommendedAction'],
        properties: {
          patientId: { type: 'string' },
          encounterId: { type: 'string' },
          urgencyScore: { type: 'number', minimum: 0, maximum: 100 },
          symptoms: { type: 'array', items: { type: 'string' } },
          recommendedSpecialty: { type: 'string' },
          recommendedAction: { enum: ['ED', 'OPD', 'Telemedicine'] },
          triageData: { type: 'object' },
        },
      },
    },
  },

  'appointment.scheduled': {
    ...baseEventSchema,
    properties: {
      ...baseEventSchema.properties,
      eventType: { const: 'appointment.scheduled' },
      data: {
        type: 'object',
        required: ['appointmentId', 'patientId', 'facilityId', 'clinicianId', 'specialty', 'scheduledTime', 'appointmentType'],
        properties: {
          appointmentId: { type: 'string' },
          patientId: { type: 'string' },
          facilityId: { type: 'string' },
          clinicianId: { type: 'string' },
          specialty: { type: 'string' },
          scheduledTime: { type: 'string', format: 'date-time' },
          appointmentType: { enum: ['ED', 'OPD', 'Telemedicine'] },
          estimatedWaitTime: { type: 'number' },
        },
      },
    },
  },

  'consultation.completed': {
    ...baseEventSchema,
    properties: {
      ...baseEventSchema.properties,
      eventType: { const: 'consultation.completed' },
      data: {
        type: 'object',
        required: ['encounterId', 'patientId', 'clinicianId', 'diagnoses', 'completedTime'],
        properties: {
          encounterId: { type: 'string' },
          patientId: { type: 'string' },
          clinicianId: { type: 'string' },
          diagnoses: {
            type: 'array',
            items: {
              type: 'object',
              required: ['icdCode', 'description', 'confidence'],
              properties: {
                icdCode: { type: 'string' },
                description: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
            },
          },
          prescriptions: { type: 'array' },
          diagnosticOrders: { type: 'array' },
          completedTime: { type: 'string', format: 'date-time' },
        },
      },
    },
  },

  'agent.escalation': {
    ...baseEventSchema,
    properties: {
      ...baseEventSchema.properties,
      eventType: { const: 'agent.escalation' },
      data: {
        type: 'object',
        required: ['taskId', 'agentName', 'reason', 'confidence', 'escalatedTo', 'escalationTime'],
        properties: {
          taskId: { type: 'string' },
          agentName: { type: 'string' },
          reason: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          escalatedTo: { enum: ['human', 'supervisor'] },
          escalationTime: { type: 'string', format: 'date-time' },
          context: { type: 'object' },
        },
      },
    },
  },

  'infection.cluster.detected': {
    ...baseEventSchema,
    properties: {
      ...baseEventSchema.properties,
      eventType: { const: 'infection.cluster.detected' },
      data: {
        type: 'object',
        required: ['clusterId', 'facilityId', 'infectionType', 'caseCount', 'wardLocation', 'detectionTime', 'severity'],
        properties: {
          clusterId: { type: 'string' },
          facilityId: { type: 'string' },
          infectionType: { type: 'string' },
          caseCount: { type: 'number', minimum: 1 },
          wardLocation: { type: 'string' },
          detectionTime: { type: 'string', format: 'date-time' },
          severity: { enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        },
      },
    },
  },

  'inventory.low': {
    ...baseEventSchema,
    properties: {
      ...baseEventSchema.properties,
      eventType: { const: 'inventory.low' },
      data: {
        type: 'object',
        required: ['facilityId', 'itemId', 'itemType', 'itemName', 'currentStock', 'reorderLevel', 'criticalLevel'],
        properties: {
          facilityId: { type: 'string' },
          itemId: { type: 'string' },
          itemType: { enum: ['medication', 'blood', 'supply'] },
          itemName: { type: 'string' },
          currentStock: { type: 'number', minimum: 0 },
          reorderLevel: { type: 'number', minimum: 0 },
          criticalLevel: { type: 'boolean' },
        },
      },
    },
  },
};

export function getSchemaForEventType(eventType: string): any {
  return eventSchemas[eventType] || baseEventSchema;
}
