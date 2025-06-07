'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Divider,
  Badge,
  Tooltip,
  alpha,
  useTheme,
  Collapse,
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Assessment as ResultsIcon,
  CloudUpload as UploadIcon,
  Chat as ChatIcon,
  RecordVoiceOver as VoiceIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  MedicalServices as MedicalIcon,
  LocalHospital as HospitalIcon,
  CheckCircle as CheckCircleIcon,
  Notifications as NotificationsIcon,
  BarChart as AnalyticsIcon,
  KeyboardDoubleArrowLeft as CollapseIcon,
  KeyboardDoubleArrowRight as ExpandIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  subitems?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
  { label: 'Results', icon: <ResultsIcon />, href: '/results', badge: 2 },
  { 
    label: 'Upload', 
    icon: <UploadIcon />,
    subitems: [
      { label: 'CT Scan', icon: <MedicalIcon />, href: '/upload/ct' },
      { label: 'MRI', icon: <MedicalIcon />, href: '/upload/mri' },
      { label: 'X-Ray', icon: <MedicalIcon />, href: '/upload/xray' },
      { label: 'Report', icon: <MedicalIcon />, href: '/upload/report' },
    ]
  },
  { label: 'Chat Assistant', icon: <ChatIcon />, href: '/chat' },
  { label: 'Voice Commands', icon: <VoiceIcon />, href: '/voice' },
  { label: 'Analytics', icon: <AnalyticsIcon />, href: '/dashboard/analytics' },
  { label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
  { label: 'Help', icon: <HelpIcon />, href: '/help' },
];

