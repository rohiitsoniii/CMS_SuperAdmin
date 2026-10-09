import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, FormControl, Select, MenuItem, InputLabel, Button, TextField, InputAdornment, Grid, Alert } from '@mui/material';
import { Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material';
import { auditLogsAPI } from '../../../shared/api/client';
import { useQuery } from '@tanstack/react-query';

const unwrap = (res: any) => ({ logs: res.data?.data?.logs ?? [], total: res.data?.data?.pagination?.total ?? 0 });

export const AuditLogsPage: React.FC = () => {
  const [action, setAction] = React.useState('all');
  const [status, setStatus] = React.useState('all');
  const [tenantId, setTenantId] = React.useState('');
  const [page, setPage] = React.useState(0);

  const { data: audit = { logs: [], total: 0 }, isLoading, error } = useQuery({
    queryKey: ['audit-logs', action, status, tenantId, page],
    queryFn: async () => unwrap(await auditLogsAPI.list({
      action: action !== 'all' ? action : undefined,
      status: status !== 'all' ? status : undefined,
      tenantId: tenantId || undefined,
      page: page + 1,
      limit: 25,
    })),
  });

  const statsQ = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => auditLogsAPI.getStats().then((r) => r.data?.data),
  });

  const handleExport = async () => {
    const res = await auditLogsAPI.export({
      action: action !== 'all' ? action : undefined,
      tenantId: tenantId || undefined,
    });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Audit Logs</Typography>
          <Typography variant="body1" color="text.secondary">
            Platform-wide trail — {statsQ.data ? Number(statsQ.data.total ?? 0).toLocaleString() : '…'} entries (30d)
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />} onClick={handleExport}>Export CSV</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load audit logs.</Alert>}

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'flex-end' }}>
          <Grid item xs={12} sm={4}>
            <FormControl size="small" fullWidth>
              <InputLabel id="action-label">Action</InputLabel>
              <Select value={action} label="Action" onChange={(e) => { setAction(e.target.value); setPage(0); }}>
                {['all', 'tenant.suspend', 'tenant.activate', 'tenant.plan.update', 'tenant.delete', 'user.sessions.revoke', 'billing.invoice.refund', 'email.campaign.pause', 'platform.key.reveal', 'incident.create'].map((a) => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl size="small" fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
                {['all', 'success', 'failure'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              placeholder="Tenant ID filter (ObjectId)…"
              value={tenantId}
              onChange={(e) => { setTenantId(e.target.value); setPage(0); }}
              size="small"
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <TableContainer sx={{ maxHeight: 520 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} align="center">Loading…</TableCell></TableRow>
              ) : audit.logs.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">No audit entries</Typography></TableCell></TableRow>
              ) : audit.logs.map((l: any) => (
                <TableRow key={l._id} hover>
                  <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{l.actor?.email || l.actor?.name || l.actor?.type}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{l.action}</TableCell>
                  <TableCell>{l.resource?.type}:{String(l.resource?.id || '').slice(0, 8)}</TableCell>
                  <TableCell>{l.tenantId?.slug || l.tenantId?.name || (l.tenantId ? String(l.tenantId).slice(0, 8) : 'platform')}</TableCell>
                  <TableCell>
                    <Chip label={l.status} size="small" variant="outlined" color={l.status === 'success' ? 'success' : 'error'} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">Total: {audit.total.toLocaleString()}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="small" onClick={() => setPage((p) => p + 1)}>Next</Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
