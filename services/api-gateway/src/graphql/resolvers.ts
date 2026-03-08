import axios from 'axios';
import DataLoader from 'dataloader';
import { config } from '../config';
import { logger } from '../utils/logger';

// DataLoader for batching and caching
const createPatientLoader = () => new DataLoader(async (ids: readonly string[]) => {
  try {
    const response = await axios.post(`${config.services.integration}/patients/batch`, { ids });
    return ids.map(id => response.data.find((p: any) => p.id === id));
  } catch (error) {
    logger.error('Error loading patients:', error);
    return ids.map(() => null);
  }
});

const createFacilityLoader = () => new DataLoader(async (ids: readonly string[]) => {
  try {
    const response = await axios.post(`${config.services.integration}/facilities/batch`, { ids });
    return ids.map(id => response.data.find((f: any) => f.id === id));
  } catch (error) {
    logger.error('Error loading facilities:', error);
    return ids.map(() => null);
  }
});

const createClinicianLoader = () => new DataLoader(async (ids: readonly string[]) => {
  try {
    const response = await axios.post(`${config.services.integration}/clinicians/batch`, { ids });
    return ids.map(id => response.data.find((c: any) => c.id === id));
  } catch (error) {
    logger.error('Error loading clinicians:', error);
    return ids.map(() => null);
  }
});

