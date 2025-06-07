'use client';

import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Effect to handle responsive sidebar state
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/results',
    '/upload',
    '/chat',
    '/voice',
    '/profile',
    '/settings',
  ];

  // Check if current route is protected
  const isProtectedRoute = () => {
    return protectedRoutes.some(route => pathname.startsWith(route));
  };

  // Redirect to login if accessing protected route without authentication
  useEffect(() => {
    if (!loading && !user && isProtectedRoute()) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // If on public route (like homepage or login), don't apply the layout
  const isPublicPage = ['/login', '/register', '/'].includes(pathname);

  if (isPublicPage) {
    return <>{children}</>;
  }
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        collapsed={sidebarCollapsed}
        toggleCollapsed={toggleSidebarCollapse}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: 0,
          width: '100%',
          ...(sidebarOpen && {
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: { 
              xs: 0, 
              md: sidebarCollapsed ? '80px' : '280px' 
            },
            width: { 
              xs: '100%', 
              md: `calc(100% - ${sidebarCollapsed ? 80 : 280}px)` 
            },
          }),
        }}
      >
        <Header 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          sidebarCollapsed={sidebarCollapsed}
        />
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            pt: { xs: '80px', sm: '90px' },
            minHeight: '100vh',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
} 