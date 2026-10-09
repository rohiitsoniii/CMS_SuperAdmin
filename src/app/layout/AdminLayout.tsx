import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mui/material';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Badge,
  Chip,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  Campaign as CampaignIcon,
  Mail as MailIcon,
  Key as KeyIcon,
  Memory as MemoryIcon,
  MonitorHeart as MonitorHeartIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Backup as BackupIcon,
  Queue as QueuesIcon,
  SupportAgent as SupportIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../../shared/styles/theme/ThemeProvider';
import { useAuthStore } from '../../shared/hooks/useAuthStore';
import { useTheme as useMuiTheme } from '@mui/material/styles';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Tenants', href: '/tenants', icon: <BusinessIcon /> },
  { name: 'Subscriptions', href: '/subscriptions', icon: <CreditCardIcon /> },
  { name: 'Campaigns', href: '/campaigns', icon: <CampaignIcon /> },
  { name: 'Email Templates', href: '/email-templates', icon: <MailIcon /> },
  { name: 'API Keys', href: '/api-keys', icon: <KeyIcon /> },
  { name: 'Token Usage', href: '/token-usage', icon: <MemoryIcon /> },
  { name: 'System Health', href: '/system-health', icon: <MonitorHeartIcon /> },
  { name: 'Queues & Workers', href: '/queues', icon: <QueuesIcon /> },
  { name: 'Backups & Storage', href: '/backups', icon: <BackupIcon /> },
  { name: 'Support Inbox', href: '/support', icon: <SupportIcon /> },
  { name: 'Audit Logs', href: '/audit-logs', icon: <HistoryIcon /> },
  { name: 'Settings', href: '/settings', icon: <SettingsIcon /> },
  { name: 'Users', href: '/users', icon: <PeopleIcon /> },
];

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setNotificationsOpen] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const { mode, toggleTheme } = useThemeMode();
  const muiTheme = useMuiTheme();
  const { user, tenant, logout, isImpersonating, exitImpersonation } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleImpersonationExit = () => {
    exitImpersonation();
    navigate('/tenants');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Skip link for accessibility */}
      <Box
        component="a"
        href="#main-content"
        className="skip-link"
        sx={{
          position: 'absolute',
          top: -40,
          left: 0,
          bgcolor: 'primary.main',
          color: 'white',
          padding: '8px 16px',
          zIndex: 10000,
          '&:focus': { top: 0 },
        }}
      >
        Skip to main content
      </Box>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <Box
          onClick={() => setMobileMenuOpen(false)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1200,
            display: { xs: 'block', md: 'none' },
          }}
        />
      )}

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileMenuOpen : sidebarOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          width: sidebarOpen ? 280 : 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarOpen ? 280 : 72,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            transition: muiTheme.transitions.create('width', {
              easing: muiTheme.transitions.easing.sharp,
              duration: muiTheme.transitions.duration.enteringScreen,
            }),
            overflow: 'hidden',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: 64,
              px: sidebarOpen ? 3 : 1.5,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <AdminPanelSettingsIcon sx={{ width: 24, height: 24 }} />
              </Box>
              {sidebarOpen && (
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  CMS Admin
                </Typography>
              )}
            </Box>
            {!isMobile && (
              <IconButton
                onClick={handleSidebarToggle}
                sx={{ p: 1, color: 'text.secondary' }}
                aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            )}
          </Box>

          {/* Navigation */}
          <Box sx={{ flex: 1, overflow: 'auto', py: 2, px: 1 }}>
            <List sx={{ px: 1 }} disablePadding>
              {navigation.map((item) => (
                <ListItem
                  key={item.name}
                  disablePadding
                  sx={{ mb: 0.5 }}
                >
                  <NavLink
                    to={item.href}
                    end={item.href === '/dashboard'}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: sidebarOpen ? 2 : 0,
                      padding: '12px 16px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      color: isActive ? '#1976d2' : '#6e6e73',
                      backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.2s ease',
                    })}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                      {item.icon}
                    </ListItemIcon>
                    {sidebarOpen && <ListItemText primary={item.name} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} />}
                  </NavLink>
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Impersonation Banner */}
          {isImpersonating && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'warning.light',
                borderTop: 1,
                borderColor: 'divider',
                mx: 1,
                mb: 1,
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" color="warning.dark" sx={{ flex: 1 }}>
                  Impersonating: <strong>{tenant?.name}</strong>
                </Typography>
                <Button size="small" variant="outlined" onClick={handleImpersonationExit}>
                  Exit
                </Button>
              </Box>
            </Box>
          )}

          {/* User section */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: sidebarOpen ? 2 : 0, justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
              <Avatar
                src={user?.avatar}
                sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
              >
                {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              {sidebarOpen && (
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {tenant?.name}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Mobile header */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={1}
          sx={{
            zIndex: 1201,
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              CMS Admin
            </Typography>
            <IconButton color="inherit" onClick={toggleTheme} aria-label={mode === 'light' ? 'Enable dark mode' : 'Enable light mode'}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Main content */}
      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: muiTheme.transitions.create('margin', {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
          }),
          ml: isMobile ? 0 : (sidebarOpen ? 280 : 72),
          mt: isMobile ? 64 : 0,
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        {/* Top Bar */}
        {!isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              px: 4,
            }}
          >
            <Toolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  {tenant?.name || 'Dashboard'}
                </Typography>
                <Chip
                  label={tenant?.subscription?.plan || 'Free'}
                  size="small"
                  variant="outlined"
                  color={tenant?.subscription?.status === 'active' ? 'success' : 'default'}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Notifications">
                  <IconButton onClick={() => setNotificationsOpen(true)} color="inherit">
                    <Badge badgeContent={3} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                <Tooltip title={mode === 'light' ? 'Enable dark mode' : 'Enable light mode'}>
                  <IconButton onClick={toggleTheme} color="inherit">
                    {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Help">
                  <IconButton color="inherit"><HelpIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Profile">
                  <IconButton onClick={handleProfileClick} color="inherit">
                    <Avatar src={user?.avatar} sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
            <PersonIcon sx={{ mr: 1.5 }} /> Profile
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
            <SettingsIcon sx={{ mr: 1.5 }} /> Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 1.5 }} /> Logout
          </MenuItem>
        </Menu>

        <Outlet />
      </Box>
    </Box>
  );
};