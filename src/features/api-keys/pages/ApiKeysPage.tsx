import React from 'react';
import { Box, Typography, Paper, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, ContentCopy as CopyIcon, Delete as DeleteIcon } from '@mui/icons-material';

export const ApiKeysPage: React.FC = () => {
  const [search, setSearch] = React.useState('');

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" fontWeight={700}>Platform API Keys</Typography>
          <Button variant="contained" startIcon={<AddIcon />}>Create API Key</Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage platform-level API keys for third-party integrations (ChatGPT, SendGrid, AWS, etc.)
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, maxWidth: 400 }}>
          <TextField
            placeholder="Search API keys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
          />
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>Create API Key</Button>
      </Box>

      <Paper elevation={1} sx={{ p: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Key Prefix</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Last Used</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[
                { name: 'OpenAI GPT-4', service: 'OpenAI', prefix: 'sk-proj-abc123...', permissions: ['chat', 'embeddings'], created: '2024-11-01', lastUsed: '2024-11-20' },
                { name: 'SendGrid Email', service: 'SendGrid', prefix: 'SG.xyz789...', permissions: ['email.send', 'templates'], created: '2024-10-15', lastUsed: '2024-11-19' },
                { name: 'AWS S3 Upload', service: 'AWS', prefix: 'AKIA...', permissions: ['s3:PutObject', 's3:GetObject'], created: '2024-10-01', lastUsed: '2024-11-18' },
              ].map((key) => (
                <TableRow key={key.name} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{key.name}</TableCell>
                  <TableCell><Chip label={key.service} size="small" variant="outlined" /></TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{key.prefix}</TableCell>
                  <TableCell>{key.permissions.map((p: string) => <Chip key={p} label={p} size="small" variant="outlined" sx={{ mr: 0.5 }} />)}</TableCell>
                  <TableCell>{key.created}</TableCell>
                  <TableCell>{key.lastUsed}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<CopyIcon fontSize="small" />}>Copy</Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />}>Revoke</Button>
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