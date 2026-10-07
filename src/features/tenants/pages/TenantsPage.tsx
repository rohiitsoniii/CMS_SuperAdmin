import React, { useState } from 'react';
import { Box, Typography, Button, TextField, InputAdornment, IconButton, Menu, MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Select, MenuItem as SelectMenuItem } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Add as AddIcon, Search as SearchIcon, FilterList as FilterListIcon, MoreVert as MoreVertIcon, Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon, PauseCircle as PauseCircleIcon, PlayCircle as PlayCircleIcon, Download as DownloadIcon } from '@mui/icons-material';
import { tenantsAPI } from '../../../shared/api/client';
import { useQuery } from '@tanstack/react-query';

export const TenantsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants', search, statusFilter, planFilter],
    queryFn: async (): Promise<any[]> =>
      (await tenantsAPI.list({ search, status: statusFilter !== 'all' ? statusFilter : undefined })).data,
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tenant: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedTenant(tenant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTenant(null);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    // await tenantsAPI.delete(selectedTenant.id);
    setDeleteDialogOpen(false);
    handleMenuClose();
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'slug', headerName: 'Slug', width: 180 },
    { field: 'plan', headerName: 'Plan', width: 140 },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as string;
        return (
          <Chip
            label={status}
            size="small"
            variant="outlined"
            color={
              status === 'active' ? 'success' :
              status === 'suspended' ? 'error' :
              status === 'pending' ? 'warning' : 'default'
            }
          />
        );
      },
    },
    { field: 'users', headerName: 'Users', width: 90, type: 'number' },
    { field: 'revenue', headerName: 'MRR', width: 120, type: 'number', valueFormatter: (v: any) => `$${Number(v ?? 0).toLocaleString()}` },
    { field: 'storage', headerName: 'Storage', width: 120, valueFormatter: (v: any) => `${(Number(v ?? 0) / 1024 / 1024).toFixed(1)} GB` },
    { field: 'lastActive', headerName: 'Last Active', width: 150, valueFormatter: (v: any) => (v ? new Date(v).toLocaleDateString() : '—') },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" aria-label="View" onClick={() => { window.location.href = `/tenants/${params.row.id}`; }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="Edit">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" aria-label="More" onClick={(e) => handleMenuOpen(e, params.row)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          Tenants
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage platform tenants and their subscriptions
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <TextField
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <SelectMenuItem value="all">All Status</SelectMenuItem>
            <SelectMenuItem value="active">Active</SelectMenuItem>
            <SelectMenuItem value="suspended">Suspended</SelectMenuItem>
            <SelectMenuItem value="pending">Pending</SelectMenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <SelectMenuItem value="all">All Plans</SelectMenuItem>
            <SelectMenuItem value="free">Free</SelectMenuItem>
            <SelectMenuItem value="pro">Pro</SelectMenuItem>
            <SelectMenuItem value="enterprise">Enterprise</SelectMenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { console.log('Create tenant'); }}>
          Add Tenant
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        {selectedRows.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" startIcon={<PauseCircleIcon fontSize="small" />}>
              Suspend ({selectedRows.length})
            </Button>
            <Button variant="outlined" size="small" startIcon={<PlayCircleIcon fontSize="small" />}>
              Activate ({selectedRows.length})
            </Button>
            <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon fontSize="small" />}>
              Delete ({selectedRows.length})
            </Button>
            <Button variant="outlined" size="small" startIcon={<DownloadIcon fontSize="small" />}>
              Export
            </Button>
          </Box>
        )}
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<FilterListIcon fontSize="small" />}>
          Filters
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />}>
          Export CSV
        </Button>
      </Box>

      <Box sx={{ height: 600, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={tenants}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 20, page: 0 } } }}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection
          onRowSelectionModelChange={(m) => setSelectedRows(m as string[])}
          rowSelectionModel={selectedRows}
          disableRowSelectionOnClick
          loading={!tenants}
        />
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => { setAnchorEl(null); setSelectedTenant(null); }}
      >
        <MenuItem onClick={() => { handleMenuClose(); window.location.href = `/tenants/${selectedTenant?.id}`; }}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1.5 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); console.log('Edit', selectedTenant); }}>
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); console.log('Suspend', selectedTenant); }}>
          <PauseCircleIcon fontSize="small" sx={{ mr: 1.5 }} /> Suspend
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Tenant</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedTenant?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
