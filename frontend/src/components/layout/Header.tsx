import React from 'react';
import { Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const Header = () => {
  const theme = useTheme();
  const user = { name: 'John Doe' }; // Replace with actual user data

  const handleProfileMenuOpen = () => {
    // Implement the logic to open the profile menu
  };

  return (
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
  );
};

export default Header; 