import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Pause as PauseIcon, PlayArrow as PlayIcon, Cancel as CancelIcon, Send as SendIcon, Schedule as ScheduleIcon, Refresh as TickIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { campaignsAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const unwrapList = (res: any): any[] => res.data?.data?.campaigns ?? [];

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [suppressOpen, setSuppressOpen] = useState(false);
  const [notice, setNotice] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ projectId: '', name: '', subject: '' });
  const [suppressEmail, setSuppressEmail] = useState('');

  const overviewQ = useQuery({ queryKey: ['email-overview'], queryFn: () => campaignsAPI.overview().then((r) => r.data?.data) });
  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: ['email-campaigns', search, statusFilter],
    queryFn: async (): Promise<any[]> =>
      unwrapList(await campaignsAPI.list({ search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined, limit: 50 })),
  });
  const suppressionQ = useQuery({
    queryKey: ['suppressions'],
    queryFn: async (): Promise<any[]> => (await campaignsAPI.suppressions.list({ limit: 10 })).data?.data?.suppressions ?? [],
  });

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['email-campaigns'] }),
    queryClient.invalidateQueries({ queryKey: ['email-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['suppressions'] }),
  ]);

  const runAction = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      await refresh();
      setNotice({ severity: 'success', text: okText });
    } catch (err: any) {
      setNotice({ severity: 'error', text: err.response?.data?.error || err.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const ov = overviewQ.data;
  const statCards = [
    { label: 'Sent', value: ov ? Number(ov.totals?.sent ?? 0).toLocaleString() : '—' },
    { label: 'Open rate', value: ov ? `${ov.openRate ?? 0}%` : '—' },
    { label: 'Click rate', value: ov ? `${ov.clickRate ?? 0}%` : '—' },
    { label: 'Bounce rate', value: ov ? `${ov.bounceRate ?? 0}%` : '—' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" fontWeight={700}>Email Campaigns</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<TickIcon fontSize="small" />} disabled={busy} onClick={() => runAction(() => campaignsAPI.tickWorker(), 'Worker tick completed')}>
              Run worker tick
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Create Campaign</Button>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Global deliverability, kill-switch controls and suppression — all tenants
        </Typography>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load campaigns.</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((s) => (
          <Grid item xs={12} sm={6} lg={3} key={s.label}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              <Typography variant="h4" fontWeight={700}>{overviewQ.isLoading ? '…' : s.value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <TextField
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="campaign-status">Status</InputLabel>
          <Select labelId="campaign-status" value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            {['all', 'draft', 'scheduled', 'sending', 'paused', 'sent', 'cancelled', 'failed'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Sent</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Delivered</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Opened</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Clicked</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center">Loading…</TableCell></TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary">No campaigns</Typography></TableCell></TableRow>
              ) : campaigns.map((c: any) => (
                <TableRow key={c._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/campaigns/${c._id}`)}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.status} size="small" variant="outlined"
                      color={c.status === 'sent' ? 'success' : c.status === 'sending' ? 'info' : c.status === 'paused' ? 'warning' : c.status === 'failed' ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{Number(c.stats?.sent ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right">{Number(c.stats?.delivered ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right">{Number(c.stats?.opened ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right">{Number(c.stats?.clicked ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    {c.status === 'sending' && (
                      <Tooltip title="Pause (kill-switch)"><IconButton size="small" aria-label="Pause campaign" disabled={busy} onClick={() => runAction(() => campaignsAPI.pause(c._id), `Campaign ${c.name} paused`)}><PauseIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    {c.status === 'paused' && (
                      <Tooltip title="Resume"><IconButton size="small" aria-label="Resume campaign" disabled={busy} onClick={() => runAction(() => campaignsAPI.resume(c._id), `Campaign ${c.name} resumed`)}><PlayIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    {['sending', 'paused', 'scheduled'].includes(c.status) && (
                      <Tooltip title="Cancel"><IconButton size="small" aria-label="Cancel campaign" disabled={busy} onClick={() => runAction(() => campaignsAPI.cancel(c._id), `Campaign ${c.name} cancelled`)}><CancelIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    {['draft', 'scheduled'].includes(c.status) && (
                      <Tooltip title="Send now"><IconButton size="small" aria-label="Send campaign" disabled={busy} onClick={() => runAction(() => campaignsAPI.send(c._id), `Campaign ${c.name} sending`)}><SendIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    {c.status === 'draft' && (
                      <Tooltip title="Schedule"><IconButton size="small" aria-label="Schedule campaign" disabled={busy} onClick={() => runAction(() => campaignsAPI.schedule(c._id, new Date(Date.now() + 3600_000).toISOString()), `Campaign ${c.name} scheduled`)}><ScheduleIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Suppression List</Typography>
          <Button variant="outlined" size="small" onClick={() => setSuppressOpen(true)}>Suppress email</Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(suppressionQ.data ?? []).map((s: any) => (
                <TableRow key={`${s.email}-${s.projectId?._id || s.projectId}`} hover>
                  <TableCell>{s.email}</TableCell>
                  <TableCell><Chip label={s.status} size="small" variant="outlined" color="warning" /></TableCell>
                  <TableCell align="right">
                    <Button size="small" disabled={busy} onClick={() => runAction(() => campaignsAPI.suppressions.unsuppress(s.email), `Suppression removed for ${s.email}`)}>Unsuppress</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!suppressionQ.isLoading && (suppressionQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary">Suppression list is empty</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Campaign</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Project ID" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} fullWidth sx={{ mt: 1 }} placeholder="ObjectId of the project" />
          <TextField label="Campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Subject (defaults to name)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={() => {
              setCreateOpen(false);
              runAction(() => campaignsAPI.create({ projectId: form.projectId.trim(), name: form.name.trim(), subject: form.subject.trim() || undefined }), `Campaign ${form.name} created as draft`);
            }}
          >
            {busy ? <CircularProgress size={20} /> : 'Create draft'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={suppressOpen} onClose={() => setSuppressOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Suppress email</DialogTitle>
        <DialogContent>
          <TextField label="Email address" value={suppressEmail} onChange={(e) => setSuppressEmail(e.target.value)} fullWidth sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuppressOpen(false)}>Cancel</Button>
          <Button
            variant="contained" color="warning" disabled={busy}
            onClick={() => {
              setSuppressOpen(false);
              runAction(() => campaignsAPI.suppressions.suppress(suppressEmail.trim()), `Suppressed ${suppressEmail}`);
              setSuppressEmail('');
            }}
          >
            Suppress everywhere
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
