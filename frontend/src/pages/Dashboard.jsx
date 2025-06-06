import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ScanCard from '../components/ScanCard';

const StatCard = ({ title, value, icon, color, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Paper
      sx={{
        p: 3,
        background: 'rgba(26, 26, 26, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            background: `${color}20`,
            borderRadius: 2,
            p: 1,
            mr: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography
        variant="h4"
        sx={{
          mb: 1,
          fontWeight: 700,
          background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {value}
      </Typography>
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUpIcon
            sx={{
              color: trend > 0 ? '#34C759' : '#FF3B30',
              mr: 0.5,
              fontSize: 16,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: trend > 0 ? '#34C759' : '#FF3B30',
            }}
          >
            {trend > 0 ? '+' : ''}{trend}% from last month
          </Typography>
        </Box>
      )}
    </Paper>
  </motion.div>
);

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [stats, setStats] = useState({
    totalScans: 156,
    completedScans: 142,
    pendingScans: 8,
    failedScans: 6,
  });

  const [recentScans, setRecentScans] = useState([
    {
      id: 1,
      title: 'Chest X-Ray',
      description: 'Routine check-up',
      status: 'completed',
      imageUrl: '/path/to/xray.jpg',
      progress: 100,
    },
    {
      id: 2,
      title: 'Brain MRI',
      description: 'Follow-up scan',
      status: 'processing',
      imageUrl: '/path/to/mri.jpg',
      progress: 65,
    },
    // Add more scans as needed
  ]);

  const handleView = (scan) => {
    console.log('View scan:', scan);
  };

  const handleDownload = (scan) => {
    console.log('Download scan:', scan);
  };

  const handleShare = (scan) => {
    console.log('Share scan:', scan);
  };

  const handleDelete = (scan) => {
    console.log('Delete scan:', scan);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #007AFF, #00C6FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dashboard
        </Typography>
        <IconButton
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
            },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Scans"
            value={stats.totalScans}
            icon={<TrendingUpIcon sx={{ color: '#007AFF' }} />}
            color="#007AFF"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completedScans}
            icon={<CheckCircleIcon sx={{ color: '#34C759' }} />}
            color="#34C759"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pendingScans}
            icon={<WarningIcon sx={{ color: '#FF9500' }} />}
            color="#FF9500"
            trend={-3}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed"
            value={stats.failedScans}
            icon={<WarningIcon sx={{ color: '#FF3B30' }} />}
            color="#FF3B30"
            trend={-2}
          />
        </Grid>
      </Grid>

      {/* Recent Scans */}
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 600,
          background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Recent Scans
      </Typography>
      <Grid container spacing={3}>
        {recentScans.map((scan) => (
          <Grid item xs={12} sm={6} md={4} key={scan.id}>
            <ScanCard
              scan={scan}
              onView={handleView}
              onDownload={handleDownload}
              onShare={handleShare}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 