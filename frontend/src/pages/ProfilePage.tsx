import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Button, CircularProgress, Stack } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then(data => {
        setUser({ email: data.email });
        setLoading(false);
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Use AuthContext logout and redirect
      logout();
      navigate('/login');
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  if (!user) return null;

  return (
    <Box display="flex" justifyContent="center" alignItems="flex-start" minHeight="60vh" py={8}>
      <Paper elevation={6} sx={{ maxWidth: 480, width: '100%', p: 5, borderRadius: 3, border: '1px solid', borderColor: 'primary.light' }}>
        <Typography variant="h4" fontWeight={700} color="primary" align="center" mb={4}>
          Profile
        </Typography>
        <Box mb={4}>
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary">Email:</Typography>
          <Typography>{user.email}</Typography>
        </Box>
        <Stack spacing={2}>
          <Button
            href="/keys"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ fontWeight: 600 }}
          >
            Manage API Keys
          </Button>
          <Button
            onClick={handleLogout}
            variant="outlined"
            color="error"
            fullWidth
            disabled={logoutLoading}
            sx={{ fontWeight: 600 }}
          >
            {logoutLoading ? 'Logging out...' : 'Logout'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ProfilePage; 