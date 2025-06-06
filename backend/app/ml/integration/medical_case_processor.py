from typing import Dict, Optional, Union
from .base_manager import BaseIntegrationManager
from ..image_processor import ImageProcessor
from ..text_processor import TextProcessor
from ..decision_engine import DecisionEngine
from ..measurement_processor import MeasurementProcessor
from ..feature_fusion import MultiModalFusion

class MedicalCaseProcessor(BaseIntegrationManager):
    def __init__(self):
        super().__init__()
        
        # Initialize components
        self.image_processor = ImageProcessor()
        self.text_processor = TextProcessor()
        self.decision_engine = DecisionEngine()
        self.measurement_processor = MeasurementProcessor()
        self.feature_fusion = MultiModalFusion()
    
    def process_medical_case(
        self,
        session_id: str,
        image_data: Union[str, bytes],
        clinical_notes: Optional[str] = None,
        dicom_metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Process a complete medical case with integrated analysis
        
        Args:
            session_id: Unique session identifier
            image_data: Medical image data (path or bytes)
            clinical_notes: Optional clinical notes
            dicom_metadata: Optional DICOM metadata
            
        Returns:
            Dictionary containing comprehensive analysis results
        """
        try:
            # Initialize session
            self._initialize_session(session_id)
            
            # Process image
            image_results = self._process_image(image_data, dicom_metadata)
            
            # Process clinical notes if available
            text_results = None
            if clinical_notes:
                text_results = self._process_clinical_notes(clinical_notes)
            
            # Fuse features
            fused_features = self._fuse_features(image_results, text_results)
            
            # Get measurements
            measurements = self._get_measurements(image_results)
            
            # Make decisions
            analysis_results = self._analyze_case(
                fused_features,
                measurements,
                clinical_notes
            )
            
            # Generate comprehensive report
            report = self._generate_report(
                session_id,
                image_results,
                text_results,
                analysis_results
            )
            
            # Update session
            self._update_session(session_id, report)
            
            return report
            
        except Exception as e:
            self.logger.error(f"Error processing case: {e}")
            raise
    
    def _process_image(
        self,
        image_data: Union[str, bytes],
        dicom_metadata: Optional[Dict]
    ) -> Dict:
        """Process medical image with DICOM support"""
        try:
            # Process image
            image_results = self.image_processor.process_image(image_data)
            
            # Add DICOM metadata if available
            if dicom_metadata:
                image_results['dicom_metadata'] = dicom_metadata
            
            return image_results
            
        except Exception as e:
            self.logger.error(f"Error processing image: {e}")
            raise
    
    def _process_clinical_notes(self, clinical_notes: str) -> Dict:
        """Process clinical notes"""
        try:
            return self.text_processor.analyze_report(clinical_notes)
        except Exception as e:
            self.logger.error(f"Error processing clinical notes: {e}")
            raise
    
    def _fuse_features(
        self,
        image_results: Dict,
        text_results: Optional[Dict]
    ) -> Dict:
        """Fuse image and text features"""
        try:
            return self.feature_fusion.fuse_features(
                image_results,
                text_results
            )
        except Exception as e:
            self.logger.error(f"Error fusing features: {e}")
            raise
    
    def _get_measurements(self, image_results: Dict) -> Dict:
        """Get precise measurements from image results"""
        try:
            return self.measurement_processor.process_measurements(
                image_results['image'],
                image_results['modality'],
                image_results['region'],
                image_results['predictions']
            )
        except Exception as e:
            self.logger.error(f"Error getting measurements: {e}")
            raise
    
    def _analyze_case(
        self,
        features: Dict,
        measurements: Dict,
        clinical_notes: Optional[str]
    ) -> Dict:
        """Analyze case with all available information"""
        try:
            return self.decision_engine.analyze(
                features,
                measurements,
                clinical_notes
            )
        except Exception as e:
            self.logger.error(f"Error analyzing case: {e}")
            raise
    
    def _generate_report(
        self,
        session_id: str,
        image_results: Dict,
        text_results: Optional[Dict],
        analysis_results: Dict
    ) -> Dict:
        """Generate comprehensive analysis report"""
        try:
            report = {
                'session_id': session_id,
                'timestamp': str(datetime.now()),
                'image_analysis': {
                    'modality': image_results['modality'],
                    'quality_metrics': image_results['quality_metrics'],
                    'attention_map': image_results['attention_map']
                },
                'text_analysis': text_results if text_results else None,
                'measurements': analysis_results.get('measurements', {}),
                'predictions': analysis_results['predictions'],
                'confidence_scores': analysis_results['confidence_scores'],
                'recommendations': analysis_results['recommendations'],
                'unknown_condition_analysis': analysis_results.get(
                    'unknown_condition_analysis',
                    {}
                )
            }
            
            # Add DICOM metadata if available
            if 'dicom_metadata' in image_results:
                report['dicom_metadata'] = image_results['dicom_metadata']
            
            return report
            
        except Exception as e:
            self.logger.error(f"Error generating report: {e}")
            raise 