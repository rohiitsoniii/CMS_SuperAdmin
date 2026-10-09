import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
  CircularProgress,
} from '@mui/material';
import { twoFactorAPI, api } from '@/shared/api/client';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface MFAChallengeModalProps {
  /** Pre-MFA temp token from login (mfaVerified=false). Never stored as a session. */
  tempToken: string;
  onCancel: () => void;
}

export const MFAChallengeModal: React.FC<MFAChallengeModalProps> = ({ tempToken, onCancel }) => {
  const [token, setToken] = React.useState('');
  const [error, setError] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    try {
      const res = await twoFactorAPI.verify(token.trim(), tempToken);
      const tokens = res.data?.data?.tokens || res.data?.tokens;
      if (!tokens?.accessToken) throw new Error('Verification succeeded but no session was issued');
      // Fetch the full profile with the MFA-verified token, then establish the session
      const me = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      const { user, tenant } = me.data?.data ?? {};
      if (!user) throw new Error('Verified, but profile load failed');
      setAuth(user, tenant, tokens);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog
      open
      onClose={(_e, reason) => {
        if (reason !== 'backdropClick') onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mfa-modal-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="mfa-modal-title">Two-factor authentication</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the 6-digit code from your authenticator app.
        </Typography>
        {error && (
          <Alert severity="error" role="alert" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleVerify}>
          <TextField
            id="mfa-token"
            label="Verification code"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ inputMode: 'numeric', maxLength: 6, 'aria-label': 'Six-digit verification code' }}
            fullWidth
            autoFocus
            disabled={verifying}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={verifying}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={token.length !== 6 || verifying}
          startIcon={verifying ? <CircularProgress size={18} /> : undefined}
        >
          {verifying ? 'Verifying…' : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
