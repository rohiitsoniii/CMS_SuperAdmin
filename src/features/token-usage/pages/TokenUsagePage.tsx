import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Select, MenuItem, FormControl, InputLabel, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress } from '@mui/material';
import { Download as DownloadIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { tokenUsageAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const rangeFor = (period: string): { from: string; to: string } => {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
  return { from: new Date(Date.now() - days * 86_400_000).toISOString(), to: new Date().toISOString() };
};

export const TokenUsagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = React.useState('30d');
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [alertForm, setAlertForm] = React.useState({ metric: 'aiCostUSD', threshold: '100', period: 'monthly', notifyEmail: '' });

  const range = rangeFor(period);
  const usageQ = useQuery({ queryKey: ['ai-usage', period], queryFn: () => tokenUsageAPI.getUsage(range).then((r) => r.data?.data) });
  const topQ = useQuery({ queryKey: ['ai-top'], queryFn: () => tokenUsageAPI.getTopConsumers({ limit: 10 }).then((r) => r.data?.data) });
  const projQ = useQuery({ queryKey: ['ai-projection'], queryFn: () => tokenUsageAPI.getProjection(3).then((r) => r.data?.data) });
  const alertsQ = useQuery({ queryKey: ['ai-alerts'], queryFn: () => tokenUsageAPI.listAlerts().then((r) => r.data?.data?.alerts ?? []) });

  const t = usageQ.data?.totals;
  const cards = [
    { label: 'Total Tokens', value: t ? Number(t.totalTokens ?? 0).toLocaleString() : '—' },
    { label: 'Platform Cost', value: t ? `$${Number(t.costUSD ?? 0).toFixed(2)}` : '—' },
    { label: 'Requests', value: t ? Number(t.requests ?? 0).toLocaleString() : '—' },
    { label: 'Errors', value: t ? Number(t.errors ?? 0).toLocaleString() : '—' },
  ];
  const modelBars = (usageQ.data?.byModel ?? []).map((m: any) => ({ model: String(m.model).slice(0, 20), cost: m.costUSD }));

  const runAction = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ['ai-alerts'] });
      setNotice({ severity: 'success', text: okText });
    } catch (err: any) {
      setNotice({ severity: 'error', text: err.response?.data?.error || err.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const rows = (usageQ.data?.byTenant ?? []).map((u: any) => [u.tenantId, u.tenantName || '', u.totalTokens, u.costUSD, u.requests]);
    const csv = ['tenantId,tenantName,totalTokens,costUSD,requests', ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-usage-by-tenant.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Token Usage Analytics</Typography>
          <Typography variant="body1" color="text.secondary">
            Platform AI spend, per-model cost and top consumers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="period-label">Period</InputLabel>
            <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
              <MenuItem value="1y">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />} onClick={exportCsv}>Export CSV</Button>
        </Box>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} lg={3} key={c.label}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">{c.label}</Typography>
              <Typography variant="h4" fontWeight={700}>{usageQ.isLoading ? '…' : c.value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Cost by Model</Typography>
            {modelBars.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cost" name="Cost ($)" fill="#7c4dff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No AI usage in this period</Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={1} sx={{ p: 3, height: 400, overflow: 'auto' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>3-Month Projection</Typography>
            <Typography variant="caption" color="text.secondary">Estimate from trailing-30d run-rate</Typography>
            {(projQ.data?.projections ?? []).map((p: any) => (
              <Box key={p.month} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Typography variant="body2">{p.month}</Typography>
                <Typography variant="body2" fontWeight={600}>${Number(p.costUSD).toFixed(2)}</Typography>
              </Box>
            ))}
            {(!projQ.data?.projections || projQ.data.projections.length === 0) && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>No projection data</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Top Consumers (month)</Typography>
        <TableContainer sx={{ maxHeight: 320 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Tokens</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Requests</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(topQ.data?.consumers ?? []).map((c: any) => (
                <TableRow key={c.tenantId} hover>
                  <TableCell>{c.tenantName || String(c.tenantId).slice(0, 8)}</TableCell>
                  <TableCell align="right">{Number(c.platformTokens ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right">{Number(c.platformRequests ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right">${Number(c.platformCostUSD ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {!topQ.isLoading && (topQ.data?.consumers ?? []).length === 0 && (
                <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary">No consumers this month</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Usage Alerts</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => runAction(() => tokenUsageAPI.evaluateAlerts().then(() => queryClient.invalidateQueries({ queryKey: ['ai-alerts'] })), 'Alerts evaluated')} disabled={busy}>
              Evaluate now
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setAlertOpen(true)}>New Alert</Button>
          </Box>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Threshold</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Scope</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Fired</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(alertsQ.data ?? []).map((a: any) => (
                <TableRow key={a._id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{a.metric}</TableCell>
                  <TableCell align="right">{a.threshold}</TableCell>
                  <TableCell>{a.period}</TableCell>
                  <TableCell>{a.tenantId ? String(a.tenantId).slice(0, 8) : 'platform'}</TableCell>
                  <TableCell>{a.lastFiredAt ? new Date(a.lastFiredAt).toLocaleString() : 'never'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => runAction(() => tokenUsageAPI.deleteAlert(a._id), 'Alert deleted')}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!alertsQ.isLoading && (alertsQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">No alerts configured</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={alertOpen} onClose={() => setAlertOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Usage Alert</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="alert-metric">Metric</InputLabel>
            <Select labelId="alert-metric" value={alertForm.metric} label="Metric" onChange={(e) => setAlertForm({ ...alertForm, metric: e.target.value })}>
              <MenuItem value="aiCostUSD">Platform cost (USD)</MenuItem>
              <MenuItem value="aiTokens">Platform tokens</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Threshold" type="number" value={alertForm.threshold} onChange={(e) => setAlertForm({ ...alertForm, threshold: e.target.value })} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="alert-period">Period</InputLabel>
            <Select labelId="alert-period" value={alertForm.period} label="Period" onChange={(e) => setAlertForm({ ...alertForm, period: e.target.value })}>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Notify email (optional)" type="email" value={alertForm.notifyEmail} onChange={(e) => setAlertForm({ ...alertForm, notifyEmail: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={() => {
              setAlertOpen(false);
              runAction(() => tokenUsageAPI.createAlert({
                metric: alertForm.metric as 'aiCostUSD' | 'aiTokens',
                threshold: Number(alertForm.threshold),
                period: alertForm.period as 'daily' | 'monthly',
                notifyEmail: alertForm.notifyEmail || undefined,
              }), 'Alert created');
            }}
          >
            {busy ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
