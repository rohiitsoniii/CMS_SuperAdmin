import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Select, MenuItem as SelectMenuItem, FormControl, InputLabel, Button } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Download as DownloadIcon } from '@mui/icons-material';

export const TokenUsagePage: React.FC = () => {
  const [period, setPeriod] = React.useState('30d');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Token Usage Analytics</Typography>
          <Typography variant="body1" color="text.secondary">
            Track AI token consumption, costs, and trends across all tenants
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="period-label">Period</InputLabel>
            <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
              <SelectMenuItem value="7d">Last 7 Days</SelectMenuItem>
              <SelectMenuItem value="30d">Last 30 Days</SelectMenuItem>
              <SelectMenuItem value="90d">Last 90 Days</SelectMenuItem>
              <SelectMenuItem value="1y">Last Year</SelectMenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<DownloadIcon fontSize="small" />}>Export CSV</Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Total Tokens</Typography>
              <Typography variant="h4" fontWeight={700}>2.4M</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <TrendingUpIcon color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">+15.2%</Typography>
                <Typography variant="body2" color="text.secondary">vs last period</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
              <Typography variant="h4" fontWeight={700}>$1,247</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <TrendingUpIcon color="warning" fontSize="small" />
                <Typography variant="body2" color="warning.main">+8.7%</Typography>
                <Typography variant="body2" color="text.secondary">vs last period</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Avg Cost/1K Tokens</Typography>
              <Typography variant="h4" fontWeight={700}>$0.52</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <TrendingDownIcon color="success" fontSize="small" />
                <Typography variant="body2" color="success.main">-2.1%</Typography>
                <Typography variant="body2" color="text.secondary">vs last period</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Active Models</Typography>
              <Typography variant="h4" fontWeight={700}>4</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">GPT-4, GPT-3.5, Embeddings, DALL-E</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Placeholder */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Token Usage Over Time</Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', px: 2 }}>
              {Array.from({ length: 30 }, (_, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 30,
                      height: Math.max(50, Math.random() * 300 + 50),
                      bgcolor: 'primary.main',
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                  <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                    Day {i + 1}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Paper elevation={1} sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Usage by Model</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { model: 'GPT-4', tokens: '1.2M', cost: '$720', color: 'primary' },
                { model: 'GPT-3.5 Turbo', tokens: '890K', cost: '$178', color: 'success' },
                { model: 'Text Embeddings', tokens: '230K', cost: '$23', color: 'info' },
                { model: 'DALL-E 3', tokens: '45K', cost: '$135', color: 'warning' },
              ].map((item) => (
                <Box key={item.model} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                    <Typography variant="body2" fontWeight={500}>{item.model}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" fontWeight={600}>{item.tokens}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.cost}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};