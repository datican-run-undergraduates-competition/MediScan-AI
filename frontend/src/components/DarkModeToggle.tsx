'use client';

import React from 'react';
import { 
  IconButton, 
  Tooltip, 
  useTheme, 
  alpha, 
  Switch, 
  FormControlLabel 
} from '@mui/material';
import { 
  DarkMode as DarkModeIcon, 
  LightMode as LightModeIcon 
} from '@mui/icons-material';
import { useDarkMode } from '../contexts/DarkModeContext';

interface DarkModeToggleProps {
  variant?: 'icon' | 'switch';
  size?: 'small' | 'medium' | 'large';
  tooltip?: boolean;
}

export default function DarkModeToggle({ 
  variant = 'icon', 
  size = 'medium',
  tooltip = true
}: DarkModeToggleProps) {
  const theme = useTheme();
  const { darkMode, toggleDarkMode } = useDarkMode();
  
  if (variant === 'switch') {
    return (
      <FormControlLabel
        control={
          <Switch
            checked={darkMode}
            onChange={toggleDarkMode}
            name="darkMode"
            color="primary"
            size={size === 'large' ? 'medium' : 'small'}
          />
        }
        label={darkMode ? "Dark Mode" : "Light Mode"}
      />
    );
  }
  
  const button = (
    <IconButton
      size={size}
      color="inherit"
      onClick={toggleDarkMode}
      sx={{
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.main,
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.2),
        },
      }}
    >
      {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
  
  if (tooltip) {
    return (
      <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
        {button}
      </Tooltip>
    );
  }
  
  return button;
} 