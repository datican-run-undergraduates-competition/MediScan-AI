import axios from 'axios';
import tus from 'tus-js-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size for resumable uploads

/**
 * Upload Service for handling file uploads with advanced features
 */
const uploadService = {
  /**
   * Get available X-ray analysis models
   * @returns {Promise} - API response
   */
  getXrayModels: async () => {
    try {
      // First try to get from cache if we need it quickly
      const cachedData = localStorage.getItem('xrayModelsCache');
      const cachedTime = localStorage.getItem('xrayModelsCacheTime');
      
      // If cache is less than 1 hour old and we're offline, use it
      if (!navigator.onLine && cachedData && cachedTime) {
        const cacheAge = Date.now() - parseInt(cachedTime);
        if (cacheAge < 3600000) { // 1 hour
          return { data: JSON.parse(cachedData) };
        }
      }
      
      // If online, try to fetch from API
      const response = await axios.get(`${API_URL}/xray/models`);
      
      // Cache the response
      localStorage.setItem('xrayModelsCache', JSON.stringify(response.data));
      localStorage.setItem('xrayModelsCacheTime', Date.now().toString());
      
      return response;
    } catch (error) {
      console.error('Error fetching X-ray models:', error);
      
      // If we have cached data, return it as fallback
      const cachedData = localStorage.getItem('xrayModelsCache');
      if (cachedData) {
        return { data: JSON.parse(cachedData) };
      }
      
      throw error;
    }
  },
  
  /**
   * Upload and analyze an X-ray image
   * @param {File} file - The image file to upload
   * @param {string} modelId - The model ID to use for analysis
   * @param {Object} options - Upload options
   * @param {Function} options.onUploadProgress - Progress callback
   * @param {boolean} options.resumable - Whether to use resumable uploads
   * @returns {Promise} - API response
   */
  uploadXrayImage: async (file, modelId, options = {}) => {
    const { onUploadProgress, resumable = true } = options;
    
    // Use resumable uploads if supported and requested
    if (resumable && window.FileReader && window.Blob) {
      return uploadService.resumableUpload(
        file, 
        modelId, 
        '/xray/analyze', 
        onUploadProgress
      );
    }
    
    // Fallback to regular upload
    return uploadService.regularUpload(
      file, 
      modelId, 
      '/xray/analyze', 
      onUploadProgress
    );
  },
  
  /**
   * Upload and analyze an MRI image
   * @param {File} file - The image file to upload
   * @param {string} modelId - The model ID to use for analysis
   * @param {Object} options - Upload options
   * @param {Function} options.onUploadProgress - Progress callback
   * @param {boolean} options.resumable - Whether to use resumable uploads
   * @returns {Promise} - API response
   */
  uploadMriImage: async (file, modelId, options = {}) => {
    const { onUploadProgress, resumable = true } = options;
    
    // Use resumable uploads if supported and requested
    if (resumable && window.FileReader && window.Blob) {
      return uploadService.resumableUpload(
        file, 
        modelId, 
        '/mri/analyze', 
        onUploadProgress
      );
    }
    
    // Fallback to regular upload
    return uploadService.regularUpload(
      file, 
      modelId, 
      '/mri/analyze', 
      onUploadProgress
    );
  },
  
  /**
   * Upload and analyze a CT scan image
   * @param {File} file - The image file to upload
   * @param {string} modelId - The model ID to use for analysis
   * @param {Object} options - Upload options
   * @param {Function} options.onUploadProgress - Progress callback
   * @param {boolean} options.resumable - Whether to use resumable uploads
   * @returns {Promise} - API response
   */
  uploadCtImage: async (file, modelId, options = {}) => {
    const { onUploadProgress, resumable = true } = options;
    
    // Use resumable uploads if supported and requested
    if (resumable && window.FileReader && window.Blob) {
      return uploadService.resumableUpload(
        file, 
        modelId, 
        '/ct/analyze', 
        onUploadProgress
      );
    }
    
    // Fallback to regular upload
    return uploadService.regularUpload(
      file, 
      modelId, 
      '/ct/analyze', 
      onUploadProgress
    );
  },
  
  /**
   * Upload a medical report document
   * @param {File} file - The report file to upload
   * @param {Object} options - Upload options
   * @param {Function} options.onUploadProgress - Progress callback
   * @param {boolean} options.resumable - Whether to use resumable uploads
   * @returns {Promise} - API response
   */
  uploadReport: async (file, options = {}) => {
    const { onUploadProgress, resumable = true } = options;
    
    // Use resumable uploads if supported and requested
    if (resumable && window.FileReader && window.Blob) {
      return uploadService.resumableUpload(
        file, 
        null, 
        '/report/upload', 
        onUploadProgress
      );
    }
    
    // Fallback to regular upload
    return uploadService.regularUpload(
      file, 
      null, 
      '/report/upload', 
      onUploadProgress
    );
  },
  
  /**
   * Implement a resumable upload using TUS protocol
   * @param {File} file - The file to upload
   * @param {string} modelId - The model ID to use for analysis (if applicable)
   * @param {string} endpoint - API endpoint for the upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} - Resolves with the upload result
   */
  resumableUpload: (file, modelId, endpoint, onProgress) => {
    return new Promise((resolve, reject) => {
      // Create a unique upload ID
      const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Create form data with metadata
      const metadata = {
        filename: file.name,
        filetype: file.type,
        modelId: modelId || '',
        uploadId: uploadId
      };
      
      // Create upload instance
      const upload = new tus.Upload(file, {
        endpoint: `${API_URL}${endpoint}/tus`,
        metadata,
        retryDelays: [0, 1000, 3000, 5000, 10000, 30000],
        chunkSize: UPLOAD_CHUNK_SIZE,
        
        // Handle progress
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          if (onProgress) {
            onProgress({ loaded: bytesUploaded, total: bytesTotal, percentage });
          }
        },
        
        // Handle success
        onSuccess: async () => {
          try {
            // Trigger analysis after upload is complete
            const response = await axios.post(`${API_URL}${endpoint}/complete`, {
              uploadId,
              modelId: modelId || ''
            });
            
            resolve(response);
          } catch (error) {
            reject(error);
          }
        },
        
        // Handle error
        onError: (error) => {
          console.error('Resumable upload failed:', error);
          reject(error);
        }
      });
      
      // Start the upload
      upload.start();
    });
  },
  
  /**
   * Regular (non-resumable) file upload
   * @param {File} file - The file to upload
   * @param {string} modelId - The model ID to use for analysis (if applicable)
   * @param {string} endpoint - API endpoint for the upload
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} - API response
   */
  regularUpload: async (file, modelId, endpoint, onProgress) => {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    
    if (modelId) {
      formData.append('model_name', modelId);
    }
    
    // Configure request
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress
    };
    
    // Handle offline status
    if (!navigator.onLine) {
      throw new Error('You are currently offline. Please try again when your connection is restored.');
    }
    
    // Make request with retry capability
    return uploadService.requestWithRetry(
      () => axios.post(`${API_URL}${endpoint}`, formData, config),
      3
    );
  },
  
  /**
   * Make a request with automatic retry on network failures
   * @param {Function} requestFn - Function that returns a Promise for the request
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Delay between retries in ms
   * @returns {Promise} - API response
   */
  requestWithRetry: async (requestFn, maxRetries = 3, delay = 1000) => {
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        console.error(`Request attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
        lastError = error;
        
        // Check if we're offline or it's a network error
        if (!navigator.onLine || 
            error.message === 'Network Error' || 
            error.code === 'ECONNABORTED') {
          // Wait longer between retries if we're offline
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
          continue;
        }
        
        // If it's not a network error, don't retry
        throw error;
      }
    }
    
    throw lastError;
  }
};

export default uploadService; 
