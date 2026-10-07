import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, LinearProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Select, MenuItem as SelectMenuItem, FormControl, InputLabel } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon, Warning as WarningIcon, Speed as SpeedIcon, Download as DownloadIcon } from '@mui/icons-material';

export const SystemHealthPage: React.FC = () => {
  const [period, setPeriod] = React.useState('1h');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>System Health</Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor platform health, performance metrics, and error rates
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="period-label">Period</InputLabel>
            <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
              <SelectMenuItem value="1h">Last Hour</SelectMenuItem>
              <SelectMenuItem value="24h">Last 24 Hours</SelectMenuItem>
              <SelectMenuItem value="7d">Last 7 Days</SelectMenuItem>
              <SelectMenuItem value="30d">Last 30 Days</SelectMenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />}>Export Report</Button>
        </Box>
      </Box>

      {/* Health Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">API Uptime</Typography>
                <CheckCircleIcon color="success" />
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">99.99%</Typography>
              <Typography variant="body2" color="text.secondary">Target: 99.95%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Error Rate</Typography>
                <ErrorIcon color="error" />
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">0.02%</Typography>
              <Typography variant="body2" color="text.secondary">Threshold: {'<'} 0.1%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Avg Response Time</Typography>
                <SpeedIcon color="primary" />
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary.main">87ms</Typography>
              <Typography variant="body2" color="text.secondary">p95: 245ms</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Queue Depth</Typography>
                <WarningIcon color="warning" />
              </Box>
              <Typography variant="h3" fontWeight={700} color="warning.main">23</Typography>
              <Typography variant="body2" color="text.secondary">Processing: 12 jobs</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Metrics Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Response Time Trend</Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', px: 2 }}>
              {Array.from({ length: 24 }, (_, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 30,
                      height: Math.max(20, Math.random() * 200 + 30),
                      bgcolor: 'primary.main',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                    H{i}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={1} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>System Resources</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">CPU Usage</Typography>
                  <Typography variant="body2" fontWeight={600}>42%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={42} sx={{ height: 6, borderRadius: 3 }} color="primary" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Memory Usage</Typography>
                  <Typography variant="body2" fontWeight={600}>68%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={68} sx={{ height: 6, borderRadius: 3 }} color="warning" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Disk Usage</Typography>
                  <Typography variant="body2" fontWeight={600}>55%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={55} sx={{ height: 6, borderRadius: 3 }} color="info" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">DB Connections</Typography>
                  <Typography variant="body2" fontWeight={600}>23/100</Typography>
                </Box>
                <LinearProgress variant="determinate" value={23} sx={{ height: 6, borderRadius: 3 }} color="success" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Errors */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>Recent Errors</Typography>
          <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />}>Export All</Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>Endpoint</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { time: '2 min ago', severity: 'critical', message: 'Database connection timeout', tenant: 'acme-corp', endpoint: '/api/v1/content', status: 'Investigating' },
                { time: '15 min ago', severity: 'error', message: 'Redis connection failed', tenant: 'platform', endpoint: '/api/v1/cache', status: 'Resolved' },
                { time: '1 hour ago', severity: 'warning', message: 'High memory usage detected', tenant: 'beta-startup', endpoint: '/api/v1/media', status: 'Monitoring' },
              ].map((error, i) => (
                <TableRow key={i} hover>
                  <TableCell>{error.time}</TableCell>
                  <TableCell><Chip label={error.severity} size="small" color={error.severity === 'critical' ? 'error' : error.severity === 'error' ? 'error' : 'warning'} /></TableCell>
                  <TableCell>{error.message}</TableCell>
                  <TableCell>{error.tenant}</TableCell>
                  <TableCell>{error.endpoint}</TableCell>
                  <TableCell><Chip label={error.status} size="small" variant="outlined" color={error.status === 'Resolved' ? 'success' : error.status === 'Investigating' ? 'warning' : 'info'} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};