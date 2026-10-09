import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { useAuthStore } from '@/shared/hooks/useAuthStore';

// NOTE: the guard must sit inside <Routes> so that <Navigate> unmounts it
// after redirecting — otherwise Navigate re-fires every render (same as prod).
const renderAt = (path: string, child: React.ReactNode = <div>secret</div>) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <>{child}</>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute super-admin gate', () => {
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
      impersonationToken: null,
      originalAccessToken: null,
    });
  });

  it('redirects to login when unauthenticated', () => {
    renderAt('/dashboard');
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('blocks authenticated non-staff with a not-authorized screen', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '9', email: 'x@y.com', firstName: 'X', lastName: 'Y', role: 'support', mfaEnabled: false },
    });
    renderAt('/dashboard');
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(screen.getByText('Not authorized')).toBeInTheDocument();
  });

  it('renders children for super-admins', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '1', email: 'a@b.com', firstName: 'S', lastName: 'A', role: 'superadmin', isSuperAdmin: true, mfaEnabled: true },
    });
    renderAt('/dashboard');
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('signs out from the not-authorized screen', () => {
    const logout = vi.spyOn(useAuthStore.getState(), 'logout');
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: '9', email: 'x@y.com', firstName: 'X', lastName: 'Y', role: 'billing', mfaEnabled: false },
    });
    renderAt('/dashboard');
    fireEvent.click(screen.getByText('Sign out'));
    expect(logout).toHaveBeenCalled();
  });
});
