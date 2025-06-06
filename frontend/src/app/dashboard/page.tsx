'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { medicalAnalysisService } from '../../services/medicalAnalysisService';

interface DashboardStats {
  totalScans: number;
  pendingAnalysis: number;
  completedAnalysis: number;
  recentResults: any[];
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalScans: 0,
    pendingAnalysis: 0,
    completedAnalysis: 0,
    recentResults: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await medicalAnalysisService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              Welcome back, {user?.email}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's an overview of your medical scan analysis activity.
            </Typography>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Scans
              </Typography>
              <Typography variant="h4">{stats.totalScans}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Analysis
              </Typography>
              <Typography variant="h4">{stats.pendingAnalysis}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed Analysis
              </Typography>
              <Typography variant="h4">{stats.completedAnalysis}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Results */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Results
            </Typography>
            <Grid container spacing={2}>
              {stats.recentResults.map((result, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {result.scanType} Analysis
                      </Typography>
                      <Typography color="text.secondary">
                        Date: {new Date(result.timestamp).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {result.summary}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => router.push(`/analysis/${result.id}`)}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => router.push('/upload')}
              >
                Upload New Scan
              </Button>
              <Button
                variant="outlined"
                onClick={() => router.push('/history')}
              >
                View History
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 