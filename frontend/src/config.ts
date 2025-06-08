// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
 
// Other configuration constants can be added here
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/dicom']; 