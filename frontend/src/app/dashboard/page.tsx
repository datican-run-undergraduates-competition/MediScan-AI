'use client';

import React from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  useTheme, 
  alpha, 
  Paper,
  Avatar,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Tab,
  Tabs,
  Checkbox,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon,
  MonitorHeart as HeartIcon,
  MedicalServices as MedicalIcon,
  BiotechOutlined as LabIcon,
  EventAvailable as AppointmentIcon,
  PeopleAlt as PatientIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationIcon,
  BarChart as BarChartIcon,
  Timeline as LineChartIcon,
  DonutSmall as DonutIcon,
  CheckCircle as CheckIcon,
  MoreVert as MoreIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  Article as ArticleIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import StatCard from '../components/dashboard/StatCard';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Chart data & options
const lineChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'CT Scans',
      data: [65, 59, 80, 81, 56, 55, 72],
      fill: true,
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
        return gradient;
      },
      borderColor: '#2563EB',
      borderWidth: 2,
      tension: 0.4,
      pointBackgroundColor: '#FFFFFF',
      pointBorderColor: '#2563EB',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
    {
      label: 'MRI Scans',
      data: [28, 48, 40, 19, 86, 27, 90],
      fill: true,
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        return gradient;
      },
      borderColor: '#06B6D4',
      borderWidth: 2,
      tension: 0.4,
      pointBackgroundColor: '#FFFFFF',
      pointBorderColor: '#06B6D4',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        boxWidth: 10,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1F2937',
      bodyColor: '#4B5563',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1,
      padding: 12,
      boxWidth: 10,
      usePointStyle: true,
      boxPadding: 6,
      bodyFont: {
        size: 12,
      },
      titleFont: {
        size: 14,
        weight: 'bold',
      },
    },
  },
  scales: {
    y: {
      grid: {
        display: true,
        drawBorder: false,
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 10,
        },
        color: '#6B7280',
        padding: 10,
      },
      beginAtZero: true,
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 10,
        },
        color: '#6B7280',
      },
    },
  },
  elements: {
    line: {
      borderJoinStyle: 'round',
    },
  },
};

const barChartData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Patients',
      data: [35, 45, 40, 50, 42, 25, 18],
      backgroundColor: [
        'rgba(37, 99, 235, 0.8)',
        'rgba(37, 99, 235, 0.8)',
        'rgba(37, 99, 235, 0.8)',
        'rgba(37, 99, 235, 0.8)',
        'rgba(37, 99, 235, 0.8)',
        'rgba(37, 99, 235, 0.8)',
        'rgba(37, 99, 235, 0.8)',
      ],
      borderRadius: 8,
      borderWidth: 0,
      maxBarThickness: 16,
    },
  ],
};

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1F2937',
      bodyColor: '#4B5563',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1,
      padding: 12,
      boxWidth: 10,
      usePointStyle: true,
      boxPadding: 6,
      bodyFont: {
        size: 12,
      },
      titleFont: {
        size: 14,
        weight: 'bold',
      },
    },
  },
  scales: {
    y: {
      grid: {
        display: true,
        drawBorder: false,
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 10,
        },
        color: '#6B7280',
        padding: 10,
      },
      beginAtZero: true,
    },
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        font: {
          size: 10,
        },
        color: '#6B7280',
      },
    },
  },
};

const doughnutChartData = {
  labels: ['CT Scans', 'MRI Scans', 'X-Rays', 'Ultrasounds', 'Other'],
  datasets: [
    {
      data: [35, 25, 20, 15, 5],
      backgroundColor: [
        '#2563EB',
        '#06B6D4',
        '#10B981',
        '#F59E0B',
        '#6B7280',
      ],
      borderWidth: 0,
      borderRadius: 4,
      hoverOffset: 5,
    },
  ],
};

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        boxWidth: 12,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 15,
        font: {
          size: 11,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1F2937',
      bodyColor: '#4B5563',
      borderColor: 'rgba(0, 0, 0, 0.1)',
      borderWidth: 1,
      padding: 12,
      boxWidth: 10,
      usePointStyle: true,
      boxPadding: 6,
      bodyFont: {
        size: 12,
      },
      titleFont: {
        size: 14,
        weight: 'bold',
      },
      callbacks: {
        label: function(context: any) {
          const label = context.label || '';
          const value = context.formattedValue;
          return `${label}: ${value}%`;
        }
      }
    },
  },
};

// Types for our data
interface Appointment {
  id: number;
  patientName: string;
  patientAvatar?: string;
  date: string;
  time: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  doctor: string;
}

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

