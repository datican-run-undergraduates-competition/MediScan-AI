import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Image as ImageIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Define the status type
type StatusType = 'success' | 'warning' | 'error' | 'info';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

interface StatusChipProps {
  status: StatusType;
}

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})<StatusChipProps>(({ theme, status }) => ({
  backgroundColor: 
    status === 'success' ? theme.palette.success.light :
    status === 'warning' ? theme.palette.warning.light :
    status === 'error' ? theme.palette.error.light :
    theme.palette.info.light,
  color: theme.palette.getContrastText(
    status === 'success' ? theme.palette.success.light :
    status === 'warning' ? theme.palette.warning.light :
    status === 'error' ? theme.palette.error.light :
    theme.palette.info.light
  ),
}));

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Mock data - replace with actual data from your backend
  const stats = {
    totalScans: 156,
    pendingAnalysis: 12,
    completedAnalysis: 144,
    accuracy: 98.5,
  };

  const recentScans = [
    {
      id: 1,
      patient: 'John Doe',
      type: 'Chest X-Ray',
      date: '2024-03-15',
      status: 'completed',
      confidence: 0.95,
    },
    {
      id: 2,
      patient: 'Jane Smith',
      type: 'Brain MRI',
      date: '2024-03-15',
      status: 'pending',
      confidence: 0.0,
    },
    // Add more mock data as needed
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
          <PersonIcon />
        </Avatar>
        <Typography variant="h6">Medical AI</Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><ImageIcon /></ListItemIcon>
          <ListItemText primary="Medical Scans" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><ChatIcon /></ListItemIcon>
          <ListItemText primary="AI Assistant" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><AssessmentIcon /></ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItem>
        <ListItem button>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* App Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          bgcolor: 'white',
          boxShadow: 1,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Medical AI Dashboard
        </Typography>
        <IconButton color="inherit">
          <NotificationsIcon />
        </IconButton>
      </Box>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: 250,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 250,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: isMobile ? 0 : '250px',
        }}
      >
        <Container maxWidth="xl">
          {/* Stats Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Scans
                </Typography>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {stats.totalScans}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All time
                </Typography>
              </StyledPaper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Pending Analysis
                </Typography>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {stats.pendingAnalysis}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  In queue
                </Typography>
              </StyledPaper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {stats.completedAnalysis}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Successfully analyzed
                </Typography>
              </StyledPaper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Accuracy
                </Typography>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {stats.accuracy}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall system accuracy
                </Typography>
              </StyledPaper>
            </Grid>
          </Grid>

          {/* Recent Scans */}
          <Typography variant="h5" sx={{ mb: 3 }}>
            Recent Scans
          </Typography>
          <Grid container spacing={3}>
            {recentScans.map((scan) => (
              <Grid item xs={12} md={6} key={scan.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{scan.patient}</Typography>
                      <StatusChip
                        label={scan.status}
                        status={scan.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {scan.type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Date: {scan.date}
                    </Typography>
                    {scan.status === 'completed' && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Confidence Score
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={scan.confidence * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {(scan.confidence * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Quick Actions */}
          <Typography variant="h5" sx={{ mt: 4, mb: 3 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ImageIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">New Scan</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Upload and analyze a new medical image
                </Typography>
              </StyledPaper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ChatIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">AI Assistant</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Get help from our AI medical assistant
                </Typography>
              </StyledPaper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TimelineIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">Reports</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  View detailed analysis reports
                </Typography>
              </StyledPaper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StyledPaper>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SettingsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6">Settings</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Configure system preferences
                </Typography>
              </StyledPaper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 