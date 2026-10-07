import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, Button, Tabs, Tab, Paper, Avatar, Divider, IconButton, Alert } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Delete as DeleteIcon, CreditCard as CreditCardIcon, Storage as StorageIcon, People as PeopleIcon, History as HistoryIcon } from '@mui/icons-material';
import { tenantsAPI } from '../../../shared/api/client';
import { useQuery } from '@tanstack/react-query';

export const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async (): Promise<any> => (await tenantsAPI.get(id!)).data,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!tenant) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Alert severity="error">Tenant not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/tenants')} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', variant: 'rounded' }}>
              {tenant.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                {tenant.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {tenant.slug} • {tenant.id}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto' }}>
            <Chip label={tenant.plan || 'Free'} size="small" color={tenant.plan === 'enterprise' ? 'primary' : tenant.plan === 'pro' ? 'success' : 'default'} variant="outlined" />
            <Chip
              label={tenant.status || 'active'}
              size="small"
              variant="outlined"
              color={
                tenant.status === 'active' ? 'success' :
                tenant.status === 'suspended' ? 'error' :
                tenant.status === 'pending' ? 'warning' : 'default'
              }
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<EditIcon fontSize="small" />}>Edit</Button>
            <Button variant="outlined" color="error" startIcon={<DeleteIcon fontSize="small" />}>Delete</Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Users</Typography>
              <Typography variant="h5" fontWeight={700}>{tenant.users || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">MRR</Typography>
              <Typography variant="h5" fontWeight={700}>${(tenant.revenue || 0).toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Storage Used</Typography>
              <Typography variant="h5" fontWeight={700}>{((tenant.storage || 0) / 1024 / 1024 / 1024).toFixed(2)} GB</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">API Calls (30d)</Typography>
              <Typography variant="h5" fontWeight={700}>{(tenant.apiCalls || 0).toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper elevation={1}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }} variant="fullWidth">
          <Tab label="Overview" icon={<HistoryIcon />} />
          <Tab label="Subscription" icon={<CreditCardIcon />} />
          <Tab label="Usage" icon={<StorageIcon />} />
          <Tab label="Team" icon={<PeopleIcon />} />
          <Tab label="Audit Logs" icon={<HistoryIcon />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Tenant Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" fontWeight={500}>{tenant.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Slug</Typography>
                    <Typography variant="body1" fontWeight={500} fontFamily="monospace">{tenant.slug}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={tenant.status} size="small" variant="outlined" color={tenant.status === 'active' ? 'success' : tenant.status === 'suspended' ? 'error' : 'warning'} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Plan</Typography>
                    <Typography variant="body1" fontWeight={500}>{tenant.plan}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Created</Typography>
                    <Typography variant="body1">{new Date(tenant.createdAt).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Last Active</Typography>
                    <Typography variant="body1">{new Date(tenant.lastActive).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Quick Stats</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Content Items</Typography>
                        <Typography variant="h6" fontWeight={700}>{(tenant.contentItems || 0).toLocaleString()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">API Calls (30d)</Typography>
                        <Typography variant="h6" fontWeight={700}>{(tenant.apiCalls || 0).toLocaleString()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Storage</Typography>
                        <Typography variant="h6" fontWeight={700}>{((tenant.storage || 0) / 1024 / 1024 / 1024).toFixed(2)} GB</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Box>
            )}
            {tab === 1 && (
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Subscription Details</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Current Plan</Typography>
                        <Typography variant="h6" fontWeight={700}>{tenant.plan}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Billing Cycle</Typography>
                        <Typography variant="h6" fontWeight={700}>{tenant.subscription?.billingCycle || 'Monthly'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip label={tenant.subscription?.status || 'active'} size="small" color="success" variant="outlined" />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Next Billing</Typography>
                        <Typography variant="h6" fontWeight={700}>{tenant.subscription?.currentPeriodEnd ? new Date(tenant.subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
            {tab >= 2 && (
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  {['Usage Analytics', 'Team Members', 'Audit Logs'][tab - 2]}
                </Typography>
                <Typography color="text.secondary">Content coming soon...</Typography>
              </Box>
            )}
          </Box>
      </Paper>
    </Box>
  );
};