// Mock data
const upcomingAppointments: Appointment[] = [
  {
    id: 1,
    patientName: 'Sarah Johnson',
    patientAvatar: '/assets/avatars/patient1.jpg',
    date: 'Today',
    time: '10:00 AM',
    type: 'CT Scan',
    status: 'upcoming',
    doctor: 'Dr. Michael Chen',
  },
  {
    id: 2,
    patientName: 'Robert Smith',
    patientAvatar: '/assets/avatars/patient2.jpg',
    date: 'Today',
    time: '1:30 PM',
    type: 'MRI',
    status: 'upcoming',
    doctor: 'Dr. Emily Rodriguez',
  },
  {
    id: 3,
    patientName: 'Jennifer Williams',
    patientAvatar: '/assets/avatars/patient3.jpg',
    date: 'Tomorrow',
    time: '9:15 AM',
    type: 'X-Ray',
    status: 'upcoming',
    doctor: 'Dr. James Wilson',
  },
  {
    id: 4,
    patientName: 'David Garcia',
    patientAvatar: '/assets/avatars/patient4.jpg',
    date: 'May 10',
    time: '11:45 AM',
    type: 'CT Scan',
    status: 'upcoming',
    doctor: 'Dr. Sarah Lee',
  },
];

const recentNotifications: Notification[] = [
  {
    id: 1,
    title: 'New CT Scan Results',
    description: 'CT Scan for patient #12345 has been processed.',
    time: '10 mins ago',
    read: false,
    type: 'info',
  },
  {
    id: 2,
    title: 'System Update Complete',
    description: 'AI model has been updated to version 2.3.0.',
    time: '1 hour ago',
    read: false,
    type: 'success',
  },
  {
    id: 3,
    title: 'Database Maintenance',
    description: 'Scheduled maintenance in 24 hours.',
    time: '3 hours ago',
    read: true,
    type: 'warning',
  },
];

const tasks: Task[] = [
  { id: 1, title: 'Review CT scan results for patient #1234', completed: false, priority: 'high' },
  { id: 2, title: 'Update AI training dataset', completed: false, priority: 'medium' },
  { id: 3, title: 'Prepare monthly analytics report', completed: true, priority: 'medium' },
  { id: 4, title: 'Check system for updates', completed: true, priority: 'low' },
];

