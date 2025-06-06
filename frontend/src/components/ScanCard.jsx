import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ScanCard = ({ scan, onView, onDownload, onShare, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#34C759';
      case 'processing':
        return '#FF9500';
      case 'failed':
        return '#FF3B30';
      default:
        return '#007AFF';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Card
        sx={{
          position: 'relative',
          overflow: 'visible',
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            '& .scan-actions': {
              opacity: 1,
            },
          },
        }}
      >
        {/* Status Indicator */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1,
          }}
        >
          <Chip
            label={scan.status}
            size="small"
            sx={{
              background: `${getStatusColor(scan.status)}20`,
              color: getStatusColor(scan.status),
              border: `1px solid ${getStatusColor(scan.status)}40`,
              fontWeight: 500,
            }}
          />
        </Box>

        {/* Scan Image */}
        <CardMedia
          component="img"
          height="200"
          image={scan.imageUrl}
          alt={scan.title}
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            objectFit: 'cover',
          }}
        />

        {/* Scan Info */}
        <CardContent>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {scan.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            {scan.description}
          </Typography>

          {/* Progress Bar */}
          {scan.status === 'processing' && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={scan.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(45deg, #007AFF, #00C6FF)',
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block' }}
              >
                Processing: {scan.progress}%
              </Typography>
            </Box>
          )}

          {/* Action Buttons */}
          <Box
            className="scan-actions"
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              opacity: { xs: 1, md: 0 },
              transition: 'opacity 0.3s ease',
            }}
          >
            <Box>
              <Tooltip title="View Details">
                <IconButton
                  onClick={() => onView(scan)}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton
                  onClick={() => onDownload(scan)}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box>
              <Tooltip title="Share">
                <IconButton
                  onClick={() => onShare(scan)}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton
                  onClick={() => onDelete(scan)}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScanCard; 