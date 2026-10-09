import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useAuthStore } from '../hooks/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, restoreSession, user, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) {
      restoreSession();
    }
  }, [isLoading, restoreSession]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // This portal is super-admin only. Backend is the real enforcer
  // (requireSuperAdmin); this gate keeps non-staff out of the UI shell.
  const isStaff = user?.isSuperAdmin === true || user?.role === 'superadmin';
  if (!isStaff) {
    return (
      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, p: 3, textAlign: 'center' }}
      >
        <Typography variant="h5" fontWeight={700}>
          Not authorized
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This console is restricted to platform super-admins.
        </Typography>
        <Button variant="outlined" onClick={logout}>
          Sign out
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
};