import torch
import torch.nn as nn
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import json
import os
from pathlib import Path

@dataclass
class ConditionMetrics:
    probability: float
    confidence: float
    measurements: Dict
    severity: float
    urgency: str
    similarity_score: Optional[float] = None
    is_unknown: bool = False

class DecisionEngine:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Initialize condition categories first
        self.condition_categories = {
            'respiratory': [],
            'cardiovascular': [],
            'neurological': [],
            'musculoskeletal': [],
            'gastrointestinal': [],
            'endocrine': [],
            'hematological': [],
            'immunological': [],
            'dermatological': [],
            'ophthalmological': [],
            'otolaryngological': [],
            'urological': [],
            'gynecological': [],
            'pediatric': [],
            'geriatric': [],
            'rare_diseases': []
        }
        
        # Load condition database
        self.condition_database = self._load_condition_database()
        
        # Initialize classifiers for all known conditions
        self.classifiers = self._initialize_classifiers()
        
        # Initialize feature scaler
        self.scaler = StandardScaler()
        
        # WHO-compliant confidence thresholds
        self.confidence_thresholds = {
            'high': 0.9,
            'medium': 0.8,
            'low': 0.7
        }
        
        # Unknown condition detection parameters
        self.unknown_condition_params = {
            'similarity_threshold': 0.3,
            'min_confidence': 0.6,
            'max_conditions_to_compare': 10
        }

    def _load_condition_database(self) -> Dict:
        """Load comprehensive condition database"""
        try:
            # Load from JSON file
            db_path = Path(__file__).parent / 'data' / 'condition_database.json'
            with open(db_path, 'r') as f:
                database = json.load(f)
            
            # Categorize conditions
            for condition, data in database.items():
                category = data.get('category', 'rare_diseases')
                if category in self.condition_categories:
                    self.condition_categories[category].append(condition)
            
            return database
        except Exception as e:
            print(f"Error loading condition database: {e}")
            return {}

    def _initialize_classifiers(self) -> Dict:
        """Initialize classifiers for all known conditions"""
        classifiers = {}
        
        # Initialize classifiers for each condition in the database
        for condition in self.condition_database.keys():
            classifiers[condition] = self._init_classifier()
        
        return classifiers

    def _init_classifier(self) -> RandomForestClassifier:
        """Initialize a Random Forest classifier"""
        return RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )

    def analyze(
        self,
        features: Dict,
        measurements: Optional[Dict] = None,
        clinical_notes: Optional[str] = None
    ) -> Dict:
        """
        Analyze features and measurements to make decisions
        
        Args:
            features: Dictionary of extracted features
            measurements: Optional dictionary of precise measurements
            clinical_notes: Optional clinical notes for context
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Scale features
            scaled_features = self.scaler.fit_transform(
                np.array(list(features.values())).reshape(1, -1)
            )
            
            # Get predictions for all conditions
            predictions = self._get_all_predictions(scaled_features)
            
            # Check for unknown conditions
            unknown_analysis = self._analyze_unknown_conditions(
                predictions,
                features,
                clinical_notes
            )
            
            # Process measurements if available
            if measurements:
                self._process_measurements(predictions, measurements)
            
            # Calculate confidence scores
            confidence_scores = self._calculate_confidence_scores(
                predictions,
                features
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                predictions,
                confidence_scores,
                unknown_analysis
            )
            
            # Prepare results
            results = {
                'predictions': predictions,
                'confidence_scores': confidence_scores,
                'recommendations': recommendations,
                'unknown_condition_analysis': unknown_analysis,
                'explanation': self._generate_explanation(
                    predictions,
                    confidence_scores,
                    measurements,
                    unknown_analysis
                )
            }
            
            return results
            
        except Exception as e:
            raise Exception(f"Error in decision engine: {str(e)}")

    def _get_all_predictions(self, scaled_features: np.ndarray) -> Dict:
        """Get predictions for all conditions"""
        predictions = {}
        
        for condition, classifier in self.classifiers.items():
            try:
                proba = classifier.predict_proba(scaled_features)[0]
                predictions[condition] = {
                    'probability': float(proba[1]),
                    'detected': proba[1] > 0.5,
                    'category': self.condition_database[condition]['category']
                }
            except Exception as e:
                print(f"Error predicting {condition}: {e}")
                continue
        
        return predictions

    def _analyze_unknown_conditions(
        self,
        predictions: Dict,
        features: Dict,
        clinical_notes: Optional[str]
    ) -> Dict:
        """Analyze potential unknown conditions"""
        unknown_analysis = {
            'is_unknown': False,
            'similar_conditions': [],
            'confidence': 0.0,
            'recommendations': []
        }
        
        # Get top predictions
        top_predictions = sorted(
            predictions.items(),
            key=lambda x: x[1]['probability'],
            reverse=True
        )[:self.unknown_condition_params['max_conditions_to_compare']]
        
        # Check if any prediction meets unknown condition criteria
        if all(pred[1]['probability'] < self.unknown_condition_params['min_confidence'] 
               for pred in top_predictions):
            unknown_analysis['is_unknown'] = True
            
            # Find similar conditions
            similar_conditions = self._find_similar_conditions(
                features,
                clinical_notes
            )
            
            unknown_analysis['similar_conditions'] = similar_conditions
            unknown_analysis['confidence'] = self._calculate_unknown_confidence(
                similar_conditions
            )
            
            # Generate recommendations for unknown condition
            unknown_analysis['recommendations'] = self._generate_unknown_recommendations(
                similar_conditions,
                clinical_notes
            )
        
        return unknown_analysis

    def _find_similar_conditions(
        self,
        features: Dict,
        clinical_notes: Optional[str]
    ) -> List[Dict]:
        """Find conditions similar to the current case"""
        similar_conditions = []
        
        # Convert features to vector
        feature_vector = np.array(list(features.values()))
        
        # Compare with all conditions in database
        for condition, data in self.condition_database.items():
            # Calculate similarity score
            similarity = self._calculate_condition_similarity(
                feature_vector,
                data['feature_template'],
                clinical_notes,
                data.get('clinical_patterns', [])
            )
            
            if similarity > self.unknown_condition_params['similarity_threshold']:
                similar_conditions.append({
                    'condition': condition,
                    'similarity_score': similarity,
                    'category': data['category'],
                    'description': data['description']
                })
        
        # Sort by similarity score
        similar_conditions.sort(
            key=lambda x: x['similarity_score'],
            reverse=True
        )
        
        return similar_conditions[:5]  # Return top 5 similar conditions

    def _calculate_condition_similarity(
        self,
        feature_vector: np.ndarray,
        template: np.ndarray,
        clinical_notes: Optional[str],
        clinical_patterns: List[str]
    ) -> float:
        """Calculate similarity between current case and condition template"""
        # Calculate feature similarity
        feature_similarity = cosine_similarity(
            feature_vector.reshape(1, -1),
            template.reshape(1, -1)
        )[0][0]
        
        # Calculate clinical notes similarity if available
        if clinical_notes and clinical_patterns:
            clinical_similarity = self._calculate_clinical_similarity(
                clinical_notes,
                clinical_patterns
            )
            return 0.7 * feature_similarity + 0.3 * clinical_similarity
        
        return feature_similarity

    def _calculate_clinical_similarity(
        self,
        clinical_notes: str,
        patterns: List[str]
    ) -> float:
        """Calculate similarity based on clinical notes"""
        # Implement clinical notes similarity calculation
        # This could use NLP techniques to compare clinical notes with patterns
        return 0.5  # Placeholder

    def _calculate_unknown_confidence(
        self,
        similar_conditions: List[Dict]
    ) -> float:
        """Calculate confidence score for unknown condition"""
        if not similar_conditions:
            return 0.0
        
        # Calculate confidence based on similarity scores
        similarity_scores = [cond['similarity_score'] for cond in similar_conditions]
        return np.mean(similarity_scores)

    def _generate_unknown_recommendations(
        self,
        similar_conditions: List[Dict],
        clinical_notes: Optional[str]
    ) -> List[str]:
        """Generate recommendations for unknown condition"""
        recommendations = [
            "Consider consulting with specialists in the following areas:",
        ]
        
        # Add specialist recommendations based on similar conditions
        categories = set(cond['category'] for cond in similar_conditions)
        for category in categories:
            recommendations.append(f"- {category.title()} specialist")
        
        # Add general recommendations
        recommendations.extend([
            "Conduct additional diagnostic tests:",
            "- Complete blood count",
            "- Comprehensive metabolic panel",
            "- Imaging studies as indicated",
            "Consider genetic testing if applicable",
            "Document all symptoms and progression",
            "Schedule follow-up within 1 week",
            "Consider referral to a tertiary care center"
        ])
        
        return recommendations

    def _generate_explanation(
        self,
        predictions: Dict,
        confidence_scores: Dict,
        measurements: Optional[Dict],
        unknown_analysis: Dict
    ) -> Dict:
        """Generate detailed explanation of decisions"""
        explanation = {
            'detected_conditions': [],
            'confidence_analysis': {},
            'measurement_analysis': {},
            'unknown_condition_analysis': unknown_analysis,
            'recommendations': []
        }
        
        # Add detected conditions
        for condition, prediction in predictions.items():
            if prediction['detected']:
                condition_info = {
                    'condition': condition,
                    'probability': prediction['probability'],
                    'severity': prediction.get('severity', 'moderate'),
                    'confidence': confidence_scores[condition]['overall_confidence'],
                    'category': prediction['category']
                }
                explanation['detected_conditions'].append(condition_info)
                
                # Add confidence analysis
                explanation['confidence_analysis'][condition] = {
                    'base_confidence': confidence_scores[condition]['base_confidence'],
                    'feature_confidence': confidence_scores[condition]['feature_confidence'],
                    'measurement_confidence': confidence_scores[condition]['measurement_confidence']
                }
                
                # Add measurement analysis if available
                if measurements and condition in measurements:
                    explanation['measurement_analysis'][condition] = {
                        'measurements': measurements[condition],
                        'interpretation': self._interpret_measurements(
                            measurements[condition],
                            condition
                        )
                    }
        
        return explanation

    def _process_measurements(
        self,
        predictions: Dict,
        measurements: Dict
    ):
        """Process precise measurements for each condition"""
        for condition, condition_measurements in measurements.items():
            if condition in predictions and predictions[condition]['detected']:
                # Get measurement rules for condition
                rules = self.measurement_rules.get(condition, {})
                
                # Process each measurement type
                for measurement_type, measurement_data in condition_measurements.items():
                    if measurement_type in rules:
                        # Get severity based on measurement value
                        severity = self._get_measurement_severity(
                            measurement_data,
                            rules[measurement_type]
                        )
                        
                        # Update prediction with measurement-based severity
                        predictions[condition]['severity'] = severity
                        predictions[condition]['measurements'] = measurement_data

    def _get_measurement_severity(
        self,
        measurement: Dict,
        rules: Dict
    ) -> str:
        """Get severity level based on measurement value"""
        value = measurement['value']
        
        for severity, (min_val, max_val) in rules.items():
            if min_val <= value < max_val:
                return severity
        
        return 'unknown'

    def _calculate_confidence_scores(
        self,
        predictions: Dict,
        features: Dict
    ) -> Dict:
        """Calculate confidence scores for predictions"""
        confidence_scores = {}
        
        for condition, prediction in predictions.items():
            if prediction['detected']:
                # Calculate base confidence
                base_confidence = prediction['probability']
                
                # Adjust confidence based on feature quality
                feature_confidence = self._calculate_feature_confidence(
                    features,
                    condition
                )
                
                # Adjust confidence based on measurements if available
                measurement_confidence = 1.0
                if 'measurements' in prediction:
                    measurement_confidence = self._calculate_measurement_confidence(
                        prediction['measurements']
                    )
                
                # Calculate final confidence
                confidence_scores[condition] = {
                    'base_confidence': base_confidence,
                    'feature_confidence': feature_confidence,
                    'measurement_confidence': measurement_confidence,
                    'overall_confidence': (
                        base_confidence * 0.4 +
                        feature_confidence * 0.3 +
                        measurement_confidence * 0.3
                    )
                }
        
        return confidence_scores

    def _calculate_feature_confidence(
        self,
        features: Dict,
        condition: str
    ) -> float:
        """Calculate confidence based on feature quality"""
        # Implement feature quality assessment
        return 0.8  # Placeholder

    def _calculate_measurement_confidence(self, measurements: Dict) -> float:
        """Calculate confidence based on measurement quality"""
        if not measurements:
            return 1.0
        
        # Calculate average measurement confidence
        confidences = [
            measurement.get('confidence', 0.8)
            for measurement in measurements.values()
        ]
        
        return np.mean(confidences)

    def _generate_recommendations(
        self,
        predictions: Dict,
        confidence_scores: Dict,
        unknown_analysis: Dict
    ) -> List[str]:
        """Generate clinical recommendations"""
        recommendations = []
        
        for condition, prediction in predictions.items():
            if prediction['detected']:
                confidence = confidence_scores[condition]['overall_confidence']
                severity = prediction.get('severity', 'moderate')
                
                # Generate condition-specific recommendations
                if condition == 'pneumonia':
                    recommendations.extend(
                        self._get_pneumonia_recommendations(
                            severity,
                            confidence
                        )
                    )
                elif condition == 'tuberculosis':
                    recommendations.extend(
                        self._get_tuberculosis_recommendations(
                            severity,
                            confidence
                        )
                    )
                elif condition == 'covid19':
                    recommendations.extend(
                        self._get_covid19_recommendations(
                            severity,
                            confidence
                        )
                    )
                elif condition == 'stroke':
                    recommendations.extend(
                        self._get_stroke_recommendations(
                            severity,
                            confidence
                        )
                    )
                elif condition == 'cancer':
                    recommendations.extend(
                        self._get_cancer_recommendations(
                            severity,
                            confidence
                        )
                    )
                elif condition == 'multiple_sclerosis':
                    recommendations.extend(
                        self._get_ms_recommendations(
                            severity,
                            confidence
                        )
                    )
        
        return recommendations

    def _interpret_measurements(
        self,
        measurements: Dict,
        condition: str
    ) -> Dict:
        """Interpret measurements for a condition"""
        interpretation = {}
        
        for measurement_type, measurement_data in measurements.items():
            value = measurement_data['value']
            unit = measurement_data['unit']
            
            # Get reference ranges
            reference_ranges = self.measurement_rules.get(condition, {}).get(
                measurement_type,
                {}
            )
            
            # Interpret measurement
            if reference_ranges:
                for severity, (min_val, max_val) in reference_ranges.items():
                    if min_val <= value < max_val:
                        interpretation[measurement_type] = {
                            'value': f"{value:.2f} {unit}",
                            'severity': severity,
                            'reference_range': f"{min_val}-{max_val} {unit}"
                        }
                        break
        
        return interpretation

    def _get_pneumonia_recommendations(
        self,
        severity: str,
        confidence: float
    ) -> List[str]:
        """Get recommendations for pneumonia"""
        recommendations = []
        
        if confidence >= self.confidence_thresholds['high']:
            if severity == 'mild':
                recommendations.extend([
                    "Prescribe appropriate antibiotics",
                    "Monitor symptoms for 48 hours",
                    "Schedule follow-up in 1 week"
                ])
            elif severity == 'moderate':
                recommendations.extend([
                    "Prescribe broad-spectrum antibiotics",
                    "Consider hospitalization",
                    "Monitor oxygen saturation",
                    "Schedule follow-up in 3-5 days"
                ])
            else:  # severe
                recommendations.extend([
                    "Immediate hospitalization required",
                    "Start IV antibiotics",
                    "Monitor vital signs closely",
                    "Consider ICU admission"
                ])
        
        return recommendations

    def _get_tuberculosis_recommendations(
        self,
        severity: str,
        confidence: float
    ) -> List[str]:
        """Get recommendations for tuberculosis"""
        recommendations = []
        
        if confidence >= self.confidence_thresholds['high']:
            if severity == 'mild':
                recommendations.extend([
                    "Start standard TB treatment",
                    "Monitor for side effects",
                    "Schedule follow-up in 2 weeks"
                ])
            elif severity == 'moderate':
                recommendations.extend([
                    "Start intensive TB treatment",
                    "Consider hospitalization",
                    "Monitor liver function",
                    "Schedule follow-up in 1 week"
                ])
            else:  # severe
                recommendations.extend([
                    "Immediate hospitalization required",
                    "Start intensive TB treatment",
                    "Monitor for complications",
                    "Consider isolation measures"
                ])
        
        return recommendations

    def _get_covid19_recommendations(
        self,
        severity: str,
        confidence: float
    ) -> List[str]:
        """Get recommendations for COVID-19"""
        recommendations = []
        
        if confidence >= self.confidence_thresholds['high']:
            if severity == 'mild':
                recommendations.extend([
                    "Self-isolation for 14 days",
                    "Monitor symptoms",
                    "Stay hydrated",
                    "Schedule follow-up in 1 week"
                ])
            elif severity == 'moderate':
                recommendations.extend([
                    "Consider hospitalization",
                    "Monitor oxygen saturation",
                    "Start appropriate treatment",
                    "Schedule follow-up in 3-5 days"
                ])
            else:  # severe
                recommendations.extend([
                    "Immediate hospitalization required",
                    "Monitor vital signs closely",
                    "Consider ICU admission",
                    "Start aggressive treatment"
                ])
        
        return recommendations

    def _get_stroke_recommendations(
        self,
        severity: str,
        confidence: float
    ) -> List[str]:
        """Get recommendations for stroke"""
        recommendations = []
        
        if confidence >= self.confidence_thresholds['high']:
            if severity == 'mild':
                recommendations.extend([
                    "Immediate neurological consultation",
                    "Start appropriate medication",
                    "Monitor for progression",
                    "Schedule follow-up in 1 week"
                ])
            elif severity == 'moderate':
                recommendations.extend([
                    "Immediate hospitalization required",
                    "Start emergency treatment",
                    "Monitor for complications",
                    "Consider rehabilitation"
                ])
            else:  # severe
                recommendations.extend([
                    "Immediate emergency care required",
                    "Start aggressive treatment",
                    "Monitor for life-threatening complications",
                    "Prepare for possible surgery"
                ])
        
        return recommendations

    def _get_cancer_recommendations(
        self,
        severity: str,
        confidence: float
    ) -> List[str]:
        """Get recommendations for cancer"""
        recommendations = []
        
        if confidence >= self.confidence_thresholds['high']:
            if severity == 'stage1':
                recommendations.extend([
                    "Schedule oncology consultation",
                    "Plan for surgical intervention",
                    "Monitor for progression",
                    "Schedule follow-up in 2 weeks"
                ])
            elif severity == 'stage2':
                recommendations.extend([
                    "Immediate oncology consultation",
                    "Consider combination therapy",
                    "Monitor for metastasis",
                    "Schedule follow-up in 1 week"
                ])
            elif severity == 'stage3':
                recommendations.extend([
                    "Immediate hospitalization required",
                    "Start aggressive treatment",
                    "Monitor for complications",
                    "Consider clinical trials"
                ])
            else:  # stage4
                recommendations.extend([
                    "Immediate palliative care consultation",
                    "Start appropriate treatment",
                    "Monitor quality of life",
                    "Consider hospice care"
                ])
        
        return recommendations

    def _get_ms_recommendations(
        self,
        severity: str,
        confidence: float
    ) -> List[str]:
        """Get recommendations for multiple sclerosis"""
        recommendations = []
        
        if confidence >= self.confidence_thresholds['high']:
            if severity == 'mild':
                recommendations.extend([
                    "Schedule neurology consultation",
                    "Start appropriate medication",
                    "Monitor symptoms",
                    "Schedule follow-up in 2 weeks"
                ])
            elif severity == 'moderate':
                recommendations.extend([
                    "Immediate neurology consultation",
                    "Start disease-modifying therapy",
                    "Monitor for progression",
                    "Schedule follow-up in 1 week"
                ])
            else:  # severe
                recommendations.extend([
                    "Immediate hospitalization required",
                    "Start aggressive treatment",
                    "Monitor for complications",
                    "Consider rehabilitation"
                ])
        
        return recommendations 