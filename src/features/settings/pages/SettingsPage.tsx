import React from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel, Alert } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon } from '@mui/icons-material';
import { settingsAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [settingOpen, setSettingOpen] = React.useState(false);
  const [flagOpen, setFlagOpen] = React.useState(false);
  const [settingForm, setSettingForm] = React.useState({ key: '', value: '' });
  const [flagForm, setFlagForm] = React.useState({ key: '', description: '', enabled: true, rollout: '100' });

  const settingsQ = useQuery({ queryKey: ['settings'], queryFn: () => settingsAPI.list().then((r) => r.data?.data?.settings ?? []) });
  const flagsQ = useQuery({ queryKey: ['flags'], queryFn: () => settingsAPI.listFlags().then((r) => r.data?.data?.flags ?? []) });

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['settings'] }),
    queryClient.invalidateQueries({ queryKey: ['flags'] }),
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

  const maintenanceOn = (settingsQ.data ?? []).some((s: any) => s.key === 'maintenance.enabled' && s.value === true);

  const parseValue = (raw: string): unknown => {
    const t = raw.trim();
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (t !== '' && !isNaN(Number(t))) return Number(t);
    try {
      return JSON.parse(t);
    } catch {
      return raw;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Platform Settings</Typography>
        <Typography variant="body1" color="text.secondary">
          Namespaced key-value settings, feature flags and maintenance mode
        </Typography>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Paper elevation={1} sx={{ p: 3, mb: 3, borderLeft: maintenanceOn ? 4 : 0, borderColor: 'warning.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>Maintenance mode</Typography>
            <Typography variant="body2" color="text.secondary">
              {maintenanceOn ? 'ACTIVE — tenant API traffic returns 503; auth and system routes stay open.' : 'Off. Tenant traffic flows normally.'}
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={maintenanceOn}
                color="warning"
                disabled={busy}
                onChange={(_, checked) => runAction(
                  () => settingsAPI.set('maintenance.enabled', checked),
                  checked ? 'Maintenance mode ENABLED' : 'Maintenance mode disabled'
                )}
              />
            }
            label={maintenanceOn ? 'On' : 'Off'}
          />
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Settings</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setSettingOpen(true)}>Set Value</Button>
        </Box>
        <TableContainer sx={{ maxHeight: 320 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(settingsQ.data ?? []).map((s: any) => (
                <TableRow key={s.key} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{s.key}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(s.value)?.slice(0, 120)}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => runAction(() => settingsAPI.remove(s.key), `Setting ${s.key} deleted (default applies)`)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!settingsQ.isLoading && (settingsQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={3} align="center"><Typography color="text.secondary">No overrides — all built-in defaults apply</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Allowed namespaces: smtp.*, storage.*, ratelimit.*, ai.*, maintenance.*, announcement.*, email.*
        </Typography>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Feature Flags</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setFlagOpen(true)}>New Flag</Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Enabled</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Rollout %</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Overrides</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(flagsQ.data ?? []).map((f: any) => (
                <TableRow key={f.key} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{f.key}</TableCell>
                  <TableCell>
                    <Switch
                      checked={!!f.enabled}
                      disabled={busy}
                      onChange={(_, checked) => runAction(() => settingsAPI.updateFlag(f.key, { enabled: checked }), `Flag ${f.key} ${checked ? 'enabled' : 'disabled'}`)}
                    />
                  </TableCell>
                  <TableCell align="right">{f.rolloutPercentage ?? 100}%</TableCell>
                  <TableCell>{f.tenantOverrides ? Object.keys(f.tenantOverrides).length : 0}</TableCell>
                  <TableCell align="right">
                    <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => runAction(() => settingsAPI.deleteFlag(f.key), `Flag ${f.key} deleted`)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!flagsQ.isLoading && (flagsQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">No flags defined</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={settingOpen} onClose={() => setSettingOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Platform Value</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Key (e.g. ai.defaultModel)" value={settingForm.key} onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })} fullWidth sx={{ mt: 1 }} />
          <TextField label="Value (JSON, number, boolean or text)" value={settingForm.value} onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })} fullWidth multiline rows={3} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingOpen(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy} startIcon={<SaveIcon />}
            onClick={() => {
              setSettingOpen(false);
              runAction(() => settingsAPI.set(settingForm.key.trim(), parseValue(settingForm.value)), `Setting ${settingForm.key} saved`);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={flagOpen} onClose={() => setFlagOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Feature Flag</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Key" value={flagForm.key} onChange={(e) => setFlagForm({ ...flagForm, key: e.target.value })} fullWidth sx={{ mt: 1 }} />
          <TextField label="Description" value={flagForm.description} onChange={(e) => setFlagForm({ ...flagForm, description: e.target.value })} fullWidth />
          <TextField label="Rollout %" type="number" value={flagForm.rollout} onChange={(e) => setFlagForm({ ...flagForm, rollout: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagOpen(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={() => {
              setFlagOpen(false);
              runAction(() => settingsAPI.createFlag({ key: flagForm.key.trim(), description: flagForm.description, enabled: true, rolloutPercentage: Number(flagForm.rollout) }), `Flag ${flagForm.key} created`);
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
