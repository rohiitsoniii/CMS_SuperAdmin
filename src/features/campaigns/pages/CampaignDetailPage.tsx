import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Chip, Button, Paper, Divider, IconButton, Tabs, Tab } from '@mui/material';
import { ArrowBack as ArrowBackIcon, Edit as EditIcon, Send as SendIcon, Schedule as ScheduleIcon, Download as DownloadIcon, Analytics as AnalyticsIcon, Delete as DeleteIcon } from '@mui/icons-material';

export const CampaignDetailPage: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock campaign data
  const campaign = {
    id: campaignId ?? 'camp-001',
    name: 'Q4 Product Launch',
    type: 'One-time',
    status: 'Scheduled',
    audience: 'All Active Users',
    subject: 'Introducing Our New AI Features',
    fromName: 'CMS Platform Team',
    fromEmail: 'team@cms.example.com',
    scheduledAt: '2024-12-15T10:00:00Z',
    sentAt: null,
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      spam: 0,
    },
    content: {
      html: '<h1>Introducing Our New AI Features</h1><p>We\'re excited to announce...</p>',
      text: 'Introducing Our New AI Features\n\nWe\'re excited to announce...',
    },
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/campaigns')} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight={700}>{campaign.name}</Typography>
            <Chip
              label={campaign.type}
              size="small"
              variant="outlined"
              color={campaign.type === 'Automated' ? 'info' : 'default'}
            />
            <Chip
              label={campaign.status}
              size="small"
              variant="outlined"
              color={
                campaign.status === 'Sent' ? 'success' :
                campaign.status === 'Scheduled' ? 'info' :
                campaign.status === 'Draft' ? 'default' : 'warning'
              }
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button variant="outlined" startIcon={<EditIcon fontSize="small" />}>Edit</Button>
            <Button variant="outlined" startIcon={<SendIcon fontSize="small" />}>Send Test</Button>
            <Button variant="outlined" startIcon={<ScheduleIcon fontSize="small" />}>Reschedule</Button>
            <Button variant="contained" startIcon={<SendIcon fontSize="small" />}>Send Now</Button>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Sent</Typography>
              <Typography variant="h5" fontWeight={700}>{campaign.stats.sent.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Delivered</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">{campaign.stats.delivered.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Opened</Typography>
              <Typography variant="h5" fontWeight={700}>{campaign.stats.opened.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Clicked</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">{campaign.stats.clicked.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Open Rate</Typography>
              <Typography variant="h5" fontWeight={700}>{campaign.stats.sent > 0 ? ((campaign.stats.opened / campaign.stats.sent) * 100).toFixed(1) : 0}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Click Rate</Typography>
              <Typography variant="h5" fontWeight={700}>{campaign.stats.delivered > 0 ? ((campaign.stats.clicked / campaign.stats.delivered) * 100).toFixed(1) : 0}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Bounced</Typography>
              <Typography variant="h5" fontWeight={700} color="error.main">{campaign.stats.bounced.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Unsubscribed</Typography>
              <Typography variant="h5" fontWeight={700} color="warning.main">{campaign.stats.unsubscribed.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Details Tabs */}
      <Paper elevation={1}>
        <Tabs value={0} onChange={() => {}} sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }} variant="fullWidth">
          <Tab label="Overview" />
          <Tab label="Content" />
          <Tab label="Recipients" />
          <Tab label="Analytics" icon={<AnalyticsIcon />} />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Campaign Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Campaign Name</Typography>
                    <Typography variant="body1" fontWeight={500}>{campaign.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Type</Typography>
                    <Chip label={campaign.type} size="small" variant="outlined" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={campaign.status} size="small" variant="outlined" color={campaign.status === 'Sent' ? 'success' : campaign.status === 'Scheduled' ? 'info' : 'default'} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Subject Line</Typography>
                    <Typography variant="body1" fontWeight={500}>{campaign.subject}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">From Name</Typography>
                    <Typography variant="body1" fontWeight={500}>{campaign.fromName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">From Email</Typography>
                    <Typography variant="body1" fontFamily="monospace" sx={{ fontSize: '0.875rem' }}>{campaign.fromEmail}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Audience</Typography>
                    <Typography variant="body1" fontWeight={500}>{campaign.audience}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Scheduled For</Typography>
                    <Typography variant="body1" fontWeight={500}>{new Date(campaign.scheduledAt).toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Email Content Preview</Typography>
                <Paper variant="outlined" sx={{ p: 3, maxHeight: 400, overflow: 'auto' }}>
                  <div dangerouslySetInnerHTML={{ __html: campaign.content.html }} />
                </Paper>
              </Box>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper elevation={1} sx={{ p: 3, height: 'fit-content', position: 'sticky', top: 100 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Quick Actions</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button variant="contained" fullWidth startIcon={<SendIcon />}>Send Test Email</Button>
                  <Button variant="outlined" fullWidth startIcon={<ScheduleIcon />}>Reschedule</Button>
                  <Button variant="outlined" fullWidth startIcon={<DownloadIcon />}>Export Recipients</Button>
                  <Button variant="outlined" fullWidth color="error" startIcon={<DeleteIcon />}>Cancel Campaign</Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Schedule</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Scheduled for: {new Date(campaign.scheduledAt).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Timezone: UTC
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};