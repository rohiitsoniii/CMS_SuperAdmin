import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PlayArrow as TickIcon, Replay as ReplayIcon } from '@mui/icons-material';
import { workersAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const WORKERS = ['email-campaigns', 'webhook-retry', 'scheduled-publish', 'billing-housekeeping'] as const;

export const QueuesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [jobId, setJobId] = React.useState('');
  const [jobResult, setJobResult] = React.useState<any>(null);
  const [replayOpen, setReplayOpen] = React.useState(false);
  const [replayLimit, setReplayLimit] = React.useState('200');

  const queuesQ = useQuery({ queryKey: ['queues'], queryFn: () => workersAPI.getQueues().then((r) => r.data?.data), refetchInterval: 15000 });

  const runAction = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ['queues'] });
      setNotice({ severity: 'success', text: okText });
    } catch (err: any) {
      setNotice({ severity: 'error', text: err.response?.data?.error || err.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const q = queuesQ.data;
  const tr = q?.translation ?? {};

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Queues & Workers</Typography>
        <Typography variant="body1" color="text.secondary">
          Depths, manual ticks, dead-letter replay and translation jobs
        </Typography>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Email: scheduled / sending</Typography>
            <Typography variant="h4" fontWeight={700}>{q ? `${q.email?.scheduled ?? 0} / ${q.email?.sending ?? 0}` : '…'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Webhooks: pending / dead-letter</Typography>
            <Typography variant="h4" fontWeight={700}>{q ? `${q.webhooks?.pendingOrRetrying ?? 0} / ${q.webhooks?.deadLetter ?? 0}` : '…'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Translation queue</Typography>
            <Typography variant="h4" fontWeight={700}>{tr.status === 'ok' ? `${(tr.waiting ?? 0) + (tr.active ?? 0)} open` : tr.status || '…'}</Typography>
            <Typography variant="body2" color="text.secondary">{tr.status === 'ok' ? `failed: ${tr.failed ?? 0}` : 'Redis unreachable'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Oldest webhook retry due</Typography>
            <Typography variant="h6" fontWeight={700}>{q?.webhooks?.oldestNextRetryAt ? new Date(q.webhooks.oldestNextRetryAt).toLocaleString() : 'none due'}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Workers</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Worker</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Schedule</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Enabled</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(q?.workers ?? WORKERS.map((name) => ({ name }))).map((w: any) => (
                <TableRow key={w.name} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{w.name}</TableCell>
                  <TableCell>{w.description || '—'}</TableCell>
                  <TableCell>{w.schedule || '—'}</TableCell>
                  <TableCell>
                    <Chip label={w.enabled === false ? 'off' : 'on'} size="small" variant="outlined" color={w.enabled === false ? 'default' : 'success'} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<TickIcon fontSize="small" />} disabled={busy} onClick={() => runAction(() => workersAPI.tickWorker(w.name), `Worker ${w.name} tick completed`)}>Run tick</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>Dead-lettered Webhooks</Typography>
            <Typography variant="body2" color="text.secondary">
              {q ? `${q.webhooks?.deadLetter ?? 0} deliveries exhausted all retries` : '…'}
            </Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<ReplayIcon fontSize="small" />} disabled={busy || (q?.webhooks?.deadLetter ?? 0) === 0} onClick={() => setReplayOpen(true)}>
            Replay dead letters
          </Button>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Translation Job Inspector</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
          <TextField label="Job ID" size="small" value={jobId} onChange={(e) => setJobId(e.target.value)} sx={{ width: 320 }} />
          <Button
            variant="outlined" size="small" disabled={busy || !jobId}
            onClick={() => runAction(() => workersAPI.getTranslationJob(jobId.trim()).then((r) => setJobResult(r.data?.data?.job)), 'Job loaded')}
          >
            Inspect
          </Button>
          <Button
            variant="outlined" size="small" disabled={busy || !jobId}
            onClick={() => runAction(() => workersAPI.retryTranslationJob(jobId.trim()), 'Job requeued')}
          >
            Retry
          </Button>
          <Button
            variant="outlined" size="small" color="error" disabled={busy || !jobId}
            onClick={() => runAction(() => workersAPI.cancelTranslationJob(jobId.trim()).then(() => setJobResult(null)), 'Job removed')}
          >
            Cancel
          </Button>
        </Box>
        {jobResult && (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(jobResult, null, 1)}
          </Typography>
        )}
      </Paper>

      <Dialog open={replayOpen} onClose={() => setReplayOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Replay dead letters</DialogTitle>
        <DialogContent>
          <TextField label="Max to requeue (1–1000)" type="number" value={replayLimit} onChange={(e) => setReplayLimit(e.target.value)} fullWidth sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplayOpen(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={() => {
              setReplayOpen(false);
              runAction(() => workersAPI.replayDeadWebhooks({ limit: Number(replayLimit) }), 'Dead letters requeued');
            }}
          >
            {busy ? <CircularProgress size={20} /> : 'Replay'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
