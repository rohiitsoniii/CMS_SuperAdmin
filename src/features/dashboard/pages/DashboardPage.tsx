import React from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, LinearProgress } from '@mui/material';
import {
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  Campaign as CampaignIcon,
  Memory as MemoryIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import { tenantsAPI } from '../../../shared/api/client';
import { useQuery } from '@tanstack/react-query';

const statCards = [
  { title: 'Total Tenants', value: '247', change: '+12%', trend: 'up', icon: <BusinessIcon />, color: 'primary' },
  { title: 'Monthly Revenue', value: '$48,320', change: '+8.2%', trend: 'up', icon: <CreditCardIcon />, color: 'success' },
  { title: 'Active Campaigns', value: '23', change: '-3%', trend: 'down', icon: <CampaignIcon />, color: 'warning' },
  { title: 'Token Usage (Daily)', value: '2.4M', change: '+15%', trend: 'up', icon: <MemoryIcon />, color: 'info' },
];

const recentTenantsColumns = [
  { field: 'name', headerName: 'Tenant', width: 200 },
  { field: 'plan', headerName: 'Plan', width: 150 },
  { field: 'status', headerName: 'Status', width: 120 },
  { field: 'revenue', headerName: 'MRR', width: 120, type: 'number' },
  { field: 'users', headerName: 'Users', width: 100, type: 'number' },
  { field: 'lastActive', headerName: 'Last Active', width: 150, type: 'date' },
];

export const DashboardPage: React.FC = () => {
  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants', 'recent'],
    queryFn: async (): Promise<any[]> => (await tenantsAPI.list({ limit: 10 })).data,
  });

  return (
    <Box sx={{ py: 2 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's an overview of your platform.
        </Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.title}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${stat.color}.light`, color: `${stat.color}.main` }}>
                    {stat.icon}
                  </Box>
                  <Chip
                    label={stat.trend === 'up' ? `+${stat.change}` : stat.change}
                    size="small"
                    color={stat.trend === 'up' ? 'success' : 'error'}
                    icon={stat.trend === 'up' ? <TrendingUpIcon fontSize="small" /> : <TrendingUpIcon fontSize="small" />}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Tenants */}
        <Grid item xs={12} lg={8} sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ height: '100%' }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Tenants
              </Typography>
              <Button variant="text" endIcon={<MoreVertIcon />}>
                View All
              </Button>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {recentTenantsColumns.map((col) => (
                      <TableCell key={col.field} align={col.type === 'number' ? 'right' : 'left'} sx={{ fontWeight: 600 }}>
                        {col.headerName}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tenants.length > 0 ? (
                    tenants.map((tenant: any) => (
                      <TableRow key={tenant.id} hover>
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
                        <TableCell>{tenant.plan || 'Free'}</TableCell>
                        <TableCell>
                          <Chip
                            label={tenant.status || 'active'}
                            size="small"
                            color={tenant.status === 'active' ? 'success' : tenant.status === 'suspended' ? 'error' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">${(tenant.revenue || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{tenant.users || 0}</TableCell>
                        <TableCell>{new Date(tenant.lastActive || Date.now()).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No tenants found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Quick Stats / Platform Health */}
        <Grid item xs={12} lg={4} sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ height: '100%', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Platform Health
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">API Uptime</Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">99.99%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={99.99} sx={{ height: 6, borderRadius: 3 }} color="success" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Error Rate</Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">0.02%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={2} sx={{ height: 6, borderRadius: 3 }} color="success" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Avg Response Time</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">87ms</Typography>
                </Box>
                <LinearProgress variant="determinate" value={40} sx={{ height: 6, borderRadius: 3 }} color="primary" />
              </Box>
            </Box>

            <Typography variant="h6" fontWeight={600} sx={{ mt: 1 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button variant="outlined" startIcon={<PeopleIcon />} fullWidth>
                Invite New Tenant
              </Button>
              <Button variant="outlined" startIcon={<CampaignIcon />} fullWidth>
                Create Campaign
              </Button>
              <Button variant="outlined" startIcon={<KeyIcon />} fullWidth>
                Manage API Keys
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Chart Placeholder */}
        <Grid item xs={12} sx={{ mb: 3 }}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
              Revenue Overview (Last 30 Days)
            </Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', px: 2 }}>
              {Array.from({ length: 12 }, (_, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 40,
                      height: Math.random() * 250 + 50,
                      bgcolor: 'primary.main',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                    Week {i + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};