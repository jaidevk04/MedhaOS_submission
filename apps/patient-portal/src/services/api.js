import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('patientToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('patientToken');
      localStorage.removeItem('patientInfo');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/patients/register', data),
  login: (data) => api.post('/patients/login', data),
  logout: () => {
    localStorage.removeItem('patientToken');
    localStorage.removeItem('patientInfo');
  },
  getPatientInfo: () => {
    const info = localStorage.getItem('patientInfo');
    return info ? JSON.parse(info) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('patientToken');
  }
};

// Triage API
export const triageAPI = {
  analyzeSymptoms: (data) => api.post('/triage/score', data),
  getQuestions: (language) => api.get(`/triage/questions?language=${language}`),
};

// Voice API
export const voiceAPI = {
  transcribe: (audioBlob, language) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('language', language);
    return api.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  triageConversation: (data) => api.post('/voice/triage-conversation', data),
  analyzeSymptoms: (data) => api.post('/voice/analyze-symptoms', data),
};

// Appointments API
export const appointmentsAPI = {
  book: (data) => api.post('/appointments/book', data),
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  cancel: (id) => api.put(`/appointments/${id}/cancel`),
};

// Patients API
export const patientsAPI = {
  getProfile: (id) => api.get(`/patients/${id}`),
  updateProfile: (id, data) => api.put(`/patients/${id}`, data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/patient'),
};

export default api;
