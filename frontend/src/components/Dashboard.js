import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

const Dashboard = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to MediScan AI
          </Typography>
          <Typography variant="body1">
            Advanced Medical Diagnostic System with Multi-modal AI Analysis
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Analyses
          </Typography>
          {/* Add recent analyses list here */}
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          {/* Add system status information here */}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard; 