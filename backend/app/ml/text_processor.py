from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn as nn
from typing import Dict, List, Optional
import numpy as np
import re

class TextProcessor:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.tokenizer = AutoTokenizer.from_pretrained("emilyalsentzer/Bio_ClinicalBERT")
        self.model = AutoModel.from_pretrained("emilyalsentzer/Bio_ClinicalBERT")
        self.model.to(self.device)
        self.model.eval()

        # WHO-compliant medical terminology
        self.medical_terms = {
            'symptoms': [
                'fever', 'cough', 'shortness of breath', 'chest pain',
                'headache', 'fatigue', 'nausea', 'vomiting', 'dizziness'
            ],
            'conditions': [
                'pneumonia', 'tuberculosis', 'covid-19', 'stroke',
                'cancer', 'multiple sclerosis', 'aneurysm'
            ],
            'severity': [
                'mild', 'moderate', 'severe', 'critical',
                'acute', 'chronic', 'progressive'
            ]
        }

    def analyze_report(self, text: str) -> Dict:
        """
        Analyze medical report text using BioClinicalBERT
        
        Args:
            text: Medical report text
            
        Returns:
            Dictionary containing extracted features and clinical indicators
        """
        try:
            # Preprocess text
            cleaned_text = self._preprocess_text(text)
            
            # Tokenize and get embeddings
            inputs = self.tokenizer(
                cleaned_text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            ).to(self.device)
            
            # Get embeddings
            with torch.no_grad():
                outputs = self.model(**inputs)
                embeddings = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
            
            # Extract clinical indicators
            indicators = self._extract_clinical_indicators(cleaned_text)
            
            # Calculate confidence scores
            confidence_scores = self._calculate_confidence_scores(indicators)
            
            return {
                'embeddings': embeddings,
                'clinical_indicators': indicators,
                'confidence_scores': confidence_scores,
                'text_quality': self._assess_text_quality(cleaned_text)
            }
            
        except Exception as e:
            raise Exception(f"Error analyzing medical report: {str(e)}")

    def _preprocess_text(self, text: str) -> str:
        """Preprocess medical report text"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep medical terms
        text = re.sub(r'[^\w\s\-]', ' ', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text

    def _extract_clinical_indicators(self, text: str) -> Dict:
        """Extract clinical indicators from text"""
        indicators = {
            'symptoms': [],
            'conditions': [],
            'severity': [],
            'measurements': self._extract_measurements(text),
            'temporal_info': self._extract_temporal_info(text)
        }
        
        # Extract medical terms
        for category, terms in self.medical_terms.items():
            for term in terms:
                if term in text:
                    indicators[category].append(term)
        
        return indicators

    def _extract_measurements(self, text: str) -> List[Dict]:
        """Extract numerical measurements from text"""
        measurements = []
        
        # Common measurement patterns
        patterns = {
            'temperature': r'(\d+\.?\d*)\s*[°Ff]',
            'blood_pressure': r'(\d+)\s*/\s*(\d+)\s*[Mm][Mm][Hh][Gg]',
            'heart_rate': r'(\d+)\s*[Bb][Pp][Mm]',
            'oxygen_saturation': r'(\d+)\s*%'
        }
        
        for measurement_type, pattern in patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                measurements.append({
                    'type': measurement_type,
                    'value': match.group(1),
                    'unit': self._get_unit(measurement_type)
                })
        
        return measurements

    def _extract_temporal_info(self, text: str) -> Dict:
        """Extract temporal information from text"""
        temporal_info = {
            'onset': None,
            'duration': None,
            'frequency': None
        }
        
        # Extract onset
        onset_patterns = [
            r'onset\s+(\d+)\s+(day|week|month|year)s?\s+ago',
            r'started\s+(\d+)\s+(day|week|month|year)s?\s+ago'
        ]
        
        for pattern in onset_patterns:
            match = re.search(pattern, text)
            if match:
                temporal_info['onset'] = {
                    'value': int(match.group(1)),
                    'unit': match.group(2)
                }
                break
        
        return temporal_info

    def _calculate_confidence_scores(self, indicators: Dict) -> Dict:
        """Calculate confidence scores for extracted indicators"""
        confidence_scores = {}
        
        # Calculate confidence based on term frequency and context
        for category, terms in indicators.items():
            if isinstance(terms, list):
                confidence_scores[category] = {
                    term: self._calculate_term_confidence(term, category)
                    for term in terms
                }
        
        return confidence_scores

    def _calculate_term_confidence(self, term: str, category: str) -> float:
        """Calculate confidence score for a specific term"""
        # Base confidence on term specificity and category
        base_confidence = {
            'symptoms': 0.8,
            'conditions': 0.9,
            'severity': 0.85
        }.get(category, 0.7)
        
        # Adjust confidence based on term length and specificity
        term_specificity = len(term.split()) / 2
        confidence = base_confidence * (1 + term_specificity * 0.1)
        
        return min(confidence, 1.0)

    def _assess_text_quality(self, text: str) -> Dict:
        """Assess the quality of medical report text"""
        quality_metrics = {
            'completeness': self._assess_completeness(text),
            'clarity': self._assess_clarity(text),
            'consistency': self._assess_consistency(text)
        }
        
        # Calculate overall quality score
        quality_metrics['overall_score'] = np.mean([
            quality_metrics['completeness'],
            quality_metrics['clarity'],
            quality_metrics['consistency']
        ])
        
        return quality_metrics

    def _assess_completeness(self, text: str) -> float:
        """Assess completeness of medical report"""
        required_sections = [
            'history', 'examination', 'findings', 'impression'
        ]
        
        # Check for presence of required sections
        section_scores = [
            1.0 if section in text.lower() else 0.0
            for section in required_sections
        ]
        
        return np.mean(section_scores)

    def _assess_clarity(self, text: str) -> float:
        """Assess clarity of medical report"""
        # Calculate average sentence length
        sentences = text.split('.')
        avg_sentence_length = np.mean([
            len(sentence.split())
            for sentence in sentences
            if sentence.strip()
        ])
        
        # Score based on sentence length (optimal: 15-20 words)
        if 15 <= avg_sentence_length <= 20:
            return 1.0
        elif 10 <= avg_sentence_length <= 25:
            return 0.8
        else:
            return 0.6

    def _assess_consistency(self, text: str) -> float:
        """Assess consistency of medical report"""
        # Check for contradictory terms
        contradictions = [
            ('acute', 'chronic'),
            ('mild', 'severe'),
            ('improving', 'worsening')
        ]
        
        contradiction_score = 1.0
        for term1, term2 in contradictions:
            if term1 in text and term2 in text:
                contradiction_score *= 0.8
        
        return contradiction_score

    def _get_unit(self, measurement_type: str) -> str:
        """Get appropriate unit for measurement type"""
        units = {
            'temperature': '°F',
            'blood_pressure': 'mmHg',
            'heart_rate': 'bpm',
            'oxygen_saturation': '%'
        }
        return units.get(measurement_type, '') 