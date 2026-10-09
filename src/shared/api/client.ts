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

// ---------------------------------------------------------------------------
// Endpoint modules — paths mirror backend/src/routes/systemRoutes.ts exactly.
// Do not add a method here without a matching backend route (see client.test.ts).
// ---------------------------------------------------------------------------

export const tenantsAPI = {
  list: (params?: { page?: number; limit?: number; search?: string; plan?: string; status?: string }) =>
    api.get('/system/tenants', { params }),

  summary: () => api.get('/system/tenants/summary'),

  get: (id: string) => api.get(`/system/tenants/${id}`),

  suspend: (id: string, reason?: string) => api.patch(`/system/tenants/${id}/suspend`, { reason }),

  activate: (id: string) => api.patch(`/system/tenants/${id}/activate`),

  updatePlan: (id: string, data: { plan?: string; billingCycle?: 'monthly' | 'yearly'; customLimits?: Record<string, number> }) =>
    api.patch(`/system/tenants/${id}/plan`, data),

  resetQuota: (id: string) => api.post(`/system/tenants/${id}/reset-quota`),

  impersonate: (id: string) => api.post(`/system/tenants/${id}/impersonate`),

  delete: (id: string) => api.delete(`/system/tenants/${id}`),
};

export const subscriptionsAPI = {
  plans: {
    list: (params?: { isActive?: boolean }) => api.get('/system/plans', { params }),
    get: (id: string) => api.get(`/system/plans/${id}`),
    create: (data: any) => api.post('/system/plans', data),
    update: (id: string, data: any) => api.put(`/system/plans/${id}`, data),
    delete: (id: string) => api.delete(`/system/plans/${id}`),
  },
  coupons: {
    list: () => api.get('/system/coupons'),
    create: (data: any) => api.post('/system/coupons', data),
  },
  subscriptions: {
    list: (params?: { page?: number; limit?: number; status?: string; plan?: string; tenantId?: string }) =>
      api.get('/system/subscriptions', { params }),
  },
  revenue: {
    get: (params?: { from?: string; to?: string; currency?: string }) => api.get('/system/revenue', { params }),
    getChurn: (params?: { from?: string; to?: string }) => api.get('/system/churn', { params }),
    getTrialsFunnel: (params?: { from?: string; to?: string }) => api.get('/system/trials/funnel', { params }),
  },
  invoices: {
    refund: (id: string, amount?: number) => api.post(`/system/invoices/${id}/refund`, { amount }),
    void: (id: string) => api.post(`/system/invoices/${id}/void`),
  },
};

export const campaignsAPI = {
  overview: (params?: { from?: string; to?: string }) => api.get('/system/email/overview', { params }),

  list: (params?: { page?: number; limit?: number; status?: string; tenantId?: string; search?: string }) =>
    api.get('/system/email/campaigns', { params }),

  get: (id: string) => api.get(`/system/email/campaigns/${id}`),

  create: (data: { projectId: string; name: string; subject?: string; htmlContent?: string; fromName?: string; fromEmail?: string; recipientType?: string; segmentId?: string; customRecipients?: string[] }) =>
    api.post('/system/email/campaigns', data),

  pause: (id: string) => api.post(`/system/email/campaigns/${id}/pause`),

  resume: (id: string) => api.post(`/system/email/campaigns/${id}/resume`),

  cancel: (id: string) => api.post(`/system/email/campaigns/${id}/cancel`),

  send: (id: string) => api.post(`/system/email/campaigns/${id}/send`),

  schedule: (id: string, scheduledFor: string) => api.post(`/system/email/campaigns/${id}/schedule`, { scheduledFor }),

  tickWorker: () => api.post('/system/email/worker/tick'),

  suppressions: {
    list: (params?: { page?: number; limit?: number; email?: string; status?: string }) =>
      api.get('/system/email/suppressions', { params }),
    suppress: (email: string, reason?: string) => api.post('/system/email/suppressions', { email, reason }),
    unsuppress: (email: string) => api.delete(`/system/email/suppressions/${encodeURIComponent(email)}`),
  },

  updateSmtpLimits: (projectId: string, data: { dailyLimit?: number; monthlyLimit?: number }) =>
    api.patch(`/system/email/throttle/${projectId}`, data),
};

