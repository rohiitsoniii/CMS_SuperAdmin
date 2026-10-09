import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, CardHeader, TextField, Button, InputAdornment, IconButton, Checkbox, FormControlLabel, Alert, Typography, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, EmailOutlined } from '@mui/icons-material';
import { useAuthStore } from '../../../shared/hooks/useAuthStore';
import { authAPI } from '../../../shared/api/client';
import { MFAChallengeModal } from '../components/MFAChallengeModal';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [mfaTempToken, setMfaTempToken] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      const response = await authAPI.login(data);
      const payload = response.data.data;
      if (payload?.mfaRequired) {
        const tempToken: string | undefined = payload?.tokens?.accessToken;
        if (!tempToken) {
          setError('MFA required but no challenge token was issued.');
          return;
        }
        // Hold the pre-MFA temp token ONLY for the verify call — never as a session
        setMfaTempToken(tempToken);
        return;
      }
      const { user, tenant, tokens } = payload;
      setAuth(user, tenant, tokens);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ width: '100%', maxWidth: 440, p: 0 }}
      >
        <Card elevation={3} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardHeader
            sx={{ textAlign: 'center', pb: 1 }}
            title={<Typography variant="h5" sx={{ fontWeight: 700 }}>Welcome Back</Typography>}
            subheader={<Typography variant="body2" color="text.secondary">Sign in to CMS Super Admin</Typography>}
          />
          <CardContent sx={{ py: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              placeholder="admin@cms.example.com"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              autoComplete="email"
              autoFocus
              margin="normal"
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              margin="normal"
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2 }}>
              <FormControlLabel
                control={<Checkbox {...register('rememberMe')} />}
                label="Remember me"
                labelPlacement="end"
              />
              <Link to="/forgot-password" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ py: 1.5, mt: 1 }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Need help?{' '}
            <Link to="/support" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Contact Support
            </Link>
          </Typography>
        </Box>
      </Box>
      {mfaTempToken && (
        <MFAChallengeModal tempToken={mfaTempToken} onCancel={() => setMfaTempToken(null)} />
      )}
    </Box>
  );
};