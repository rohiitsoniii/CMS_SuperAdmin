import React from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, TextField, Grid, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { Reply as ReplyIcon } from '@mui/icons-material';
import { supportAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const SupportPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selected, setSelected] = React.useState<any>(null);
  const [reply, setReply] = React.useState('');
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const ticketsQ = useQuery({
    queryKey: ['support-queue', statusFilter],
    queryFn: async (): Promise<any[]> =>
      (await supportAPI.listTickets({ status: statusFilter !== 'all' ? statusFilter : undefined, limit: 50 })).data?.data?.tickets ?? [],
  });
  const slaQ = useQuery({
    queryKey: ['support-sla'],
    queryFn: () => supportAPI.getSla().then((r) => r.data?.data),
  });

  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['support-queue'] }),
    queryClient.invalidateQueries({ queryKey: ['support-sla'] }),
  ]);

  const runAction = async (fn: () => Promise<any>, okText: string, selectId?: string) => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fn();
      await refresh();
      const updated = res?.data?.data?.ticket;
      if (updated && (selectId === undefined || selectId === updated._id)) setSelected(updated);
      setNotice({ severity: 'success', text: okText });
    } catch (err: any) {
      setNotice({ severity: 'error', text: err.response?.data?.error || err.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  const sla = slaQ.data;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Support Inbox</Typography>
        <Typography variant="body1" color="text.secondary">
          Triage tickets across all tenants — assign, reply, resolve
        </Typography>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>Ticket Queue</Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="ticket-status">Status</InputLabel>
                <Select labelId="ticket-status" value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                  {['all', 'open', 'in_progress', 'waiting', 'resolved', 'closed'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TableContainer sx={{ maxHeight: 460 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ticketsQ.isLoading ? (
                    <TableRow><TableCell colSpan={5} align="center">Loading…</TableCell></TableRow>
                  ) : (ticketsQ.data ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">Queue is clear 🎉</Typography></TableCell></TableRow>
                  ) : (ticketsQ.data ?? []).map((t: any) => (
                    <TableRow key={t._id} hover selected={selected?._id === t._id} sx={{ cursor: 'pointer' }} onClick={() => { setSelected(t); setReply(''); }}>
                      <TableCell sx={{ fontWeight: 600 }}>{t.subject}</TableCell>
                      <TableCell>
                        <Chip label={t.priority} size="small" variant="outlined" color={t.priority === 'urgent' ? 'error' : t.priority === 'high' ? 'warning' : 'default'} />
                      </TableCell>
                      <TableCell>
                        <Chip label={t.status} size="small" variant="outlined" color={t.status === 'open' ? 'error' : ['resolved', 'closed'].includes(t.status) ? 'success' : 'info'} />
                      </TableCell>
                      <TableCell>{t.tenant?.name || t.tenant?.slug || '—'}</TableCell>
                      <TableCell>{t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={1} sx={{ p: 3, height: '100%' }}>
            {!selected ? (
              <Typography color="text.secondary">Select a ticket to triage and reply.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" fontWeight={600}>{selected.subject}</Typography>
                <Typography variant="body2" color="text.secondary">{selected.description}</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const).map((s) => (
                    <Chip
                      key={s} label={s} size="small" variant={selected.status === s ? 'filled' : 'outlined'}
                      color={selected.status === s ? 'primary' : 'default'}
                      clickable disabled={busy}
                      onClick={() => runAction(() => supportAPI.updateTicket(selected._id, { status: s }), `Status → ${s}`, selected._id)}
                    />
                  ))}
                </Box>
                <TextField label="Staff reply" value={reply} onChange={(e) => setReply(e.target.value)} multiline rows={4} fullWidth />
                <Button
                  variant="contained" size="small" startIcon={<ReplyIcon fontSize="small" />} disabled={busy || !reply.trim()}
                  onClick={() => runAction(
                    () => supportAPI.replyTicket(selected._id, reply.trim()).then(() => setReply('')),
                    'Reply posted (moves open → in progress)'
                  , selected._id)}
                >
                  {busy ? <CircularProgress size={20} /> : 'Post reply'}
                </Button>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Thread</Typography>
                  {(selected.messages ?? []).slice(-6).map((m: any, i: number) => (
                    <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: m.isStaff ? 'primary.light' : 'background.default' }}>
                      <Typography variant="caption" color="text.secondary">{m.isStaff ? 'staff' : 'customer'} • {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</Typography>
                      <Typography variant="body2">{m.message}</Typography>
                    </Paper>
                  ))}
                  {(selected.messages ?? []).length === 0 && <Typography variant="body2" color="text.secondary">No messages yet.</Typography>}
                </Box>
              </Box>
            )}
          </Paper>
          <Card sx={{ mt: 3 }}><CardContent>
            <Typography variant="body2" color="text.secondary">SLA (30d)</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Tickets</Typography>
                <Typography variant="body2" fontWeight={600}>{sla?.ticketCount ?? '…'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Avg first response</Typography>
                <Typography variant="body2" fontWeight={600}>{sla?.avgFirstResponseHours ?? '—'} h</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Avg resolution</Typography>
                <Typography variant="body2" fontWeight={600}>{sla?.avgResolutionHours ?? '—'} h</Typography>
              </Box>
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};
