import axios from 'axios';
import {
  DashboardSummary,
  DashboardTrends,
  PaginatedRecords,
  IdentityRecord,
  SingleRecordAnalysisResult,
  ModelRunItem
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health
  getHealth: async () => {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get('/dashboard/summary');
    return res.data;
  },
  getDashboardTrends: async (days: number = 30): Promise<DashboardTrends> => {
    const res = await apiClient.get(`/dashboard/trends?days=${days}`);
    return res.data;
  },

  // Records
  getRecords: async (params: {
    page?: number;
    page_size?: number;
    search?: string;
    validation_status?: string;
    review_status?: string;
    is_duplicate?: boolean;
    sort_by?: string;
    sort_desc?: boolean;
  }): Promise<PaginatedRecords> => {
    const res = await apiClient.get('/records', { params });
    return res.data;
  },
  getRecordById: async (recordId: string | number): Promise<IdentityRecord> => {
    const res = await apiClient.get(`/records/${recordId}`);
    return res.data;
  },
  analyzeSingleRecord: async (payload: {
    full_name: string;
    email?: string;
    phone?: string;
    city?: string;
    date_created?: string;
    save_to_database?: boolean;
  }): Promise<SingleRecordAnalysisResult> => {
    const res = await apiClient.post('/records/analyze-single', payload);
    return res.data;
  },

  // Bulk Uploads
  uploadCsv: async (formData: FormData) => {
    const res = await apiClient.post('/uploads/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getJobStatus: async (jobId: string) => {
    const res = await apiClient.get(`/uploads/jobs/${jobId}`);
    return res.data;
  },

  // Analytics
  getAnalyticsOverview: async () => {
    const res = await apiClient.get('/analytics/overview');
    return res.data;
  },
  getDataQualityMetrics: async () => {
    const res = await apiClient.get('/analytics/data-quality');
    return res.data;
  },
  getDuplicateAnalytics: async () => {
    const res = await apiClient.get('/analytics/duplicates');
    return res.data;
  },

  // Machine Learning
  getModelStatus: async () => {
    const res = await apiClient.get('/models/status');
    return res.data;
  },
  trainModels: async (payload: { model_type?: string; test_size?: number; random_seed?: number }) => {
    const res = await apiClient.post('/models/train', payload);
    return res.data;
  },
  getModelMetrics: async (): Promise<{ is_trained: boolean; active_version?: string; runs: ModelRunItem[] }> => {
    const res = await apiClient.get('/models/metrics');
    return res.data;
  },

  // Review Queue
  getReviews: async (status?: string) => {
    const params = status ? { status } : {};
    const res = await apiClient.get('/reviews', { params });
    return res.data;
  },
  updateReview: async (reviewId: number, payload: { review_status: string; reviewer_notes?: string }) => {
    const res = await apiClient.put(`/reviews/${reviewId}`, payload);
    return res.data;
  },

  // Reports
  exportReportUrl: (format: 'json' | 'csv') => `${API_BASE}/reports/export?format=${format}`,
  generatePowerBiCsvs: async () => {
    const res = await apiClient.post('/reports/generate-power-bi');
    return res.data;
  },
};