export default function Dashboard() {
  const theme = useTheme();
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's an overview of your medical imaging analytics.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AssessmentIcon />}
          sx={{ 
            px: 3, 
            py: 1.2, 
            borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)',
          }}
        >
          Generate Report
        </Button>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Scans"
            value={1254}
            icon={<MedicalIcon />}
            change={8.2}
            changeText="vs. last month"
            startColor={theme.palette.primary.main}
            endColor={theme.palette.primary.dark}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Diagnoses"
            value={824}
            icon={<AssessmentIcon />}
            change={5.1}
            changeText="vs. last month"
            startColor={theme.palette.secondary.main}
            endColor={theme.palette.secondary.dark}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Patients"
            value={567}
            icon={<PatientIcon />}
            change={-2.3}
            changeText="vs. last month"
            startColor="#F59E0B"
            endColor="#B45309"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Success Rate"
            value={96.8}
            icon={<CheckIcon />}
            change={1.2}
            changeText="vs. last month"
            isPercentage={true}
            startColor="#10B981"
            endColor="#047857"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            height: '100%',
            p: 1,
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Scan Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly scan volume by type
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="View as Bar Chart">
                    <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <BarChartIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View as Line Chart">
                    <IconButton size="small" sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <LineChartIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="More Options">
                    <IconButton size="small">
                      <MoreIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box sx={{ height: 350 }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            height: '100%',
            p: 1,
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Scan Distribution
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    By scan type
                  </Typography>
                </Box>
                <Tooltip title="More Options">
                  <IconButton size="small">
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
              </Box>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  2,367
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total scans this quarter
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Appointments */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            height: '100%',
            p: 1,
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Upcoming Appointments
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip title="View Calendar">
                    <IconButton size="small" sx={{ mr: 1 }}>
                      <CalendarIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button 
                    variant="outlined" 
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ 
                      borderRadius: '8px',
                      textTransform: 'none',
                    }}
                  >
                    View All
                  </Button>
                </Box>
              </Box>
              
              <List sx={{ p: 0 }}>
                {upcomingAppointments.map((appointment, index) => (
                  <React.Fragment key={appointment.id}>
                    <ListItem 
                      alignItems="flex-start" 
                      sx={{ 
                        px: 1, 
                        py: 1.5,
                        borderRadius: '12px',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={appointment.patientAvatar} 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                          }}
                        >
                          {appointment.patientName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {appointment.patientName}
                            </Typography>
                            <Chip 
                              label={appointment.type} 
                              size="small"
                              sx={{ 
                                borderRadius: '4px',
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                fontWeight: 500,
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', color: theme.palette.text.secondary }} />
                                {appointment.date}, {appointment.time}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.doctor}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < upcomingAppointments.length - 1 && (
                      <Divider variant="inset" component="li" sx={{ my: 0.5 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Weekly Stats */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            height: '100%',
            p: 1,
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Weekly Patient Load
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patients per day
                  </Typography>
                </Box>
                <Box>
                  <Chip 
                    icon={<TrendingUpIcon fontSize="small" />} 
                    label="+12.5% vs. last week" 
                    size="small"
                    sx={{ 
                      borderRadius: '16px',
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ height: 230 }}>
                <Bar data={barChartData} options={barChartOptions} />
              </Box>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Department Workload
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">CT Department</Typography>
                    <Typography variant="body2" fontWeight={600}>78%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={78} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.primary.main,
                        borderRadius: 4,
                      }
                    }} 
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">MRI Department</Typography>
                    <Typography variant="body2" fontWeight={600}>64%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={64} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.secondary.main,
                        borderRadius: 4,
                      }
                    }} 
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">X-Ray Department</Typography>
                    <Typography variant="body2" fontWeight={600}>92%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={92} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha('#F59E0B', 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#F59E0B',
                        borderRadius: 4,
                      }
                    }} 
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Notifications & Tasks */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            height: '100%',
            p: 1,
          }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderRadius: '3px 3px 0 0',
                    },
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    },
                  }}
                >
                  <Tab 
                    label="Notifications" 
                    icon={<NotificationIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label="Tasks" 
                    icon={<ArticleIcon />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
              
              <Box sx={{ pt: 1 }}>
                {tabValue === 0 && (
                  <List sx={{ p: 0 }}>
                    {recentNotifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem 
                          alignItems="flex-start" 
                          sx={{ 
                            px: 1, 
                            py: 1.5,
                            borderRadius: '12px',
                            position: 'relative',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                            },
                            ...(notification.read ? {} : {
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: -4,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 8,
                                height: 8,
                                bgcolor: theme.palette.primary.main,
                                borderRadius: '50%',
                              }
                            })
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: 
                                  notification.type === 'info' 
                                    ? alpha(theme.palette.primary.main, 0.1)
                                    : notification.type === 'warning'
                                      ? alpha(theme.palette.warning.main, 0.1)
                                      : alpha(theme.palette.success.main, 0.1),
                                color: 
                                  notification.type === 'info' 
                                    ? theme.palette.primary.main
                                    : notification.type === 'warning'
                                      ? theme.palette.warning.main
                                      : theme.palette.success.main,
                              }}
                            >
                              {notification.type === 'info' && <MedicalIcon />}
                              {notification.type === 'warning' && <NotificationIcon />}
                              {notification.type === 'success' && <CheckIcon />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {notification.title}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" component="span" color="text.secondary">
                                  {notification.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  {notification.time}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentNotifications.length - 1 && (
                          <Divider variant="inset" component="li" sx={{ my: 0.5 }} />
                        )}
                      </React.Fragment>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button 
                        variant="text" 
                        sx={{ 
                          textTransform: 'none',
                          fontSize: '0.9rem',
                        }}
                      >
                        View All Notifications
                      </Button>
                    </Box>
                  </List>
                )}
                
                {tabValue === 1 && (
                  <List sx={{ p: 0 }}>
                    {tasks.map((task, index) => (
                      <ListItem 
                        key={task.id}
                        sx={{ 
                          px: 1, 
                          py: 1.5,
                          borderRadius: '12px',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        <Box sx={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          mr: 2,
                          bgcolor: task.priority === 'high' 
                            ? alpha(theme.palette.error.main, 0.9)
                            : task.priority === 'medium'
                              ? alpha(theme.palette.warning.main, 0.9)
                              : alpha(theme.palette.success.main, 0.9),
                          }}
                        />
                        <ListItemText
                          primary={
                            <Typography 
                              variant="body1"
                              sx={{ 
                                textDecoration: task.completed ? 'line-through' : 'none',
                                color: task.completed ? 'text.secondary' : 'text.primary',
                              }}
                            >
                              {task.title}
                            </Typography>
                          }
                        />
                        <Checkbox 
                          checked={task.completed}
                          color="primary"
                          sx={{ 
                            '&.Mui-checked': {
                              color: theme.palette.primary.main,
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button 
                        variant="text" 
                        sx={{ 
                          textTransform: 'none',
                          fontSize: '0.9rem',
                        }}
                      >
                        View All Tasks
                      </Button>
                    </Box>
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
