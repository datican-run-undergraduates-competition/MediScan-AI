import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

/**
 * Custom hook to manage online/offline status with enhanced reliability
 * @returns {Object} Online status and related utilities
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState(navigator.onLine ? Date.now() : null);
  const reconnectTimerRef = useRef(null);
  const pingIntervalRef = useRef(null);

  // Update online status
  const updateOnlineStatus = useCallback((status) => {
    setIsOnline(status);
    if (status) {
      setLastOnlineTime(Date.now());
    }
  }, []);

  // Actively check connection by pinging the server
  const checkConnection = useCallback(async () => {
    try {
      // Minimal HEAD request to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok && !navigator.onLine) {
        // Browser thinks we're offline, but we got a response
        window.dispatchEvent(new Event('online'));
      }
      
      return response.ok;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }, []);

  // Start periodic connection checks when offline
  const startReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) return;
    
    reconnectTimerRef.current = setInterval(() => {
      checkConnection();
    }, 10000); // Check every 10 seconds
  }, [checkConnection]);

  // Stop periodic connection checks
  const stopReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearInterval(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  // Start background periodic pings when online to detect network issues early
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) return;
    
    pingIntervalRef.current = setInterval(() => {
      checkConnection();
    }, 30000); // Light ping every 30 seconds
  }, [checkConnection]);

  // Stop background pings
  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      updateOnlineStatus(true);
      stopReconnectTimer();
      startPingInterval();
    };
    
    const handleOffline = () => {
      updateOnlineStatus(false);
      stopPingInterval();
      startReconnectTimer();
    };
    
    // Register event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Start appropriate interval based on current status
    if (navigator.onLine) {
      startPingInterval();
    } else {
      startReconnectTimer();
    }
    
    // Initial connection check
    checkConnection();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopReconnectTimer();
      stopPingInterval();
    };
  }, [
    updateOnlineStatus, 
    checkConnection, 
    startReconnectTimer, 
    stopReconnectTimer, 
    startPingInterval, 
    stopPingInterval
  ]);

  return {
    isOnline,
    lastOnlineTime,
    checkConnection
  };
};

/**
 * Custom hook to use local storage with automatic JSON parsing/stringifying
 * @param {string} key - Storage key
 * @param {any} initialValue - Default value
 * @returns {Array} [storedValue, setValue] - Stored value and setter
 */
export const useLocalStorage = (key, initialValue) => {
  // State to store value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter that persists to localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function for same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Dispatch storage event for cross-tab communication
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(valueToStore),
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};

/**
 * Custom hook for debounced values
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for API requests with automatic caching and offline support
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Query options
 * @returns {Object} Query result with added utilities
 */
