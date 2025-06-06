import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const UploadArea = ({ onUpload }) => {
  const theme = useTheme();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.dicom'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    setUploading(true);
    for (const file of files) {
      if (file.status === 'pending') {
        setUploadProgress((prev) => ({
          ...prev,
          [file.id]: 0,
        }));

        try {
          // Simulate upload progress
          for (let i = 0; i <= 100; i += 10) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            setUploadProgress((prev) => ({
              ...prev,
              [file.id]: i,
            }));
          }

          // Update file status
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: 'success' } : f
            )
          );

          // Call the onUpload callback
          onUpload(file);
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, status: 'error' } : f
            )
          );
        }
      }
    }
    setUploading(false);
  };

  const removeFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          background: isDragActive
            ? 'rgba(0, 122, 255, 0.1)'
            : 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '2px dashed',
          borderColor: isDragActive ? '#007AFF' : 'rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(0, 122, 255, 0.05)',
            borderColor: '#007AFF',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CloudUploadIcon
              sx={{
                fontSize: 64,
                color: isDragActive ? '#007AFF' : 'rgba(255, 255, 255, 0.5)',
                mb: 2,
              }}
            />
          </motion.div>
          <Typography
            variant="h6"
            sx={{
              mb: 1,
              fontWeight: 600,
              background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {isDragActive
              ? 'Drop your files here'
              : 'Drag & drop files here, or click to select'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'center' }}
          >
            Supports DICOM, JPG, PNG, and PDF files
          </Typography>
        </Box>
      </Paper>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #FFFFFF, #CCCCCC)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Selected Files
              </Typography>
              {files.map((file) => (
                <Paper
                  key={file.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    background: 'rgba(26, 26, 26, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {file.status === 'success' ? (
                        <CheckCircleIcon sx={{ color: '#34C759', mr: 1 }} />
                      ) : file.status === 'error' ? (
                        <ErrorIcon sx={{ color: '#FF3B30', mr: 1 }} />
                      ) : null}
                      <Typography variant="body1">{file.file.name}</Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeFile(file.id)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: '#FF3B30',
                        },
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  {file.status === 'pending' && (
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress[file.id] || 0}
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #007AFF, #00C6FF)',
                        },
                      }}
                    />
                  )}
                </Paper>
              ))}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  mt: 2,
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(45deg, #007AFF, #00C6FF)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: uploading ? 0.7 : 1,
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </motion.button>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default UploadArea; 