import React from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, ContentCopy as CopyIcon, Delete as DeleteIcon, Visibility as RevealIcon, Refresh as RotateIcon } from '@mui/icons-material';
import { apiKeysAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const SERVICES = ['openai', 'anthropic', 'openrouter', 'gemini', 'sendgrid', 'aws', 'stripe', 'custom'];
const unwrap = (res: any): any[] => res.data?.data?.keys ?? [];

export const ApiKeysPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [serviceFilter, setServiceFilter] = React.useState('all');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [rotateOpen, setRotateOpen] = React.useState(false);
  const [revealOpen, setRevealOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<any>(null);
  const [rawValue, setRawValue] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', service: 'openai', keyValue: '', scopes: '', expiresAt: '' });
  const [rotateValue, setRotateValue] = React.useState('');

  const { data: keys = [], isLoading, error } = useQuery({
    queryKey: ['platform-keys', search, serviceFilter],
    queryFn: async (): Promise<any[]> =>
      unwrap(await apiKeysAPI.list({ search: search || undefined, service: serviceFilter !== 'all' ? serviceFilter : undefined })),
  });
  const expiringQ = useQuery({
    queryKey: ['keys-expiring'],
    queryFn: () => apiKeysAPI.expiring(30).then((r) => r.data?.data?.keys ?? []),
  });

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['platform-keys'] }),
    queryClient.invalidateQueries({ queryKey: ['keys-expiring'] }),
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

  const handleCreate = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await apiKeysAPI.create({
        name: form.name.trim(),
        service: form.service,
        keyValue: form.keyValue,
        scopes: form.scopes.split(',').map((s) => s.trim()).filter(Boolean),
        expiresAt: form.expiresAt || undefined,
      });
      setRawValue(res.data?.data?.rawValue || null);
      setCreateOpen(false);
      setForm({ name: '', service: 'openai', keyValue: '', scopes: '', expiresAt: '' });
      await refresh();
    } catch (err: any) {
      setNotice({ severity: 'error', text: err.response?.data?.error || err.message || 'Create failed' });
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ severity: 'success', text: 'Copied to clipboard' });
    } catch {
      setNotice({ severity: 'error', text: 'Copy failed — select the value manually' });
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>Platform API Keys</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>Store Key</Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Encrypted vault for third-party credentials. Values are masked — reveals and rotations are audit-logged.
        </Typography>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load keys.</Alert>}

      {(expiringQ.data ?? []).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {(expiringQ.data ?? []).length} key(s) expire within 30 days: {(expiringQ.data ?? []).map((k: any) => k.name).join(', ')}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <TextField
            placeholder="Search keys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="svc-filter">Service</InputLabel>
          <Select labelId="svc-filter" value={serviceFilter} label="Service" onChange={(e) => setServiceFilter(e.target.value)}>
            <MenuItem value="all">All</MenuItem>
            {SERVICES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Hint</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Scopes</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Expires</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} align="center">Loading…</TableCell></TableRow>
              ) : keys.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary">No keys stored</Typography></TableCell></TableRow>
              ) : keys.map((k: any) => (
                <TableRow key={k._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{k.name}</TableCell>
                  <TableCell><Chip label={k.service} size="small" variant="outlined" /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{k.keyHint}</TableCell>
                  <TableCell>{(k.scopes ?? []).map((s: string) => <Chip key={s} label={s} size="small" variant="outlined" sx={{ mr: 0.5 }} />)}</TableCell>
                  <TableCell>{k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : 'never'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<RevealIcon fontSize="small" />} onClick={() => { setSelected(k); setRevealed(null); setRevealOpen(true); }}>Reveal</Button>
                    <Button size="small" startIcon={<RotateIcon fontSize="small" />} onClick={() => { setSelected(k); setRotateValue(''); setRotateOpen(true); }}>Rotate</Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => runAction(() => apiKeysAPI.delete(k._id), `Key ${k.name} revoked`)}>Revoke</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Store Platform Key</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth sx={{ mt: 1 }} />
          <FormControl fullWidth>
            <InputLabel id="svc-label">Service</InputLabel>
            <Select labelId="svc-label" value={form.service} label="Service" onChange={(e) => setForm({ ...form, service: e.target.value })}>
              {SERVICES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Secret value" type="password" value={form.keyValue} onChange={(e) => setForm({ ...form, keyValue: e.target.value })} fullWidth helperText="Min 8 chars. Encrypted at rest." />
          <TextField label="Scopes (comma-separated)" value={form.scopes} onChange={(e) => setForm({ ...form, scopes: e.target.value })} fullWidth />
          <TextField label="Expires at (optional)" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={handleCreate}>{busy ? <CircularProgress size={20} /> : 'Store encrypted'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rawValue !== null} onClose={() => setRawValue(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Save this value now</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            This is the only time the raw value is shown. Afterwards only masked reads and audited reveals are possible.
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
            {rawValue}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CopyIcon fontSize="small" />} onClick={() => rawValue && copy(rawValue)}>Copy</Button>
          <Button variant="contained" onClick={() => setRawValue(null)}>Done</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={revealOpen} onClose={() => { setRevealOpen(false); setRevealed(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Reveal key value</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="warning.main" paragraph>
            This reveal is written to the audit log with your identity.
          </Typography>
          {revealed && (
            <Paper variant="outlined" sx={{ p: 2, fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {revealed}
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setRevealOpen(false); setRevealed(null); }}>Close</Button>
          {revealed
            ? <Button startIcon={<CopyIcon fontSize="small" />} onClick={() => copy(revealed)}>Copy</Button>
            : <Button
              variant="contained" color="warning" disabled={busy}
              onClick={() => runAction(() => apiKeysAPI.reveal(selected._id).then((r) => setRevealed(r.data?.data?.value)), 'Value revealed — logged to audit trail')}
            >
              Reveal
            </Button>}
        </DialogActions>
      </Dialog>

      <Dialog open={rotateOpen} onClose={() => setRotateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rotate key</DialogTitle>
        <DialogContent>
          <TextField label="New secret value" type="password" value={rotateValue} onChange={(e) => setRotateValue(e.target.value)} fullWidth sx={{ mt: 1 }} helperText="The old hint is retained for tracing." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRotateOpen(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={() => {
              setRotateOpen(false);
              if (selected) runAction(() => apiKeysAPI.rotate(selected._id, rotateValue), `Key ${selected.name} rotated`);
            }}
          >
            Rotate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