export const useApi = (endpoint, options = {}) => {
  const { isOnline } = useOnlineStatus();
  const queryClient = useQueryClient();
  const cacheKey = options.queryKey || ['api', endpoint];
  
  // Prepare fetch function with offline handling
  const fetchFn = useCallback(async () => {
    if (!isOnline) {
      // Return cached data when offline
      const cachedData = queryClient.getQueryData(cacheKey);
      if (cachedData) return cachedData;
      throw new Error('You are offline and no cached data is available');
    }
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${endpoint}`, {
      ...options.fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...options.fetchOptions?.headers,
      },
    });
    
    if (!response.ok) {
      const error = new Error('API request failed');
      error.status = response.status;
      try {
        error.data = await response.json();
      } catch (e) {
        error.data = null;
      }
      throw error;
    }
    
    return response.json();
  }, [endpoint, isOnline, queryClient, cacheKey, options.fetchOptions]);
  
  // Use React Query for data fetching with caching
  const query = useQuery(
    cacheKey,
    fetchFn,
    {
      enabled: options.enabled !== false,
      retry: isOnline ? options.retry ?? 2 : false,
      staleTime: options.staleTime ?? 5 * 60 * 1000, // 5 minutes
      ...options.queryOptions,
    }
  );
  
  // Add mutation capabilities
  const mutation = useMutation(
    async (data) => {
      if (!isOnline) {
        throw new Error('Cannot perform this action while offline');
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.mutationOptions?.fetchOptions?.headers,
        },
        body: JSON.stringify(data),
        ...options.mutationOptions?.fetchOptions,
      });
      
      if (!response.ok) {
        const error = new Error('API request failed');
        error.status = response.status;
        try {
          error.data = await response.json();
        } catch (e) {
          error.data = null;
        }
        throw error;
      }
      
      return response.json();
    },
    {
      onSuccess: () => {
        // Invalidate query cache on successful mutation
        queryClient.invalidateQueries(cacheKey);
      },
      ...options.mutationOptions,
    }
  );
  
  return {
    ...query,
    mutation,
    isOffline: !isOnline,
  };
};

/**
 * Custom hook for file uploads with resumable functionality
 * @param {Object} options - Upload options
 * @returns {Object} Upload methods and state
 */
export const useFileUpload = (options = {}) => {
  const [uploads, setUploads] = useState({});
  const [isOnline] = useOnlineStatus();
  const [pendingUploads, setPendingUploads] = useLocalStorage('pendingUploads', []);
  
  // Process any pending uploads when we come back online
  useEffect(() => {
    if (isOnline && pendingUploads.length > 0 && options.processPendingOnMount !== false) {
      processPendingUploads();
    }
  }, [isOnline, pendingUploads]);
  
  // Process pending uploads
  const processPendingUploads = useCallback(async () => {
    if (!isOnline || pendingUploads.length === 0) return;
    
    const currentPending = [...pendingUploads];
    // Clear pending uploads first to avoid duplicates
    setPendingUploads([]);
    
    for (const pendingUpload of currentPending) {
      try {
        // Convert data URL back to file
        const response = await fetch(pendingUpload.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], pendingUpload.filename, { 
          type: pendingUpload.type,
          lastModified: pendingUpload.lastModified 
        });
        
        // Upload the file
        await uploadFile(file, pendingUpload.uploadOptions);
      } catch (error) {
        console.error('Failed to process pending upload:', error);
        // Add back to pending
        setPendingUploads(prev => [...prev, pendingUpload]);
        break;
      }
    }
  }, [isOnline, pendingUploads, setPendingUploads]);
  
  // Add a file to pending uploads for when we're offline
  const addToPendingUploads = useCallback(async (file, uploadOptions = {}) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const newPendingUpload = {
            id: Date.now().toString(),
            filename: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            dataUrl: reader.result,
            uploadOptions,
            timestamp: Date.now()
          };
          
          setPendingUploads(prev => [...prev, newPendingUpload]);
          resolve(newPendingUpload);
        };
        reader.onerror = (error) => {
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }, [setPendingUploads]);
  
  // Upload a file with progress tracking
  const uploadFile = useCallback(async (file, uploadOptions = {}) => {
    if (!file) throw new Error('No file provided');
    
    // Generate unique ID for this upload
    const uploadId = Date.now().toString();
    
    // Initialize upload in state
    setUploads(prev => ({
      ...prev,
      [uploadId]: {
        id: uploadId,
        file,
        progress: 0,
        status: 'preparing',
        error: null,
        result: null
      }
    }));
    
    // If offline, add to pending uploads
    if (!isOnline) {
      try {
        setUploads(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            status: 'pending',
            message: 'Saved for upload when connection is restored'
          }
        }));
        
        await addToPendingUploads(file, uploadOptions);
        
        return {
          id: uploadId,
          status: 'pending',
          message: 'File saved for upload when connection is restored'
        };
      } catch (error) {
        setUploads(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            status: 'error',
            error: error.message || 'Failed to save for later upload'
          }
        }));
        throw error;
      }
    }
    
    // Proceed with upload if online
    try {
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'uploading'
        }
      }));
      
      // Configure upload progress callback
      const onProgress = (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        
        setUploads(prev => ({
          ...prev,
          [uploadId]: {
            ...prev[uploadId],
            progress
          }
        }));
        
        // Call external progress handler if provided
        if (uploadOptions.onProgress) {
          uploadOptions.onProgress(progressEvent);
        }
      };
      
      // Perform upload with appropriate service
      let result;
      if (uploadOptions.service === 'xray') {
        result = await import('../services/uploadService').then(
          module => module.default.uploadXrayImage(
            file, 
            uploadOptions.modelId,
            { 
              onUploadProgress: onProgress,
              resumable: uploadOptions.resumable !== false
            }
          )
        );
      } else if (uploadOptions.service === 'mri') {
        result = await import('../services/uploadService').then(
          module => module.default.uploadMriImage(
            file, 
            uploadOptions.modelId,
            { 
              onUploadProgress: onProgress,
              resumable: uploadOptions.resumable !== false
            }
          )
        );
      } else if (uploadOptions.service === 'ct') {
        result = await import('../services/uploadService').then(
          module => module.default.uploadCtImage(
            file, 
            uploadOptions.modelId,
            { 
              onUploadProgress: onProgress,
              resumable: uploadOptions.resumable !== false
            }
          )
        );
      } else if (uploadOptions.service === 'report') {
        result = await import('../services/uploadService').then(
          module => module.default.uploadReport(
            file,
            { 
              onUploadProgress: onProgress,
              resumable: uploadOptions.resumable !== false
            }
          )
        );
      } else {
        // Generic upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Add any additional form data
        if (uploadOptions.formData) {
          Object.entries(uploadOptions.formData).forEach(([key, value]) => {
            formData.append(key, value);
          });
        }
        
        result = await fetch(uploadOptions.endpoint || '/api/upload', {
          method: 'POST',
          body: formData,
          signal: uploadOptions.signal
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }
          return response.json();
        });
      }
      
      // Update upload state with success
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'success',
          progress: 100,
          result
        }
      }));
      
      return {
        id: uploadId,
        status: 'success',
        result
      };
    } catch (error) {
      setUploads(prev => ({
        ...prev,
        [uploadId]: {
          ...prev[uploadId],
          status: 'error',
          error: error.message || 'Upload failed'
        }
      }));
      
      throw error;
    }
  }, [isOnline, addToPendingUploads]);
  
  // Remove an upload from state
  const removeUpload = useCallback((uploadId) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      delete newUploads[uploadId];
      return newUploads;
    });
  }, []);
  
  // Clear all uploads
  const clearUploads = useCallback(() => {
    setUploads({});
  }, []);
  
  return {
    uploads,
    uploadFile,
    removeUpload,
    clearUploads,
    pendingUploads,
    processPendingUploads,
    isOnline
  };
};

/**
 * Custom hook for persistent form state
 * @param {string} formId - Unique identifier for the form
 * @param {Object} initialValues - Initial form values
 * @returns {Object} Form state and handlers
 */
export const usePersistedForm = (formId, initialValues = {}) => {
  const storageKey = `form_${formId}`;
  const [values, setValues] = useLocalStorage(storageKey, initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, [setValues]);
  
  // Handle field blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);
  
  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues, setValues]);
  
  // Clear persisted form data
  const clearPersistedData = useCallback(() => {
    localStorage.removeItem(storageKey);
    resetForm();
  }, [storageKey, resetForm]);
  
  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setTouched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    resetForm,
    clearPersistedData
  };
}; 
