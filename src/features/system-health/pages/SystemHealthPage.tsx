import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Error as ErrorIcon, Add as AddIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { systemHealthAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const SystemHealthPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [incidentOpen, setIncidentOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [incidentForm, setIncidentForm] = React.useState({ title: '', description: '', severity: 'medium' });

  const healthQ = useQuery({ queryKey: ['health-detail'], queryFn: () => systemHealthAPI.getHealthDetail().then((r) => r.data?.data), refetchInterval: 30000 });
  const perfQ = useQuery({ queryKey: ['performance'], queryFn: () => systemHealthAPI.getPerformance({ limit: 12 }).then((r) => r.data?.data) });
  const incidentsQ = useQuery({ queryKey: ['incidents'], queryFn: () => systemHealthAPI.listIncidents({ limit: 20 }).then((r) => r.data?.data?.incidents ?? []) });
  const errorsQ = useQuery({ queryKey: ['errors-recent'], queryFn: () => systemHealthAPI.getErrors({ limit: 8 }).then((r) => r.data?.data?.logs ?? []) });

  const h = healthQ.data;
  const perfRows = (perfQ.data?.endpoints ?? []).slice(0, 12).map((e: any) => ({ endpoint: String(e.endpoint).slice(0, 28), avgMs: e.avgMs }));

  const runAction = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ['incidents'] });
      await queryClient.invalidateQueries({ queryKey: ['health-detail'] });
      setNotice({ severity: 'success', text: okText });
    } catch (err: any) {
      setNotice({ severity: 'error', text: err.response?.data?.error || err.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>System Health</Typography>
          <Typography variant="body1" color="text.secondary">
            Live dependencies, error rate, latency, queues and incidents
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setIncidentOpen(true)}>Open Incident</Button>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              {h ? <CheckCircleIcon color={h.status === 'operational' ? 'success' : 'warning'} /> : null}
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ textTransform: 'capitalize' }}>{h ? h.status : '…'}</Typography>
            <Typography variant="body2" color="text.secondary">Uptime {h?.uptime != null ? `${(h.uptime / 3600).toFixed(1)}h` : '—'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Errors (24h)</Typography>
              <ErrorIcon color="error" />
            </Box>
            <Typography variant="h4" fontWeight={700}>{h ? h.errorsLast24h ?? 0 : '…'}</Typography>
            <Typography variant="body2" color="text.secondary">Open incidents: {h ? h.openIncidents?.length ?? 0 : '—'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Requests (24h)</Typography>
            <Typography variant="h4" fontWeight={700}>{perfQ.data ? Number(perfQ.data.totals?.requests ?? 0).toLocaleString() : '…'}</Typography>
            <Typography variant="body2" color="text.secondary">Errors: {perfQ.data ? perfQ.data.totals?.errors ?? 0 : '—'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Dependencies</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
              {h ? Object.entries(h.dependencies ?? {}).map(([k, v]: any) => `${k}:${v}`).join(' • ') || 'ok' : '…'}
            </Typography>
            <Typography variant="body2" color="text.secondary">mongo • redis</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ p: 3, height: 380 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Slowest Endpoints (avg ms, 24h)</Typography>
            {perfRows.length > 0 ? (
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={perfRows} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="endpoint" width={180} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avgMs" name="avg ms" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary">No telemetry in this window</Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={1} sx={{ p: 3, height: 380, overflow: 'auto' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Incidents</Typography>
            {(incidentsQ.data ?? []).length === 0 && !incidentsQ.isLoading && (
              <Typography color="text.secondary">No incidents on record 🎉</Typography>
            )}
            {(incidentsQ.data ?? []).map((i: any) => (
              <Box key={i._id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{i.title}</Typography>
                  <Chip label={i.status} size="small" variant="outlined" color={i.status === 'resolved' ? 'success' : i.status === 'monitoring' ? 'info' : 'error'} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {i.severity} • {new Date(i.startedAt).toLocaleString()}
                </Typography>
                {i.status !== 'resolved' && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small" disabled={busy}
                      onClick={() => runAction(() => systemHealthAPI.updateIncident(i._id, { status: 'resolved' }), `Incident ${i.title} resolved`)}
                    >
                      Resolve
                    </Button>
                  </Box>
                )}
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Recent Errors</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Message</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Path</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(errorsQ.data ?? []).map((e: any) => (
                <TableRow key={e._id} hover>
                  <TableCell>{new Date(e.createdAt).toLocaleString()}</TableCell>
                  <TableCell><Chip label={e.severity} size="small" variant="outlined" color={e.severity === 'critical' ? 'error' : e.severity === 'high' ? 'warning' : 'default'} /></TableCell>
                  <TableCell>{String(e.message).slice(0, 80)}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{e.path}</TableCell>
                  <TableCell><Chip label={e.isFixed ? 'fixed' : 'open'} size="small" variant="outlined" color={e.isFixed ? 'success' : 'error'} /></TableCell>
                  <TableCell align="right">
                    {!e.isFixed && (
                      <Button size="small" disabled={busy} onClick={() => runAction(() => systemHealthAPI.fixError(e._id).then(() => queryClient.invalidateQueries({ queryKey: ['errors-recent'] })), 'Error marked fixed')}>Mark fixed</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!errorsQ.isLoading && (errorsQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">No errors 🎉</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={incidentOpen} onClose={() => setIncidentOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Open Incident</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Title" value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} fullWidth sx={{ mt: 1 }} />
          <TextField label="Description" value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} fullWidth multiline rows={3} />
          <FormControl fullWidth>
            <InputLabel id="sev-label">Severity</InputLabel>
            <Select labelId="sev-label" value={incidentForm.severity} label="Severity" onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}>
              {['critical', 'high', 'medium', 'low'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIncidentOpen(false)}>Cancel</Button>
          <Button
            variant="contained" color="error" disabled={busy}
            onClick={() => {
              setIncidentOpen(false);
              runAction(() => systemHealthAPI.createIncident({ title: incidentForm.title.trim(), description: incidentForm.description, severity: incidentForm.severity }), 'Incident opened');
              setIncidentForm({ title: '', description: '', severity: 'medium' });
            }}
          >
            {busy ? <CircularProgress size={20} /> : 'Open incident'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