export const resolvers = {
  Query: {
    // Patient queries
    patient: async (_: any, { id }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.integration}/patients/${id}`, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching patient:', error);
        throw new Error('Failed to fetch patient');
      }
    },

    patients: async (_: any, { search, page = 1, limit = 20 }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.integration}/patients`, {
          params: { search, page, limit },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching patients:', error);
        throw new Error('Failed to fetch patients');
      }
    },

    // Encounter queries
    encounter: async (_: any, { id }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.integration}/encounters/${id}`, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching encounter:', error);
        throw new Error('Failed to fetch encounter');
      }
    },

    encounters: async (_: any, { patientId, status, page = 1, limit = 20 }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.integration}/encounters`, {
          params: { patientId, status, page, limit },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching encounters:', error);
        throw new Error('Failed to fetch encounters');
      }
    },

    // Diagnostic queries
    diagnostic: async (_: any, { id }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.diagnosticVision}/reports/${id}`, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching diagnostic:', error);
        throw new Error('Failed to fetch diagnostic report');
      }
    },

    diagnostics: async (_: any, { patientId, reportType, status, page = 1, limit = 20 }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.diagnosticVision}/reports`, {
          params: { patientId, reportType, status, page, limit },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching diagnostics:', error);
        throw new Error('Failed to fetch diagnostic reports');
      }
    },

    // Appointment queries
    appointment: async (_: any, { id }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.queueOptimization}/appointments/${id}`, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching appointment:', error);
        throw new Error('Failed to fetch appointment');
      }
    },

    appointments: async (_: any, args: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.queueOptimization}/appointments`, {
          params: args,
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching appointments:', error);
        throw new Error('Failed to fetch appointments');
      }
    },

    appointmentAvailability: async (_: any, { facilityId, clinicianId, specialty, date }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.queueOptimization}/appointments/availability`, {
          params: { facilityId, clinicianId, specialty, date },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching availability:', error);
        throw new Error('Failed to fetch appointment availability');
      }
    },

    // Dashboard queries
    dashboardMetrics: async (_: any, { facilityId }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.operationalIntelligence}/dashboard/metrics`, {
          params: { facilityId },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching dashboard metrics:', error);
        throw new Error('Failed to fetch dashboard metrics');
      }
    },

    capacityOverview: async (_: any, { facilityId }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.operationalIntelligence}/capacity/overview`, {
          params: { facilityId },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching capacity overview:', error);
        throw new Error('Failed to fetch capacity overview');
      }
    },

    queueStatus: async (_: any, { facilityId }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.queueOptimization}/queue/status`, {
          params: { facilityId },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching queue status:', error);
        throw new Error('Failed to fetch queue status');
      }
    },

    predictiveAnalytics: async (_: any, { facilityId, timeRange }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.operationalIntelligence}/analytics/predictive`, {
          params: { facilityId, timeRange },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching predictive analytics:', error);
        throw new Error('Failed to fetch predictive analytics');
      }
    },

    operationalMetrics: async (_: any, { facilityId, startDate, endDate }: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.operationalIntelligence}/metrics/operational`, {
          params: { facilityId, startDate, endDate },
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching operational metrics:', error);
        throw new Error('Failed to fetch operational metrics');
      }
    },
  },

  Mutation: {
    // Patient mutations
    createPatient: async (_: any, { input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.integration}/patients`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error creating patient:', error);
        throw new Error('Failed to create patient');
      }
    },

    updatePatient: async (_: any, { id, input }: any, context: any) => {
      try {
        const response = await axios.put(`${config.services.integration}/patients/${id}`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error updating patient:', error);
        throw new Error('Failed to update patient');
      }
    },

    // Encounter mutations
    createEncounter: async (_: any, { input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.integration}/encounters`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error creating encounter:', error);
        throw new Error('Failed to create encounter');
      }
    },

    updateEncounter: async (_: any, { id, input }: any, context: any) => {
      try {
        const response = await axios.put(`${config.services.integration}/encounters/${id}`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error updating encounter:', error);
        throw new Error('Failed to update encounter');
      }
    },

    addTriageData: async (_: any, { encounterId, input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.triage}/encounters/${encounterId}/triage`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error adding triage data:', error);
        throw new Error('Failed to add triage data');
      }
    },

    addClinicalNotes: async (_: any, { encounterId, input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.ambientScribe}/encounters/${encounterId}/notes`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error adding clinical notes:', error);
        throw new Error('Failed to add clinical notes');
      }
    },

    addDiagnosis: async (_: any, { encounterId, input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.cdss}/encounters/${encounterId}/diagnoses`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error adding diagnosis:', error);
        throw new Error('Failed to add diagnosis');
      }
    },

    addPrescription: async (_: any, { encounterId, input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.drugSafety}/encounters/${encounterId}/prescriptions`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error adding prescription:', error);
        throw new Error('Failed to add prescription');
      }
    },

    completeEncounter: async (_: any, { id }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.integration}/encounters/${id}/complete`, {}, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error completing encounter:', error);
        throw new Error('Failed to complete encounter');
      }
    },

    // Diagnostic mutations
    createDiagnosticReport: async (_: any, { input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.diagnosticVision}/reports`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error creating diagnostic report:', error);
        throw new Error('Failed to create diagnostic report');
      }
    },

    uploadDiagnosticImage: async (_: any, { reportId, imageUrl }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.diagnosticVision}/reports/${reportId}/upload`, { imageUrl }, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error uploading diagnostic image:', error);
        throw new Error('Failed to upload diagnostic image');
      }
    },

    analyzeDiagnosticImage: async (_: any, { reportId }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.diagnosticVision}/reports/${reportId}/analyze`, {}, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error analyzing diagnostic image:', error);
        throw new Error('Failed to analyze diagnostic image');
      }
    },

    verifyDiagnosticReport: async (_: any, { reportId, input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.diagnosticVision}/reports/${reportId}/verify`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error verifying diagnostic report:', error);
        throw new Error('Failed to verify diagnostic report');
      }
    },

    finalizeDiagnosticReport: async (_: any, { reportId }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.diagnosticVision}/reports/${reportId}/finalize`, {}, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error finalizing diagnostic report:', error);
        throw new Error('Failed to finalize diagnostic report');
      }
    },

    // Appointment mutations
    createAppointment: async (_: any, { input }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.queueOptimization}/appointments`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error creating appointment:', error);
        throw new Error('Failed to create appointment');
      }
    },

    updateAppointment: async (_: any, { id, input }: any, context: any) => {
      try {
        const response = await axios.put(`${config.services.queueOptimization}/appointments/${id}`, input, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error updating appointment:', error);
        throw new Error('Failed to update appointment');
      }
    },

    confirmAppointment: async (_: any, { id }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.queueOptimization}/appointments/${id}/confirm`, {}, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error confirming appointment:', error);
        throw new Error('Failed to confirm appointment');
      }
    },

    cancelAppointment: async (_: any, { id, reason }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.queueOptimization}/appointments/${id}/cancel`, { reason }, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error cancelling appointment:', error);
        throw new Error('Failed to cancel appointment');
      }
    },

    rescheduleAppointment: async (_: any, { id, newDate, newTime }: any, context: any) => {
      try {
        const response = await axios.post(`${config.services.queueOptimization}/appointments/${id}/reschedule`, { newDate, newTime }, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error rescheduling appointment:', error);
        throw new Error('Failed to reschedule appointment');
      }
    },
  },

  // Field resolvers with DataLoader
  Patient: {
    encounters: async (parent: any, _: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.integration}/patients/${parent.id}/encounters`, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching patient encounters:', error);
        return [];
      }
    },

    appointments: async (parent: any, _: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.queueOptimization}/appointments`, {
          params: { patientId: parent.id },
          headers: { Authorization: context.token },
        });
        return response.data.edges.map((edge: any) => edge.node);
      } catch (error) {
        logger.error('Error fetching patient appointments:', error);
        return [];
      }
    },

    diagnosticReports: async (parent: any, _: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.diagnosticVision}/reports`, {
          params: { patientId: parent.id },
          headers: { Authorization: context.token },
        });
        return response.data.edges.map((edge: any) => edge.node);
      } catch (error) {
        logger.error('Error fetching patient diagnostic reports:', error);
        return [];
      }
    },
  },

  Encounter: {
    patient: async (parent: any, _: any, context: any) => {
      return context.loaders.patientLoader.load(parent.patientId);
    },

    facility: async (parent: any, _: any, context: any) => {
      return context.loaders.facilityLoader.load(parent.facilityId);
    },

    clinician: async (parent: any, _: any, context: any) => {
      return context.loaders.clinicianLoader.load(parent.clinicianId);
    },
  },

  DiagnosticReport: {
    patient: async (parent: any, _: any, context: any) => {
      return context.loaders.patientLoader.load(parent.patientId);
    },

    encounter: async (parent: any, _: any, context: any) => {
      try {
        const response = await axios.get(`${config.services.integration}/encounters/${parent.encounterId}`, {
          headers: { Authorization: context.token },
        });
        return response.data;
      } catch (error) {
        logger.error('Error fetching encounter:', error);
        return null;
      }
    },
  },

  Appointment: {
    patient: async (parent: any, _: any, context: any) => {
      return context.loaders.patientLoader.load(parent.patientId);
    },

    facility: async (parent: any, _: any, context: any) => {
      return context.loaders.facilityLoader.load(parent.facilityId);
    },

    clinician: async (parent: any, _: any, context: any) => {
      return context.loaders.clinicianLoader.load(parent.clinicianId);
    },
  },
};

// Context factory for creating loaders per request
export const createContext = ({ req }: any) => ({
  token: req.headers.authorization,
  user: (req as any).user,
  loaders: {
    patientLoader: createPatientLoader(),
    facilityLoader: createFacilityLoader(),
    clinicianLoader: createClinicianLoader(),
  },
});
