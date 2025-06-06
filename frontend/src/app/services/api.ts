import axios from 'axios';
import { User, UserSettings, AnalysisResponse, DashboardStats, Upload } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/token', credentials);
    return response.data;
  },
  register: async (userData: { email: string; password: string; full_name: string }) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/users/me/');
    return response.data;
  },
};

export const settingsAPI = {
  getUserSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/settings/');
    return response.data;
  },
  updateUserSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put('/settings/', settings);
    return response.data;
  },
};

export const analysisAPI = {
  uploadFile: async (file: File, fileType: string): Promise<Upload> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    const response = await api.post('/uploads/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getAnalysis: async (uploadId: number): Promise<AnalysisResponse> => {
    const response = await api.get(`/uploads/${uploadId}`);
    return response.data;
  },
  getUserUploads: async (): Promise<Upload[]> => {
    const response = await api.get('/uploads/');
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export const medicalImageAPI = {
  analyzeXRay: async (file: File): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/xray/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  analyzeMRI: async (file: File): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/mri/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  analyzeCT: async (file: File): Promise<AnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/ct/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const chatAPI = {
  sendMessage: async (message: string) => {
    const response = await api.post('/chat/message', { message });
    return response.data;
  },
  getChatHistory: async () => {
    const response = await api.get('/chat/history');
    return response.data;
  },
};

export const voiceAPI = {
  processVoiceCommand: async (command: string) => {
    const response = await api.post('/voice/command', { command });
    return response.data;
  },
  getVoiceHistory: async () => {
    const response = await api.get('/voice/history');
    return response.data;
  },
};

export default api;
 