'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from '../contexts/AuthContext';
import { DarkModeProvider, useDarkMode } from '../contexts/DarkModeContext';
import AppLayout from './components/layout/AppLayout';
import { useMemo } from 'react';

// Create a theme wrapper that uses dark mode context
function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const { darkMode } = useDarkMode();
  const mode = darkMode ? 'dark' : 'light';

  // Create a theme instance
  const theme = useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
        },
        palette: {
          mode,
          primary: {
            main: '#3f51b5',
            light: '#757de8',
            dark: '#002984',
          },
          secondary: {
            main: '#f50057',
            light: '#ff4081',
            dark: '#c51162',
          },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
        },
        shape: {
          borderRadius: 10,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DarkModeProvider>
            <ThemeProviderWrapper>
              <CssBaseline />
              <AppLayout>
                {children}
              </AppLayout>
            </ThemeProviderWrapper>
          </DarkModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
