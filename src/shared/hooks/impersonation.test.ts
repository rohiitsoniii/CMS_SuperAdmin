import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  tenantsAPI: {
    impersonate: vi.fn().mockResolvedValue({ data: { data: { token: 'imp-token-123' } } }),
    get: vi.fn().mockResolvedValue({
      data: { data: { tenant: { _id: 't1', name: 'Acme', slug: 'acme', isActive: true, subscription: { plan: 'pro' } } } },
    }),
  },
}));

import { tenantsAPI } from '@/shared/api/client';

const mockUser = {
  id: '1',
  email: 'admin@cms.example.com',
  firstName: 'Super',
  lastName: 'Admin',
  role: 'superadmin' as const,
  isSuperAdmin: true,
  mfaEnabled: true,
};

const mockTenant = {
  id: 'platform',
  name: 'Platform',
  slug: 'platform',
  status: 'active' as const,
  subscription: { plan: 'enterprise', status: 'active', currentPeriodEnd: '' },
  usage: { storageUsed: 0, apiCalls: 0, contentItems: 0 },
};

describe('impersonation flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
      originalTenant: null,
      impersonationToken: null,
      originalAccessToken: null,
    });
  });

  it('mints a token, swaps the session, and restores on exit', async () => {
    useAuthStore.getState().setAuth(mockUser, mockTenant, { accessToken: 'admin-token', refreshToken: 'rt' });

    await useAuthStore.getState().beginImpersonation('t1');

    expect(tenantsAPI.impersonate).toHaveBeenCalledWith('t1');
    const s = useAuthStore.getState();
    expect(s.isImpersonating).toBe(true);
    expect(s.accessToken).toBe('imp-token-123');
    expect(s.impersonationToken).toBe('imp-token-123');
    expect(s.originalAccessToken).toBe('admin-token');
    expect(s.tenant?.id).toBe('t1');
    expect(s.tenant?.name).toBe('Acme');

    useAuthStore.getState().exitImpersonation();
    const after = useAuthStore.getState();
    expect(after.isImpersonating).toBe(false);
    expect(after.accessToken).toBe('admin-token');
    expect(after.tenant?.id).toBe('platform');
    expect(after.impersonationToken).toBeNull();
  });

  it('throws when no token is issued', async () => {
    vi.mocked(tenantsAPI.impersonate).mockResolvedValueOnce({ data: { data: {} } } as any);
    useAuthStore.getState().setAuth(mockUser, mockTenant, { accessToken: 'admin-token', refreshToken: 'rt' });

    await expect(useAuthStore.getState().beginImpersonation('t1')).rejects.toThrow(/no token was issued/);
    expect(useAuthStore.getState().isImpersonating).toBe(false);
    expect(useAuthStore.getState().accessToken).toBe('admin-token');
  });
});
