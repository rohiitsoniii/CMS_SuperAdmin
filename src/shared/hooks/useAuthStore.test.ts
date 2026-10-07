import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

const mockUser = {
  id: '1',
  email: 'admin@cms.example.com',
  firstName: 'Super',
  lastName: 'Admin',
  role: 'superadmin' as const,
  mfaEnabled: false,
};

const mockTenant = {
  id: 'platform',
  name: 'CMS Platform',
  slug: 'platform',
  status: 'active' as const,
  subscription: { plan: 'Enterprise', status: 'active', currentPeriodEnd: new Date().toISOString() },
  usage: { storageUsed: 0, apiCalls: 0, contentItems: 0 },
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
      originalTenant: null,
    });
    localStorage.clear();
  });

  it('sets auth and marks authenticated', () => {
    useAuthStore.getState().setAuth(mockUser, mockTenant, {
      accessToken: 'at',
      refreshToken: 'rt',
    });
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(true);
    expect(s.accessToken).toBe('at');
    expect(s.user?.email).toBe('admin@cms.example.com');
  });

  it('starts and exits impersonation, restoring the original tenant', () => {
    useAuthStore.getState().setAuth(mockUser, mockTenant, { accessToken: 'at', refreshToken: 'rt' });
    const other = { ...mockTenant, id: 't2', name: 'Acme' };
    useAuthStore.getState().startImpersonation(other);
    expect(useAuthStore.getState().isImpersonating).toBe(true);
    expect(useAuthStore.getState().tenant?.id).toBe('t2');
    useAuthStore.getState().exitImpersonation();
    expect(useAuthStore.getState().isImpersonating).toBe(false);
    expect(useAuthStore.getState().tenant?.id).toBe('platform');
  });

  it('logs out and clears session', () => {
    useAuthStore.getState().setAuth(mockUser, mockTenant, { accessToken: 'at', refreshToken: 'rt' });
    useAuthStore.getState().logout();
    const s = useAuthStore.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.accessToken).toBeNull();
    expect(s.user).toBeNull();
  });
});
