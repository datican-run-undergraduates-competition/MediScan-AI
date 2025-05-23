import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { validateApiForUser } from './utils/apiRouteValidator';
import { useOnlineStatus } from './utils/customHooks';
import ErrorBoundary from './utils/errorBoundary';
import { lazyImport } from './utils/lazyImport';
import { ThemeProvider, useTheme } from './utils/theme';
import { I18nProvider, useI18n } from './utils/i18n';
import { initializeAuditLogger, logSystemEvent, LOG_ACTION } from './utils/auditLogger';
import { KEYFRAMES } from './utils/animations';
import { useSkipLink } from './utils/accessibilityUtils';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load pages for better performance
const Dashboard = lazyImport(() => import('./pages/Dashboard'));
const Upload = lazyImport(() => import('./pages/Upload'));
const Results = lazyImport(() => import('./pages/Results'));
const Profile = lazyImport(() => import('./pages/Profile'));
const Settings = lazyImport(() => import('./pages/Settings'));
const NotFound = lazyImport(() => import('./pages/NotFound'));
const Accessibility = lazyImport(() => import('./pages/Accessibility'));

// Loading indicator with animation
const LoadingScreen = () => {
  const { isDark } = useTheme();
  const { t } = useI18n();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 border-t-4 border-b-4 rounded-full animate-spin"
          style={{ 
            borderTopColor: 'var(--color-primary)',
            borderBottomColor: 'var(--color-primary)',
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent'
          }}
        ></div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">{t('common.loading')}</h2>
        <p className="text-foreground opacity-70">{t('common.loading_message')}</p>
      </div>
    </div>
  );
};

// API Status alert banner with animation
const ApiStatusAlert = ({ status }) => {
  if (!status) return null;
  
  const { t } = useI18n();
  
  const statusClasses = {
    error: 'bg-error/10 border-error text-error',
    warning: 'bg-warning/10 border-warning text-warning',
    success: 'bg-success/10 border-success text-success'
  }[status.severity] || 'bg-info/10 border-info text-info';
  
  return (
    <motion.div 
      className={`px-4 py-3 mb-4 border rounded ${statusClasses}`}
      role="alert"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="block sm:inline">{status.userMessage}</span>
    </motion.div>
  );
};

