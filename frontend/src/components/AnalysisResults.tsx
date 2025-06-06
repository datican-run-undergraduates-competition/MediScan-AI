import React from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Zoom,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Paper
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { AnalysisResult, PatternMatch } from '../services/medicalAnalysisService';

interface AnalysisResultsProps {
  result: AnalysisResult;
  onExport?: () => void;
  onCompare?: () => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  boxShadow: theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const ConfidenceScore = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
}));

const PatternList = styled(List)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
}));

const TimelineWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.spacing(1),
  marginTop: theme.spacing(2)
}));

const ProgressionIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  marginBottom: theme.spacing(1)
}));

const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  onExport,
  onCompare
}) => {
  const [expandedPatterns, setExpandedPatterns] = React.useState<number[]>([]);

  const togglePatterns = (index: number) => {
    setExpandedPatterns(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
        return 'error';
      case 'moderate':
        return 'warning';
      case 'mild':
        return 'success';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const renderPrimaryDiagnosis = () => (
    <StyledCard>
      <Typography variant="h6" gutterBottom>
        Primary Diagnosis
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" color="textSecondary">
            Condition
          </Typography>
          <Typography variant="h5" gutterBottom>
            {result.primary_diagnosis.condition}
          </Typography>
          <ConfidenceScore>
            <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
              Confidence:
            </Typography>
            <LinearProgress
              variant="determinate"
              value={result.primary_diagnosis.confidence * 100}
              color={getConfidenceColor(result.primary_diagnosis.confidence)}
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Typography variant="body2">
              {Math.round(result.primary_diagnosis.confidence * 100)}%
            </Typography>
          </ConfidenceScore>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" flexDirection="column" gap={1}>
            <Chip
              label={`Severity: ${result.primary_diagnosis.severity}`}
              color={getSeverityColor(result.primary_diagnosis.severity)}
              size="small"
            />
            <Chip
              label={`Urgency: ${result.primary_diagnosis.urgency_level}`}
              color={getSeverityColor(result.primary_diagnosis.urgency_level)}
              size="small"
            />
          </Box>
        </Grid>
      </Grid>
    </StyledCard>
  );

  const renderDifferentialDiagnoses = () => (
    <StyledCard>
      <Typography variant="h6" gutterBottom>
        Differential Diagnoses
      </Typography>
      <List>
        {result.differential_diagnoses.map((diagnosis, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <AssessmentIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={diagnosis.condition}
              secondary={
                <ConfidenceScore>
                  <LinearProgress
                    variant="determinate"
                    value={diagnosis.confidence * 100}
                    color={getConfidenceColor(diagnosis.confidence)}
                    sx={{ flexGrow: 1, mr: 1 }}
                  />
                  <Typography variant="body2">
                    {Math.round(diagnosis.confidence * 100)}%
                  </Typography>
                </ConfidenceScore>
              }
            />
          </ListItem>
        ))}
      </List>
    </StyledCard>
  );

  const renderTemporalAnalysis = (match: PatternMatch) => (
    <TimelineWrapper>
      <Typography variant="subtitle2" gutterBottom>
        Temporal Analysis
      </Typography>
      <Timeline>
        {Object.entries(match.temporal_factors).map(([factor, score], index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent>
              <Typography variant="body2" color="textSecondary">
                {factor}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={getConfidenceColor(score)}>
                <ScheduleIcon />
              </TimelineDot>
              {index < Object.entries(match.temporal_factors).length - 1 && (
                <TimelineConnector />
              )}
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="body2">
                {Math.round(score * 100)}% Match
              </Typography>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </TimelineWrapper>
  );

  const renderProgressionAnalysis = (match: PatternMatch) => (
    <Box mt={2}>
      <Typography variant="subtitle2" gutterBottom>
        Progression Analysis
      </Typography>
      <ProgressionIndicator>
        <TrendingUpIcon color="primary" />
        <Box flex={1}>
          <Typography variant="body2" gutterBottom>
            Progression Score
          </Typography>
          <LinearProgress
            variant="determinate"
            value={match.progression_score * 100}
            color={getConfidenceColor(match.progression_score)}
          />
        </Box>
        <Typography variant="body2">
          {Math.round(match.progression_score * 100)}%
        </Typography>
      </ProgressionIndicator>
    </Box>
  );

  const renderRarityIndicator = (match: PatternMatch) => (
    <Box display="flex" alignItems="center" gap={1} mt={1}>
      <StarIcon color={match.rarity_score > 0.7 ? "warning" : "action"} />
      <Typography variant="body2" color="textSecondary">
        {match.rarity_score > 0.7 ? "Rare Condition" : "Common Condition"}
      </Typography>
    </Box>
  );

  const renderPatternMatches = () => (
    <StyledCard>
      <Typography variant="h6" gutterBottom>
        Pattern Matches
      </Typography>
      {result.pattern_matches.map((match, index) => (
        <Box key={index} mb={2}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: 'background.default',
              borderRadius: 1,
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1">
                {match.condition}
              </Typography>
              <Box>
                <Tooltip
                  title="View Details"
                  TransitionComponent={Zoom}
                  arrow
                >
                  <IconButton
                    size="small"
                    onClick={() => togglePatterns(index)}
                  >
                    {expandedPatterns.includes(index) ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {match.description}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
              {Object.entries(match.confidence_factors).map(([factor, score]) => (
                <Chip
                  key={factor}
                  label={`${factor}: ${Math.round(score * 100)}%`}
                  color={getConfidenceColor(score)}
                  size="small"
                />
              ))}
            </Box>
            {renderRarityIndicator(match)}
            <Collapse in={expandedPatterns.includes(index)}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>
                Matched Patterns
              </Typography>
              <PatternList>
                {match.matched_patterns.map((pattern, pIndex) => (
                  <ListItem key={pIndex} dense>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={pattern} />
                  </ListItem>
                ))}
              </PatternList>
              {renderTemporalAnalysis(match)}
              {renderProgressionAnalysis(match)}
            </Collapse>
          </Paper>
        </Box>
      ))}
    </StyledCard>
  );

  const renderKeyFindings = () => (
    <StyledCard>
      <Typography variant="h6" gutterBottom>
        Key Findings
      </Typography>
      <List>
        {result.key_findings.map((finding, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={finding} />
          </ListItem>
        ))}
      </List>
    </StyledCard>
  );

  const renderRecommendedTests = () => (
    <StyledCard>
      <Typography variant="h6" gutterBottom>
        Recommended Tests
      </Typography>
      <List>
        {result.recommended_tests.map((test, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <TimelineIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={test} />
          </ListItem>
        ))}
      </List>
    </StyledCard>
  );

  return (
    <Box>
      {renderPrimaryDiagnosis()}
      {renderDifferentialDiagnoses()}
      {renderPatternMatches()}
      {renderKeyFindings()}
      {renderRecommendedTests()}
    </Box>
  );
};

export default AnalysisResults; 