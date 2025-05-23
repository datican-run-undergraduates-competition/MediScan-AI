import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Handles chunked file upload with resumability
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const handleChunkedUpload = async (file, endpoint, options = {}) => {
  const chunkSize = options.chunkSize || 1024 * 1024 * 2; // 2MB chunks by default
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileId = options.fileId || uuidv4();
  const metadata = {
    fileId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    totalChunks,
    ...options.metadata
  };
  
  // Check if we can resume an existing upload
  let uploadedChunks = [];
  if (options.resumable !== false) {
    try {
      const resumeResponse = await axios.post(`${API_URL}${endpoint}/resume`, {
        fileId,
        fileName: file.name
      });
      
      if (resumeResponse.data.uploadedChunks) {
        uploadedChunks = resumeResponse.data.uploadedChunks;
        console.log(`Resuming upload for ${file.name}, ${uploadedChunks.length}/${totalChunks} chunks already uploaded`);
      }
    } catch (error) {
      console.log('No existing upload to resume, starting new upload');
      // Start fresh if we can't resume
      uploadedChunks = [];
    }
  }
  
  // Prepare upload session
  await axios.post(`${API_URL}${endpoint}/init`, metadata);
  
  // Upload chunks
  const chunksToUpload = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!uploadedChunks.includes(i)) {
      chunksToUpload.push(i);
    }
  }
  
  let completedChunks = uploadedChunks.length;
  
  for (const chunkIndex of chunksToUpload) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('fileId', fileId);
    formData.append('chunkIndex', chunkIndex);
    formData.append('totalChunks', totalChunks);
    formData.append('chunk', chunk);
    
    await axios.post(`${API_URL}${endpoint}/chunk`, formData, {
      onUploadProgress: (progressEvent) => {
        if (options.onUploadProgress) {
          // Calculate overall progress considering already uploaded chunks
          const chunkProgress = (progressEvent.loaded / progressEvent.total);
          const overallProgress = (completedChunks + chunkProgress) / totalChunks;
          
          options.onUploadProgress({
            loaded: overallProgress * file.size,
            total: file.size
          });
        }
      }
    });
    
    completedChunks++;
  }
  
  // Complete the upload
  const response = await axios.post(`${API_URL}${endpoint}/complete`, { fileId });
  return response.data;
};

/**
 * Upload an X-ray image for analysis
 * @param {File} file - X-ray image file
 * @param {string} modelId - AI model ID for analysis
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadXrayImage = async (file, modelId, options = {}) => {
  const metadata = {
    modelId,
    imageType: 'xray',
    ...options.metadata
  };
  
  return handleChunkedUpload(file, '/api/uploads/xray', {
    ...options,
    metadata
  });
};

/**
 * Upload an MRI image for analysis
 * @param {File} file - MRI image file
 * @param {string} modelId - AI model ID for analysis
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadMriImage = async (file, modelId, options = {}) => {
  const metadata = {
    modelId,
    imageType: 'mri',
    ...options.metadata
  };
  
  return handleChunkedUpload(file, '/api/uploads/mri', {
    ...options,
    metadata
  });
};

/**
 * Upload a CT scan image for analysis
 * @param {File} file - CT scan image file
 * @param {string} modelId - AI model ID for analysis
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadCtImage = async (file, modelId, options = {}) => {
  const metadata = {
    modelId,
    imageType: 'ct',
    ...options.metadata
  };
  
  return handleChunkedUpload(file, '/api/uploads/ct', {
    ...options,
    metadata
  });
};

/**
 * Upload a medical report
 * @param {File} file - Report file
 * @param {Object} options - Upload options
 * @returns {Promise} Upload result
 */
const uploadReport = async (file, options = {}) => {
  const metadata = {
    reportType: file.type.includes('pdf') ? 'pdf' : 'document',
    ...options.metadata
  };
  
  return handleChunkedUpload(file, '/api/uploads/report', {
    ...options,
    metadata
  });
};

/**
 * Check status of an upload
 * @param {string} fileId - File ID
 * @returns {Promise} Upload status
 */
const checkUploadStatus = async (fileId) => {
  const response = await axios.get(`${API_URL}/api/uploads/status/${fileId}`);
  return response.data;
};

/**
 * Cancel an in-progress upload
 * @param {string} fileId - File ID
 * @returns {Promise} Cancellation result
 */
const cancelUpload = async (fileId) => {
  const response = await axios.post(`${API_URL}/api/uploads/cancel`, { fileId });
  return response.data;
};

export default {
  uploadXrayImage,
  uploadMriImage,
  uploadCtImage,
  uploadReport,
  checkUploadStatus,
  cancelUpload
}; 
