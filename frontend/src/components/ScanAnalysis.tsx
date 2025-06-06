import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  LinearProgress,
  IconButton,
  Tooltip,
  Zoom,
  Button,
  Chip,
  Divider,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  useTheme,
  Fade,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ZoomIn as ZoomInIcon,
  Compare as CompareIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  LocalHospital as LocalHospitalIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  ScanMetadata,
  ScanFinding,
  ScanMeasurement,
  QualityMetrics,
  RealTimeUpdate,
} from '../services/medicalScanService';

// Styled components
const QualityScore = styled(Box)(({ theme }) => ({
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

const MeasurementBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const FindingCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

interface ScanAnalysisProps {
  scan: ScanMetadata;
  onZoom: (location: { x: number; y: number; width: number; height: number }) => void;
  onExport: (format: 'pdf' | 'dicom' | 'csv' | 'json') => void;
  onCompare: (scanId: string) => void;
  onTimeline?: () => void;
  onAssessment?: () => void;
}

const ScanAnalysis: React.FC<ScanAnalysisProps> = ({
  scan,
  onZoom,
  onExport,
  onCompare,
  onTimeline,
  onAssessment,
}) => {
  const theme = useTheme();
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [expandedMeasurements, setExpandedMeasurements] = useState<Set<string>>(new Set());
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return theme.palette.error.main;
      case 'moderate':
        return theme.palette.warning.main;
      case 'mild':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const toggleFinding = (findingId: string) => {
    setExpandedFindings(prev => {
      const next = new Set(prev);
      if (next.has(findingId)) {
        next.delete(findingId);
      } else {
        next.add(findingId);
      }
      return next;
    });
  };

  const toggleMeasurement = (measurementId: string) => {
    setExpandedMeasurements(prev => {
      const next = new Set(prev);
      if (next.has(measurementId)) {
        next.delete(measurementId);
      } else {
        next.add(measurementId);
      }
      return next;
    });
  };

  const renderQualityMetrics = (metrics: QualityMetrics) => (
    <Grid container spacing={2}>
      {Object.entries(metrics).map(([key, value]) => (
        <Grid item xs={12} sm={6} md={4} key={key}>
          <QualityScore>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={value}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getQualityColor(value),
                  },
                }}
              />
            </Box>
            <Typography
              variant="body2"
              sx={{ color: getQualityColor(value), fontWeight: 'bold' }}
            >
              {value}%
            </Typography>
          </QualityScore>
        </Grid>
      ))}
    </Grid>
  );

  const renderFindings = (findings: ScanFinding[]) => (
    <List>
      {findings.map((finding) => (
        <FindingCard key={finding.id}>
          <ListItem
            button
            onClick={() => toggleFinding(finding.id)}
            sx={{
              borderLeft: `4px solid ${getSeverityColor(finding.severity)}`,
            }}
          >
            <ListItemIcon>
              <LocalHospitalIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={finding.type}
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={finding.severity}
                    sx={{
                      backgroundColor: getSeverityColor(finding.severity),
                      color: 'white',
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Confidence: {finding.confidence}%
                  </Typography>
                </Box>
              }
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onZoom(finding.location);
              }}
            >
              <ZoomInIcon />
            </IconButton>
            {expandedFindings.has(finding.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
          <Collapse in={expandedFindings.has(finding.id)}>
            <Box sx={{ pl: 7, pr: 2, pb: 2 }}>
              <Typography variant="body2" paragraph>
                {finding.description}
              </Typography>
              {finding.recommendations.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Recommendations:
                  </Typography>
                  <List dense>
                    {finding.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          </Collapse>
        </FindingCard>
      ))}
    </List>
  );

  const renderMeasurements = (measurements: ScanMeasurement[]) => (
    <Grid container spacing={2}>
      {measurements.map((measurement, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <MeasurementBox>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" color="primary">
                {measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onZoom(measurement.location)}
              >
                <ZoomInIcon />
              </IconButton>
            </Box>
            <Typography variant="h6" gutterBottom>
              {measurement.value} {measurement.unit}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={measurement.confidence}
              sx={{
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getQualityColor(measurement.confidence),
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Confidence: {measurement.confidence}%
            </Typography>
          </MeasurementBox>
        </Grid>
      ))}
    </Grid>
  );

  const renderRealTimeUpdates = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Real-time Updates
      </Typography>
      <List>
        {realTimeUpdates.map((update, index) => (
          <Fade in key={index}>
            <Alert
              severity={update.type === 'status' && update.data.status === 'failed' ? 'error' : 'info'}
              sx={{ mb: 1 }}
            >
              {update.data.message}
            </Alert>
          </Fade>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Quality Assessment */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Quality Assessment</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="View Timeline">
                  <IconButton onClick={onTimeline} color="primary">
                    <TimelineIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Detailed Assessment">
                  <IconButton onClick={onAssessment} color="primary">
                    <AssessmentIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {renderQualityMetrics(scan.qualityMetrics)}
          </Card>
        </Grid>

        {/* Findings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Findings
            </Typography>
            {renderFindings(scan.findings)}
          </Card>
        </Grid>

        {/* Measurements */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Measurements
            </Typography>
            {renderMeasurements(scan.measurements)}
          </Card>
        </Grid>

        {/* Real-time Updates */}
        {realTimeUpdates.length > 0 && (
          <Grid item xs={12}>
            {renderRealTimeUpdates()}
          </Grid>
        )}

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<CompareIcon />}
              onClick={() => onCompare(scan.id)}
            >
              Compare
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => onExport('pdf')}
            >
              Export Report
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScanAnalysis; 