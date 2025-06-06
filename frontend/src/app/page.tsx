'use client';

import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    {
      title: 'AI-Powered Analysis',
      description: 'Get instant analysis of your medical scans using advanced AI technology.',
    },
    {
      title: 'Multiple Scan Types',
      description: 'Support for X-ray, MRI, CT scans, and more.',
    },
    {
      title: 'Detailed Reports',
      description: 'Receive comprehensive reports with findings and recommendations.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                AI-Powered Medical Analysis
              </Typography>
              <Typography variant="h5" paragraph>
                Get instant, accurate analysis of your medical scans using advanced artificial intelligence.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => router.push(user ? '/dashboard' : '/login')}
                sx={{ mt: 2 }}
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Key Features
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => router.push(user ? '/dashboard' : '/login')}
                  >
                    Learn More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md">
          <Typography variant="h4" component="h2" align="center" gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" paragraph>
            Join thousands of healthcare professionals using our AI-powered analysis platform.
          </Typography>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => router.push(user ? '/dashboard' : '/register')}
            >
              {user ? 'Go to Dashboard' : 'Create Account'}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 