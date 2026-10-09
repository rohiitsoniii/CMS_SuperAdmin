import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, Button, Tabs, Tab, Paper, Avatar, Divider, IconButton, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Delete as DeleteIcon, CreditCard as CreditCardIcon, Storage as StorageIcon, People as PeopleIcon, History as HistoryIcon, PauseCircle as PauseIcon, PlayCircle as PlayIcon, PersonSearch as ImpersonateIcon, Refresh as QuotaIcon } from '@mui/icons-material';
import { tenantsAPI, usersAPI, auditLogsAPI } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/hooks/useAuthStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const fmtGB = (bytes: number) => `${(Number(bytes || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`;

export const TenantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const beginImpersonation = useAuthStore((s) => s.beginImpersonation);
  const [tab, setTab] = useState(0);
  const [notice, setNotice] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const detailQ = useQuery({
    queryKey: ['tenant', id],
    queryFn: async (): Promise<any> => (await tenantsAPI.get(id!)).data?.data,
    enabled: !!id,
  });
  const teamQ = useQuery({
    queryKey: ['tenant-users', id],
    queryFn: async (): Promise<any[]> => (await usersAPI.list({ tenantId: id, limit: 50 })).data?.data?.users ?? [],
    enabled: !!id && tab === 3,
  });
  const auditQ = useQuery({
    queryKey: ['tenant-audit', id],
    queryFn: async (): Promise<any[]> => (await auditLogsAPI.list({ tenantId: id, limit: 20 })).data?.data?.logs ?? [],
    enabled: !!id && tab === 4,
  });

  const tenant = detailQ.data?.tenant;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['tenant', id] });

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

  if (detailQ.isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (detailQ.error || !tenant) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Alert severity="error">Tenant not found</Alert>
      </Box>
    );
  }

  const suspended = tenant.isActive === false;
  const subscription = detailQ.data?.subscription;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/tenants')} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', variant: 'rounded' }}>
              {tenant.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                {tenant.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {tenant.slug} • {tenant._id}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Chip label={tenant.subscription?.plan || 'Free'} size="small" color={tenant.subscription?.plan === 'enterprise' ? 'primary' : 'default'} variant="outlined" />
            <Chip label={suspended ? 'suspended' : 'active'} size="small" variant="outlined" color={suspended ? 'error' : 'success'} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={suspended ? <PlayIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
            disabled={busy}
            onClick={() => runAction(
              () => (suspended ? tenantsAPI.activate(tenant._id) : tenantsAPI.suspend(tenant._id, 'Suspended from console')),
              suspended ? 'Tenant activated' : 'Tenant suspended — all its sessions revoked'
            )}
          >
            {suspended ? 'Activate' : 'Suspend'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ImpersonateIcon fontSize="small" />}
            disabled={busy}
            onClick={() => runAction(() => beginImpersonation(tenant._id), `Impersonating ${tenant.name} (15 min) — banner is active`)}
          >
            Impersonate
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<QuotaIcon fontSize="small" />}
            disabled={busy}
            onClick={() => runAction(() => tenantsAPI.resetQuota(tenant._id), 'API quota reset')}
          >
            Reset quota
          </Button>
          <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </Box>
      </Box>

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Users', value: String(detailQ.data?.userCount ?? 0) },
          { label: 'Projects', value: String(detailQ.data?.projectCount ?? 0) },
          { label: 'Content items', value: String(detailQ.data?.contentCount ?? 0) },
          { label: 'Storage Used', value: fmtGB(tenant.usage?.storageUsed) },
          { label: 'API Calls (month)', value: Number(tenant.usage?.apiCalls ?? 0).toLocaleString() },
        ].map((s) => (
          <Grid item xs={12} sm={6} lg={2.4} key={s.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={1}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }} variant="fullWidth">
          <Tab label="Overview" icon={<HistoryIcon />} />
          <Tab label="Subscription" icon={<CreditCardIcon />} />
          <Tab label="Usage" icon={<StorageIcon />} />
          <Tab label="Team" icon={<PeopleIcon />} />
          <Tab label="Audit Logs" icon={<HistoryIcon />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <Grid container spacing={2}>
              {[
                ['Name', tenant.name], ['Slug', tenant.slug], ['Email', tenant.email],
                ['Status', suspended ? 'suspended' : 'active'],
                ['Plan', tenant.subscription?.plan], ['Billing cycle', tenant.subscription?.billingCycle],
                ['Created', tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '—'],
                ['Last login', tenant.lastLoginAt ? new Date(tenant.lastLoginAt).toLocaleString() : '—'],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} key={label}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body1" fontWeight={500}>{String(value ?? '—')}</Typography>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" color="text.secondary">Custom limits</Typography>
                <Typography variant="body1" fontFamily="monospace" sx={{ fontSize: '0.8rem' }}>
                  {JSON.stringify(tenant.subscription?.customLimits ?? {}, null, 1)}
                </Typography>
              </Grid>
            </Grid>
          )}
          {tab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Subscription Details</Typography>
                <Button variant="outlined" size="small" onClick={() => { setPlan(subscription?.planId?.slug || tenant.subscription?.plan || 'pro'); setPlanOpen(true); }}>
                  Change plan
                </Button>
              </Box>
              <Grid container spacing={3}>
                {[
                  ['Current Plan', subscription?.planId?.name || tenant.subscription?.plan],
                  ['Billing Cycle', subscription?.billingCycle || tenant.subscription?.billingCycle],
                  ['Status', subscription?.status || (tenant.subscription?.isActive ? 'active' : 'inactive')],
                  ['Period End', subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Card><CardContent>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="h6" fontWeight={700}>{String(value ?? '—')}</Typography>
                    </CardContent></Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          {tab === 2 && (
            <Grid container spacing={3}>
              {[
                ['API calls (month)', Number(tenant.usage?.apiCalls ?? 0).toLocaleString()],
                ['Storage used', fmtGB(tenant.usage?.storageUsed)],
                ['AI tokens override', tenant.subscription?.customLimits?.aiTokensPerMonth != null ? Number(tenant.subscription.customLimits.aiTokensPerMonth).toLocaleString() : 'plan default'],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={4} key={label}>
                  <Card><CardContent>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    <Typography variant="h6" fontWeight={700}>{value}</Typography>
                  </CardContent></Card>
                </Grid>
              ))}
            </Grid>
          )}
          {tab === 3 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Super-admin</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(teamQ.data ?? []).map((u: any) => (
                    <TableRow key={u._id} hover>
                      <TableCell>{u.firstName} {u.lastName} ({u.email})</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>{u.isSuperAdmin ? 'yes' : 'no'}</TableCell>
                      <TableCell>{u.isActive === false ? 'no' : 'yes'}</TableCell>
                    </TableRow>
                  ))}
                  {!teamQ.isLoading && (teamQ.data ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={4} align="center"><Typography color="text.secondary">No users</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {tab === 4 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actor</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Resource</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(auditQ.data ?? []).map((l: any) => (
                    <TableRow key={l._id} hover>
                      <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{l.action}</TableCell>
                      <TableCell>{l.actor?.email || l.actor?.name}</TableCell>
                      <TableCell>{l.resource?.type}:{String(l.resource?.id).slice(0, 8)}</TableCell>
                      <TableCell>
                        <Chip label={l.status} size="small" color={l.status === 'success' ? 'success' : 'error'} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!auditQ.isLoading && (auditQ.data ?? []).length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">No audit entries</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      <Dialog open={planOpen} onClose={() => setPlanOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change plan</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="plan-label">Plan</InputLabel>
            <Select labelId="plan-label" value={plan} label="Plan" onChange={(e) => setPlan(e.target.value)}>
              {['free', 'basic', 'pro', 'enterprise'].map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="cycle-label">Billing cycle</InputLabel>
            <Select labelId="cycle-label" value={billingCycle} label="Billing cycle" onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'yearly')}>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => {
              setPlanOpen(false);
              runAction(() => tenantsAPI.updatePlan(tenant._id, { plan, billingCycle }), `Plan changed to ${plan} (${billingCycle})`);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete tenant</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Permanently delete <strong>{tenant.name}</strong> and all its data?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Projects, content, media, webhooks, users and subscriptions are removed. Invoices and error logs are retained.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={busy}
            onClick={() => runAction(() => tenantsAPI.delete(tenant._id).then(() => navigate('/tenants')), 'Tenant deleted')}
          >
            {busy ? <CircularProgress size={20} /> : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
