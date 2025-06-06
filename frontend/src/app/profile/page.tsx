'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  email: string;
  fullName: string;
  organization: string;
  role: string;
  joinDate: string;
}

export default function Profile() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    email: user?.email || '',
    fullName: '',
    organization: '',
    role: '',
    joinDate: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch user profile data here
        // const data = await userService.getProfile();
        // setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateProfile(profile);
      setSuccess('Profile updated successfully');
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{ width: 100, height: 100, bgcolor: 'primary.main' }}
            >
              {profile.fullName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                {profile.fullName || 'Your Name'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {profile.role || 'User Role'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {new Date(profile.joinDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Profile Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
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

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profile.email}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Organization"
                    name="organization"
                    value={profile.organization}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Role"
                    name="role"
                    value={profile.role}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Account Settings */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => router.push('/settings')}
              >
                Change Password
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => router.push('/settings/notifications')}
              >
                Notification Preferences
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 