import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';

const Input = styled('input')({
  display: 'none',
});

const ImageAnalysis = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modality, setModality] = useState('xray');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      setError(null);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleReportUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedReport(file);
    }
  };

  const handleModalityChange = (event) => {
    setModality(event.target.value);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (selectedReport) {
        formData.append('report', selectedReport);
      }
      formData.append('modality', modality);

      const response = await fetch('http://localhost:8000/api/v1/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysisResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!analysisResults || !selectedImage) return;

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('analysis_results', JSON.stringify(analysisResults));
      formData.append('modality', modality);

      const response = await fetch('http://localhost:8000/api/v1/export-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('PDF generation failed');
      }

      // Get the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mediscan_report_${new Date().toISOString().slice(0,19).replace(/[:]/g, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to generate PDF report');
    }
  };

  const getSeverityColor = (probability) => {
    if (probability >= 0.8) return 'error';
    if (probability >= 0.6) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        MediScan AI Analysis
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Medical Data
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <label htmlFor="image-upload">
                <Input
                  accept="image/*"
                  id="image-upload"
                  type="file"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="contained"
                  component="span"
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Upload Medical Image
                </Button>
              </label>
              {selectedImage && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {selectedImage.name}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <label htmlFor="report-upload">
                <Input
                  accept=".txt,.pdf"
                  id="report-upload"
                  type="file"
                  onChange={handleReportUpload}
                />
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Upload Medical Report (Optional)
                </Button>
              </label>
              {selectedReport && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {selectedReport.name}
                </Typography>
              )}
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Image Modality</InputLabel>
              <Select
                value={modality}
                label="Image Modality"
                onChange={handleModalityChange}
              >
                <MenuItem value="xray">X-Ray</MenuItem>
                <MenuItem value="mri">MRI</MenuItem>
                <MenuItem value="ct">CT Scan</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              onClick={handleAnalyze}
              disabled={loading || !selectedImage}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Paper>

          {imagePreview && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Image Preview
              </Typography>
              <Card>
                <CardMedia
                  component="img"
                  image={imagePreview}
                  alt="Medical image preview"
                  sx={{ maxHeight: 300, objectFit: 'contain' }}
                />
              </Card>
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {analysisResults && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Analysis Results
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportPDF}
                >
                  Export PDF
                </Button>
              </Box>

              {analysisResults.results.predictions && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Detected Conditions:
                  </Typography>
                  <Stack spacing={2}>
                    {Object.entries(analysisResults.results.predictions).map(([condition, data]) => (
                      data.detected && (
                        <Card key={condition} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                {condition.toUpperCase()}
                              </Typography>
                              <Chip
                                icon={data.probability >= 0.8 ? <WarningIcon /> : <CheckCircleIcon />}
                                label={`${(data.probability * 100).toFixed(1)}% Confidence`}
                                color={getSeverityColor(data.probability)}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {data.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      )
                    ))}
                  </Stack>
                </Box>
              )}

              {analysisResults.results.explanation && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Clinical Recommendations:
                  </Typography>
                  <Stack spacing={1}>
                    {analysisResults.results.explanation.recommendations.map((rec, index) => (
                      <Alert
                        key={index}
                        severity={rec.toLowerCase().includes('immediate') ? 'error' : 'info'}
                        icon={rec.toLowerCase().includes('immediate') ? <WarningIcon /> : <InfoIcon />}
                        sx={{ mb: 1 }}
                      >
                        {rec}
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImageAnalysis; 