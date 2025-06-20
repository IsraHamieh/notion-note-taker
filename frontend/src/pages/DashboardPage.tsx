import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1">
          Welcome back, {user?.name || user?.email}!
        </Typography>
      </Paper>
    </Box>
  );
};

export default DashboardPage; 