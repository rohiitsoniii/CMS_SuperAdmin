import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, IconButton, Menu, Tooltip } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Send as SendIcon, Schedule as ScheduleIcon, MoreVert as MoreVertIcon, Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon, FileDownload as DownloadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const mockCampaigns = [
  { id: 'camp-001', name: 'Q4 Product Launch', type: 'One-time', audience: 'All Active Users', status: 'Scheduled', sent: 0, openRate: 0, clickRate: 0, scheduledAt: '2024-12-15T10:00:00Z' },
  { id: 'camp-002', name: 'Welcome Series', type: 'Automated', audience: 'New Signups', status: 'Active', sent: 12400, openRate: 42.3, clickRate: 8.7, scheduledAt: null },
  { id: 'camp-003', name: 'Holiday Promo', type: 'One-time', audience: 'Pro Plan', status: 'Draft', sent: 0, openRate: 0, clickRate: 0, scheduledAt: null },
  { id: 'camp-004', name: 'Churn Win-back', type: 'Automated', audience: 'Inactive 30d', status: 'Paused', sent: 3210, openRate: 28.1, clickRate: 4.2, scheduledAt: null },
];

export const CampaignsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = mockCampaigns.filter((c) => {
    if (statusFilter !== 'all' && c.status.toLowerCase() !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openMenu = (e: React.MouseEvent<HTMLElement>, id: string) => {
    setAnchorEl(e.currentTarget);
    setSelectedId(id);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>Email Campaigns</Typography>
          <Button variant="contained" startIcon={<AddIcon />}>Create Campaign</Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Create, schedule, and track marketing email campaigns
        </Typography>
      </Box>

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
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="scheduled">Scheduled</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />}>Export</Button>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Audience</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Sent</TableCell>
                <TableCell align="right">Open %</TableCell>
                <TableCell align="right">Click %</TableCell>
                <TableCell>Scheduled</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/campaigns/${c.id}`)}>
                  <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                  <TableCell><Chip label={c.type} size="small" variant="outlined" /></TableCell>
                  <TableCell>{c.audience}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      size="small"
                      variant="outlined"
                      color={c.status === 'Active' ? 'success' : c.status === 'Scheduled' ? 'info' : c.status === 'Paused' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{c.sent.toLocaleString()}</TableCell>
                  <TableCell align="right">{c.openRate}%</TableCell>
                  <TableCell align="right">{c.clickRate}%</TableCell>
                  <TableCell>{c.scheduledAt ? new Date(c.scheduledAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Send test">
                      <IconButton size="small" aria-label="Send test"><SendIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Schedule">
                      <IconButton size="small" aria-label="Schedule"><ScheduleIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <IconButton size="small" aria-label="More actions" onClick={(e) => openMenu(e, c.id)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={() => { if (selectedId) navigate(`/campaigns/${selectedId}`); closeMenu(); }}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1.5 }} /> View report
        </MenuItem>
        <MenuItem onClick={closeMenu}>
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Edit
        </MenuItem>
        <MenuItem onClick={closeMenu} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};
