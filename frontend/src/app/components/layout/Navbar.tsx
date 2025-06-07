'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider,
  Avatar,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import ChatIcon from '@mui/icons-material/Chat';
import VoiceChatIcon from '@mui/icons-material/RecordVoiceOver';
import { useAuth } from '../../../contexts/AuthContext';

const drawerWidth = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
  { label: 'Results', icon: <AssignmentIcon />, href: '/results' },
  { label: 'Upload', icon: <UploadFileIcon />, href: '/upload/ct' },
  { label: 'Chat', icon: <ChatIcon />, href: '/chat' },
  { label: 'Voice', icon: <VoiceChatIcon />, href: '/voice' },
  { label: 'Help', icon: <HelpIcon />, href: '/help' },
  { label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1976d2 0%, #00bcd4 100%)',
          color: '#fff',
        },
      }}
    >
      <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
        <Avatar sx={{ width: 64, height: 64, mb: 1, bgcolor: '#fff' }}>
          <img src="/logo.png" alt="Logo" style={{ width: 48, height: 48 }} />
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
          Ai-Med System
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          {user?.name || 'Welcome'}
        </Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.label}
            component={Link}
            href={item.href}
            selected={pathname === item.href}
            sx={{
              color: pathname === item.href ? '#1976d2' : '#fff',
              background: pathname === item.href ? '#fff' : 'none',
              borderRadius: 2,
              mx: 1,
              my: 0.5,
              '&:hover': {
                background: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: pathname === item.href ? '#1976d2' : '#fff' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
      <List>
        <ListItem
          button
          component={Link}
          href="/profile"
          sx={{ color: '#fff', mx: 1, my: 0.5 }}
        >
          <ListItemIcon sx={{ color: '#fff' }}>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        <ListItem
          button
          onClick={logout}
          sx={{ color: '#fff', mx: 1, my: 0.5 }}
        >
          <ListItemIcon sx={{ color: '#fff' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
} 