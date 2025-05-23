import api from './apiClient';

// Constants for logging categories and actions
export const LOG_CATEGORY = {
  AUTHENTICATION: 'authentication',
  DATA_ACCESS: 'data_access',
  IMAGE_PROCESSING: 'image_processing',
  PATIENT_RECORD: 'patient_record',
  SYSTEM: 'system',
  CONFIGURATION: 'configuration',
  SECURITY: 'security',
  USER_MANAGEMENT: 'user_management',
  CONSENT: 'consent',
  EXPORT: 'export'
};

export const LOG_ACTION = {
  // Authentication actions
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  PASSWORD_CHANGED: 'password_changed',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  
  // Data access actions
  VIEW: 'view',
  SEARCH: 'search',
  DOWNLOAD: 'download',
  PRINT: 'print',
  SHARE: 'share',
  
  // Image processing actions
  UPLOAD: 'upload',
  PROCESS: 'process',
  ANALYZE: 'analyze',
  ANONYMIZE: 'anonymize',
  
  // Patient record actions
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ARCHIVE: 'archive',
  RESTORE: 'restore',
  
  // Consent actions
  CONSENT_GIVEN: 'consent_given',
  CONSENT_WITHDRAWN: 'consent_withdrawn',
  CONSENT_EXPIRED: 'consent_expired',
  
  // Export actions
  EXPORT_STARTED: 'export_started',
  EXPORT_COMPLETED: 'export_completed',
  EXPORT_FAILED: 'export_failed',
  
  // System actions
  SYSTEM_STARTUP: 'system_startup',
  SYSTEM_SHUTDOWN: 'system_shutdown',
  BACKUP_CREATED: 'backup_created',
  ERROR: 'error'
};

// Sensitive data patterns for sanitization
const SENSITIVE_PATTERNS = [
  // Patient identifiers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '***-**-****' }, // SSN
  { pattern: /\b\d{9}\b/g, replacement: '*********' }, // 9-digit numbers like SSN without dashes
  { pattern: /\b[A-Z]{2}\d{6}[A-Z]?\b/g, replacement: '********' }, // Passport numbers
  
  // Contact information
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: '[EMAIL]' }, // Email
  { pattern: /\b(\+\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s-]?)?[\d\s-]{7,10}\b/g, replacement: '[PHONE]' }, // Phone
  
  // Credit card numbers
  { pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g, replacement: '[CREDIT_CARD]' },
  { pattern: /\b\d{13,16}\b/g, replacement: '[POSSIBLE_CREDIT_CARD]' },
  
  // Addresses
  { pattern: /\b\d{5}(-\d{4})?\b/g, replacement: '[ZIP]' } // ZIP codes
];

// Local log buffer for batch sending
let logBuffer = [];
let isBufferFlushing = false;
const MAX_BUFFER_SIZE = 20;
const FLUSH_INTERVAL = 30000; // 30 seconds

/**
 * Initialize the audit logger
 */
export const initializeAuditLogger = () => {
  // Set up interval to flush logs
  setInterval(flushLogBuffer, FLUSH_INTERVAL);
  
  // Set up unload handler to flush logs before page close
  window.addEventListener('beforeunload', () => {
    flushLogBuffer(true);
  });
  
  // Log system startup
  logSystemEvent(LOG_ACTION.SYSTEM_STARTUP, 'Application initialized');
};

/**
 * Log an audit event
 * @param {string} category - Event category
 * @param {string} action - Event action
 * @param {Object} details - Event details
 * @param {boolean} isSensitive - Whether event contains sensitive data
 * @returns {Promise<void>}
 */
