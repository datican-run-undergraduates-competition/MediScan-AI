import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import numpy as np
from .pattern_matcher import AdvancedPatternMatcher
from ..models.model_manager import ModelManager
from ..config.integration_config import load_config

class MedicalCaseProcessor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.config = load_config()
        self.pattern_matcher = AdvancedPatternMatcher()
        self.model_manager = ModelManager()
        
        # Initialize required models
        self._initialize_models()
        
    def _initialize_models(self):
        """Initialize required models from model manager."""
        try:
            # Load pre-trained models
            self.image_processor = self.model_manager.load_model('image_processor')
            self.text_processor = self.model_manager.load_model('text_processor')
            self.decision_engine = self.model_manager.load_model('decision_engine')
            self.measurement_processor = self.model_manager.load_model('measurement_processor')
            self.chatbot = self.model_manager.load_model('chatbot')
            
            self.logger.info("Successfully initialized all required models")
        except Exception as e:
            self.logger.error(f"Error initializing models: {str(e)}")
            raise
            
    def process_medical_case(self,
                           image_data: Optional[Dict] = None,
                           text_data: Optional[Dict] = None,
                           measurements: Optional[Dict] = None,
                           patient_data: Optional[Dict] = None) -> Dict:
        """
        Process a complete medical case using all available data.
        
        Args:
            image_data: Dictionary containing image data and metadata
            text_data: Dictionary containing clinical notes and text data
            measurements: Dictionary containing various measurements
            patient_data: Dictionary containing patient information and history
            
        Returns:
            Dictionary containing analysis results and recommendations
        """
        try:
            # Initialize results dictionary
            results = {
                'image_analysis': None,
                'text_analysis': None,
                'measurement_analysis': None,
                'pattern_matches': None,
                'decision': None,
                'confidence_scores': {},
                'recommendations': [],
                'explanations': {}  # Added for chatbot explanations
            }
            
            # Process image data if available
            if image_data:
                results['image_analysis'] = self._process_image_data(image_data)
                
            # Process text data if available
            if text_data:
                results['text_analysis'] = self._process_text_data(text_data)
                
            # Process measurements if available
            if measurements:
                results['measurement_analysis'] = self._process_measurements(measurements)
                
            # Extract features for pattern matching
            features = self._extract_features(results)
            
            # Perform pattern matching
            if features:
                results['pattern_matches'] = self.pattern_matcher.match_patterns(
                    features,
                    patient_data or {}
                )
                
            # Make final decision
            results['decision'] = self._make_decision(results)
            
            # Generate recommendations
            results['recommendations'] = self._generate_recommendations(results)
            
            # Generate explanations using chatbot
            results['explanations'] = self._generate_explanations(results)
            
            return results
            
        except Exception as e:
            self.logger.error(f"Error processing medical case: {str(e)}")
            raise
            
    def _generate_explanations(self, results: Dict) -> Dict:
        """Generate natural language explanations using the chatbot model."""
        try:
            explanations = {}
            
            # Prepare context for chatbot
            context = {
                'decision': results.get('decision', {}),
                'pattern_matches': results.get('pattern_matches', []),
                'image_analysis': results.get('image_analysis', {}),
                'text_analysis': results.get('text_analysis', {}),
                'measurement_analysis': results.get('measurement_analysis', {}),
                'recommendations': results.get('recommendations', [])
            }
            
            # Generate summary explanation
            explanations['summary'] = self.chatbot.generate_summary(context)
            
            # Generate detailed explanations for each component
            if results.get('decision'):
                explanations['decision'] = self.chatbot.explain_decision(
                    results['decision'],
                    context
                )
                
            if results.get('pattern_matches'):
                explanations['conditions'] = self.chatbot.explain_conditions(
                    results['pattern_matches'],
                    context
                )
                
            if results.get('recommendations'):
                explanations['recommendations'] = self.chatbot.explain_recommendations(
                    results['recommendations'],
                    context
                )
                
            # Generate follow-up questions
            explanations['follow_up_questions'] = self.chatbot.generate_follow_up_questions(
                context
            )
            
            return explanations
            
        except Exception as e:
            self.logger.error(f"Error generating explanations: {str(e)}")
            return {}
            
    def get_chat_response(self,
                         query: str,
                         context: Optional[Dict] = None) -> Dict:
        """
        Get a response from the chatbot for a specific query.
        
        Args:
            query: The user's question or query
            context: Optional context from previous analysis
            
        Returns:
            Dictionary containing the chatbot's response and related information
        """
        try:
            # Prepare input for chatbot
            chatbot_input = {
                'query': query,
                'context': context or {},
                'config': self.config.get('chatbot', {})
            }
            
            # Get response from chatbot
            response = self.chatbot.generate_response(chatbot_input)
            
            return {
                'response': response.get('text', ''),
                'confidence': response.get('confidence', 0.0),
                'sources': response.get('sources', []),
                'suggested_questions': response.get('suggested_questions', []),
                'context_updates': response.get('context_updates', {})
            }
            
        except Exception as e:
            self.logger.error(f"Error getting chat response: {str(e)}")
            return {
                'response': 'I apologize, but I encountered an error processing your query.',
                'confidence': 0.0,
                'sources': [],
                'suggested_questions': [],
                'context_updates': {}
            }
            
    def _process_image_data(self, image_data: Dict) -> Dict:
        """Process medical image data using the image processor model."""
        try:
            # Prepare image data for model
            processed_image = self.image_processor.preprocess(image_data)
            
            # Get model predictions
            predictions = self.image_processor.predict(processed_image)
            
            # Post-process results
            analysis = self.image_processor.postprocess(predictions)
            
            return {
                'findings': analysis.get('findings', []),
                'quality_metrics': analysis.get('quality_metrics', {}),
                'confidence_scores': analysis.get('confidence_scores', {}),
                'metadata': analysis.get('metadata', {})
            }
            
        except Exception as e:
            self.logger.error(f"Error processing image data: {str(e)}")
            return {}
            
    def _process_text_data(self, text_data: Dict) -> Dict:
        """Process clinical text data using the text processor model."""
        try:
            # Prepare text data for model
            processed_text = self.text_processor.preprocess(text_data)
            
            # Get model predictions
            predictions = self.text_processor.predict(processed_text)
            
            # Post-process results
            analysis = self.text_processor.postprocess(predictions)
            
            return {
                'key_findings': analysis.get('key_findings', []),
                'symptoms': analysis.get('symptoms', []),
                'confidence_scores': analysis.get('confidence_scores', {}),
                'metadata': analysis.get('metadata', {})
            }
            
        except Exception as e:
            self.logger.error(f"Error processing text data: {str(e)}")
            return {}
            
    def _process_measurements(self, measurements: Dict) -> Dict:
        """Process medical measurements using the measurement processor model."""
        try:
            # Prepare measurements for model
            processed_measurements = self.measurement_processor.preprocess(measurements)
            
            # Get model predictions
            predictions = self.measurement_processor.predict(processed_measurements)
            
            # Post-process results
            analysis = self.measurement_processor.postprocess(predictions)
            
            return {
                'abnormal_values': analysis.get('abnormal_values', []),
                'trends': analysis.get('trends', {}),
                'confidence_scores': analysis.get('confidence_scores', {}),
                'metadata': analysis.get('metadata', {})
            }
            
        except Exception as e:
            self.logger.error(f"Error processing measurements: {str(e)}")
            return {}
            
    def _extract_features(self, results: Dict) -> Dict:
        """Extract features from all analysis results for pattern matching."""
        features = {
            'key_findings': [],
            'severity': 'mild',
            'urgency_level': 'normal'
        }
        
        # Extract findings from image analysis
        if results['image_analysis']:
            features['key_findings'].extend(
                results['image_analysis'].get('findings', [])
            )
            
        # Extract findings from text analysis
        if results['text_analysis']:
            features['key_findings'].extend(
                results['text_analysis'].get('key_findings', [])
            )
            
        # Extract findings from measurement analysis
        if results['measurement_analysis']:
            features['key_findings'].extend(
                results['measurement_analysis'].get('abnormal_values', [])
            )
            
        return features
        
    def _make_decision(self, results: Dict) -> Dict:
        """Make final decision using the decision engine model."""
        try:
            # Prepare input for decision engine
            decision_input = {
                'pattern_matches': results.get('pattern_matches', []),
                'image_analysis': results.get('image_analysis', {}),
                'text_analysis': results.get('text_analysis', {}),
                'measurement_analysis': results.get('measurement_analysis', {})
            }
            
            # Get decision engine prediction
            decision = self.decision_engine.predict(decision_input)
            
            return {
                'primary_condition': decision.get('primary_condition'),
                'confidence': decision.get('confidence'),
                'severity': decision.get('severity'),
                'urgency': decision.get('urgency'),
                'supporting_evidence': decision.get('supporting_evidence', []),
                'differential_diagnosis': decision.get('differential_diagnosis', [])
            }
            
        except Exception as e:
            self.logger.error(f"Error making decision: {str(e)}")
            return {}
            
    def _generate_recommendations(self, results: Dict) -> List[Dict]:
        """Generate recommendations based on analysis results and decision."""
        recommendations = []
        
        # Get decision details
        decision = results.get('decision', {})
        pattern_matches = results.get('pattern_matches', [])
        
        # Add primary condition recommendations
        if decision.get('primary_condition'):
            primary_match = next(
                (match for match in pattern_matches 
                 if match['condition'] == decision['primary_condition']),
                None
            )
            
            if primary_match:
                recommendations.extend([
                    {
                        'type': 'treatment',
                        'description': action,
                        'priority': 'high' if decision.get('urgency') == 'high' else 'medium',
                        'confidence': decision.get('confidence', 0.0)
                    }
                    for action in primary_match.get('recommended_actions', [])
                ])
                
        # Add measurement-based recommendations
        if results.get('measurement_analysis'):
            for abnormal in results['measurement_analysis'].get('abnormal_values', []):
                recommendations.append({
                    'type': 'monitoring',
                    'description': f"Monitor {abnormal['name']}",
                    'priority': 'medium',
                    'confidence': abnormal.get('confidence', 0.0)
                })
                
        return recommendations 