// Header component with accessibility features
const Header = ({ toggleSidebar }) => {
  const { toggleTheme, isDark } = useTheme();
  const { t, changeLocale, locale, supportedLanguages } = useI18n();
  const { isOnline, connectionQuality } = useOnlineStatus();
  
  return (
    <header className="bg-surface border-b border-border p-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar} 
          className="mr-4 p-2 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={t('navigation.toggle_menu')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">
          {t('app.title')}
          <span className="ml-2 text-xs font-normal text-foreground/60">v1.0</span>
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Connection status indicator */}
        <div className="hidden md:flex items-center text-sm">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            !isOnline ? 'bg-error' : 
            connectionQuality === 'good' ? 'bg-success' : 
            connectionQuality === 'fair' ? 'bg-warning' : 'bg-error'
          }`}></div>
          <span className="text-foreground/70">
            {!isOnline ? t('status.offline') : 
             connectionQuality === 'good' ? t('status.connected') : 
             connectionQuality === 'fair' ? t('status.degraded') : t('status.poor_connection')}
          </span>
        </div>
        
        {/* Theme toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label={isDark ? t('theme.switch_light') : t('theme.switch_dark')}
        >
          {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
        
        {/* Language selector */}
        <div className="relative">
          <select 
            value={locale}
            onChange={(e) => changeLocale(e.target.value)}
            className="appearance-none bg-transparent border border-border rounded p-1 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            aria-label={t('language.select')}
          >
            {Object.entries(supportedLanguages).map(([code, lang]) => (
              <option key={code} value={code}>{lang.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-foreground/70">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

// Sidebar navigation with animation
const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const { isDark } = useTheme();
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <motion.aside
        className="fixed top-0 left-0 z-50 h-full w-64 bg-surface border-r border-border shadow-lg md:shadow-none md:relative md:z-0"
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('navigation.menu')}</h2>
            <button 
              onClick={onClose}
              className="md:hidden p-2 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label={t('navigation.close_menu')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              <NavItem to="/dashboard" icon="dashboard" label={t('navigation.dashboard')} onClick={onClose} />
              <NavItem to="/upload" icon="upload" label={t('navigation.upload')} onClick={onClose} />
              <NavItem to="/results" icon="results" label={t('navigation.results')} onClick={onClose} />
              <NavItem to="/profile" icon="profile" label={t('navigation.profile')} onClick={onClose} />
              <NavItem to="/settings" icon="settings" label={t('navigation.settings')} onClick={onClose} />
              <NavItem to="/accessibility" icon="accessibility" label={t('navigation.accessibility')} onClick={onClose} />
            </ul>
          </nav>
          
          <div className="p-4 border-t border-border">
            <div className="text-sm text-foreground/70">
              <p>{t('app.version', { version: '1.0.0' })}</p>
              <p>{t('app.copyright')}</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

// Navigation item with animation
const NavItem = ({ to, icon, label, onClick }) => {
  return (
    <li>
      <motion.div whileHover={{ x: 5 }} whileTap={{ scale: 0.98 }}>
        <a
          href={to}
          className="flex items-center px-4 py-2 text-foreground hover:bg-primary/10 rounded-md"
          onClick={(e) => {
            e.preventDefault();
            onClick?.();
            window.location.href = to;
          }}
        >
          <NavIcon icon={icon} />
          <span className="ml-3">{label}</span>
        </motion.div>
    </li>
  );
};

// Icon component for navigation
const NavIcon = ({ icon }) => {
  switch (icon) {
    case 'dashboard':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'upload':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      );
    case 'results':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'profile':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'settings':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'accessibility':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    default:
      return null;
  }
};

// Global styles for animations
const GlobalStyles = () => {
  useEffect(() => {
    // Create style element
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.innerHTML = KEYFRAMES;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  return null;
};

// Main App component
const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const { isOnline, connectionQuality } = useOnlineStatus();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useI18n();
  const { skipLinkProps } = useSkipLink('main-content');
  
  // Initialize audit logger
  useEffect(() => {
    initializeAuditLogger();
    logSystemEvent(LOG_ACTION.SYSTEM_STARTUP, 'Application initialized');
    
    // Clean up on unmount
    return () => {
      logSystemEvent(LOG_ACTION.SYSTEM_SHUTDOWN, 'Application shutdown');
    };
  }, []);
  
  // Validate API routes on startup
  useEffect(() => {
    const validateApi = async () => {
      try {
        const validation = await validateApiForUser();
        setApiStatus(validation);
      } catch (error) {
        console.error('API validation failed:', error);
        setApiStatus({
          status: 'error',
          severity: 'error',
          userMessage: t('api.error_connection')
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    validateApi();
  }, [t]);
  
  // Update API status when online status changes
  useEffect(() => {
    if (!isLoading) {
      if (!isOnline && apiStatus?.status !== 'offline') {
        setApiStatus({
          status: 'offline',
          severity: 'warning',
          userMessage: t('api.offline')
        });
      } else if (isOnline && apiStatus?.status === 'offline') {
        // Revalidate when coming back online
        validateApiForUser().then(setApiStatus);
      }
    }
  }, [isOnline, isLoading, apiStatus, t]);
  
  // Listen for auth logout events
  useEffect(() => {
    const handleLogout = () => {
      // Clear all queries in cache when user logs out
      queryClient.clear();
      // Any other logout logic here
    };
    
    window.addEventListener('auth:logout-required', handleLogout);
    return () => window.removeEventListener('auth:logout-required', handleLogout);
  }, [queryClient]);
  
  // Show loading screen during initial load
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a {...skipLinkProps} className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:text-foreground focus:p-4 focus:m-4 focus:rounded">
        {t('accessibility.skip_to_content')}
      </a>
      
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          
          <main id="main-content" className="flex-1 overflow-y-auto p-6" tabIndex="-1">
            {/* Show API status banner */}
            <AnimatePresence>
              {apiStatus && <ApiStatusAlert status={apiStatus} />}
            </AnimatePresence>
            
            {/* Main routes */}
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <React.Suspense fallback={<LoadingScreen />}>
                    <Dashboard connectionQuality={connectionQuality} />
                  </React.Suspense>
                } />
                <Route path="/upload" element={
                  <React.Suspense fallback={<LoadingScreen />}>
                    <Upload isOnline={isOnline} connectionQuality={connectionQuality} />
                  </React.Suspense>
                } />
                <Route path="/results/:id?" element={
                  <React.Suspense fallback={<LoadingScreen />}>
                    <Results />
                  </React.Suspense>
                } />
                <Route path="/profile" element={
                  <React.Suspense fallback={<LoadingScreen />}>
                    <Profile />
                  </React.Suspense>
                } />
                <Route path="/settings" element={
                  <React.Suspense fallback={<LoadingScreen />}>
                    <Settings />
                  </React.Suspense>
                } />
                <Route path="/accessibility" element={
                  <React.Suspense fallback={<LoadingScreen />}>
                    <Accessibility />
                  </React.Suspense>
                } />
                <Route path="*" element={
                  <React.Suspense fallback={<LoadingScreen />}>
                    <NotFound />
                  </React.Suspense>
                } />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
        
        <footer className="bg-surface border-t border-border p-4 text-center text-sm text-foreground/70">
          <p>© {new Date().getFullYear()} {t('app.footer_copyright')}</p>
          <p className="mt-1">{t('app.footer_compliance')}</p>
        </footer>
      </div>
      
      {/* Global animation styles */}
      <GlobalStyles />
    </>
  );
};

// Root App component with providers
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
