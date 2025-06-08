'use client';

import React from 'react';
import { Box, Typography, Container } from '@mui/material';

export default function VoicePage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Voice Command System
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Control the Ai-Med platform using voice commands for a hands-free experience.
        </Typography>
      </Box>
    </Container>
  );
}