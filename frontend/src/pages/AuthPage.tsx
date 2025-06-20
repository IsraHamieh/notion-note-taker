import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Divider,
  Fade,
  Slide,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'register';
type AuthMethod = 'email' | 'google';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<AuthMethod | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, googleLogin, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
    }
  };

  const handleGoogleAuth = () => {
    googleLogin();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const resetMethod = () => {
    setMethod(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {method && (
          <IconButton
            onClick={resetMethod}
            sx={{
              position: 'absolute',
              left: 16,
              top: 16,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        <Fade in={!method}>
          <Box>
            <Typography
              variant="h4"
              component="h1"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: (theme) =>
                  `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 4,
              }}
            >
              Welcome Back
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Button
                fullWidth
                variant={mode === 'login' ? 'contained' : 'outlined'}
                onClick={() => setMode('login')}
                sx={{ borderRadius: 2 }}
              >
                Login
              </Button>
              <Button
                fullWidth
                variant={mode === 'register' ? 'contained' : 'outlined'}
                onClick={() => setMode('register')}
                sx={{ borderRadius: 2 }}
              >
                Register
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => setMethod('email')}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Continue with Email
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleAuth}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Continue with Google
              </Button>
            </Box>
          </Box>
        </Fade>

        <Slide direction="left" in={method === 'email'} mountOnEnter unmountOnExit>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography
              variant="h5"
              component="h2"
              align="center"
              gutterBottom
              sx={{ mb: 4 }}
            >
              {mode === 'login' ? 'Login with Email' : 'Register with Email'}
            </Typography>

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {error && (
              <Typography color="error" align="center" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{
                borderRadius: 2,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {mode === 'login' ? 'Login' : 'Register'}
            </Button>
          </Box>
        </Slide>
      </Paper>
    </Box>
  );
};

export default AuthPage; 