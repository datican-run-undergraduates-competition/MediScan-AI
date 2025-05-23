import axios from 'axios';

// Get base API URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Default 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    // Normalize API paths to avoid double slashes
    if (config.url) {
      // Remove leading slash from URL if baseURL ends with slash
      if (config.baseURL?.endsWith('/') && config.url.startsWith('/')) {
        config.url = config.url.substring(1);
      }
      
      // Ensure API routes start with /api if not already present
      if (!config.url.startsWith('/api') && !config.url.startsWith('api/')) {
        config.url = `/api/${config.url}`.replace(/\/+/g, '/');
      }
    }
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Keep track of network errors
    if (error.message === 'Network Error') {
      window.dispatchEvent(new CustomEvent('api:network-error', { 
        detail: { url: originalRequest.url } 
      }));
    }
    
    // Format error for consistent handling
    const formattedError = new Error(
      error.response?.data?.message || error.message || 'Unknown error'
    );
    
    // Attach useful properties
    formattedError.status = error.response?.status;
    formattedError.data = error.response?.data;
    formattedError.originalError = error;
    formattedError.request = {
      url: originalRequest?.url,
      method: originalRequest?.method,
      baseURL: originalRequest?.baseURL,
    };
    
    // Handle 401 Unauthorized - refresh token or logout
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Attempt to refresh token (simplified - implement your actual refresh logic)
      try {
        // Prevent infinite loop
        originalRequest._retry = true;
        
        // Check if we should try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Try to get a new token
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/api/auth/refresh-token`,
            { refreshToken },
            { _skipAuthRefresh: true } // Skip interceptor for this call
          );
          
          if (refreshResponse.data.token) {
            // Save new tokens
            localStorage.setItem('authToken', refreshResponse.data.token);
            if (refreshResponse.data.refreshToken) {
              localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
            }
            
            // Update the failed request with new token and retry
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        // If refresh fails, logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        
        // Dispatch logout event for app to handle
        window.dispatchEvent(new Event('auth:logout-required'));
      }
    }
    
    // For server errors (5xx), add retry capability
    if (error.response?.status >= 500 && !originalRequest._serverRetry && originalRequest.method === 'GET') {
      if (!originalRequest._serverRetryCount) {
        originalRequest._serverRetryCount = 0;
      }
      
      if (originalRequest._serverRetryCount < 2) { // Max 2 retries
        originalRequest._serverRetryCount++;
        originalRequest._serverRetry = true;
        
        // Exponential backoff
        const backoff = Math.pow(2, originalRequest._serverRetryCount) * 1000;
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(apiClient(originalRequest));
          }, backoff);
        });
      }
    }
    
    return Promise.reject(formattedError);
  }
);

// Helper methods for common API operations
const api = {
  /**
   * Perform a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  get: (endpoint, options = {}) => {
    return apiClient.get(endpoint, options);
  },
  
  /**
   * Perform a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  post: (endpoint, data = {}, options = {}) => {
    return apiClient.post(endpoint, data, options);
  },
  
  /**
   * Perform a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  put: (endpoint, data = {}, options = {}) => {
    return apiClient.put(endpoint, data, options);
  },
  
  /**
   * Perform a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  delete: (endpoint, options = {}) => {
    return apiClient.delete(endpoint, options);
  },
  
  /**
   * Upload a file or FormData
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with files
   * @param {Object} options - Request options
   * @returns {Promise} - Response promise
   */
  upload: (endpoint, formData, options = {}) => {
    return apiClient.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...options,
    });
  },
  
  /**
   * Check if API server is reachable
   * @returns {Promise<boolean>} - Whether server is reachable
   */
  checkHealth: async () => {
    try {
      // Try primary health endpoint
      const response = await apiClient.get('/api/health', {
        timeout: 5000,
        _skipRetry: true,
      });
      return response.status === 200;
    } catch (error) {
      try {
        // Fallback to root endpoint
        const fallbackResponse = await axios.head(API_BASE_URL, {
          timeout: 3000,
          _skipRetry: true,
        });
        return fallbackResponse.status < 400;
      } catch (fallbackError) {
        return false;
      }
    }
  },
  
  /**
   * Validate critical API endpoints exist
   * @param {Array} endpoints - List of critical endpoints to validate
   * @returns {Promise<Object>} - Validation results
   */
  validateEndpoints: async (endpoints = []) => {
    if (!navigator.onLine) {
      return { success: false, message: 'Offline mode' };
    }
    
    const criticalEndpoints = endpoints.length > 0 ? endpoints : [
      '/api/uploads/xray/init',
      '/api/uploads/mri/init',
      '/api/uploads/ct/init'
    ];
    
    const results = { success: true, failures: [] };
    
    for (const endpoint of criticalEndpoints) {
      try {
        // Use HEAD request to minimize bandwidth
        await apiClient.head(endpoint, { timeout: 3000 });
      } catch (error) {
        results.failures.push({
          endpoint,
          status: error.status || 'unknown',
          message: error.message
        });
      }
    }
    
    results.success = results.failures.length === 0;
    return results;
  }
};

export { apiClient, api };
export default api;
