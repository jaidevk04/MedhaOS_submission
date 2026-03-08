import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MedhaOS Healthcare Intelligence Ecosystem API',
    version: '1.0.0',
    description: `
      Comprehensive API for the MedhaOS Healthcare Intelligence Ecosystem.
      
      ## Features
      - Patient Management
      - Clinical Encounters
      - Diagnostic Reports
      - Appointment Scheduling
      - AI-Powered Triage
      - Clinical Decision Support
      - Drug Safety Checks
      - Ambient Scribe
      - Real-time Queue Management
      - Predictive Analytics
      
      ## Authentication
      All protected endpoints require a JWT token in the Authorization header:
      \`Authorization: Bearer <token>\`
      
      ## Rate Limiting
      - Global: 1000 requests/minute per user
      - Auth endpoints: 10 requests/minute per IP
      - AI endpoints: 100 requests/minute per user
      
      ## WebSocket
      Real-time updates available at \`${config.websocket.path}\`
      
      ## GraphQL
      GraphQL API available at \`${config.graphql.path}\`
    `,
    contact: {
      name: 'MedhaOS Team',
      email: 'support@medhaos.health',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: `http://${config.host}:${config.port}`,
      description: 'Development server',
    },
    {
      url: 'https://api.medhaos.health',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'Error message',
          },
          details: {
            type: 'object',
          },
        },
      },
      Patient: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          abhaId: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          age: {
            type: 'integer',
          },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'other'],
          },
          languagePreference: {
            type: 'string',
          },
          contact: {
            type: 'object',
            properties: {
              phone: { type: 'string' },
              whatsapp: { type: 'string' },
              email: { type: 'string' },
            },
          },
          address: {
            type: 'object',
            properties: {
              district: { type: 'string' },
              state: { type: 'string' },
              pincode: { type: 'string' },
            },
          },
          medicalHistory: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                condition: { type: 'string' },
                diagnosedDate: { type: 'string', format: 'date' },
                status: { type: 'string', enum: ['active', 'resolved'] },
              },
            },
          },
          allergies: {
            type: 'array',
            items: { type: 'string' },
          },
          currentMedications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                drugName: { type: 'string' },
                dosage: { type: 'string' },
                frequency: { type: 'string' },
                startDate: { type: 'string', format: 'date' },
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Encounter: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          patientId: {
            type: 'string',
            format: 'uuid',
          },
          facilityId: {
            type: 'string',
            format: 'uuid',
          },
          clinicianId: {
            type: 'string',
            format: 'uuid',
          },
          encounterType: {
            type: 'string',
            enum: ['ED', 'OPD', 'IPD', 'Telemedicine'],
          },
          urgencyScore: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
          },
          chiefComplaint: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['in_progress', 'completed', 'admitted'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      DiagnosticReport: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          encounterId: {
            type: 'string',
            format: 'uuid',
          },
          patientId: {
            type: 'string',
            format: 'uuid',
          },
          reportType: {
            type: 'string',
            enum: ['radiology', 'laboratory', 'pathology'],
          },
          modality: {
            type: 'string',
          },
          imageUrls: {
            type: 'array',
            items: { type: 'string' },
          },
          aiAnalysis: {
            type: 'object',
            properties: {
              findings: {
                type: 'array',
                items: { type: 'string' },
              },
              anomaliesDetected: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    location: { type: 'string' },
                    confidence: { type: 'number' },
                    severity: { type: 'string', enum: ['critical', 'moderate', 'minor'] },
                  },
                },
              },
              draftReport: { type: 'string' },
              processingTimeSeconds: { type: 'number' },
            },
          },
          radiologistReport: {
            type: 'string',
          },
          status: {
            type: 'string',
            enum: ['pending', 'ai_completed', 'verified', 'finalized'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          verifiedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Appointment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          patientId: {
            type: 'string',
            format: 'uuid',
          },
          facilityId: {
            type: 'string',
            format: 'uuid',
          },
          clinicianId: {
            type: 'string',
            format: 'uuid',
          },
          appointmentDate: {
            type: 'string',
            format: 'date',
          },
          appointmentTime: {
            type: 'string',
            pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
          },
          specialty: {
            type: 'string',
          },
          urgencyScore: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
          },
          status: {
            type: 'string',
            enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
          },
          estimatedWaitTime: {
            type: 'integer',
            description: 'Estimated wait time in minutes',
          },
          queuePosition: {
            type: 'integer',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: 'Invalid or expired token',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: 'Insufficient permissions',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              success: false,
              error: 'Resource not found',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Validation failed' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Too many requests, please try again later' },
                retryAfter: { type: 'integer', example: 60 },
              },
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status endpoints',
    },
    {
      name: 'Patients',
      description: 'Patient management operations',
    },
    {
      name: 'Encounters',
      description: 'Clinical encounter management',
    },
    {
      name: 'Diagnostics',
      description: 'Diagnostic report management',
    },
    {
      name: 'Appointments',
      description: 'Appointment scheduling and management',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/app.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  if (!config.swagger.enabled) {
    logger.info('Swagger documentation is disabled');
    return;
  }

  // Swagger JSON endpoint
  app.get(`${config.swagger.path}.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use(
    config.swagger.path,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'MedhaOS API Documentation',
      customfavIcon: '/favicon.ico',
    })
  );

  logger.info(`📚 API Documentation available at ${config.swagger.path}`);
  logger.info(`📄 OpenAPI spec available at ${config.swagger.path}.json`);
};
