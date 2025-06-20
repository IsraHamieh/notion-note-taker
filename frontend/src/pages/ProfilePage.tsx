import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1">
          Email: {user?.email}
        </Typography>
        {user?.name && (
          <Typography variant="body1">
            Name: {user.name}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ProfilePage; 