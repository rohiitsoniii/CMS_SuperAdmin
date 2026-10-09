import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, InputAdornment, IconButton, Menu, MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, Select, MenuItem as SelectMenuItem, Alert, CircularProgress } from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Search as SearchIcon, MoreVert as MoreVertIcon, Visibility as VisibilityIcon, Delete as DeleteIcon, PauseCircle as PauseCircleIcon, PlayCircle as PlayCircleIcon, Download as DownloadIcon, PersonSearch as ImpersonateIcon } from '@mui/icons-material';
import { tenantsAPI } from '../../../shared/api/client';
import { useAuthStore } from '../../../shared/hooks/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const unwrap = (res: any): any[] => res.data?.data?.tenants ?? [];

export const TenantsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const beginImpersonation = useAuthStore((s) => s.beginImpersonation);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notice, setNotice] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: tenants = [], isLoading, error } = useQuery({
    queryKey: ['tenants', search, statusFilter, planFilter],
    queryFn: async (): Promise<any[]> =>
      unwrap(await tenantsAPI.list({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        plan: planFilter !== 'all' ? planFilter : undefined,
      })),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['tenants'] });

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

  const suspendMutation = useMutation({
    mutationFn: (id: string) => tenantsAPI.suspend(id, 'Suspended from super-admin console'),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsAPI.delete(id),
    onSuccess: refresh,
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, tenant: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedTenant(tenant);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTenant(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTenant) return;
    setDeleteDialogOpen(false);
    await runAction(() => deleteMutation.mutateAsync(selectedTenant._id), `Tenant ${selectedTenant.name} deleted`);
    handleMenuClose();
  };

  const handleImpersonate = async (tenant: any) => {
    handleMenuClose();
    await runAction(async () => {
      await beginImpersonation(tenant._id);
    }, `Impersonating ${tenant.name} — banner is active at the top`);
  };

  const handleBulk = async (action: 'suspend' | 'activate') => {
    await runAction(async () => {
      await Promise.all(selectedRows.map((id) => (action === 'suspend' ? tenantsAPI.suspend(id) : tenantsAPI.activate(id))));
      setSelectedRows([]);
    }, `${selectedRows.length} tenant(s) ${action === 'suspend' ? 'suspended' : 'activated'}`);
  };

  const handleExportCsv = () => {
    const rows = tenants.map((t: any) => [t._id, t.name, t.slug, t.subscription?.plan ?? '', t.isActive === false ? 'suspended' : 'active', t.userCount ?? 0]);
    const csv = ['id,name,slug,plan,status,users', ...rows.map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenants.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 220, flex: 1 },
    { field: 'slug', headerName: 'Slug', width: 180 },
    {
      field: 'plan', headerName: 'Plan', width: 130,
      valueGetter: (params: any) => params.row.subscription?.plan || 'free',
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const suspended = params.row.isActive === false;
        return <Chip label={suspended ? 'suspended' : 'active'} size="small" variant="outlined" color={suspended ? 'error' : 'success'} />;
      },
    },
    { field: 'userCount', headerName: 'Users', width: 90, type: 'number' },
    {
      field: 'storage', headerName: 'Storage', width: 120,
      valueGetter: (params: any) => params.row.usage?.storageUsed ?? 0,
      valueFormatter: (v: any) => `${(Number(v ?? 0) / 1024 / 1024 / 1024).toFixed(2)} GB`,
    },
    {
      field: 'lastActive', headerName: 'Last Active', width: 150,
      valueGetter: (params: any) => params.row.lastLoginAt,
      valueFormatter: (v: any) => (v ? new Date(v).toLocaleDateString() : '—'),
    },
    {
      field: 'actions', headerName: 'Actions', width: 140, sortable: false, filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" aria-label="View" onClick={() => navigate(`/tenants/${params.row._id}`)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={params.row.isActive === false ? 'Activate' : 'Suspend'}
            onClick={() => runAction(
              () => (params.row.isActive === false ? tenantsAPI.activate(params.row._id) : suspendMutation.mutateAsync(params.row._id)),
              `Tenant ${params.row.isActive === false ? 'activated' : 'suspended'}`
            )}
          >
            {params.row.isActive === false ? <PlayCircleIcon fontSize="small" /> : <PauseCircleIcon fontSize="small" />}
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
          Suspend, resume, re-plan and inspect every workspace on the platform
        </Typography>
      </Box>

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load tenants. Check the backend connection and session.
        </Alert>
      )}

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
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <SelectMenuItem value="all">All Plans</SelectMenuItem>
            <SelectMenuItem value="free">Free</SelectMenuItem>
            <SelectMenuItem value="basic">Basic</SelectMenuItem>
            <SelectMenuItem value="pro">Pro</SelectMenuItem>
            <SelectMenuItem value="enterprise">Enterprise</SelectMenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />} onClick={handleExportCsv}>
          Export CSV
        </Button>
      </Box>

      {selectedRows.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <Button variant="outlined" size="small" startIcon={<PauseCircleIcon fontSize="small" />} disabled={busy} onClick={() => handleBulk('suspend')}>
            Suspend ({selectedRows.length})
          </Button>
          <Button variant="outlined" size="small" startIcon={<PlayCircleIcon fontSize="small" />} disabled={busy} onClick={() => handleBulk('activate')}>
            Activate ({selectedRows.length})
          </Button>
        </Box>
      )}

      <Box sx={{ height: 600, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={tenants}
          getRowId={(r) => r._id}
          columns={columns}
          initialState={{ pagination: { paginationModel: { pageSize: 20, page: 0 } } }}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection
          onRowSelectionModelChange={(m) => setSelectedRows(m as string[])}
          rowSelectionModel={selectedRows}
          disableRowSelectionOnClick
          loading={isLoading || busy}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); navigate(`/tenants/${selectedTenant?._id}`); }}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1.5 }} /> View Details
        </MenuItem>
        <MenuItem onClick={() => selectedTenant && handleImpersonate(selectedTenant)}>
          <ImpersonateIcon fontSize="small" sx={{ mr: 1.5 }} /> Impersonate (15 min)
        </MenuItem>
        <MenuItem
          onClick={() => {
            const t = selectedTenant;
            handleMenuClose();
            if (t) runAction(() => (t.isActive === false ? tenantsAPI.activate(t._id) : suspendMutation.mutateAsync(t._id)), `Tenant ${t.isActive === false ? 'activated' : 'suspended'}`);
          }}
        >
          {selectedTenant?.isActive === false
            ? <><PlayCircleIcon fontSize="small" sx={{ mr: 1.5 }} /> Activate</>
            : <><PauseCircleIcon fontSize="small" sx={{ mr: 1.5 }} /> Suspend</>}
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); setDeleteDialogOpen(true); }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Tenant</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to permanently delete <strong>{selectedTenant?.name}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All projects, content, media, webhooks and users in this workspace will be removed.
            Invoices and error logs are retained for records. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={busy} onClick={handleConfirmDelete}>
            {busy ? <CircularProgress size={20} /> : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