const Sidebar = ({ open, onClose, collapsed, toggleCollapsed }: SidebarProps) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const toggleMenu = (label: string) => {
    if (collapsed) return;
    setExpandedMenu(expandedMenu === label ? null : label);
  };
  
  const isActive = (href: string) => pathname === href;
  
  const drawerWidth = collapsed ? 80 : 280;
  
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          border: 'none',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)}, ${alpha(theme.palette.primary.dark, 0.95)})`,
          color: 'white',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Decorative elements */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '-150px', 
            right: '-150px', 
            width: '300px', 
            height: '300px', 
            borderRadius: '50%', 
            background: alpha(theme.palette.primary.light, 0.3),
            filter: 'blur(40px)',
            zIndex: 0,
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: '-100px', 
            left: '-100px', 
            width: '200px', 
            height: '200px', 
            borderRadius: '50%', 
            background: alpha(theme.palette.secondary.main, 0.4),
            filter: 'blur(40px)',
            zIndex: 0,
          }} 
        />
        
        {/* Header with close/collapse buttons */}
        <Box 
          sx={{ 
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'space-between',
            alignItems: 'center',
            p: 1,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {!collapsed && (
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <ChevronLeftIcon />
              </IconButton>
            </Box>
          )}
          
          <IconButton 
            onClick={toggleCollapsed} 
            sx={{ 
              color: 'white',
              bgcolor: alpha('#fff', 0.1),
              '&:hover': { bgcolor: alpha('#fff', 0.2) },
              display: { xs: 'none', md: 'flex' },
              ...(collapsed && { margin: '0 auto' }),
            }}
          >
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </IconButton>
        </Box>

        {/* Logo & User Info */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: collapsed ? 'center' : 'center', 
            p: collapsed ? 1 : 3, 
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box 
            sx={{ 
              mb: collapsed ? 1 : 2, 
              display: 'flex', 
              alignItems: 'center', 
              gap: collapsed ? 0 : 1.5,
              justifyContent: 'center',
              flexDirection: collapsed ? 'column' : 'row',
            }}
          >
            <Avatar
              sx={{ 
                width: 44, 
                height: 44, 
                bgcolor: 'white',
                color: theme.palette.primary.main,
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
              }}
            >
              <HospitalIcon />
            </Avatar>
            
            {!collapsed && (
              <Typography 
                variant="h6" 
                component="h1" 
                sx={{ 
                  fontWeight: 800, 
                  letterSpacing: '0.02em',
                  background: 'linear-gradient(45deg, #FFFFFF, #E6F0FD)',
                  backgroundClip: 'text',
                  textFillColor: 'transparent',
                }}
              >
                Ai-Med
              </Typography>
            )}
          </Box>
          
          {!collapsed && (
            <Divider 
              sx={{ 
                width: '80%', 
                my: 2, 
                borderColor: alpha('#fff', 0.2),
              }} 
            />
          )}
          
          <Box sx={{ position: 'relative', mb: collapsed ? 1 : 1 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <CheckCircleIcon 
                  sx={{ 
                    fontSize: 18, 
                    color: theme.palette.success.main,
                    background: 'white',
                    borderRadius: '50%',
                  }}
                />
              }
            >
              <Avatar 
                src="/assets/avatar.png" 
                alt={user?.name || 'User'} 
                sx={{ 
                  width: collapsed ? 40 : 56, 
                  height: collapsed ? 40 : 56,
                  boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
                  border: '2px solid white',
                }} 
              />
            </Badge>
          </Box>
          
          {!collapsed && (
            <>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                }}
              >
                {user?.name || 'Guest User'}
              </Typography>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  color: alpha('#fff', 0.8),
                  mb: 1,
                }}
              >
                Medical Specialist
              </Typography>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  mb: 2,
                }}
              >
                <Tooltip title="Notifications">
                  <IconButton 
                    size="small" 
                    sx={{ 
                      color: alpha('#fff', 0.9),
                      bgcolor: alpha('#fff', 0.1),
                      '&:hover': { bgcolor: alpha('#fff', 0.2) },
                    }}
                  >
                    <Badge badgeContent={3} color="error">
                      <NotificationsIcon fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Settings">
                  <IconButton 
                    size="small" 
                    component={Link}
                    href="/settings"
                    sx={{ 
                      color: alpha('#fff', 0.9),
                      bgcolor: alpha('#fff', 0.1),
                      '&:hover': { bgcolor: alpha('#fff', 0.2) },
                    }}
                  >
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Profile">
                  <IconButton 
                    size="small" 
                    component={Link}
                    href="/profile"
                    sx={{ 
                      color: alpha('#fff', 0.9),
                      bgcolor: alpha('#fff', 0.1),
                      '&:hover': { bgcolor: alpha('#fff', 0.2) },
                    }}
                  >
                    <PersonIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </Box>

        {/* Navigation */}
        <Box 
          sx={{ 
            overflowY: 'auto', 
            flex: 1,
            position: 'relative',
            zIndex: 1,
            px: collapsed ? 1 : 2,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: alpha('#fff', 0.2),
              borderRadius: '3px',
            },
          }}
        >
          <List component="nav" sx={{ py: 1 }}>
            {navItems.map((item) => (
              <React.Fragment key={item.label}>
                {item.subitems ? (
                  // Item with sub-menu
                  <>
                    <Tooltip 
                      title={collapsed ? item.label : ""}
                      placement="right"
                      arrow
                      disableHoverListener={!collapsed}
                    >
                      <ListItemButton
                        onClick={() => toggleMenu(item.label)}
                        sx={{
                          borderRadius: '12px',
                          mb: 0.5,
                          px: collapsed ? 1 : 2,
                          py: collapsed ? 1.5 : 1,
                          minHeight: collapsed ? 48 : 'auto',
                          justifyContent: collapsed ? 'center' : 'flex-start',
                          bgcolor: expandedMenu === item.label ? alpha('#fff', 0.1) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha('#fff', 0.1),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ 
                          color: 'white', 
                          minWidth: collapsed ? 0 : 40,
                          mr: collapsed ? 0 : 2,
                          justifyContent: 'center',
                        }}>
                          {item.icon}
                        </ListItemIcon>
                        
                        {!collapsed && (
                          <>
                            <ListItemText 
                              primary={item.label} 
                              primaryTypographyProps={{ 
                                fontSize: '0.95rem',
                                fontWeight: 500,
                              }} 
                            />
                            {expandedMenu === item.label ? <ArrowUpIcon /> : <ArrowDownIcon />}
                          </>
                        )}
                      </ListItemButton>
                    </Tooltip>
                    
                    {!collapsed && (
                      <Collapse in={expandedMenu === item.label} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.subitems.map((subitem) => (
                            <ListItemButton
                              key={subitem.label}
                              component={Link}
                              href={subitem.href || '#'}
                              selected={isActive(subitem.href || '')}
                              sx={{
                                pl: 4,
                                py: 0.75,
                                borderRadius: '12px',
                                mb: 0.5,
                                color: 'white',
                                bgcolor: isActive(subitem.href || '') ? alpha('#fff', 0.15) : 'transparent',
                                '&:hover': {
                                  bgcolor: alpha('#fff', 0.1),
                                },
                                '&.Mui-selected': {
                                  bgcolor: alpha('#fff', 0.15),
                                  '&:hover': {
                                    bgcolor: alpha('#fff', 0.2),
                                  },
                                },
                              }}
                            >
                              <ListItemIcon sx={{ color: 'white', minWidth: 36 }}>
                                {subitem.icon}
                              </ListItemIcon>
                              <ListItemText 
                                primary={subitem.label} 
                                primaryTypographyProps={{ 
                                  fontSize: '0.875rem',
                                  fontWeight: 500,
                                }} 
                              />
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    )}
                  </>
                ) : (
                  // Regular menu item
                  <Tooltip 
                    title={collapsed ? item.label : ""}
                    placement="right"
                    arrow
                    disableHoverListener={!collapsed}
                  >
                    <ListItemButton
                      component={Link}
                      href={item.href || '#'}
                      selected={isActive(item.href || '')}
                      sx={{
                        borderRadius: '12px',
                        mb: 0.5,
                        px: collapsed ? 1 : 2,
                        py: collapsed ? 1.5 : 1,
                        minHeight: collapsed ? 48 : 'auto',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        color: 'white',
                        bgcolor: isActive(item.href || '') ? alpha('#fff', 0.15) : 'transparent',
                        '&:hover': {
                          bgcolor: alpha('#fff', 0.1),
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha('#fff', 0.15),
                          '&:hover': {
                            bgcolor: alpha('#fff', 0.2),
                          },
                        },
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: 'white', 
                        minWidth: collapsed ? 0 : 40,
                        mr: collapsed ? 0 : 2,
                        justifyContent: 'center',
                      }}>
                        {item.badge && !collapsed ? (
                          <Badge badgeContent={item.badge} color="error">
                            {item.icon}
                          </Badge>
                        ) : item.icon}
                      </ListItemIcon>
                      
                      {!collapsed && (
                        <ListItemText 
                          primary={item.label} 
                          primaryTypographyProps={{ 
                            fontSize: '0.95rem',
                            fontWeight: 500,
                          }} 
                        />
                      )}
                      
                      {!collapsed && item.badge && (
                        <Badge 
                          badgeContent={item.badge} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.6rem',
                              height: 18,
                              minWidth: 18,
                            }
                          }}
                        />
                      )}
                    </ListItemButton>
                  </Tooltip>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Logout */}
        <Box 
          sx={{ 
            p: collapsed ? 1 : 2, 
            borderTop: `1px solid ${alpha('#fff', 0.1)}`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Tooltip 
            title={collapsed ? "Logout" : ""}
            placement="right"
            arrow
            disableHoverListener={!collapsed}
          >
            <ListItemButton
              onClick={logout}
              sx={{
                borderRadius: '12px',
                bgcolor: alpha('#fff', 0.08),
                px: collapsed ? 1 : 2,
                py: collapsed ? 1.5 : 1,
                minHeight: collapsed ? 48 : 'auto',
                justifyContent: collapsed ? 'center' : 'flex-start',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.15),
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: 'white', 
                minWidth: collapsed ? 0 : 40,
                mr: collapsed ? 0 : 2,
                justifyContent: 'center',
              }}>
                <LogoutIcon />
              </ListItemIcon>
              
              {!collapsed && (
                <ListItemText 
                  primary="Logout" 
                  primaryTypographyProps={{ 
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }} 
                />
              )}
            </ListItemButton>
          </Tooltip>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