export const logAuditEvent = async (category, action, details = {}, isSensitive = false) => {
  try {
    // Get user info
    const userId = localStorage.getItem('userId') || 'anonymous';
    const userRole = localStorage.getItem('userRole') || 'guest';
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      category,
      action,
      userId,
      userRole,
      sessionId: getSessionId(),
      ipAddress: await getClientIp(),
      userAgent: navigator.userAgent,
      details: isSensitive ? sanitizeData(details) : details
    };
    
    // Add to buffer
    logBuffer.push(logEntry);
    
    // If buffer is full, flush it
    if (logBuffer.length >= MAX_BUFFER_SIZE) {
      flushLogBuffer();
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('AUDIT LOG:', logEntry);
    }
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

/**
 * Flush the log buffer to the server
 * @param {boolean} isSync - Whether to flush synchronously (for page unload)
 */
const flushLogBuffer = async (isSync = false) => {
  // If buffer is empty or already flushing, skip
  if (logBuffer.length === 0 || isBufferFlushing) {
    return;
  }
  
  isBufferFlushing = true;
  const currentBuffer = [...logBuffer];
  logBuffer = [];
  
  try {
    if (isSync) {
      // Use synchronous XHR for page unload
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${api.baseURL}/api/audit/logs`, false); // false makes it synchronous
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Add auth token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(JSON.stringify({ logs: currentBuffer }));
    } else {
      // Use async API for normal operation
      await api.post('/audit/logs', { logs: currentBuffer });
    }
  } catch (error) {
    // If failed, add back to buffer for retry
    logBuffer = [...currentBuffer, ...logBuffer];
    console.error('Failed to flush audit logs:', error);
  } finally {
    isBufferFlushing = false;
  }
};

/**
 * Get or create a session ID
 * @returns {string} Session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

/**
 * Get client IP address (best effort)
 * @returns {Promise<string>} IP address or placeholder
 */
const getClientIp = async () => {
  try {
    // Try to get IP from API
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};

/**
 * Sanitize sensitive data
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
const sanitizeData = (data) => {
  // Deep copy to avoid modifying original
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Recursive function to sanitize objects
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(key => {
      // Check if key is sensitive
      if (/password|token|secret|key|ssn|credit|card|address|email|phone|birth|name|gender|race|ethnicity|diagnosis/i.test(key)) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'string') {
        // Apply patterns to string values
        let value = obj[key];
        SENSITIVE_PATTERNS.forEach(pattern => {
          value = value.replace(pattern.pattern, pattern.replacement);
        });
        obj[key] = value;
      } else if (typeof obj[key] === 'object') {
        // Recurse into nested objects and arrays
        obj[key] = sanitizeObject(obj[key]);
      }
    });
    
    return obj;
  };
  
  return sanitizeObject(sanitized);
};

/**
 * Log patient data access
 * @param {string} action - Access action
 * @param {string} patientId - Patient ID
 * @param {string} resourceType - Type of resource accessed
 * @param {string} resourceId - ID of resource accessed
 * @param {string} reason - Reason for access
 */
export const logPatientAccess = (action, patientId, resourceType, resourceId, reason = '') => {
  return logAuditEvent(LOG_CATEGORY.DATA_ACCESS, action, {
    patientId,
    resourceType,
    resourceId,
    reason,
    hasConsent: getConsentStatus(patientId)
  }, true);
};

/**
 * Log image processing activity
 * @param {string} action - Processing action
 * @param {string} imageId - Image ID
 * @param {string} imageType - Type of image
 * @param {Object} metadata - Image metadata
 */
export const logImageProcessing = (action, imageId, imageType, metadata = {}) => {
  return logAuditEvent(LOG_CATEGORY.IMAGE_PROCESSING, action, {
    imageId,
    imageType,
    metadata: sanitizeImageMetadata(metadata)
  });
};

/**
 * Log authentication events
 * @param {string} action - Authentication action
 * @param {string} username - Username (will be sanitized)
 * @param {Object} details - Additional details
 */
export const logAuthentication = (action, username, details = {}) => {
  return logAuditEvent(LOG_CATEGORY.AUTHENTICATION, action, {
    username,
    method: details.method || 'password',
    successful: details.successful !== false,
    failureReason: details.failureReason || '',
    ipAddress: details.ipAddress || '',
    deviceInfo: details.deviceInfo || navigator.userAgent
  });
};

/**
 * Log system events
 * @param {string} action - System action
 * @param {string} message - Event message
 * @param {Object} details - Additional details
 */
export const logSystemEvent = (action, message, details = {}) => {
  return logAuditEvent(LOG_CATEGORY.SYSTEM, action, {
    message,
    ...details
  });
};

/**
 * Log security events
 * @param {string} action - Security action
 * @param {string} message - Event message
 * @param {Object} details - Additional details
 */
export const logSecurityEvent = (action, message, details = {}) => {
  return logAuditEvent(LOG_CATEGORY.SECURITY, action, {
    message,
    severity: details.severity || 'info',
    ...details
  });
};

/**
 * Get patient consent status
 * @param {string} patientId - Patient ID
 * @returns {boolean} Whether patient has given consent
 */
const getConsentStatus = (patientId) => {
  // This would be replaced with actual consent checking logic
  // For now, simulate consent based on local storage
  const consents = JSON.parse(localStorage.getItem('patientConsents') || '{}');
  return !!consents[patientId];
};

/**
 * Sanitize image metadata for logging
 * @param {Object} metadata - Image metadata
 * @returns {Object} Sanitized metadata
 */
const sanitizeImageMetadata = (metadata) => {
  // Create a safe copy with only non-sensitive fields
  const safeCopy = {
    imageType: metadata.imageType,
    modality: metadata.modality,
    studyDate: metadata.studyDate,
    bodyPartExamined: metadata.bodyPartExamined,
    manufacturer: metadata.manufacturer,
    hasPixelData: metadata.hasPixelData,
    size: metadata.size
  };
  
  return safeCopy;
};

/**
 * Generate a HIPAA compliance report
 * @param {Date} startDate - Report start date
 * @param {Date} endDate - Report end date
 * @returns {Promise<Object>} Compliance report
 */
export const generateComplianceReport = async (startDate, endDate) => {
  try {
    const response = await api.get('/audit/compliance-report', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Failed to generate compliance report:', error);
    throw error;
  }
};

export default {
  logAuditEvent,
  logPatientAccess,
  logImageProcessing,
  logAuthentication,
  logSystemEvent,
  logSecurityEvent,
  initializeAuditLogger,
  generateComplianceReport,
  LOG_CATEGORY,
  LOG_ACTION
}; 
