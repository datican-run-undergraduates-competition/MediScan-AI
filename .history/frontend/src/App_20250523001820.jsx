import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { validateApiForUser } from './utils/apiRouteValidator';
import { useOnlineStatus } from './utils/customHooks';
import ErrorBoundary from './utils/errorBoundary';
import { lazyImport } from './utils/lazyImport';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy load pages for better performance
const Dashboard = lazyImport(() => import('./pages/Dashboard'));
const Upload = lazyImport(() => import('./pages/Upload'));
const Results = lazyImport(() => import('./pages/Results'));
const Profile = lazyImport(() => import('./pages/Profile'));
const NotFound = lazyImport(() => import('./pages/NotFound'));

// Loading indicator
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
      <h2 className="mb-2 text-xl font-semibold text-gray-700">Loading Application</h2>
      <p className="text-gray-500">Please wait while we connect to the server...</p>
    </div>
  </div>
);

// API Status alert banner
const ApiStatusAlert = ({ status }) => {
  if (!status) return null;
  
  const bgColor = {
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    success: 'bg-green-100 border-green-400 text-green-700'
  }[status.severity] || 'bg-blue-100 border-blue-400 text-blue-700';
  
  return (
    <div className={`px-4 py-3 mb-4 border rounded ${bgColor}`} role="alert">
      <span className="block sm:inline">{status.userMessage}</span>
    </div>
  );
};

// Main App component
const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const { isOnline, connectionQuality } = useOnlineStatus();
  const queryClient = useQueryClient();
  
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
          userMessage: 'Unable to connect to the server. Please check your connection.'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    validateApi();
  }, []);
  
  // Update API status when online status changes
  useEffect(() => {
    if (!isLoading) {
      if (!isOnline && apiStatus?.status !== 'offline') {
        setApiStatus({
          status: 'offline',
          severity: 'warning',
          userMessage: 'You are currently offline. Some features may not be available.'
        });
      } else if (isOnline && apiStatus?.status === 'offline') {
        // Revalidate when coming back online
        validateApiForUser().then(setApiStatus);
      }
    }
  }, [isOnline, isLoading, apiStatus]);
  
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
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header with connection status would go here */}
        <div className="flex-grow container mx-auto px-4 py-6">
          {/* Show API status banner */}
          <ApiStatusAlert status={apiStatus} />
          
          {/* Main routes */}
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
            <Route path="*" element={
              <React.Suspense fallback={<LoadingScreen />}>
                <NotFound />
              </React.Suspense>
            } />
          </Routes>
        </div>
        {/* Footer would go here */}
      </div>
      
      {/* Toast notifications container */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ErrorBoundary>
  );
};

export default App; 
