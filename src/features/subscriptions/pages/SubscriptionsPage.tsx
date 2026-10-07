import React from 'react';
import { Box, Typography, Paper, Card, CardContent, Grid, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, FilterList as FilterListIcon, Download as DownloadIcon } from '@mui/icons-material';

export const SubscriptionsPage: React.FC = () => {
  const [search, setSearch] = React.useState('');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>Subscriptions</Typography>
          <Button variant="contained" startIcon={<AddIcon />}>Create Plan</Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage subscription plans, coupons, and billing
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <TextField
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            }}
          />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>Create Plan</Button>
        <Button variant="outlined" startIcon={<FilterListIcon fontSize="small" />}>Filters</Button>
        <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />}>Export</Button>
      </Box>

      {/* Revenue Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Monthly Recurring Revenue</Typography>
              <Typography variant="h4" fontWeight={700}>$48,320</Typography>
              <Typography variant="body2" color="success.main">+8.2% vs last month</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Active Subscriptions</Typography>
              <Typography variant="h4" fontWeight={700}>1,247</Typography>
              <Typography variant="body2" color="success.main">+12 vs last month</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Churn Rate</Typography>
              <Typography variant="h4" fontWeight={700}>2.3%</Typography>
              <Typography variant="body2" color="success.main">-0.4% vs last month</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Average Revenue Per User</Typography>
              <Typography variant="h4" fontWeight={700}>$38.75</Typography>
              <Typography variant="body2" color="success.main">+5.1% vs last month</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>Subscription Plans</Typography>
          <Button variant="contained" startIcon={<AddIcon />}>Create Plan</Button>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Price (Monthly)</TableCell>
                <TableCell>Price (Yearly)</TableCell>
                <TableCell>Features</TableCell>
                <TableCell>Subscribers</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { name: 'Free', monthly: 0, yearly: 0, features: 'Basic', subscribers: 842, status: 'active' },
                { name: 'Pro', monthly: 29, yearly: 290, features: 'Advanced', subscribers: 321, status: 'active' },
                { name: 'Enterprise', monthly: 99, yearly: 990, features: 'Full', subscribers: 84, status: 'active' },
              ].map((plan) => (
                <TableRow key={plan.name} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{plan.name}</TableCell>
                  <TableCell>${plan.monthly}</TableCell>
                  <TableCell>${plan.yearly}</TableCell>
                  <TableCell>{plan.features}</TableCell>
                  <TableCell align="right">{plan.subscribers}</TableCell>
                  <TableCell><Chip label={plan.status} size="small" color="success" variant="outlined" /></TableCell>
                  <TableCell align="right">
                    <Button size="small">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};