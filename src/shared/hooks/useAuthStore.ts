import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../api/client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'support' | 'billing' | 'devops';
  avatar?: string;
  mfaEnabled: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'pending';
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
  };
  usage: {
    storageUsed: number;
    apiCalls: number;
    contentItems: number;
  };
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  originalTenant: Tenant | null;

  // Actions
  setAuth: (user: User, tenant: Tenant, tokens: { accessToken: string; refreshToken: string }) => void;
  updateUser: (user: Partial<User>) => void;
  setTenant: (tenant: Tenant) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  restoreSession: () => Promise<boolean>;
  startImpersonation: (tenant: Tenant) => void;
  exitImpersonation: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      isImpersonating: false,
      originalTenant: null,

      setAuth: (user, tenant, tokens) =>
        set({
          user,
          tenant,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      setTenant: (tenant) =>
        set({
          tenant,
          isImpersonating: false,
          originalTenant: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      logout: () =>
        set({
          user: null,
          tenant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isImpersonating: false,
          originalTenant: null,
        }),

      restoreSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          set({ isLoading: false });
          return false;
        }

        try {
          const response = await api.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
            withCredentials: true,
          });

          const tokens = response.data?.data?.tokens || response.data?.tokens;
          const accessToken = tokens?.accessToken;

          if (!accessToken) {
            throw new Error('Refresh failed: invalid token payload');
          }

          // Fetch user profile with new token
          const profileRes = await api.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          });

          const { user, tenant } = profileRes.data.data;
          set({
            user,
            tenant,
            accessToken,
            refreshToken: tokens.refreshToken || refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch {
          get().logout();
          set({ isLoading: false });
          return false;
        }
      },

      startImpersonation: (tenant) =>
        set((state) => ({
          originalTenant: state.tenant,
          tenant,
          isImpersonating: true,
        })),

      exitImpersonation: () =>
        set((state) => ({
          tenant: state.originalTenant,
          isImpersonating: false,
          originalTenant: null,
        })),
    }),
    {
      name: 'cms-super-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);