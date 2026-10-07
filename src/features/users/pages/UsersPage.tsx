import React from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment, FormControl, FormControlLabel, Select, MenuItem, MenuItem as SelectMenuItem, Menu, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, InputLabel, Switch } from '@mui/material';
import { Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon, MoreVert as MoreVertIcon, Shield as ShieldIcon, VisibilityOff as VisibilityOffIcon } from '@mui/icons-material';

export const UsersPage: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<'create' | 'edit'>('create');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleCreateClick = () => {
    setDialogMode('create');
    setSelectedUser(null);
    setDialogOpen(true);
  };

  const handleEditClick = () => {
    setDialogMode('edit');
    setDialogOpen(true);
    handleMenuClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>Platform Users</Typography>
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleCreateClick}>Invite User</Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage super admin and support team members
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
          <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
            <SelectMenuItem value="all">All Roles</SelectMenuItem>
            <SelectMenuItem value="superadmin">Super Admin</SelectMenuItem>
            <SelectMenuItem value="support">Support</SelectMenuItem>
            <SelectMenuItem value="billing">Billing</SelectMenuItem>
            <SelectMenuItem value="devops">DevOps</SelectMenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <SelectMenuItem value="all">All Status</SelectMenuItem>
            <SelectMenuItem value="active">Active</SelectMenuItem>
            <SelectMenuItem value="inactive">Inactive</SelectMenuItem>
            <SelectMenuItem value="invited">Invited</SelectMenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={1} sx={{ height: 550, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>MFA</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { name: 'Sarah Chen', email: 'sarah@cms.example.com', role: 'superadmin', mfa: true, status: 'active', lastLogin: '2 min ago' },
                { name: 'Marcus Johnson', email: 'marcus@cms.example.com', role: 'support', mfa: true, status: 'active', lastLogin: '1 hour ago' },
                { name: 'Emily Rodriguez', email: 'emily@cms.example.com', role: 'billing', mfa: false, status: 'active', lastLogin: '3 days ago' },
                { name: 'David Kim', email: 'david@cms.example.com', role: 'devops', mfa: true, status: 'inactive', lastLogin: '2 weeks ago' },
                { name: 'Lisa Wang', email: 'lisa@cms.example.com', role: 'support', mfa: true, status: 'invited', lastLogin: 'Never' },
              ].map((user) => (
                <TableRow key={user.email} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      variant="outlined"
                      color={
                        user.role === 'superadmin' ? 'primary' :
                        user.role === 'support' ? 'success' :
                        user.role === 'billing' ? 'warning' : 'info'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.mfa ? 'Enabled' : 'Disabled'}
                      size="small"
                      variant="outlined"
                      color={user.mfa ? 'success' : 'error'}
                      icon={user.mfa ? <ShieldIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      variant="outlined"
                      color={
                        user.status === 'active' ? 'success' :
                        user.status === 'inactive' ? 'default' : 'warning'
                      }
                    />
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" aria-label="More actions" onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => { setAnchorEl(null); setSelectedUser(null); }}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); console.log('Reset MFA', selectedUser); }}>
          <VisibilityOffIcon fontSize="small" sx={{ mr: 1.5 }} /> Reset MFA
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); console.log('Resend Invite', selectedUser); }}>
          <PersonAddIcon fontSize="small" sx={{ mr: 1.5 }} /> Resend Invite
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); console.log('Deactivate', selectedUser); }} sx={{ color: 'warning.main' }}>
          Deactivate
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); console.log('Delete', selectedUser); }} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); setSelectedUser(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? 'Invite New User' : 'Edit User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" defaultValue={selectedUser?.firstName || ''} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" defaultValue={selectedUser?.lastName || ''} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" defaultValue={selectedUser?.email || ''} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="role-label">Role</InputLabel>
                <Select label="Role" defaultValue={selectedUser?.role || 'support'}>
                  <SelectMenuItem value="superadmin">Super Admin</SelectMenuItem>
                  <SelectMenuItem value="support">Support</SelectMenuItem>
                  <SelectMenuItem value="billing">Billing</SelectMenuItem>
                  <SelectMenuItem value="devops">DevOps</SelectMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select label="Status" defaultValue="active">
                  <SelectMenuItem value="active">Active</SelectMenuItem>
                  <SelectMenuItem value="inactive">Inactive</SelectMenuItem>
                  <SelectMenuItem value="invited">Invited</SelectMenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch defaultChecked />} label="Require MFA" />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch />} label="Send Invitation Email" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setSelectedUser(null); }}>Cancel</Button>
          <Button variant="contained" onClick={() => { setDialogOpen(false); setSelectedUser(null); }}>
            {dialogMode === 'create' ? 'Invite' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};