'use client';

import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  useTheme, 
  alpha, 
  Tooltip,
  IconButton,
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import CountUp from 'react-countup';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  change?: number;
  changeText?: string;
  description?: string;
  startColor?: string;
  endColor?: string;
  isLoading?: boolean;
  isPercentage?: boolean;
  isCurrency?: boolean;
  suffix?: string;
  prefix?: string;
  formatter?: (value: number) => string;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  change, 
  changeText,
  description,
  startColor,
  endColor,
  isLoading = false,
  isPercentage = false,
  isCurrency = false,
  suffix = '',
  prefix = '',
  formatter,
}: StatCardProps) => {
  const theme = useTheme();
  
  const defaultStartColor = theme.palette.primary.main;
  const defaultEndColor = theme.palette.primary.dark;
  
  const iconBackgroundColor = alpha(startColor || defaultStartColor, 0.15);
  const iconColor = startColor || defaultStartColor;
  
  const isPositiveChange = change && change > 0;
  const isNegativeChange = change && change < 0;
  
  const formatValue = (val: number) => {
    if (formatter) return formatter(val);
    if (isCurrency) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    if (isPercentage) return `${val}%`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toString();
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        background: startColor && endColor 
          ? `linear-gradient(135deg, ${alpha(startColor, 0.05)} 0%, ${alpha(endColor, 0.08)} 100%)`
          : 'white',
        border: '1px solid',
        borderColor: startColor && endColor 
          ? `${alpha(startColor, 0.1)}`
          : alpha(theme.palette.grey[300], 0.8),
        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* Decorative elements */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          width: 80, 
          height: 80, 
          background: `linear-gradient(45deg, transparent 0%, ${alpha(startColor || defaultStartColor, 0.08)} 100%)`,
          borderRadius: '0 0 0 100%',
        }} 
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          sx={{ 
            fontWeight: 500,
            mb: 0.5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {title}
          {description && (
            <Tooltip title={description} arrow placement="top">
              <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                <InfoIcon fontSize="small" sx={{ color: alpha(theme.palette.text.secondary, 0.6), fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Typography>
        
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: iconBackgroundColor,
            borderRadius: '12px',
            p: 1.5,
            color: iconColor,
          }}
        >
          {icon}
        </Box>
      </Box>
      
      <Box>
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            fontWeight: 700,
            color: startColor || theme.palette.text.primary,
            mb: 1,
          }}
        >
          {isLoading ? (
            <Box sx={{ height: 40, width: '70%', bgcolor: alpha(theme.palette.grey[200], 0.7), borderRadius: 1 }} />
          ) : (
            <>
              {prefix}
              <CountUp 
                end={value} 
                separator="," 
                duration={2}
                decimals={isPercentage ? 1 : 0}
                decimal="."
                formattingFn={(val) => formatValue(val)}
              />
              {suffix}
            </>
          )}
        </Typography>
        
        {(change !== undefined || changeText) && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {change !== undefined && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  bgcolor: isPositiveChange 
                    ? alpha(theme.palette.success.main, 0.1) 
                    : isNegativeChange 
                      ? alpha(theme.palette.error.main, 0.1)
                      : alpha(theme.palette.grey[400], 0.1),
                  color: isPositiveChange 
                    ? theme.palette.success.main 
                    : isNegativeChange 
                      ? theme.palette.error.main
                      : theme.palette.grey[600],
                  borderRadius: '4px',
                  px: 1,
                  py: 0.5,
                  mr: 1,
                }}
              >
                {isPositiveChange ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                <Typography variant="caption" sx={{ fontWeight: 600, ml: 0.5 }}>
                  {Math.abs(change)}%
                </Typography>
              </Box>
            )}
            
            {changeText && (
              <Typography variant="caption" color="text.secondary">
                {changeText}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default StatCard;
