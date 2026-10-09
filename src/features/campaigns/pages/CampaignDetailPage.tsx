import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, Button, Paper, IconButton, Alert, CircularProgress } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Send as SendIcon, Schedule as ScheduleIcon, Pause as PauseIcon, PlayArrow as PlayIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { campaignsAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['email-campaign', id],
    queryFn: async (): Promise<any> => (await campaignsAPI.get(id!)).data?.data,
    enabled: !!id,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['email-campaign', id] });

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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.campaign) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Alert severity="error">Campaign not found</Alert>
      </Box>
    );
  }

  const campaign = data.campaign;
  const stats = campaign.stats ?? {};
  const derived = data.derived ?? {};
  const statusColor = campaign.status === 'sent' ? 'success' : campaign.status === 'sending' ? 'info' : campaign.status === 'paused' ? 'warning' : campaign.status === 'failed' ? 'error' : 'default';

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/campaigns')} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
            <Typography variant="h4" fontWeight={700}>{campaign.name}</Typography>
            <Chip label={campaign.status} size="small" variant="outlined" color={statusColor as any} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {campaign.subject} • project {campaign.projectId?.name || campaign.projectId}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {campaign.status === 'sending' && (
            <Button variant="outlined" size="small" startIcon={<PauseIcon fontSize="small" />} disabled={busy} onClick={() => runAction(() => campaignsAPI.pause(campaign._id), 'Campaign paused platform-wide')}>Pause</Button>
          )}
          {campaign.status === 'paused' && (
            <Button variant="outlined" size="small" startIcon={<PlayIcon fontSize="small" />} disabled={busy} onClick={() => runAction(() => campaignsAPI.resume(campaign._id), 'Campaign resumed')}>Resume</Button>
          )}
          {['sending', 'paused', 'scheduled'].includes(campaign.status) && (
            <Button variant="outlined" size="small" color="error" startIcon={<CancelIcon fontSize="small" />} disabled={busy} onClick={() => runAction(() => campaignsAPI.cancel(campaign._id), 'Campaign cancelled')}>Cancel</Button>
          )}
          {['draft', 'scheduled'].includes(campaign.status) && (
            <>
              <Button variant="outlined" size="small" startIcon={<ScheduleIcon fontSize="small" />} disabled={busy} onClick={() => runAction(() => campaignsAPI.schedule(campaign._id, new Date(Date.now() + 3600_000).toISOString()), 'Scheduled in 1 hour')}>Schedule +1h</Button>
              <Button variant="contained" size="small" startIcon={<SendIcon fontSize="small" />} disabled={busy} onClick={() => runAction(() => campaignsAPI.send(campaign._id), 'Campaign sending')}>Send Now</Button>
            </>
          )}
        </Box>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          ['Sent', stats.sent], ['Delivered', stats.delivered], ['Opened', stats.opened], ['Clicked', stats.clicked],
          ['Bounced', stats.bounced], ['Unsubscribed', stats.unsubscribed], ['Failed', stats.failed], ['Pending', derived.pending],
        ].map(([label, value]) => (
          <Grid item xs={6} sm={4} lg={3} key={label as string}>
            <Card><CardContent>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="h5" fontWeight={700}>{Number(value ?? 0).toLocaleString()}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Rates</Typography>
        <Grid container spacing={3}>
          {[
            ['Delivery rate', derived.deliveryRate], ['Open rate', derived.openRate],
            ['Click rate', derived.clickRate], ['Bounce rate', derived.bounceRate],
          ].map(([label, value]) => (
            <Grid item xs={6} sm={3} key={label as string}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="h6" fontWeight={700}>{value ?? 0}%</Typography>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">From</Typography>
          <Typography variant="body1">{campaign.fromName} &lt;{campaign.fromEmail || 'platform default'}&gt;</Typography>
          {campaign.scheduledFor && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Scheduled for</Typography>
              <Typography variant="body1">{new Date(campaign.scheduledFor).toLocaleString()}</Typography>
            </>
          )}
          {campaign.lastError && (
            <>
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>Last error</Typography>
              <Typography variant="body2">{campaign.lastError}</Typography>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
