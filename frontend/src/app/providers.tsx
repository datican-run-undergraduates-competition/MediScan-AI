'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from '../theme';
import Navbar from './components/layout/Navbar';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Navbar />
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </AuthProvider>
    </ThemeProvider>
  );
} 