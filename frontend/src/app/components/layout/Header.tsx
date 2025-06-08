'use client';

import React, { useState } from 'react';
import { 
  AppBar,
  Toolbar,
  IconButton,
  Box,
  TextField,
  InputAdornment,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Typography,
  useTheme,
  alpha,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  NightlightRound as DarkModeIcon,
  LightMode as LightModeIcon,
  InsertInvitation as CalendarIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import Link from 'next/link';

interface HeaderProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  sidebarCollapsed?: boolean;
}

export default function Header({ sidebarOpen, toggleSidebar, sidebarCollapsed = false }: HeaderProps) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsClose = () => {
    setNotificationAnchorEl(null);
  };

  const menuId = 'profile-menu';
  const notificationsId = 'notifications-menu';
  
  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New Analysis Complete',
      description: 'CT Scan analysis has been completed.',
      time: '10 minutes ago',
      unread: true,
    },
    {
      id: 2,
      title: 'System Update',
      description: 'AI models have been updated to the latest version.',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 3,
      title: 'New Message',
      description: 'Dr. Smith sent you a message regarding Patient #1234.',
      time: '3 hours ago',
      unread: false,
    },
  ];
  
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        backdropFilter: 'blur(20px)',
        backgroundColor: alpha(theme.palette.background.default, 0.8),
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        zIndex: theme.zIndex.drawer - 1,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        ...(sidebarOpen && {
          width: { 
            xs: '100%', 
            md: sidebarCollapsed ? `calc(100% - 80px)` : `calc(100% - 280px)` 
          },
          marginLeft: { 
            xs: 0, 
            md: sidebarCollapsed ? '80px' : '280px' 
          },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }),
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left side - Hamburger & Search */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={toggleSidebar}
            edge="start"
            sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Paper
            component="form"
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: { xs: 200, sm: 300, md: 400 },
              height: 42,
              px: 2,
              py: 0.5,
              ml: { xs: 0, md: 2 },
              borderRadius: '16px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              bgcolor: alpha(theme.palette.background.paper, 0.8),
            }}
          >
            <InputAdornment position="start" sx={{ mr: 1 }}>
              <SearchIcon color="action" />
            </InputAdornment>
            <TextField
              fullWidth
              placeholder="Search..."
              variant="standard"
              InputProps={{
                disableUnderline: true,
              }}
              sx={{
                '& input': {
                  fontSize: '0.95rem',
                },
              }}
            />
          </Paper>
        </Box>
        
        {/* Right side - Actions & Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* Calendar Button - visible on larger screens */}
          <Button
            variant="outlined"
            startIcon={<CalendarIcon />}
            sx={{
              display: { xs: 'none', md: 'flex' },
              borderRadius: '12px',
              textTransform: 'none',
              px: 2,
              py: 1,
              borderColor: alpha(theme.palette.primary.main, 0.5),
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            Schedule
          </Button>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton 
              size="large"
              aria-label="show new notifications"
              aria-controls={notificationsId}
              aria-haspopup="true"
              onClick={handleNotificationsOpen}
              color="inherit"
              sx={{ 
                position: 'relative',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <Badge badgeContent={2} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Theme Toggle - visible on larger screens */}
          <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton
              size="large"
              color="inherit"
              onClick={toggleDarkMode}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          {/* Profile Avatar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              ml: 1,
              borderRadius: '24px',
              py: 0.5,
              px: { xs: 0.5, sm: 1 },
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
            onClick={handleProfileMenuOpen}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.palette.primary.main,
                cursor: 'pointer'
              }}
              onClick={handleProfileMenuOpen}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" component="div" sx={{ fontWeight: 600 }}>
                {user?.name || 'Guest User'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Medical Specialist
              </Typography>
            </Box>
            <ArrowDropDownIcon sx={{ color: theme.palette.text.secondary, display: { xs: 'none', sm: 'block' } }} />
          </Box>
        </Box>
      </Toolbar>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        id={notificationsId}
        keepMounted
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationsClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            width: 360,
            overflow: 'visible',
            mt: 1.5,
            borderRadius: '16px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
          <Button size="small" sx={{ textTransform: 'none' }}>
            Mark all as read
          </Button>
        </Box>
        <Divider />
        {notifications.map((notification) => (
          <MenuItem 
            key={notification.id} 
            onClick={handleNotificationsClose} 
            sx={{ 
              py: 1.5,
              px: 2,
              borderLeft: notification.unread ? `3px solid ${theme.palette.primary.main}` : 'none',
              bgcolor: notification.unread ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
            }}
          >
            <Box sx={{ width: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={600}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.time}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {notification.description}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button
            fullWidth
            sx={{ 
              textTransform: 'none',
              borderRadius: '12px',
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id={menuId}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            width: 220,
            overflow: 'visible',
            mt: 1.5,
            borderRadius: '16px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.name || 'Guest User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'guest@example.com'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem component={Link} href="/profile" onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem component={Link} href="/settings" onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { handleProfileMenuClose(); logout(); }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
