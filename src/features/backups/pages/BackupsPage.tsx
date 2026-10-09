import React from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Grid, Card, CardContent } from '@mui/material';
import { Verified as VerifyIcon, Restore as RestoreIcon, Delete as CleanupIcon } from '@mui/icons-material';
import { opsAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const fmtBytes = (b: number) => {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${Number(b || 0).toLocaleString()} B`;
};

export const BackupsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [tenantFilter, setTenantFilter] = React.useState('');
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [verifyName, setVerifyName] = React.useState('');
  const [verifyResult, setVerifyResult] = React.useState<any>(null);
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [restoreFile, setRestoreFile] = React.useState('');
  const [restoreTenant, setRestoreTenant] = React.useState('');
  const [cleanupOpen, setCleanupOpen] = React.useState(false);
  const [cleanupDays, setCleanupDays] = React.useState('30');
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const backupsQ = useQuery({
    queryKey: ['sys-backups', tenantFilter],
    queryFn: async (): Promise<any[]> =>
      (await opsAPI.listBackups({ tenantId: tenantFilter || undefined })).data?.data?.backups ?? [],
  });
  const storageQ = useQuery({ queryKey: ['sys-storage'], queryFn: () => opsAPI.getStorage(10).then((r) => r.data?.data) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['sys-backups'] });

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

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Backups & Storage</Typography>
        <Typography variant="body1" color="text.secondary">
          Verify, restore and prune backups across tenants; media storage accounting
        </Typography>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Media Total</Typography>
            <Typography variant="h4" fontWeight={700}>{storageQ.data ? fmtBytes(storageQ.data.totalBytes) : '…'}</Typography>
            <Typography variant="body2" color="text.secondary">{storageQ.data ? Number(storageQ.data.totalFiles ?? 0).toLocaleString() : '—'} files</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Backup Files</Typography>
            <Typography variant="h4" fontWeight={700}>{backupsQ.data ? backupsQ.data.length : '…'}</Typography>
            <Typography variant="body2" color="text.secondary">across all tenants</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Top Tenant by Media</Typography>
            <Typography variant="h6" fontWeight={700}>{storageQ.data?.byTenant?.[0]?.tenantName || storageQ.data?.byTenant?.[0]?.tenantId?.slice?.(0, 8) || '—'}</Typography>
            <Typography variant="body2" color="text.secondary">{storageQ.data?.byTenant?.[0] ? fmtBytes(storageQ.data.byTenant[0].bytes) : ''}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>Backup Files</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField label="Tenant ID filter" size="small" value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)} sx={{ width: 260 }} />
            <Button variant="outlined" size="small" startIcon={<VerifyIcon fontSize="small" />} onClick={() => { setVerifyResult(null); setVerifyOpen(true); }}>Verify file</Button>
            <Button variant="outlined" size="small" startIcon={<RestoreIcon fontSize="small" />} onClick={() => setRestoreOpen(true)}>Restore for tenant</Button>
            <Button variant="outlined" size="small" color="warning" startIcon={<CleanupIcon fontSize="small" />} onClick={() => setCleanupOpen(true)}>Retention cleanup</Button>
          </Box>
        </Box>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Filename</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Size</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(backupsQ.data ?? []).map((b: any) => (
                <TableRow key={b.filename} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{b.filename}</TableCell>
                  <TableCell><Chip label={b.type} size="small" variant="outlined" /></TableCell>
                  <TableCell align="right">{fmtBytes(b.size)}</TableCell>
                  <TableCell>{b.created ? new Date(b.created).toLocaleString() : '—'}</TableCell>
                </TableRow>
              ))}
              {!backupsQ.isLoading && (backupsQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary">No backups found</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={verifyOpen} onClose={() => setVerifyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Verify Backup File</DialogTitle>
        <DialogContent>
          <TextField label="Filename" value={verifyName} onChange={(e) => setVerifyName(e.target.value)} fullWidth sx={{ mt: 1 }} placeholder="backup-<tenant>-<ts>.json" />
          {verifyResult && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={verifyResult.valid ? 'success' : 'warning'} sx={{ mb: 1 }}>
                {verifyResult.valid ? 'Backup is valid' : 'Backup has warnings'}
              </Alert>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify({ tenantId: verifyResult.tenantId, type: verifyResult.type, counts: verifyResult.counts, warnings: verifyResult.warnings }, null, 1)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyOpen(false)}>Close</Button>
          <Button
            variant="contained" disabled={busy || !verifyName}
            onClick={() => runAction(() => opsAPI.verifyBackup(verifyName.trim()).then((r) => setVerifyResult(r.data?.data)), 'Verification complete')}
          >
            {busy ? <CircularProgress size={20} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={restoreOpen} onClose={() => setRestoreOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore Backup Into Tenant</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Restores into the backup's own tenant (for locked-out workspaces). Cross-tenant restores are refused by the API.
          </Typography>
          <TextField label="Filename" value={restoreFile} onChange={(e) => setRestoreFile(e.target.value)} fullWidth sx={{ mt: 1 }} />
          <TextField label="Target Tenant ID" value={restoreTenant} onChange={(e) => setRestoreTenant(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreOpen(false)}>Cancel</Button>
          <Button
            variant="contained" color="warning" disabled={busy}
            onClick={() => {
              setRestoreOpen(false);
              runAction(() => opsAPI.restoreBackupFor(restoreFile.trim(), restoreTenant.trim()), `Backup restored into tenant`);
            }}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cleanupOpen} onClose={() => setCleanupOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Retention Cleanup</DialogTitle>
        <DialogContent>
          <TextField label="Keep last N days" type="number" value={cleanupDays} onChange={(e) => setCleanupDays(e.target.value)} fullWidth sx={{ mt: 1 }} helperText="Deletes backup files older than N days (1–3650)" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupOpen(false)}>Cancel</Button>
          <Button
            variant="contained" color="warning" disabled={busy}
            onClick={() => {
              setCleanupOpen(false);
              runAction(() => opsAPI.cleanupBackups({ daysToKeep: Number(cleanupDays) }), 'Retention cleanup completed');
            }}
          >
            Run cleanup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