export const emailTemplatesAPI = {
  list: (params?: { page?: number; limit?: number; search?: string; projectId?: string; tenantId?: string }) =>
    api.get('/system/email/templates', { params }),

  preview: (id: string, variables?: Record<string, string>) => api.post(`/system/email/templates/${id}/preview`, { variables }),

  testSend: (id: string, to: string) => api.post(`/system/email/templates/${id}/test`, { to }),
};

export const apiKeysAPI = {
  list: (params?: { service?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) =>
    api.get('/system/api-keys', { params }),

  create: (data: { name: string; service: string; keyValue: string; scopes?: string[]; expiresAt?: string }) =>
    api.post('/system/api-keys', data),

  reveal: (id: string) => api.post(`/system/api-keys/${id}/reveal`),

  rotate: (id: string, keyValue: string) => api.post(`/system/api-keys/${id}/rotate`, { keyValue }),

  delete: (id: string) => api.delete(`/system/api-keys/${id}`),

  getUsage: (id: string) => api.get(`/system/api-keys/${id}/usage`),

  expiring: (days?: number) => api.get('/system/api-keys/expiring', { params: { days } }),
};

export const tokenUsageAPI = {
  getUsage: (params?: { from?: string; to?: string; tenantId?: string }) =>
    api.get('/system/ai/usage', { params }),

  getTopConsumers: (params?: { month?: string; limit?: number }) =>
    api.get('/system/ai/top-consumers', { params }),

  getProjection: (months?: number) => api.get('/system/ai/usage/projection', { params: { months } }),

  listAlerts: () => api.get('/system/ai/alerts'),

  createAlert: (data: { tenantId?: string; metric: 'aiCostUSD' | 'aiTokens'; threshold: number; period: 'daily' | 'monthly'; notifyEmail?: string; webhookUrl?: string }) =>
    api.post('/system/ai/alerts', data),

  deleteAlert: (id: string) => api.delete(`/system/ai/alerts/${id}`),

  evaluateAlerts: () => api.post('/system/ai/alerts/evaluate'),
};

export const systemHealthAPI = {
  getHealthDetail: () => api.get('/system/health/detail'),

  getPerformance: (params?: { from?: string; to?: string; limit?: number }) =>
    api.get('/system/performance', { params }),

  getErrors: (params?: { page?: number; limit?: number; severity?: string; isFixed?: boolean; statusCode?: number; path?: string; method?: string; tenantId?: string; startDate?: string; endDate?: string }) =>
    api.get('/system/errors', { params }),

  fixError: (id: string) => api.patch(`/system/errors/${id}/fix`),

  listIncidents: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/system/incidents', { params }),

  createIncident: (data: { title: string; description?: string; severity?: string; components?: string[] }) =>
    api.post('/system/incidents', data),

  updateIncident: (id: string, data: { status?: string; message?: string }) =>
    api.patch(`/system/incidents/${id}`, data),
};

export const workersAPI = {
  getQueues: () => api.get('/system/queues'),

  tickWorker: (name: 'email-campaigns' | 'webhook-retry' | 'scheduled-publish' | 'billing-housekeeping') =>
    api.post(`/system/workers/${name}/tick`),

  replayDeadWebhooks: (data?: { webhookId?: string; limit?: number }) =>
    api.post('/system/webhooks/replay-dead', data ?? {}),

  getTranslationJob: (id: string) => api.get(`/system/translation/jobs/${id}`),

  retryTranslationJob: (id: string) => api.post(`/system/translation/jobs/${id}/retry`),

  cancelTranslationJob: (id: string) => api.delete(`/system/translation/jobs/${id}`),
};

export const opsAPI = {
  purgeCache: (params?: { tenantId?: string; projectSlug?: string }) =>
    api.delete('/system/cache', { params }),

  cacheStats: () => api.get('/system/cache/stats'),

  listBackups: (params?: { tenantId?: string; type?: 'full' | 'project' }) =>
    api.get('/system/backups', { params }),

  verifyBackup: (filename: string) => api.post('/system/backups/verify', { filename }),

  restoreBackupFor: (filename: string, tenantId: string) =>
    api.post(`/system/backups/${encodeURIComponent(filename)}/restore-for/${tenantId}`),

  cleanupBackups: (data?: { daysToKeep?: number; tenantId?: string }) =>
    api.post('/system/backups/cleanup', data ?? {}),

  getStorage: (limit?: number) => api.get('/system/storage', { params: { limit } }),
};

export const auditLogsAPI = {
  list: (params?: { page?: number; limit?: number; tenantId?: string; action?: string; userId?: string; resourceType?: string; resourceId?: string; status?: string; ip?: string; startDate?: string; endDate?: string }) =>
    api.get('/system/audit-logs', { params }),

  export: (params?: { tenantId?: string; action?: string; startDate?: string; endDate?: string }) =>
    api.get('/system/audit-logs/export', { params, responseType: 'blob' }),

  getStats: (params?: { from?: string; to?: string }) => api.get('/system/audit-logs/stats', { params }),
};

export const settingsAPI = {
  list: () => api.get('/system/settings'),

  set: (key: string, value: unknown) => api.put(`/system/settings/${encodeURIComponent(key)}`, { value }),

  remove: (key: string) => api.delete(`/system/settings/${encodeURIComponent(key)}`),

  listFlags: () => api.get('/system/feature-flags'),

  createFlag: (data: { key: string; description?: string; enabled?: boolean; rolloutPercentage?: number; tenantOverrides?: Record<string, boolean> }) =>
    api.post('/system/feature-flags', data),

  updateFlag: (key: string, data: { enabled?: boolean; rolloutPercentage?: number; tenantOverrides?: Record<string, boolean>; description?: string }) =>
    api.patch(`/system/feature-flags/${encodeURIComponent(key)}`, data),

  deleteFlag: (key: string) => api.delete(`/system/feature-flags/${encodeURIComponent(key)}`),
};

export const supportAPI = {
  listTickets: (params?: { page?: number; limit?: number; status?: string; priority?: string; category?: string; tenantId?: string; assignedTo?: string; unassigned?: string; search?: string }) =>
    api.get('/system/support/tickets', { params }),

  updateTicket: (id: string, data: { status?: string; priority?: string; assignedTo?: string | null }) =>
    api.patch(`/system/support/tickets/${id}`, data),

  replyTicket: (id: string, message: string) => api.post(`/system/support/tickets/${id}/reply`, { message }),

  getSla: (params?: { from?: string; to?: string }) => api.get('/system/support/sla', { params }),
};

export const usersAPI = {  list: (params?: { page?: number; limit?: number; search?: string; role?: string; isSuperAdmin?: boolean; isActive?: boolean; tenantId?: string }) =>
    api.get('/system/users', { params }),

  invite: (data: { email: string; tenantId: string; firstName: string; lastName?: string; role?: string; password: string; isSuperAdmin?: boolean }) =>
    api.post('/system/users', data),

  update: (id: string, data: { firstName?: string; lastName?: string; role?: string; isActive?: boolean; isSuperAdmin?: boolean }) =>
    api.put(`/system/users/${id}`, data),

  delete: (id: string) => api.delete(`/system/users/${id}`),

  resetPassword: (id: string) => api.post(`/system/users/${id}/reset-password`),

  revokeSessions: (id: string) => api.post(`/system/users/${id}/revoke-sessions`),
};

export const twoFactorAPI = {
  setup: () => api.post('/two-factor/setup'),
  enable: (token: string) => api.post('/two-factor/enable', { token }),
  verify: (token: string, tempToken?: string) =>
    tempToken
      ? api.post('/two-factor/verify', { token }, { headers: { Authorization: `Bearer ${tempToken}` } })
      : api.post('/two-factor/verify', { token }),
  status: () => api.get('/two-factor/status'),
};

export default api;