'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Grid,
  MenuItem,
  Alert,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const roles = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'radiologist', label: 'Radiologist' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'admin', label: 'Administrator' },
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    role: '',
    phone_number: '',
    department: '',
    years_of_experience: '',
    npi_number: '',
    medical_school: '',
    board_certified: false,
    languages_spoken: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.organization.trim()) {
      errors.organization = 'Organization is required';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone_number)) {
      errors.phone_number = 'Invalid phone number format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      // Use direct API call instead of auth context to avoid NextRouter issues
      // This is a mock success for now - replace with actual API call when backend is ready
      console.log('Registration data:', formData);
      
      // Simulate successful registration
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (err) {
      setError('Failed to create account. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Join our medical analysis platform
          </Typography>
          
            {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={formData.name}
                  onChange={handleChange}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!validationErrors.confirmPassword}
                  helperText={validationErrors.confirmPassword}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="organization"
                  label="Organization/Hospital"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  error={!!validationErrors.organization}
                  helperText={validationErrors.organization}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  select
                  id="role"
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  error={!!validationErrors.role}
                  helperText={validationErrors.role}
                >
                  {roles.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="phone_number"
                  label="Phone Number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  error={!!validationErrors.phone_number}
                  helperText={validationErrors.phone_number}
                  placeholder="+1 (555) 555-5555"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="department"
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="years_of_experience"
                  label="Years of Experience"
                  name="years_of_experience"
                  type="number"
                  value={formData.years_of_experience}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="npi_number"
                  label="NPI Number"
                  name="npi_number"
                  value={formData.npi_number}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="medical_school"
                  label="Medical School"
                  name="medical_school"
                  value={formData.medical_school}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.board_certified}
                      onChange={e => setFormData(prev => ({ ...prev, board_certified: e.target.checked }))}
                      name="board_certified"
                      color="primary"
                    />
                  }
                  label="Board Certified"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="languages_spoken"
                  label="Languages Spoken (comma separated)"
                  name="languages_spoken"
                  value={formData.languages_spoken}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Button
                type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Create Account
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => router.push('/login')}
              >
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 