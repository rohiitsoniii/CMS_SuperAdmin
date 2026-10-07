import React from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Send as SendIcon } from '@mui/icons-material';

export const EmailTemplatesPage: React.FC = () => {
  const [search, setSearch] = React.useState('');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>Email Templates</Typography>
          <Button variant="contained" startIcon={<AddIcon />}>Create Template</Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage system email templates (welcome, password reset, notifications, etc.)
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <TextField
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
          />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>Create Template</Button>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Language</TableCell>
                <TableCell>Variables</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { name: 'Welcome Email', subject: 'Welcome to {{companyName}}!', category: 'Onboarding', language: 'en', variables: 3, updated: '2024-11-15' },
                { name: 'Password Reset', subject: 'Reset your password', category: 'Security', language: 'en', variables: 2, updated: '2024-11-10' },
                { name: 'Invoice Receipt', subject: 'Your invoice #{{invoiceNumber}}', category: 'Billing', language: 'en', variables: 5, updated: '2024-11-01' },
                { name: 'Subscription Renewal', subject: 'Your subscription renews soon', category: 'Billing', language: 'en', variables: 4, updated: '2024-10-28' },
              ].map((template) => (
                <TableRow key={template.name} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{template.name}</TableCell>
                  <TableCell>{template.subject}</TableCell>
                  <TableCell><Chip label={template.category} size="small" variant="outlined" /></TableCell>
                  <TableCell>{template.language}</TableCell>
                  <TableCell>{template.variables}</TableCell>
                  <TableCell>{template.updated}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<EditIcon fontSize="small" />}>Edit</Button>
                    <Button size="small" startIcon={<SendIcon fontSize="small" />}>Test Send</Button>
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