'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { medicalAnalysisService } from '../../../services/medicalAnalysisService';

export default function XrayUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState({
    patientId: '',
    scanType: 'x-ray',
    bodyPart: '',
    view: 'ap',
    notes: '',
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/dicom': ['.dcm'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
      setError('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });

      await medicalAnalysisService.uploadScan(formData);
      router.push('/results');
    } catch (error) {
      setError('Failed to upload X-ray scan');
      console.error('Error uploading X-ray scan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upload X-ray Scan
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                }}
              >
                <input {...getInputProps()} />
                {files.length > 0 ? (
                  <Typography>
                    Selected {files.length} file(s)
                  </Typography>
                ) : (
                  <Typography>
                    {isDragActive
                      ? 'Drop the files here'
                      : 'Drag and drop X-ray scan files here, or click to select'}
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient ID"
                value={metadata.patientId}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    ...prev,
                    patientId: e.target.value,
                  }))
                }
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Body Part</InputLabel>
                <Select
                  value={metadata.bodyPart}
                  label="Body Part"
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      ...prev,
                      bodyPart: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="chest">Chest</MenuItem>
                  <MenuItem value="spine">Spine</MenuItem>
                  <MenuItem value="hand">Hand</MenuItem>
                  <MenuItem value="foot">Foot</MenuItem>
                  <MenuItem value="knee">Knee</MenuItem>
                  <MenuItem value="shoulder">Shoulder</MenuItem>
                  <MenuItem value="pelvis">Pelvis</MenuItem>
                  <MenuItem value="skull">Skull</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>View</InputLabel>
                <Select
                  value={metadata.view}
                  label="View"
                  onChange={(e) =>
                    setMetadata((prev) => ({
                      ...prev,
                      view: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="ap">Anterior-Posterior (AP)</MenuItem>
                  <MenuItem value="pa">Posterior-Anterior (PA)</MenuItem>
                  <MenuItem value="lateral">Lateral</MenuItem>
                  <MenuItem value="oblique">Oblique</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={4}
                value={metadata.notes}
                onChange={(e) =>
                  setMetadata((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || files.length === 0}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Uploading...
                    </>
                  ) : (
                    'Upload X-ray Scan'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
} 