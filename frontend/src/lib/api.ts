import axios from 'axios';
import { InvestigationData, HealthStatus } from '../types';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getHealth: async (): Promise<HealthStatus> => {
    const res = await apiClient.get<HealthStatus>('/investigation/health/status');
    return res.data;
  },

  uploadFace: async (file: File): Promise<{ investigation_id: string; status: string; face_result: any; events: any[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/investigation/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  runSearch: async (investigationId: string, query?: string): Promise<InvestigationData> => {
    const res = await apiClient.post<InvestigationData>('/investigation/search', {
      investigation_id: investigationId,
      query: query || 'person face portrait public',
    });
    return res.data;
  },

  getInvestigation: async (investigationId: string): Promise<InvestigationData> => {
    const res = await apiClient.get<InvestigationData>(`/investigation/${investigationId}`);
    return res.data;
  },

  anchorEvidence: async (investigationId: string): Promise<InvestigationData> => {
    const res = await apiClient.post<InvestigationData>(`/investigation/${investigationId}/anchor`);
    return res.data;
  },

  verifyEvidence: async (investigationId: string): Promise<InvestigationData> => {
    const res = await apiClient.post<InvestigationData>(`/investigation/${investigationId}/verify`);
    return res.data;
  },

  simulateTamper: async (investigationId: string): Promise<InvestigationData> => {
    const res = await apiClient.post<InvestigationData>(`/investigation/${investigationId}/tamper-test`);
    return res.data;
  },

  restoreOriginal: async (investigationId: string): Promise<InvestigationData> => {
    const res = await apiClient.post<InvestigationData>(`/investigation/${investigationId}/restore`);
    return res.data;
  },
};
