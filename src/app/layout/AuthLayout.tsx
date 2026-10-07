import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, Grid } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';

export const AuthLayout: React.FC = () => {

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Grid container justifyContent="center">
          <Grid item xs={12} sm={8} md={5}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <AdminPanelSettings sx={{ width: 36, height: 36 }} />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
                CMS Super Admin
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center" paragraph>
                Platform Management Console
              </Typography>
              <Outlet />
            </Paper>
            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 3, display: 'block' }}>
              © 2026 CMS Super Admin. All rights reserved.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};