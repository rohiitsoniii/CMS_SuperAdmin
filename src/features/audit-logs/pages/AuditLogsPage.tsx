import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, FormControl, Select, MenuItem as SelectMenuItem, InputLabel, Button, TextField, InputAdornment, FormControlLabel, Checkbox, Grid } from '@mui/material';
import { Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material';

export const AuditLogsPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('all');
  const [tenantFilter, setTenantFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState('24h');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Audit Logs</Typography>
          <Typography variant="body1" color="text.secondary">
            Platform-wide audit trail for all tenant and system activities
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />}>Export Logs</Button>
      </Box>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Grid item xs={12} sm={4}>
            <TextField
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel id="action-label">Action</InputLabel>
              <Select value={actionFilter} label="Action" onChange={(e) => setActionFilter(e.target.value)}>
                <SelectMenuItem value="all">All Actions</SelectMenuItem>
                <SelectMenuItem value="create">Create</SelectMenuItem>
                <SelectMenuItem value="update">Update</SelectMenuItem>
                <SelectMenuItem value="delete">Delete</SelectMenuItem>
                <SelectMenuItem value="login">Login</SelectMenuItem>
                <SelectMenuItem value="invite">Invite</SelectMenuItem>
                <SelectMenuItem value="config_change">Config Change</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel id="tenant-label">Tenant</InputLabel>
              <Select value={tenantFilter} label="Tenant" onChange={(e) => setTenantFilter(e.target.value)}>
                <SelectMenuItem value="all">All Tenants</SelectMenuItem>
                <SelectMenuItem value="acme-corp">Acme Corporation</SelectMenuItem>
                <SelectMenuItem value="beta-startup">Beta Startup</SelectMenuItem>
                <SelectMenuItem value="enterprise-co">Enterprise Co</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="date-label">Period</InputLabel>
              <Select value={dateRange} label="Period" onChange={(e) => setDateRange(e.target.value)}>
                <SelectMenuItem value="1h">Last Hour</SelectMenuItem>
                <SelectMenuItem value="24h">Last 24 Hours</SelectMenuItem>
                <SelectMenuItem value="7d">Last 7 Days</SelectMenuItem>
                <SelectMenuItem value="30d">Last 30 Days</SelectMenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>Audit Trail</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControlLabel control={<Checkbox />} label="Show System Events" />
            <FormControlLabel control={<Checkbox />} label="Show User Actions" />
            <FormControlLabel control={<Checkbox />} label="Show API Calls" />
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Tenant</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Details</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { time: '2 min ago', actor: 'admin@platform.com', action: 'create', resource: 'Tenant', tenant: 'new-startup', ip: '192.168.1.1', details: 'Created tenant "new-startup" with Pro plan' },
                { time: '15 min ago', actor: 'support@platform.com', action: 'update', resource: 'Subscription', tenant: 'acme-corp', ip: '10.0.0.5', details: 'Upgraded plan from Pro to Enterprise' },
                { time: '1 hour ago', actor: 'john@beta-startup.com', action: 'login', resource: 'User Session', tenant: 'beta-startup', ip: '203.0.113.42', details: 'Successful login with MFA' },
                { time: '2 hours ago', actor: 'api-key:sk-proj-abc123', action: 'api_call', resource: 'Content', tenant: 'enterprise-co', ip: '198.51.100.23', details: 'GET /api/v1/content (200 OK)' },
              ].map((log, i) => (
                <TableRow key={i} hover>
                  <TableCell>{log.time}</TableCell>
                  <TableCell>{log.actor}</TableCell>
                  <TableCell><Chip label={log.action} size="small" variant="outlined" color={log.action === 'delete' ? 'error' : log.action === 'create' ? 'success' : log.action === 'update' ? 'info' : 'default'} /></TableCell>
                  <TableCell>{log.resource}</TableCell>
                  <TableCell>{log.tenant}</TableCell>
                  <TableCell>{log.ip}</TableCell>
                  <TableCell>{log.details}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="text">View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined">Load More</Button>
        </Box>
      </Paper>
    </Box>
  );
};