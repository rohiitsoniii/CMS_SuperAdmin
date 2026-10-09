import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MFAChallengeModal } from '@/features/auth/components/MFAChallengeModal';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

vi.mock('@/shared/api/client', () => ({
  api: { get: vi.fn() },
  twoFactorAPI: { verify: vi.fn() },
}));

import { twoFactorAPI, api } from '@/shared/api/client';

describe('MFAChallengeModal', () => {
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

  it('verifies the code and establishes the session', async () => {
    vi.mocked(twoFactorAPI.verify).mockResolvedValue({ data: { data: { tokens: { accessToken: 'verified-at', refreshToken: 'rt' } } } } as any);
    vi.mocked(api.get).mockResolvedValue({ data: { data: { user: { id: '1', email: 'a@b.com' }, tenant: { id: 't' } } } } as any);

    render(
      <MemoryRouter>
        <MFAChallengeModal tempToken="temp-123" onCancel={() => undefined} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(twoFactorAPI.verify).toHaveBeenCalledWith('123456', 'temp-123');
    });
    expect(api.get).toHaveBeenCalledWith('/auth/me', expect.objectContaining({}));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('verified-at');
  });

  it('shows an error on bad codes without signing in', async () => {
    vi.mocked(twoFactorAPI.verify).mockRejectedValue({ response: { data: { error: 'Invalid code' } } });

    render(
      <MemoryRouter>
        <MFAChallengeModal tempToken="temp-123" onCancel={() => undefined} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/verification code/i), { target: { value: '000000' } });
    fireEvent.click(screen.getByText('Verify'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid code');
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('only digits are accepted and verify needs 6 digits', () => {
    render(
      <MemoryRouter>
        <MFAChallengeModal tempToken="temp-123" onCancel={() => undefined} />
      </MemoryRouter>
    );
    const input = screen.getByLabelText(/verification code/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ab12cd34' } });
    expect(input.value).toBe('1234');
    expect(screen.getByText('Verify')).toBeDisabled();
  });
});
