import { v4 as uuidv4 } from 'uuid';
import api, { apiClient } from '../utils/apiClient';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

/**
 * Handles chunked file upload with resumability and improved error handling
 * @param {File} file - File to upload
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const handleChunkedUpload = async (file, endpoint, options = {}) => {
  const chunkSize = options.chunkSize || 1024 * 1024 * 2; // 2MB chunks by default
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileId = options.fileId || uuidv4();
  const abortController = options.abortController || new AbortController();
  
  // Prepare metadata
  const metadata = {
    fileId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    totalChunks,
    ...options.metadata
  };
  
  // Track upload state for potential recovery
  let uploadState = {
    fileId,
    fileName: file.name,
    uploadedChunks: [],
    status: 'initializing',
    startTime: Date.now(),
    endpoint
  };
  
  try {
    // Check if we can resume an existing upload
    if (options.resumable !== false) {
      try {
        const resumeResponse = await api.post(`${endpoint}/resume`, {
          fileId,
          fileName: file.name
        }, {
          signal: abortController.signal,
          timeout: 10000 // 10 second timeout for resume check
        });
        
        if (resumeResponse.data?.uploadedChunks?.length) {
          uploadState.uploadedChunks = resumeResponse.data.uploadedChunks;
          console.log(`Resuming upload for ${file.name}, ${uploadState.uploadedChunks.length}/${totalChunks} chunks already uploaded`);
        }
      } catch (error) {
        console.log('No existing upload to resume or error checking, starting fresh upload');
        // Start fresh if we can't resume - don't throw error here
      }
    }
    
    // Prepare upload session
    try {
      await api.post(`${endpoint}/init`, metadata, {
        signal: abortController.signal,
        timeout: 15000 // 15 second timeout for initialization
      });
      
      uploadState.status = 'uploading';
    } catch (error) {
      uploadState.status = 'failed';
      uploadState.error = 'Upload initialization failed';
      throw new Error(`Failed to initialize upload: ${error.message}`);
    }
    
    // Determine which chunks need to be uploaded
    const chunksToUpload = [];
    for (let i = 0; i < totalChunks; i++) {
      if (!uploadState.uploadedChunks.includes(i)) {
        chunksToUpload.push(i);
      }
    }
    
    // Update completion count for progress calculations
    let completedChunks = uploadState.uploadedChunks.length;
    
    // Upload chunks with proper error handling
    for (const chunkIndex of chunksToUpload) {
      // Check if upload was aborted
      if (abortController.signal.aborted) {
        uploadState.status = 'aborted';
        throw new Error('Upload was aborted');
      }
      
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      const formData = new FormData();
      formData.append('fileId', fileId);
      formData.append('chunkIndex', chunkIndex);
      formData.append('totalChunks', totalChunks);
      formData.append('chunk', chunk);
      
      let retryCount = 0;
      const maxRetries = 3;
      let chunkUploaded = false;
      
      // Retry loop for chunk upload
      while (retryCount <= maxRetries && !chunkUploaded) {
        try {
          await api.upload(`${endpoint}/chunk`, formData, {
            signal: abortController.signal,
            timeout: 60000, // 60 second timeout per chunk
            onUploadProgress: (progressEvent) => {
              if (options.onUploadProgress) {
                // Calculate overall progress considering already uploaded chunks
                const chunkProgress = (progressEvent.loaded / progressEvent.total);
                const overallProgress = (completedChunks + chunkProgress) / totalChunks;
                
                options.onUploadProgress({
                  loaded: overallProgress * file.size,
                  total: file.size,
                  percentage: Math.round(overallProgress * 100)
                });
              }
            }
          });
          
          // Mark chunk as uploaded
          chunkUploaded = true;
          uploadState.uploadedChunks.push(chunkIndex);
          completedChunks++;
        } catch (error) {
          retryCount++;
          
          // If we've exceeded retries or the upload was aborted, throw error
          if (retryCount > maxRetries || abortController.signal.aborted) {
            uploadState.status = retryCount > maxRetries ? 'failed' : 'aborted';
            uploadState.error = `Chunk upload failed: ${error.message}`;
            throw new Error(`Failed to upload chunk ${chunkIndex}: ${error.message}`);
          }
          
          // Otherwise, wait and retry with backoff
          const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Retrying chunk ${chunkIndex} after ${backoffTime}ms (attempt ${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    // Complete the upload
    try {
      uploadState.status = 'finalizing';
      const response = await api.post(`${endpoint}/complete`, { fileId }, {
        signal: abortController.signal,
        timeout: 30000 // 30 second timeout for completion
      });
      
      uploadState.status = 'completed';
      uploadState.completedAt = Date.now();
      return response.data;
    } catch (error) {
      uploadState.status = 'failed';
      uploadState.error = `Upload completion failed: ${error.message}`;
      throw new Error(`Failed to complete upload: ${error.message}`);
    }
  } catch (error) {
    // Handle abort specially
    if (abortController.signal.aborted) {
      uploadState.status = 'aborted';
      const abortError = new Error('Upload was aborted');
      abortError.uploadState = uploadState;
      throw abortError;
    }
    
    // Add upload state to error for potential recovery
    error.uploadState = uploadState;
    throw error;
  }
};

/**
 * Upload an X-ray image for analysis with better error handling
 * @param {File} file - X-ray image file
 * @param {string} modelId - AI model ID for analysis
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadXrayImage = async (file, modelId, options = {}) => {
  if (!file) throw new Error('No file provided');
  
  const metadata = {
    modelId,
    imageType: 'xray',
    ...options.metadata
  };
  
  return handleChunkedUpload(file, 'uploads/xray', {
    ...options,
    metadata
  });
};

/**
 * Upload an MRI image for analysis with better error handling
 * @param {File} file - MRI image file
 * @param {string} modelId - AI model ID for analysis
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadMriImage = async (file, modelId, options = {}) => {
  if (!file) throw new Error('No file provided');
  
  const metadata = {
    modelId,
    imageType: 'mri',
    ...options.metadata
  };
  
  return handleChunkedUpload(file, 'uploads/mri', {
    ...options,
    metadata
  });
};

/**
 * Upload a CT scan image for analysis with better error handling
 * @param {File} file - CT scan image file
 * @param {string} modelId - AI model ID for analysis
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadCtImage = async (file, modelId, options = {}) => {
  if (!file) throw new Error('No file provided');
  
  const metadata = {
    modelId,
    imageType: 'ct',
    ...options.metadata
  };
  
  return handleChunkedUpload(file, 'uploads/ct', {
    ...options,
    metadata
  });
};

/**
 * Upload a medical report with better error handling
 * @param {File} file - Report file
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadReport = async (file, options = {}) => {
  if (!file) throw new Error('No file provided');
  
  const metadata = {
    reportType: file.type.includes('pdf') ? 'pdf' : 'document',
    ...options.metadata
  };
  
  return handleChunkedUpload(file, 'uploads/report', {
    ...options,
    metadata
  });
};

/**
 * Check status of an upload with better error handling
 * @param {string} fileId - File ID
 * @returns {Promise} Upload status
 */
