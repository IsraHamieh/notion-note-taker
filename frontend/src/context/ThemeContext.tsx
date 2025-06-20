import React, { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5',
          },
          background: {
            default: isDarkMode ? '#0f172a' : '#f8fafc',
            paper: isDarkMode ? '#1e293b' : '#ffffff',
          },
        },
        shape: {
          borderRadius: 12,
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          h3: {
            fontWeight: 700,
            letterSpacing: '-0.02em',
          },
          h6: {
            fontWeight: 600,
            letterSpacing: '-0.01em',
          },
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                boxShadow: isDarkMode
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                padding: '8px 16px',
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                fontWeight: 500,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [isDarkMode]
  );

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}; 