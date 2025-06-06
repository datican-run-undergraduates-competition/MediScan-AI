from typing import Dict, List, Optional
import logging
from datetime import datetime
from ..ml.analysis.advanced_medical_analyzer import AdvancedMedicalAnalyzer, AnalysisResult
from ..ml.analysis.pattern_matcher import AdvancedPatternMatcher, PatternMatch

class MedicalAnalysisService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.analyzer = AdvancedMedicalAnalyzer()
        self.pattern_matcher = AdvancedPatternMatcher()
        
    async def analyze_medical_case(self,
                                 patient_data: Dict,
                                 scan_data: Dict,
                                 lab_results: Dict,
                                 clinical_notes: Dict) -> Dict:
        """
        Analyze a medical case using the advanced analysis engine.
        """
        try:
            # Prepare data for analysis
            clinical_data = self._prepare_clinical_data(clinical_notes)
            imaging_data = self._prepare_imaging_data(scan_data)
            lab_data = self._prepare_lab_data(lab_results)
            history_data = self._prepare_history_data(patient_data)
            
            # Perform comprehensive analysis
            analysis_result = self.analyzer.analyze_medical_data(
                clinical_data=clinical_data,
                imaging_data=imaging_data,
                lab_results=lab_data,
                patient_history=history_data
            )
            
            # Perform pattern matching
            pattern_matches = self.pattern_matcher.match_patterns(
                features=self._extract_features(analysis_result),
                conditions_db=self._load_conditions_db(),
                patient_data=patient_data
            )
            
            # Generate comprehensive report
            report = self._generate_report(analysis_result, pattern_matches)
            
            return report
            
        except Exception as e:
            self.logger.error(f"Error in medical analysis: {str(e)}")
            raise
    
    def _prepare_clinical_data(self, clinical_notes: Dict) -> Dict:
        """Prepare clinical data for analysis."""
        return {
            'symptoms': clinical_notes.get('symptoms', []),
            'vital_signs': clinical_notes.get('vital_signs', {}),
            'physical_exam': clinical_notes.get('physical_exam', {}),
            'medications': clinical_notes.get('medications', []),
            'allergies': clinical_notes.get('allergies', []),
            'social_history': clinical_notes.get('social_history', {})
        }
    
    def _prepare_imaging_data(self, scan_data: Dict) -> Dict:
        """Prepare imaging data for analysis."""
        return {
            'modality': scan_data.get('modality'),
            'findings': scan_data.get('findings', []),
            'measurements': scan_data.get('measurements', {}),
            'quality_metrics': scan_data.get('quality_metrics', {}),
            'comparison': scan_data.get('comparison', {}),
            'technical_parameters': scan_data.get('technical_parameters', {})
        }
    
    def _prepare_lab_data(self, lab_results: Dict) -> Dict:
        """Prepare laboratory data for analysis."""
        return {
            'blood_tests': lab_results.get('blood_tests', {}),
            'urine_tests': lab_results.get('urine_tests', {}),
            'microbiology': lab_results.get('microbiology', {}),
            'pathology': lab_results.get('pathology', {}),
            'genetic_tests': lab_results.get('genetic_tests', {})
        }
    
    def _prepare_history_data(self, patient_data: Dict) -> Dict:
        """Prepare patient history data for analysis."""
        return {
            'medical_history': patient_data.get('medical_history', []),
            'surgical_history': patient_data.get('surgical_history', []),
            'family_history': patient_data.get('family_history', {}),
            'medications': patient_data.get('medications', []),
            'allergies': patient_data.get('allergies', []),
            'social_history': patient_data.get('social_history', {})
        }
    
    def _extract_features(self, analysis_result: AnalysisResult) -> Dict:
        """Extract features from analysis result for pattern matching."""
        return {
            'condition': analysis_result.condition,
            'confidence': analysis_result.confidence,
            'severity': analysis_result.severity,
            'key_findings': analysis_result.key_findings,
            'differential_diagnoses': analysis_result.differential_diagnoses,
            'recommended_tests': analysis_result.recommended_tests,
            'urgency_level': analysis_result.urgency_level
        }
    
    def _load_conditions_db(self) -> Dict:
        """Load conditions database."""
        # Implement loading from conditions.json
        return {}
    
    def _generate_report(self, 
                        analysis_result: AnalysisResult,
                        pattern_matches: List[PatternMatch]) -> Dict:
        """Generate comprehensive medical report."""
        return {
            'primary_diagnosis': {
                'condition': analysis_result.condition,
                'confidence': analysis_result.confidence,
                'severity': analysis_result.severity,
                'urgency_level': analysis_result.urgency_level
            },
            'differential_diagnoses': [
                {
                    'condition': condition,
                    'confidence': confidence
                }
                for condition, confidence in analysis_result.differential_diagnoses
            ],
            'key_findings': analysis_result.key_findings,
            'recommended_tests': analysis_result.recommended_tests,
            'pattern_matches': [
                {
                    'condition': match.condition,
                    'similarity_score': match.similarity_score,
                    'matched_patterns': match.matched_patterns,
                    'confidence_factors': match.confidence_factors
                }
                for match in pattern_matches
            ],
            'timestamp': datetime.now().isoformat()
        } 