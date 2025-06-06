import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  useTheme,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tooltip,
  Zoom,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Fade,
  Badge,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Compare as CompareIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  LocalHospital as LocalHospitalIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { styled } from '@mui/material/styles';
import {
  medicalScanService,
  ScanMetadata,
  UploadProgress,
  BatchUploadResult,
  RealTimeUpdate,
} from '../services/medicalScanService';

// Styled components
const UploadBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.default,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.dark,
    transform: 'translateY(-2px)',
  },
}));

const PreviewImage = styled('img')({
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '8px',
});

const QualityIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-2px)',
  },
}));

const FileCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

interface FileWithPreview extends File {
  preview?: string;
  metadata?: Partial<ScanMetadata>;
  status?: 'pending' | 'uploading' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  quality?: number;
  warnings?: string[];
}

const MedicalScanUpload: React.FC = () => {
  const theme = useTheme();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanMetadata[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    warnings: number;
  }>({
    total: 0,
    completed: 0,
    failed: 0,
    warnings: 0,
  });
  const [activeStep, setActiveStep] = useState(0);
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([]);

  useEffect(() => {
    const handleUpdate = (update: RealTimeUpdate) => {
      setRealTimeUpdates(prev => [...prev, update]);
      
      if (update.type === 'progress' || update.type === 'status') {
        setFiles(prev =>
          prev.map(file => {
            if (file.name === update.data.fileName) {
              return {
                ...file,
                status: update.data.status,
                progress: update.data.progress,
                error: update.data.error,
                quality: update.data.quality,
                warnings: update.data.warnings,
              };
            }
            return file;
          })
        );
      }
    };

    medicalScanService.on('update', handleUpdate);
    return () => {
      medicalScanService.removeListener('update', handleUpdate);
    };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map(file => {
      const fileWithPreview = Object.assign(file, {
        preview: URL.createObjectURL(file),
        metadata: {
          scanType: '',
          modality: 'x-ray',
        },
        status: 'pending',
        progress: 0,
      });
      return fileWithPreview;
    });
    setFiles(prev => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.dicom'],
      'application/dicom': ['.dcm'],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');
    setError(null);
    setActiveStep(0);
    setRealTimeUpdates([]);

    try {
      const results = await medicalScanService.batchUpload(
        files,
        files.map(f => f.metadata || {}),
        (progress) => {
          setBatchProgress(progress);
          setUploadProgress((progress.completed / progress.total) * 100);
        }
      );

      if (results.failed.length > 0) {
        setError(`${results.failed.length} files failed to upload`);
      }

      if (results.warnings.length > 0) {
        setError(prev => 
          prev ? `${prev} (${results.warnings.length} warnings)` : `${results.warnings.length} warnings`
        );
      }

      if (results.success.length > 0) {
        setUploadStatus('success');
        setActiveStep(1);
      }
    } catch (error) {
      setUploadStatus('error');
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const file = files[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMetadataEdit = (file: FileWithPreview) => {
    setSelectedFile(file);
    setMetadataDialogOpen(true);
  };

  const handleMetadataSave = (metadata: Partial<ScanMetadata>) => {
    if (selectedFile) {
      setFiles(prev =>
        prev.map(file =>
          file === selectedFile ? { ...file, metadata } : file
        )
      );
    }
    setMetadataDialogOpen(false);
  };

  const handleExpandFile = (index: number) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'uploading':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderFileCard = (file: FileWithPreview, index: number) => (
    <FileCard key={index}>
      <ListItem
        button
        onClick={() => handleExpandFile(index)}
        sx={{
          borderLeft: `4px solid ${
            file.quality && file.quality < 60
              ? theme.palette.warning.main
              : theme.palette.primary.main
          }`,
        }}
      >
        <ListItemIcon>
          {file.preview ? (
            <img
              src={file.preview}
              alt={file.name}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
            />
          ) : (
            <ImageIcon color="primary" />
          )}
        </ListItemIcon>
        <ListItemText
          primary={file.name}
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
              {file.metadata?.scanType && (
                <Chip
                  size="small"
                  label={file.metadata.scanType}
                  variant="outlined"
                />
              )}
              {file.metadata?.modality && (
                <Chip
                  size="small"
                  label={file.metadata.modality}
                  variant="outlined"
                />
              )}
              {file.status && (
                <Chip
                  size="small"
                  label={file.status}
                  color={getStatusColor(file.status)}
                />
              )}
              {file.quality && (
                <Chip
                  size="small"
                  icon={<SpeedIcon />}
                  label={`Quality: ${file.quality}%`}
                  color={file.quality < 60 ? 'warning' : 'success'}
                />
              )}
            </Box>
          }
        />
        <ListItemSecondaryAction>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit Metadata">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMetadataEdit(file);
                }}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            {expandedFiles.has(index) ? (
              <ExpandLessIcon />
            ) : (
              <ExpandMoreIcon />
            )}
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
      <Collapse in={expandedFiles.has(index)}>
        <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
          {file.status === 'uploading' && (
            <LinearProgress
              variant="determinate"
              value={file.progress || 0}
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
            />
          )}
          {file.error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {file.error}
            </Alert>
          )}
          {file.warnings && file.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {file.warnings.map((warning, i) => (
                <Typography key={i} variant="body2">
                  {warning}
                </Typography>
              ))}
            </Alert>
          )}
        </Box>
      </Collapse>
    </FileCard>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Upload Medical Scans
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Upload Files</StepLabel>
        </Step>
        <Step>
          <StepLabel>Processing</StepLabel>
        </Step>
        <Step>
          <StepLabel>Complete</StepLabel>
        </Step>
      </Stepper>

      <Grid container spacing={3}>
        {/* Upload Area */}
        <Grid item xs={12} md={6}>
          <UploadBox {...getRootProps()}>
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive
                ? 'Drop the files here'
                : 'Drag and drop medical images here, or click to select files'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: PNG, JPG, JPEG, DICOM
            </Typography>
          </UploadBox>
        </Grid>

        {/* Preview Area */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Selected Files ({files.length})
                </Typography>
                <Badge
                  badgeContent={batchProgress.warnings}
                  color="warning"
                  sx={{ mr: 2 }}
                >
                  <WarningIcon color="warning" />
                </Badge>
              </Box>
              {files.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center">
                  No files selected
                </Typography>
              ) : (
                <List>
                  {files.map((file, index) => renderFileCard(file, index))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Batch Progress */}
        {uploading && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={uploadProgress}
                    size={24}
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body2">
                    Uploading... {uploadProgress.toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={uploadProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Completed: {batchProgress.completed}
                  </Typography>
                  <Typography variant="caption" color="error">
                    Failed: {batchProgress.failed}
                  </Typography>
                  <Typography variant="caption" color="warning">
                    Warnings: {batchProgress.warnings}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total: {batchProgress.total}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Real-time Updates */}
        {realTimeUpdates.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Real-time Updates
                </Typography>
                <List>
                  {realTimeUpdates.map((update, index) => (
                    <Fade in key={index}>
                      <Alert
                        severity={update.type === 'error' ? 'error' : 'info'}
                        sx={{ mb: 1 }}
                      >
                        {update.data.message}
                      </Alert>
                    </Fade>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => setFiles([])}
              disabled={files.length === 0 || uploading}
              startIcon={<DeleteIcon />}
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Metadata Dialog */}
      <Dialog
        open={metadataDialogOpen}
        onClose={() => setMetadataDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Scan Metadata</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Scan Type"
              fullWidth
              value={selectedFile?.metadata?.scanType || ''}
              onChange={(e) =>
                handleMetadataSave({
                  ...selectedFile?.metadata,
                  scanType: e.target.value,
                })
              }
            />
            <TextField
              select
              label="Modality"
              fullWidth
              value={selectedFile?.metadata?.modality || 'x-ray'}
              onChange={(e) =>
                handleMetadataSave({
                  ...selectedFile?.metadata,
                  modality: e.target.value as ScanMetadata['modality'],
                })
              }
            >
              <MenuItem value="x-ray">X-Ray</MenuItem>
              <MenuItem value="mri">MRI</MenuItem>
              <MenuItem value="ct">CT</MenuItem>
              <MenuItem value="ultrasound">Ultrasound</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMetadataDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => setMetadataDialogOpen(false)} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={uploadStatus === 'success'}
        autoHideDuration={6000}
        onClose={() => setUploadStatus('idle')}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Upload completed successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MedicalScanUpload; 