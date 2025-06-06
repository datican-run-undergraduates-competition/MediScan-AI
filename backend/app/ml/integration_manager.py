import os
import json
import logging
from typing import Dict, List, Optional, Union
from pathlib import Path
import torch
import numpy as np
from datetime import datetime

from .image_processor import ImageProcessor
from .text_processor import TextProcessor
from .decision_engine import DecisionEngine
from .measurement_processor import MeasurementProcessor
from .feature_fusion import MultiModalFusion

class IntegrationManager:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Initialize components
        self.image_processor = ImageProcessor()
        self.text_processor = TextProcessor()
        self.decision_engine = DecisionEngine()
        self.measurement_processor = MeasurementProcessor()
        self.feature_fusion = MultiModalFusion()
        
        # Load configuration
        self.config = self._load_config()
        
        # Initialize session tracking
        self.active_sessions = {}
        
    def _load_config(self) -> Dict:
        """Load integration configuration"""
        try:
            config_path = Path(__file__).parent / 'config' / 'integration_config.json'
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Error loading config: {e}")
            return {}
    
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
    
    def _initialize_session(self, session_id: str):
        """Initialize a new analysis session"""
        self.active_sessions[session_id] = {
            'start_time': datetime.now(),
            'status': 'processing',
            'results': None
        }
    
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
    
    def _update_session(self, session_id: str, report: Dict):
        """Update session with analysis results"""
        if session_id in self.active_sessions:
            self.active_sessions[session_id].update({
                'status': 'completed',
                'results': report,
                'end_time': datetime.now()
            })
    
    def get_session_status(self, session_id: str) -> Dict:
        """Get status of analysis session"""
        return self.active_sessions.get(session_id, {})
    
    def clear_session(self, session_id: str):
        """Clear analysis session"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
    
    def get_chatbot_response(
        self,
        session_id: str,
        user_query: str
    ) -> Dict:
        """
        Get chatbot response based on analysis results
        
        Args:
            session_id: Session identifier
            user_query: User's question
            
        Returns:
            Dictionary containing chatbot response
        """
        try:
            # Get session results
            session = self.active_sessions.get(session_id)
            if not session or session['status'] != 'completed':
                return {
                    'error': 'Session not found or analysis not completed'
                }
            
            # Process query with context from analysis
            response = self._process_chatbot_query(
                user_query,
                session['results']
            )
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting chatbot response: {e}")
            raise
    
    def _process_chatbot_query(
        self,
        query: str,
        analysis_results: Dict
    ) -> Dict:
        """Process chatbot query with analysis context"""
        try:
            # Extract relevant information based on query
            context = self._extract_query_context(query, analysis_results)
            
            # Generate response
            response = {
                'answer': self._generate_chatbot_answer(query, context),
                'relevant_measurements': context.get('measurements', {}),
                'confidence_score': context.get('confidence', 0.0),
                'sources': context.get('sources', [])
            }
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error processing chatbot query: {e}")
            raise
    
    def _extract_query_context(
        self,
        query: str,
        analysis_results: Dict
    ) -> Dict:
        """Extract relevant context for chatbot query"""
        context = {
            'measurements': {},
            'confidence': 0.0,
            'sources': []
        }
        
        # Extract relevant measurements
        if 'measurements' in analysis_results:
            for condition, measurements in analysis_results['measurements'].items():
                if condition.lower() in query.lower():
                    context['measurements'][condition] = measurements
        
        # Extract confidence scores
        if 'confidence_scores' in analysis_results:
            context['confidence'] = max(
                analysis_results['confidence_scores'].values(),
                default=0.0
            )
        
        # Add sources
        if 'image_analysis' in analysis_results:
            context['sources'].append('Medical Imaging')
        if 'text_analysis' in analysis_results:
            context['sources'].append('Clinical Notes')
        
        return context
    
    def _generate_chatbot_answer(
        self,
        query: str,
        context: Dict
    ) -> str:
        """Generate chatbot answer based on context"""
        # Implement natural language response generation
        # This could use a language model or template-based approach
        return "Analysis results indicate..."  # Placeholder 