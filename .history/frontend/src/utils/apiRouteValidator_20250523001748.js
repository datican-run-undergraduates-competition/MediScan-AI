import api from './apiClient';

/**
 * Critical API endpoints that the application depends on
 */
const CRITICAL_ENDPOINTS = [
  'uploads/xray/init',
  'uploads/mri/init',
  'uploads/ct/init',
  'uploads/report/init',
  'health'
];

/**
 * Secondary endpoints that are important but not critical
 */
const SECONDARY_ENDPOINTS = [
  'uploads/status',
  'uploads/cancel',
  'auth/login',
  'auth/refresh-token'
];

/**
 * Validates API routes at application startup
 * @returns {Promise<Object>} Validation results
 */
export const validateApiRoutes = async () => {
  // Skip validation if offline
  if (!navigator.onLine) {
    return {
      status: 'offline',
      critical: { success: false, message: 'Device is offline' },
      secondary: { success: false, message: 'Device is offline' },
    };
  }

  console.log('Validating API routes...');
  
  // Validate critical endpoints first
  const criticalResults = await api.validateEndpoints(CRITICAL_ENDPOINTS);
  
  // Only check secondary endpoints if critical ones are available
  let secondaryResults = { success: false, message: 'Skipped due to critical endpoint failures' };
  if (criticalResults.success) {
    secondaryResults = await api.validateEndpoints(SECONDARY_ENDPOINTS);
  }
  
  // Log validation results
  if (!criticalResults.success) {
    console.error('Critical API endpoints are not available:', criticalResults.failures);
  } else if (!secondaryResults.success) {
    console.warn('Some secondary API endpoints are not available:', secondaryResults.failures);
  } else {
    console.log('All API endpoints validated successfully');
  }
  
  return {
    status: criticalResults.success ? 'ok' : 'error',
    critical: criticalResults,
    secondary: secondaryResults,
    timestamp: Date.now()
  };
};

/**
 * Checks if a specific API endpoint exists
 * @param {string} endpoint - Endpoint to check
 * @returns {Promise<boolean>} Whether endpoint exists
 */
export const checkEndpointExists = async (endpoint) => {
  try {
    await api.head(endpoint, { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validates critical endpoints and provides a user-friendly message
 * @returns {Promise<Object>} Validation results with user message
 */
export const validateApiForUser = async () => {
  const results = await validateApiRoutes();
  
  // Create user-friendly message
  let userMessage = '';
  let severity = 'success';
  
  if (results.status === 'offline') {
    userMessage = 'You are currently offline. Some features may not be available.';
    severity = 'warning';
  } else if (!results.critical.success) {
    userMessage = 'Unable to connect to the server. Please check your connection and try again.';
    severity = 'error';
  } else if (!results.secondary.success) {
    const missingCount = results.secondary.failures.length;
    userMessage = `Connected to server with limited functionality. ${missingCount} features may not work properly.`;
    severity = 'warning';
  } else {
    userMessage = 'Connected to server successfully.';
    severity = 'success';
  }
  
  return {
    ...results,
    userMessage,
    severity
  };
};

export default validateApiRoutes; 
