'use client';

import { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface UserSettings {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  notifications: {
    email: boolean;
    push: boolean;
    analysisComplete: boolean;
    systemUpdates: boolean;
  };
}

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      push: true,
      analysisComplete: true,
      systemUpdates: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (settings.newPassword !== settings.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Implement password change logic here
      setSuccess('Password updated successfully');
    } catch (error) {
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (setting: keyof UserSettings['notifications']) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [setting]: !prev.notifications[setting],
      },
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Password Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordChange}>
              <TextField
                fullWidth
                margin="normal"
                label="Current Password"
                type="password"
                value={settings.currentPassword}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="New Password"
                type="password"
                value={settings.newPassword}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
              <TextField
                fullWidth
                margin="normal"
                label="Confirm New Password"
                type="password"
                value={settings.confirmPassword}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.analysisComplete}
                    onChange={() => handleNotificationChange('analysisComplete')}
                  />
                }
                label="Analysis Complete Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.systemUpdates}
                    onChange={() => handleNotificationChange('systemUpdates')}
                  />
                }
                label="System Updates"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 