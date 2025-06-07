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
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { medicalAnalysisService } from '../../services/medicalAnalysisService';
import { AnalysisResult } from '../../services/medicalAnalysisService';

export default function Results() {
  const router = useRouter();
  const { user } = useAuth();
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await medicalAnalysisService.getAnalysisHistory();
        setResults(data);
      } catch (error) {
        setError('Failed to load analysis results');
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

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
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="h4" component="h1">
                Analysis Results
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/upload')}
              >
                New Analysis
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {results.map((result) => (
                <Grid item xs={12} md={6} key={result.scan_id}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6" component="h2">
                          {result.metadata.modality} Analysis
                        </Typography>
                        <Chip
                          label={"Completed"}
                          color={getStatusColor("Completed")}
                          size="small"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Date: {new Date(result.timestamp).toLocaleDateString()}
                      </Typography>
                      {result.primary_diagnosis && (
                        <Typography variant="body1" paragraph>
                          <strong>Primary Diagnosis:</strong>{' '}
                          {result.primary_diagnosis.condition}
                        </Typography>
                      )}
                      {result.key_findings && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Key Findings:</strong> {result.key_findings}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => router.push(`/analysis/${result.scan_id}`)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          // Implement download functionality
                          console.log('Download result:', result.scan_id);
                        }}
                      >
                        Download Report
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {results.length === 0 && !error && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No analysis results found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Upload a new scan to get started
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 