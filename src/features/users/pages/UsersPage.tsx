import React from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, FormControl, Select, MenuItem, MenuItem as SelectMenuItem, Menu, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, InputLabel, Alert, CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import { Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon, MoreVert as MoreVertIcon, Shield as ShieldIcon, VpnKey as KeyIcon, Block as RevokeIcon } from '@mui/icons-material';
import { usersAPI } from '../../../shared/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const unwrapUsers = (res: any): any[] => res.data?.data?.users ?? [];

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [staffOnly, setStaffOnly] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({ email: '', tenantId: '', firstName: '', lastName: '', password: '', role: 'editor', isSuperAdmin: false });

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['platform-users', search, roleFilter, staffOnly],
    queryFn: async (): Promise<any[]> =>
      unwrapUsers(await usersAPI.list({
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        isSuperAdmin: staffOnly ? true : undefined,
      })),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['platform-users'] });

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

  const handleInvite = async () => {
    await runAction(() => usersAPI.invite({
      email: form.email.trim(),
      tenantId: form.tenantId.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      password: form.password,
      role: form.role,
      isSuperAdmin: form.isSuperAdmin,
    }), `Invitation created for ${form.email}`);
    setDialogOpen(false);
    setForm({ email: '', tenantId: '', firstName: '', lastName: '', password: '', role: 'editor', isSuperAdmin: false });
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>Platform Users</Typography>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setDialogOpen(true)}>Invite User</Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Cross-tenant directory, staff flags, password resets and session revocation
        </Typography>
      </Box>

      {notice && <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice.text}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load users.</Alert>}

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <TextField
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
          />
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <SelectMenuItem value="all">All Roles</SelectMenuItem>
            <SelectMenuItem value="owner">Owner</SelectMenuItem>
            <SelectMenuItem value="admin">Admin</SelectMenuItem>
            <SelectMenuItem value="editor">Editor</SelectMenuItem>
            <SelectMenuItem value="viewer">Viewer</SelectMenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Checkbox checked={staffOnly} onChange={(e) => setStaffOnly(e.target.checked)} />}
          label="Super-admins only"
        />
      </Box>

      <Paper elevation={1} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 550 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>MFA</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tenant</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} align="center">Loading…</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center"><Typography color="text.secondary">No users found</Typography></TableCell></TableRow>
              ) : users.map((u: any) => (
                <TableRow key={u._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip label={u.role} size="small" variant="outlined" color={u.isSuperAdmin ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      size="small" variant="outlined"
                      color={u.twoFactorEnabled ? 'success' : 'error'}
                      icon={u.twoFactorEnabled ? <ShieldIcon fontSize="small" /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={u.isActive === false ? 'inactive' : 'active'} size="small" variant="outlined" color={u.isActive === false ? 'default' : 'success'} />
                  </TableCell>
                  <TableCell>{u.tenantId?.name || u.tenantId?.slug || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" aria-label="More actions" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedUser(u); }}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedUser(null); }}>
        <MenuItem onClick={() => { const u = selectedUser; setAnchorEl(null); if (u) runAction(() => usersAPI.update(u._id, { isActive: u.isActive === false }), `User ${u.isActive === false ? 'activated' : 'deactivated'}`); }}>
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> {selectedUser?.isActive === false ? 'Activate' : 'Deactivate'}
        </MenuItem>
        <MenuItem onClick={() => { const u = selectedUser; setAnchorEl(null); setSelectedUser(null); if (u) runAction(() => usersAPI.resetPassword(u._id), `Password reset triggered for ${u.email}`); }}>
          <KeyIcon fontSize="small" sx={{ mr: 1.5 }} /> Reset password
        </MenuItem>
        <MenuItem onClick={() => { const u = selectedUser; setAnchorEl(null); setSelectedUser(null); if (u) runAction(() => usersAPI.revokeSessions(u._id), `All sessions revoked for ${u.email}`); }}>
          <RevokeIcon fontSize="small" sx={{ mr: 1.5 }} /> Revoke sessions
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); setDeleteOpen(true); }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Tenant ID" placeholder="ObjectId of the tenant" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Initial Password (min 8)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="invite-role">Role</InputLabel>
                <Select labelId="invite-role" value={form.role} label="Role" onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {['owner', 'admin', 'editor', 'viewer'].map((r) => <SelectMenuItem key={r} value={r}>{r}</SelectMenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={form.isSuperAdmin} onChange={(e) => setForm({ ...form, isSuperAdmin: e.target.checked })} />} label="Grant super-admin (platform staff)" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={handleInvite}>
            {busy ? <CircularProgress size={20} /> : 'Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => { setDeleteOpen(false); setSelectedUser(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          <Typography>Permanently delete <strong>{selectedUser?.email}</strong>? Last-super-admin and self-delete are refused by the API.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteOpen(false); setSelectedUser(null); }}>Cancel</Button>
          <Button
            variant="contained" color="error" disabled={busy}
            onClick={() => { const u = selectedUser; setDeleteOpen(false); setSelectedUser(null); if (u) runAction(() => usersAPI.delete(u._id), `User ${u.email} deleted`); }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
