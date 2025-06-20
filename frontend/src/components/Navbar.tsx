import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme as useMuiTheme,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  Button
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleSettingsMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (isMobile) {
      setDrawerOpen(true);
    } else {
      setSettingsAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setProfileAnchorEl(null);
    setSettingsAnchorEl(null);
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
    navigate('/');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const settingsMenuItems = [
    { icon: <LanguageIcon />, text: 'Language' },
    { icon: <NotificationsIcon />, text: 'Notifications' },
  ];

  const renderSettingsMenu = () => (
    <Menu
      anchorEl={settingsAnchorEl}
      open={Boolean(settingsAnchorEl)}
      onClose={handleClose}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {settingsMenuItems.map((item) => (
        <MenuItem key={item.text} onClick={handleClose}>
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText>{item.text}</ListItemText>
        </MenuItem>
      ))}
    </Menu>
  );

  const renderSettingsDrawer = () => (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={handleClose}
    >
      <Box sx={{ width: 250 }}>
        <List>
          {settingsMenuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={handleClose}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ px: { xs: 2, sm: 4 } }}>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 700,
            background: (theme) => `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          Notion Agent
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            onClick={toggleTheme} 
            color="inherit"
            sx={{
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'rotate(15deg)',
              },
            }}
          >
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          
          <IconButton 
            onClick={handleSettingsMenu} 
            color="inherit"
            sx={{
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'rotate(15deg)',
              },
            }}
          >
            <SettingsIcon />
          </IconButton>

          {user ? (
            <>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenu}
                color="inherit"
              >
                {user.profilePicture ? (
                  <Avatar
                    src={user.profilePicture}
                    alt={user.name}
                    sx={{ width: 32, height: 32 }}
                  />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
              
              <Menu
                id="menu-appbar"
                anchorEl={profileAnchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(profileAnchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleProfile}>Profile</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => navigate('/auth')}
              sx={{
                borderRadius: 2,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Sign In / Up
            </Button>
          )}
        </Box>
      </Toolbar>
      {renderSettingsMenu()}
      {renderSettingsDrawer()}
    </AppBar>
  );
};

export default Navbar; 