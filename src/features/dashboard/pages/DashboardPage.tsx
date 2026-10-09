import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Skeleton, Alert } from '@mui/material';
import {
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  Warning as WarningIcon,
  Memory as MemoryIcon,
  People as PeopleIcon,
  Campaign as CampaignIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { tenantsAPI, subscriptionsAPI, tokenUsageAPI, systemHealthAPI } from '../../../shared/api/client';
import { useQuery } from '@tanstack/react-query';

const unwrapList = (res: any): any[] => res.data?.data?.tenants ?? res.data?.tenants ?? [];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const statsQ = useQuery({ queryKey: ['sys-stats'], queryFn: () => tenantsAPI.summary().then((r) => r.data?.data) });
  const revenueQ = useQuery({ queryKey: ['sys-revenue'], queryFn: () => subscriptionsAPI.revenue.get().then((r) => r.data?.data) });
  const aiQ = useQuery({ queryKey: ['sys-ai'], queryFn: () => tokenUsageAPI.getUsage().then((r) => r.data?.data) });
  const healthQ = useQuery({ queryKey: ['sys-health'], queryFn: () => systemHealthAPI.getHealthDetail().then((r) => r.data?.data) });
  const tenantsQ = useQuery({ queryKey: ['tenants', 'recent'], queryFn: async (): Promise<any[]> => unwrapList(await tenantsAPI.list({ limit: 8 })) });

  const loading = statsQ.isLoading || revenueQ.isLoading || aiQ.isLoading || healthQ.isLoading;
  const loadError = statsQ.error || revenueQ.error || aiQ.error || healthQ.error;

  const statCards = [
    { title: 'Total Tenants', value: statsQ.data ? String(statsQ.data.total ?? 0) : '—', icon: <BusinessIcon />, color: 'primary' as const },
    { title: 'MRR', value: revenueQ.data ? `$${Number(revenueQ.data.mrr ?? 0).toLocaleString()}` : '—', icon: <CreditCardIcon />, color: 'success' as const },
    { title: 'Open Errors (24h)', value: healthQ.data ? String(healthQ.data.errorsLast24h ?? 0) : '—', icon: <WarningIcon />, color: 'warning' as const },
    { title: 'AI Cost (30d)', value: aiQ.data ? `$${Number(aiQ.data.totals?.costUSD ?? 0).toFixed(2)}` : '—', icon: <MemoryIcon />, color: 'info' as const },
  ];

  const planBars = revenueQ.data
    ? Object.entries((revenueQ.data.byPlan ?? {}) as Record<string, { count: number; mrr: number }>).map(([plan, v]) => ({ plan, mrr: Math.round(v.mrr * 100) / 100 }))
    : [];
  const modelBars = (aiQ.data?.byModel ?? []).slice(0, 8).map((m: any) => ({ model: String(m.model).slice(0, 18), cost: m.costUSD }));

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Live platform overview — tenants, revenue, errors and AI spend.
        </Typography>
      </Box>

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load platform stats. Check that the backend is running and your session is valid.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${stat.color}.light`, color: `${stat.color}.main` }}>
                    {stat.icon}
                  </Box>
                  {healthQ.data && stat.title === 'Open Errors (24h)' && (
                    <Chip label={healthQ.data.status} size="small" color={healthQ.data.status === 'operational' ? 'success' : 'warning'} variant="outlined" />
                  )}
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                  {loading ? <Skeleton width={80} /> : stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8} sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Tenants
              </Typography>
              <Button variant="text" onClick={() => navigate('/tenants')}>
                View All
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Users</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenantsQ.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}><Skeleton /></TableCell>
                    </TableRow>
                  ) : (tenantsQ.data ?? []).length > 0 ? (
                    (tenantsQ.data ?? []).map((tenant: any) => (
                      <TableRow key={tenant._id || tenant.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/tenants/${tenant._id || tenant.id}`)}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                              {tenant.name?.charAt(0).toUpperCase()}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {tenant.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {tenant.slug}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{tenant.subscription?.plan || 'Free'}</TableCell>
                        <TableCell>
                          <Chip
                            label={tenant.isActive === false ? 'suspended' : 'active'}
                            size="small"
                            color={tenant.isActive === false ? 'error' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">{tenant.userCount ?? 0}</TableCell>
                        <TableCell>{tenant.lastLoginAt ? new Date(tenant.lastLoginAt).toLocaleDateString() : '—'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No tenants found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4} sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Platform Health
            </Typography>
            {healthQ.data ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Status</Typography>
                  <Chip label={healthQ.data.status} size="small" color={healthQ.data.status === 'operational' ? 'success' : 'warning'} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Open incidents</Typography>
                  <Typography variant="body2" fontWeight={600}>{healthQ.data.openIncidents?.length ?? 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Errors (24h)</Typography>
                  <Typography variant="body2" fontWeight={600}>{healthQ.data.errorsLast24h ?? 0}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Uptime</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {healthQ.data.uptime != null ? `${(healthQ.data.uptime / 3600).toFixed(1)}h` : '—'}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Skeleton variant="rectangular" height={120} />
            )}

            <Typography variant="h6" fontWeight={600} sx={{ mt: 1 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button variant="outlined" startIcon={<PeopleIcon />} fullWidth onClick={() => navigate('/tenants')}>
                View Tenants
              </Button>
              <Button variant="outlined" startIcon={<CampaignIcon />} fullWidth onClick={() => navigate('/campaigns')}>
                View Campaigns
              </Button>
              <Button variant="outlined" startIcon={<KeyIcon />} fullWidth onClick={() => navigate('/api-keys')}>
                Manage API Keys
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6} sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ p: 3, height: 340 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              MRR by Plan
            </Typography>
            {planBars.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={planBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="plan" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="mrr" name="MRR ($)" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No revenue data yet</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6} sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ p: 3, height: 340 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              AI Cost by Model (30d)
            </Typography>
            {modelBars.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={modelBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cost" name="Cost ($)" fill="#7c4dff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No AI usage yet</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
