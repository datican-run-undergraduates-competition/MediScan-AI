import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateLeft as RotateLeftIcon,
  RotateRight as RotateRightIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AnalysisView = ({ scan }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360);
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);

  const findings = [
    {
      category: 'Anatomical Structures',
      items: [
        { name: 'Lungs', status: 'normal', confidence: 98 },
        { name: 'Heart', status: 'normal', confidence: 95 },
        { name: 'Ribs', status: 'normal', confidence: 97 },
      ],
    },
    {
      category: 'Pathologies',
      items: [
        { name: 'Nodules', status: 'detected', confidence: 85 },
        { name: 'Infiltrates', status: 'detected', confidence: 92 },
      ],
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Image View */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              height: '100%',
              minHeight: 500,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Scan View
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  onClick={handleZoomOut}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: '#007AFF' },
                  }}
                >
                  <ZoomOutIcon />
                </IconButton>
                <IconButton
                  onClick={handleZoomIn}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: '#007AFF' },
                  }}
                >
                  <ZoomInIcon />
                </IconButton>
                <IconButton
                  onClick={handleRotateLeft}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: '#007AFF' },
                  }}
                >
                  <RotateLeftIcon />
                </IconButton>
                <IconButton
                  onClick={handleRotateRight}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: '#007AFF' },
                  }}
                >
                  <RotateRightIcon />
                </IconButton>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <motion.img
                src={scan.imageUrl}
                alt={scan.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.3s ease',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Analysis Results */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              background: 'rgba(26, 26, 26, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Analysis Results
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: '#007AFF' },
                  }}
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: '#007AFF' },
                  }}
                >
                  <ShareIcon />
                </IconButton>
                <IconButton
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: '#007AFF' },
                  }}
                >
                  <PrintIcon />
                </IconButton>
              </Box>
            </Box>

            {findings.map((section) => (
              <Box key={section.category} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 2,
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {section.category}
                </Typography>
                {section.items.map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.05)',
                        },
                      }}
                    >
                      <Typography variant="body2">{item.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            background:
                              item.status === 'normal'
                                ? 'rgba(52, 199, 89, 0.2)'
                                : 'rgba(255, 149, 0, 0.2)',
                            color:
                              item.status === 'normal'
                                ? '#34C759'
                                : '#FF9500',
                            fontWeight: 500,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary' }}
                        >
                          {item.confidence}%
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisView; 