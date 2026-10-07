import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../hooks/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  constructor(public message: string, public status?: number, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token from store
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        isRefreshing = false;
        processQueue(error, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const tokens = response.data?.data?.tokens || response.data?.tokens;
        const newAccessToken = tokens?.accessToken;

        if (!newAccessToken) {
          throw new Error('Refresh failed: invalid token payload');
        }

        const { user, tenant } = useAuthStore.getState();
        if (user && tenant) {
          useAuthStore.getState().setAuth(user, tenant, { accessToken: newAccessToken, refreshToken });
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        try {
          await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
        } catch {
          // Ignore logout errors
        }

        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 500) {
      // Could log to error tracking service
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// API endpoint helpers
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  refresh: () => api.post('/auth/refresh'),

  me: () => api.get('/auth/me'),
};

export const tenantsAPI = {
  list: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/system/tenants', { params }),

  get: (id: string) => api.get(`/system/tenants/${id}`),

  create: (data: { name: string; slug: string; planId: string }) =>
    api.post('/system/tenants', data),

  update: (id: string, data: Partial<{ name: string; status: string; planId: string }>) =>
    api.put(`/system/tenants/${id}`, data),

  delete: (id: string) => api.delete(`/system/tenants/${id}`),

  suspend: (id: string) => api.post(`/system/tenants/${id}/suspend`),

  activate: (id: string) => api.post(`/system/tenants/${id}/activate`),

  impersonate: (id: string) => api.post(`/system/tenants/${id}/impersonate`),

  getUsage: (id: string) => api.get(`/system/tenants/${id}/usage`),

  getAuditLogs: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/system/tenants/${id}/audit-logs`, { params }),
};

export const subscriptionsAPI = {
  plans: {
    list: () => api.get('/billing/plans'),
    get: (id: string) => api.get(`/billing/plans/${id}`),
    create: (data: any) => api.post('/billing/plans', data),
    update: (id: string, data: any) => api.put(`/billing/plans/${id}`, data),
    delete: (id: string) => api.delete(`/billing/plans/${id}`),
  },
  coupons: {
    list: () => api.get('/system/coupons'),
    create: (data: any) => api.post('/system/coupons', data),
    update: (id: string, data: any) => api.put(`/system/coupons/${id}`, data),
    delete: (id: string) => api.delete(`/system/coupons/${id}`),
  },
  subscriptions: {
    list: (params?: { page?: number; limit?: number; status?: string }) =>
      api.get('/system/subscriptions', { params }),
    get: (id: string) => api.get(`/system/subscriptions/${id}`),
  },
  revenue: {
    getStats: (params?: { period?: string }) => api.get('/system/analytics/revenue', { params }),
  },
};

export const campaignsAPI = {
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/system/campaigns', { params }),

  get: (id: string) => api.get(`/system/campaigns/${id}`),

  create: (data: any) => api.post('/system/campaigns', data),

  update: (id: string, data: any) => api.put(`/system/campaigns/${id}`, data),

  delete: (id: string) => api.delete(`/system/campaigns/${id}`),

  send: (id: string) => api.post(`/system/campaigns/${id}/send`),

  schedule: (id: string, scheduledAt: string) => api.post(`/system/campaigns/${id}/schedule`, { scheduledAt }),

  getStats: (id: string) => api.get(`/system/campaigns/${id}/stats`),

  getRecipients: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/system/campaigns/${id}/recipients`, { params }),
};

export const emailTemplatesAPI = {
  list: () => api.get('/system/email-templates'),

  get: (id: string) => api.get(`/system/email-templates/${id}`),

  create: (data: any) => api.post('/system/email-templates', data),

  update: (id: string, data: any) => api.put(`/system/email-templates/${id}`, data),

  delete: (id: string) => api.delete(`/system/email-templates/${id}`),

  preview: (id: string, data: any) => api.post(`/system/email-templates/${id}/preview`, data),

  testSend: (id: string, email: string) => api.post(`/system/email-templates/${id}/test`, { email }),
};

export const apiKeysAPI = {
  list: () => api.get('/system/api-keys'),

  get: (id: string) => api.get(`/system/api-keys/${id}`),

  create: (data: { name: string; service: string; permissions: string[] }) => api.post('/system/api-keys', data),

  update: (id: string, data: any) => api.put(`/system/api-keys/${id}`, data),

  delete: (id: string) => api.delete(`/system/api-keys/${id}`),

  rotate: (id: string) => api.post(`/system/api-keys/${id}/rotate`),

  getUsage: (id: string, params?: { period?: string }) =>
    api.get(`/system/api-keys/${id}/usage`, { params }),
};

export const tokenUsageAPI = {
  getOverview: (params?: { period?: string; tenantId?: string }) =>
    api.get('/system/analytics/token-usage', { params }),

  getByModel: (params?: { period?: string; tenantId?: string }) =>
    api.get('/system/analytics/token-usage/by-model', { params }),

  getByTenant: (params?: { period?: string }) =>
    api.get('/system/analytics/token-usage/by-tenant', { params }),

  getCostProjection: (params?: { months?: number }) =>
    api.get('/system/analytics/token-usage/projection', { params }),

  setAlert: (data: { threshold: number; period: 'daily' | 'monthly'; webhookUrl?: string; email?: string }) =>
    api.post('/system/analytics/token-usage/alerts', data),

  getAlerts: () => api.get('/system/analytics/token-usage/alerts'),
};

export const systemHealthAPI = {
  getStatus: () => api.get('/system/health'),

  getMetrics: (params?: { period?: string }) => api.get('/system/metrics', { params }),

  getErrors: (params?: { page?: number; limit?: number; severity?: string; tenantId?: string }) =>
    api.get('/system/errors', { params }),

  getErrorDetail: (id: string) => api.get(`/system/errors/${id}`),

  getQueueStatus: () => api.get('/system/queues/status'),

  getSlowQueries: (params?: { limit?: number; tenantId?: string }) =>
    api.get('/system/queries/slow', { params }),
};

export const auditLogsAPI = {
  list: (params?: { page?: number; limit?: number; tenantId?: string; action?: string; startDate?: string; endDate?: string }) =>
    api.get('/system/audit-logs', { params }),

  export: (params?: { tenantId?: string; startDate?: string; endDate?: string }) =>
    api.get('/system/audit-logs/export', { params, responseType: 'blob' }),

  getStats: (params?: { period?: string }) => api.get('/system/audit-logs/stats', { params }),
};

export const settingsAPI = {
  get: () => api.get('/system/settings'),

  update: (data: any) => api.put('/system/settings', data),

  getFeatureFlags: () => api.get('/system/settings/feature-flags'),

  updateFeatureFlag: (key: string, data: { enabled: boolean; rolloutPercentage?: number; tenantOverrides?: Record<string, boolean> }) =>
    api.put(`/system/settings/feature-flags/${key}`, data),
};

export const usersAPI = {
  list: (params?: { page?: number; limit?: number; role?: string }) =>
    api.get('/system/users', { params }),

  get: (id: string) => api.get(`/system/users/${id}`),

  create: (data: { email: string; role: string; firstName: string; lastName: string }) =>
    api.post('/system/users', data),

  update: (id: string, data: any) => api.put(`/system/users/${id}`, data),

  delete: (id: string) => api.delete(`/system/users/${id}`),

  resetMfa: (id: string) => api.post(`/system/users/${id}/reset-mfa`),

  resendInvite: (id: string) => api.post(`/system/users/${id}/resend-invite`),
};

export default api;