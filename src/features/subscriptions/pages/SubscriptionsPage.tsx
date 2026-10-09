import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Grid, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { subscriptionsAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const SubscriptionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [planDialog, setPlanDialog] = React.useState(false);
  const [couponDialog, setCouponDialog] = React.useState(false);
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [planForm, setPlanForm] = React.useState({ name: '', slug: '', description: '', monthly: '29', yearly: '290' });
  const [couponForm, setCouponForm] = React.useState({ code: '', discountType: 'percentage', value: '10' });

  const revenueQ = useQuery({ queryKey: ['revenue'], queryFn: () => subscriptionsAPI.revenue.get().then((r) => r.data?.data) });
  const churnQ = useQuery({ queryKey: ['churn'], queryFn: () => subscriptionsAPI.revenue.getChurn().then((r) => r.data?.data) });
  const funnelQ = useQuery({ queryKey: ['funnel'], queryFn: () => subscriptionsAPI.revenue.getTrialsFunnel().then((r) => r.data?.data) });
  const subsQ = useQuery({
    queryKey: ['subscriptions', statusFilter],
    queryFn: async (): Promise<any[]> =>
      (await subscriptionsAPI.subscriptions.list({ status: statusFilter !== 'all' ? statusFilter : undefined, limit: 50 })).data?.data?.subscriptions ?? [],
  });
  const plansQ = useQuery({ queryKey: ['plans'], queryFn: () => subscriptionsAPI.plans.list().then((r) => r.data?.data?.plans ?? []) });
  const couponsQ = useQuery({ queryKey: ['coupons'], queryFn: () => subscriptionsAPI.coupons.list().then((r) => r.data?.data?.coupons ?? []) });

  const refreshAll = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['revenue'] }),
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
    queryClient.invalidateQueries({ queryKey: ['plans'] }),
    queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  ]);

  const runAction = async (fn: () => Promise<unknown>, okText: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      await refreshAll();
      setNotice({ severity: 'success', text: okText });
    } catch (err: any) {
      setNotice({ severity: 'error', text: err.response?.data?.error || err.response?.data?.message || err.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const r = revenueQ.data;
  const cards = [
    { label: 'MRR', value: r ? `$${Number(r.mrr ?? 0).toLocaleString()}` : '—' },
    { label: 'ARR', value: r ? `$${Number(r.arr ?? 0).toLocaleString()}` : '—' },
    { label: `Collected (30d)`, value: r ? `$${Number(r.collected ?? 0).toLocaleString()}` : '—' },
    { label: 'Logo churn', value: churnQ.data ? `${(Number(churnQ.data.logoChurn ?? 0) * 100).toFixed(1)}%` : '—' },
    { label: 'Trial conversion', value: funnelQ.data ? `${(Number(funnelQ.data.conversionRate ?? 0) * 100).toFixed(1)}%` : '—' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Subscriptions & Revenue</Typography>
        <Typography variant="body1" color="text.secondary">
          Plans, live subscriptions, revenue, churn and trials — platform-wide
        </Typography>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} lg={2.4} key={c.label}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">{c.label}</Typography>
              <Typography variant="h4" fontWeight={700}>{revenueQ.isLoading ? '…' : c.value}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight={600}>Live Subscriptions</Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="sub-status">Status</InputLabel>
            <Select labelId="sub-status" value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              {['all', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <TableContainer sx={{ maxHeight: 380 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Cycle</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Period End</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(subsQ.data ?? []).map((s: any) => (
                <TableRow key={s._id} hover>
                  <TableCell>{s.tenantId?.name || s.tenantId?.slug || String(s.tenantId).slice(0, 8)}</TableCell>
                  <TableCell>{s.planId?.name || s.planId?.slug || '—'}</TableCell>
                  <TableCell>{s.billingCycle}</TableCell>
                  <TableCell><Chip label={s.status} size="small" variant="outlined" color={s.status === 'active' ? 'success' : s.status === 'canceled' ? 'default' : 'warning'} /></TableCell>
                  <TableCell>{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
              {!subsQ.isLoading && (subsQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">No subscriptions</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Plans</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setPlanDialog(true)}>Create Plan</Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Monthly</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Yearly</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Features</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(plansQ.data ?? []).map((p: any) => (
                <TableRow key={p._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{p.name} <Typography variant="caption" color="text.secondary">({p.slug})</Typography></TableCell>
                  <TableCell align="right">${p.price?.monthly}</TableCell>
                  <TableCell align="right">${p.price?.yearly}</TableCell>
                  <TableCell>{(p.features ?? []).slice(0, 3).join(', ')}</TableCell>
                  <TableCell><Chip label={p.isActive === false ? 'off' : 'on'} size="small" variant="outlined" color={p.isActive === false ? 'default' : 'success'} /></TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color={p.isActive === false ? 'success' : 'error'}
                      onClick={() => runAction(
                        () => (p.isActive === false
                          ? subscriptionsAPI.plans.update(p._id, { isActive: true })
                          : subscriptionsAPI.plans.delete(p._id)),
                        p.isActive === false ? `Plan ${p.name} reactivated` : `Plan ${p.name} deactivated/deleted`
                      )}
                    >
                      {p.isActive === false ? 'Activate' : 'Deactivate'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>Coupons</Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCouponDialog(true)}>Create Coupon</Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Value</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Used</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(couponsQ.data ?? []).map((c: any) => (
                <TableRow key={c._id} hover>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{c.code}</TableCell>
                  <TableCell>{c.discountType}</TableCell>
                  <TableCell align="right">{c.value}</TableCell>
                  <TableCell align="right">{c.usedCount ?? 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</TableCell>
                  <TableCell><Chip label={c.isActive === false ? 'off' : 'on'} size="small" variant="outlined" color={c.isActive === false ? 'default' : 'success'} /></TableCell>
                </TableRow>
              ))}
              {!couponsQ.isLoading && (couponsQ.data ?? []).length === 0 && (
                <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">No coupons</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={planDialog} onClose={() => setPlanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Plan</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Name" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} fullWidth sx={{ mt: 1 }} />
          <TextField label="Slug (lowercase-hyphens)" value={planForm.slug} onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })} fullWidth />
          <TextField label="Description" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} fullWidth multiline rows={2} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Monthly $" type="number" value={planForm.monthly} onChange={(e) => setPlanForm({ ...planForm, monthly: e.target.value })} fullWidth />
            <TextField label="Yearly $" type="number" value={planForm.yearly} onChange={(e) => setPlanForm({ ...planForm, yearly: e.target.value })} fullWidth />
          </Box>
          <Typography variant="caption" color="text.secondary">Stripe price IDs and limits default to safe values — edit the plan afterwards for full control. New plans start active.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanDialog(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={() => {
              setPlanDialog(false);
              runAction(() => subscriptionsAPI.plans.create({
                name: planForm.name.trim(),
                slug: planForm.slug.trim(),
                description: planForm.description || planForm.name,
                price: { monthly: Number(planForm.monthly), yearly: Number(planForm.yearly) },
                stripePriceId: { monthly: `price_${planForm.slug}_m`, yearly: `price_${planForm.slug}_y` },
                limits: { projects: 5, contentItems: 1000, teamMembers: 5, storage: 50, apiCallsPerMonth: 100000, apiRateLimit: 100 },
                features: [],
              }), `Plan ${planForm.name} created`);
            }}
          >
            {busy ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={couponDialog} onClose={() => setCouponDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Create Coupon</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Code" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} fullWidth sx={{ mt: 1 }} />
          <FormControl fullWidth>
            <InputLabel id="coupon-type">Discount type</InputLabel>
            <Select labelId="coupon-type" value={couponForm.discountType} label="Discount type" onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}>
              <MenuItem value="percentage">Percentage %</MenuItem>
              <MenuItem value="fixed">Fixed amount</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Value" type="number" value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCouponDialog(false)}>Cancel</Button>
          <Button
            variant="contained" disabled={busy}
            onClick={() => {
              setCouponDialog(false);
              runAction(() => subscriptionsAPI.coupons.create({ code: couponForm.code.trim(), discountType: couponForm.discountType, value: Number(couponForm.value) }), `Coupon ${couponForm.code} created`);
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