const checkUploadStatus = async (fileId) => {
  if (!fileId) throw new Error('No fileId provided');
  
  const response = await api.get(`uploads/status/${fileId}`);
  return response.data;
};

/**
 * Cancel an in-progress upload
 * @param {string} fileId - File ID
 * @returns {Promise} Cancellation result
 */
const cancelUpload = async (fileId) => {
  if (!fileId) throw new Error('No fileId provided');
  
  const response = await api.post(`uploads/cancel`, { fileId });
  return response.data;
};

/**
 * Create an abort controller to cancel uploads
 * @returns {AbortController} Abort controller
 */
const createAbortController = () => new AbortController();

const uploadService = {
  // X-ray upload and analysis
  uploadXray: async (file, modelId, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelId', modelId);

    return axios.post(`${API_URL}/xray/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },

  // Get available X-ray models
  getXrayModels: async () => {
    return axios.get(`${API_URL}/xray/models`);
  },

  // Get analysis results
  getAnalysisResults: async (analysisId) => {
    return axios.get(`${API_URL}/analysis/${analysisId}`);
  },

  // Upload MRI scan
  uploadMri: async (file, modelId, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelId', modelId);

    return axios.post(`${API_URL}/mri/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },

  // Upload CT scan
  uploadCt: async (file, modelId, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelId', modelId);

    return axios.post(`${API_URL}/ct/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },

  // Upload medical report
  uploadReport: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return axios.post(`${API_URL}/report/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
  },

  // Get voice command response
  getVoiceCommandResponse: async (command) => {
    return axios.post(`${API_URL}/voice/command`, { command });
  },

  uploadXrayImage,
  uploadMriImage,
  uploadCtImage,
  uploadReport,
  checkUploadStatus,
  cancelUpload,
  createAbortController
};

export default uploadService; 
