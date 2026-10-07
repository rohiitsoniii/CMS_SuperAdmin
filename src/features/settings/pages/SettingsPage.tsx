import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, TextField, Button, FormControl, Select, MenuItem as SelectMenuItem, InputLabel, FormControlLabel, Switch, Tabs, Tab, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Save as SaveIcon, Email as EmailIcon, Cloud as CloudIcon, Security as SecurityIcon, Settings as SettingsIcon, Add as AddIcon, Send as SendIcon } from '@mui/icons-material';

export const SettingsPage: React.FC = () => {
  const [tab, setTab] = React.useState(0);
  const [saved, setSaved] = React.useState(false);

  const tabs = [
    { label: 'General', icon: <SettingsIcon /> },
    { label: 'Email', icon: <EmailIcon /> },
    { label: 'Storage', icon: <CloudIcon /> },
    { label: 'Security', icon: <SecurityIcon /> },
    { label: 'Feature Flags', icon: <AddIcon /> },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Platform Settings</Typography>
        <Typography variant="body1" color="text.secondary">
          Configure platform-wide settings, integrations, and feature flags
        </Typography>
      </Box>

      {saved && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSaved(false)}>
          Settings saved successfully!
        </Alert>
      )}

      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }} variant="fullWidth">
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} icon={t.icon} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && (
            <>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>General Settings</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Platform Name" defaultValue="CMS Platform" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Platform URL" defaultValue="https://cms.example.com" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Support Email" defaultValue="support@cms.example.com" type="email" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Default Locale" defaultValue="en" />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Terms of Service URL" defaultValue="https://cms.example.com/terms" multiline rows={2} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Privacy Policy URL" defaultValue="https://cms.example.com/privacy" multiline rows={2} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Defaults</Typography>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id="default-plan">Default Plan</InputLabel>
                      <Select label="Default Plan" defaultValue="free">
                        <SelectMenuItem value="free">Free</SelectMenuItem>
                        <SelectMenuItem value="pro">Pro</SelectMenuItem>
                        <SelectMenuItem value="enterprise">Enterprise</SelectMenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id="default-locale">Default Locale</InputLabel>
                      <Select label="Default Locale" defaultValue="en">
                        <SelectMenuItem value="en">English</SelectMenuItem>
                        <SelectMenuItem value="es">Spanish</SelectMenuItem>
                        <SelectMenuItem value="fr">French</SelectMenuItem>
                        <SelectMenuItem value="de">German</SelectMenuItem>
                      </Select>
                    </FormControl>
                    <FormControlLabel control={<Switch defaultChecked />} label="Enable Registration" />
                    <FormControlLabel control={<Switch defaultChecked />} label="Email Verification Required" />
                    <FormControlLabel control={<Switch />} label="Maintenance Mode" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="contained" onClick={() => setSaved(true)} startIcon={<SaveIcon />}>Save Changes</Button>
            </Box>
            </>
          )}

          {tab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>SMTP Configuration</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="SMTP Host" defaultValue="smtp.sendgrid.net" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="SMTP Port" defaultValue="587" type="number" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="SMTP Username" defaultValue="apikey" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="SMTP Password" type="password" defaultValue="••••••••" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="From Email" defaultValue="noreply@cms.example.com" type="email" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="From Name" defaultValue="CMS Platform" />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button variant="contained" startIcon={<SaveIcon />}>Save</Button>
                      <Button variant="outlined" startIcon={<SendIcon />}>Test Connection</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Storage Configuration</Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel id="storage-provider">Storage Provider</InputLabel>
                          <Select label="Storage Provider" defaultValue="s3">
                            <SelectMenuItem value="local">Local Filesystem</SelectMenuItem>
                            <SelectMenuItem value="s3">Amazon S3</SelectMenuItem>
                            <SelectMenuItem value="r2">Cloudflare R2</SelectMenuItem>
                            <SelectMenuItem value="gcs">Google Cloud Storage</SelectMenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Bucket Name" defaultValue="cms-media" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Region" defaultValue="us-east-1" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Access Key ID" defaultValue="AKIA..." />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Secret Access Key" type="password" defaultValue="••••••••" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="CDN URL" defaultValue="https://cdn.example.com" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Max File Size (MB)" defaultValue="100" type="number" />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button variant="contained" startIcon={<SaveIcon />}>Save</Button>
                      <Button variant="outlined" startIcon={<CloudIcon />}>Test Connection</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Security Settings</Typography>
                    <FormControlLabel control={<Switch defaultChecked />} label="Enforce MFA for Super Admins" />
                    <FormControlLabel control={<Switch defaultChecked />} label="Enforce MFA for All Admins" />
                    <FormControlLabel control={<Switch />} label="Enforce MFA for All Users" />
                    <FormControlLabel control={<Switch defaultChecked />} label="Session Timeout (minutes)" />
                    <TextField fullWidth label="Session Timeout (minutes)" defaultValue="60" type="number" sx={{ mt: 1, mb: 2, maxWidth: 200 }} />
                    <FormControlLabel control={<Switch defaultChecked />} label="Password Expiration (days)" />
                    <TextField fullWidth label="Password Expiration (days)" defaultValue="90" type="number" sx={{ mt: 1, mb: 2, maxWidth: 200 }} />
                    <FormControlLabel control={<Switch defaultChecked />} label="Rate Limiting Enabled" />
                    <FormControlLabel control={<Switch />} label="IP Whitelist for Admin Access" />
                    <Button variant="contained" startIcon={<SaveIcon />} sx={{ mt: 3 }}>Save Security Settings</Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Typography variant="h6" fontWeight={600}>Feature Flags</Typography>
                      <Button variant="contained" startIcon={<AddIcon />}>Add Feature Flag</Button>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Key</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Enabled</TableCell>
                            <TableCell>Rollout %</TableCell>
                            <TableCell>Target Tenants</TableCell>
                            <TableCell>Updated</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[
                            { key: 'ai-content-generation', desc: 'AI-powered content generation', enabled: true, rollout: 100, tenants: 'All', updated: '2024-11-15' },
                            { key: 'advanced-workflows', desc: 'Multi-step approval workflows', enabled: true, rollout: 75, tenants: 'Enterprise', updated: '2024-11-10' },
                            { key: 'rag-chatbots', desc: 'RAG-powered chatbots', enabled: false, rollout: 0, tenants: 'None', updated: '2024-11-01' },
                            { key: 'bulk-operations-v2', desc: 'New bulk operations engine', enabled: true, rollout: 50, tenants: 'Pro, Enterprise', updated: '2024-11-12' },
                          ].map((flag) => (
                            <TableRow key={flag.key} hover>
                              <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{flag.key}</TableCell>
                              <TableCell>{flag.desc}</TableCell>
                              <TableCell>
                                <Switch checked={flag.enabled} onChange={() => {}} />
                              </TableCell>
                              <TableCell>{flag.rollout}%</TableCell>
                              <TableCell>{flag.tenants}</TableCell>
                              <TableCell>{flag.updated}</TableCell>
                              <TableCell align="right">
                                <Button size="small">Edit</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="contained" onClick={() => setSaved(true)} startIcon={<SaveIcon />}>Save Changes</Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};