import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer
import json
from pathlib import Path
from datetime import datetime, timedelta

@dataclass
class PatternMatch:
    condition: str
    description: str
    similarity_score: float
    matched_patterns: List[str]
    confidence_factors: Dict[str, float]
    temporal_factors: Dict[str, float]
    progression_score: float
    rarity_score: float
    severity_level: str
    recommended_actions: List[str]
    risk_assessment: Dict[str, float]
    treatment_suggestions: List[str]
    stage_analysis: Dict[str, float]
    source_database: str  # Indicates which database the condition came from

class AdvancedPatternMatcher:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.conditions_db = self._load_conditions_db('conditions.json')
        self.condition_database = self._load_conditions_db('condition_database.json')
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self._initialize_vectorizer()
        self.condition_rarity = self._calculate_condition_rarity()
        
    def _load_conditions_db(self, filename: str) -> Dict:
        """Load conditions database from JSON file."""
        try:
            data_dir = Path(__file__).parent.parent / 'data'
            with open(data_dir / filename, 'r') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Error loading conditions database {filename}: {str(e)}")
            return {'conditions': []}
        
    def _initialize_vectorizer(self):
        """Initialize TF-IDF vectorizer with condition descriptions from both databases."""
        condition_texts = []
        
        # Add conditions from first database
        for condition in self.conditions_db['conditions']:
            condition_texts.append(
                f"{condition['name']} {condition['description']} {' '.join(condition['clinical_patterns'])}"
            )
            
        # Add conditions from second database
        for condition in self.condition_database['conditions']:
            condition_texts.append(
                f"{condition['name']} {condition['description']} {' '.join(condition['clinical_patterns'])}"
            )
            
        self.tfidf_vectorizer.fit(condition_texts)
        
    def _calculate_condition_rarity(self) -> Dict[str, float]:
        """Calculate rarity scores for conditions from both databases."""
        rarity_scores = {}
        pattern_frequencies = defaultdict(int)
        
        # Process both databases
        all_conditions = (
            self.conditions_db['conditions'] + 
            self.condition_database['conditions']
        )
        
        # Calculate pattern frequencies across both databases
        for condition in all_conditions:
            for pattern in condition['clinical_patterns']:
                pattern_frequencies[pattern] += 1
                
            # Consider analysis parameters in rarity calculation
            analysis_params = condition.get('analysis_parameters', {})
            risk_factors = analysis_params.get('risk_factors', [])
            progression_stages = analysis_params.get('progression_stages', [])
            
            # Calculate rarity based on multiple factors
            pattern_rarity = sum(
                1 / (pattern_frequencies[pattern] + 1)
                for pattern in condition['clinical_patterns']
            )
            
            risk_factor_rarity = sum(
                factor['impact'] for factor in risk_factors
            ) / len(risk_factors) if risk_factors else 0.5
            
            progression_rarity = len(progression_stages) / 3  # Normalize by typical number of stages
            
            # Combine factors with weights
            rarity_scores[condition['name']] = (
                0.4 * pattern_rarity +
                0.3 * risk_factor_rarity +
                0.3 * progression_rarity
            )
            
        return rarity_scores
        
    def match_patterns(self,
                      features: Dict,
                      patient_data: Dict) -> List[Dict]:
        """
        Enhanced pattern matching using both condition databases.
        """
        try:
            # Prepare feature vectors
            feature_vector = self._prepare_feature_vector(features)
            
            # Match against both databases
            matches_db1 = self._match_against_database(
                feature_vector,
                self.conditions_db,
                features,
                patient_data,
                'primary'
            )
            
            matches_db2 = self._match_against_database(
                feature_vector,
                self.condition_database,
                features,
                patient_data,
                'secondary'
            )
            
            # Combine and deduplicate matches
            all_matches = self._combine_matches(matches_db1, matches_db2)
            
            # Sort by similarity score
            return sorted(all_matches, key=lambda x: x['similarity_score'], reverse=True)
            
        except Exception as e:
            self.logger.error(f"Error in pattern matching: {str(e)}")
            raise
            
    def _match_against_database(self,
                              feature_vector: np.ndarray,
                              database: Dict,
                              features: Dict,
                              patient_data: Dict,
                              source: str) -> List[Dict]:
        """Match patterns against a specific database."""
        condition_vectors = self._prepare_condition_vectors(database)
        
        # Calculate similarities using multiple methods
        cosine_scores = self._calculate_cosine_similarity(feature_vector, condition_vectors)
        pattern_scores = self._calculate_pattern_similarity(features, database)
        severity_scores = self._calculate_severity_similarity(features, database)
        temporal_scores = self._calculate_temporal_similarity(features, patient_data)
        progression_scores = self._calculate_progression_scores(features, patient_data)
        risk_scores = self._calculate_risk_scores(features, patient_data)
        
        # Combine scores with weighted averaging
        combined_scores = self._combine_scores(
            cosine_scores,
            pattern_scores,
            severity_scores,
            temporal_scores,
            progression_scores,
            risk_scores,
            weights=[0.2, 0.2, 0.15, 0.15, 0.15, 0.15]
        )
        
        # Get top matches
        top_matches = self._get_top_matches(combined_scores, threshold=0.6)
        
        # Enhance matches with additional context
        enhanced_matches = self._enhance_matches(
            top_matches,
            features,
            patient_data,
            database,
            source
        )
        
        return enhanced_matches
        
    def _combine_matches(self,
                        matches_db1: List[Dict],
                        matches_db2: List[Dict]) -> List[Dict]:
        """Combine and deduplicate matches from both databases."""
        combined_matches = {}
        
        # Process matches from first database
        for match in matches_db1:
            combined_matches[match['condition']] = match
            
        # Process matches from second database
        for match in matches_db2:
            if match['condition'] in combined_matches:
                # If condition exists in both databases, take the one with higher score
                if match['similarity_score'] > combined_matches[match['condition']]['similarity_score']:
                    combined_matches[match['condition']] = match
            else:
                combined_matches[match['condition']] = match
                
        return list(combined_matches.values())
        
    def _enhance_matches(self,
                        matches: List[Tuple[int, float]],
                        features: Dict,
                        patient_data: Dict,
                        database: Dict,
                        source: str) -> List[Dict]:
        """Enhanced match processing with additional analysis capabilities."""
        enhanced_matches = []
        
        for idx, score in matches:
            condition = database['conditions'][idx]
            
            # Calculate confidence factors
            confidence_factors = {
                'pattern_match': self._calculate_pattern_confidence(
                    features.get('key_findings', []),
                    condition['clinical_patterns']
                ),
                'severity_match': self._calculate_severity_confidence(
                    features.get('severity', ''),
                    condition['severity_levels']
                ),
                'patient_history': self._calculate_history_confidence(
                    patient_data,
                    condition
                ),
                'temporal_match': self._calculate_temporal_confidence(
                    patient_data,
                    condition
                )
            }
            
            # Calculate temporal factors
            temporal_factors = self._calculate_temporal_factors(
                patient_data,
                condition
            )
            
            # Analyze current stage
            stage_analysis = self._analyze_stage(features, condition)
            current_stage = max(stage_analysis.items(), key=lambda x: x[1])[0]
            
            # Get treatment suggestions
            treatment_suggestions = self._get_treatment_suggestions(
                condition,
                current_stage
            )
            
            # Calculate risk assessment
            risk_assessment = self._calculate_risk_assessment(
                patient_data,
                condition
            )
            
            enhanced_matches.append({
                'condition': condition['name'],
                'description': condition['description'],
                'similarity_score': float(score),
                'matched_patterns': self._get_matched_patterns(
                    features.get('key_findings', []),
                    condition['clinical_patterns']
                ),
                'confidence_factors': confidence_factors,
                'temporal_factors': temporal_factors,
                'progression_score': self._calculate_progression_score(
                    patient_data,
                    condition
                ),
                'rarity_score': self.condition_rarity.get(condition['name'], 0.5),
                'severity_level': features.get('severity', 'mild'),
                'recommended_actions': treatment_suggestions,
                'risk_assessment': risk_assessment,
                'treatment_suggestions': treatment_suggestions,
                'stage_analysis': stage_analysis,
                'source_database': source
            })
            
        return enhanced_matches
        
    def _prepare_feature_vector(self, features: Dict) -> np.ndarray:
        """Convert features to TF-IDF vector."""
        feature_text = ' '.join([
            str(features.get('condition', '')),
            ' '.join(features.get('key_findings', [])),
            str(features.get('severity', '')),
            str(features.get('urgency_level', ''))
        ])
        return self.tfidf_vectorizer.transform([feature_text]).toarray()
        
    def _prepare_condition_vectors(self, conditions_db: Dict) -> np.ndarray:
        """Convert conditions to TF-IDF vectors."""
        condition_texts = [
            f"{condition['name']} {condition['description']} {' '.join(condition['clinical_patterns'])}"
            for condition in conditions_db['conditions']
        ]
        return self.tfidf_vectorizer.transform(condition_texts).toarray()
        
    def _calculate_cosine_similarity(self,
                                   feature_vector: np.ndarray,
                                   condition_vectors: np.ndarray) -> np.ndarray:
        """Calculate cosine similarity between feature and condition vectors."""
        return cosine_similarity(feature_vector, condition_vectors)[0]
        
    def _calculate_pattern_similarity(self,
                                    features: Dict,
                                    conditions_db: Dict) -> np.ndarray:
        """Calculate similarity based on clinical pattern matching."""
        pattern_scores = []
        for condition in conditions_db['conditions']:
            # Calculate pattern overlap
            feature_patterns = set(features.get('key_findings', []))
            condition_patterns = set(condition['clinical_patterns'])
            overlap = len(feature_patterns.intersection(condition_patterns))
            total = len(feature_patterns.union(condition_patterns))
            pattern_scores.append(overlap / total if total > 0 else 0)
        return np.array(pattern_scores)
        
    def _calculate_severity_similarity(self,
                                     features: Dict,
                                     conditions_db: Dict) -> np.ndarray:
        """Calculate similarity based on severity levels."""
        severity_scores = []
        feature_severity = features.get('severity', 'mild')
        for condition in conditions_db['conditions']:
            # Compare severity levels
            condition_severity = condition['severity_levels']
            if feature_severity in condition_severity:
                severity_scores.append(condition_severity[feature_severity])
            else:
                severity_scores.append(0.5)  # Default middle value
        return np.array(severity_scores)
        
    def _calculate_temporal_similarity(self,
                                     features: Dict,
                                     patient_data: Dict) -> np.ndarray:
        """Calculate similarity based on temporal patterns."""
        temporal_scores = []
        symptom_history = patient_data.get('symptom_history', [])
        
        for condition in self.conditions_db['conditions']:
            # Calculate temporal pattern match
            temporal_score = self._analyze_temporal_patterns(
                symptom_history,
                condition['clinical_patterns']
            )
            temporal_scores.append(temporal_score)
            
        return np.array(temporal_scores)
        
    def _analyze_temporal_patterns(self,
                                 symptom_history: List[Dict],
                                 condition_patterns: List[str]) -> float:
        """Analyze temporal patterns in symptom history."""
        if not symptom_history:
            return 0.5
            
        # Calculate pattern progression
        pattern_sequence = self._extract_pattern_sequence(symptom_history)
        condition_sequence = self._generate_condition_sequence(condition_patterns)
        
        # Calculate sequence similarity
        return self._calculate_sequence_similarity(pattern_sequence, condition_sequence)
        
    def _extract_pattern_sequence(self, symptom_history: List[Dict]) -> List[str]:
        """Extract pattern sequence from symptom history."""
        return [
            symptom['pattern']
            for symptom in sorted(symptom_history, key=lambda x: x['timestamp'])
        ]
        
    def _generate_condition_sequence(self, patterns: List[str]) -> List[str]:
        """Generate expected pattern sequence for condition."""
        # Implement condition-specific pattern sequence generation
        return patterns
        
    def _calculate_sequence_similarity(self,
                                     pattern_sequence: List[str],
                                     condition_sequence: List[str]) -> float:
        """Calculate similarity between pattern sequences."""
        if not pattern_sequence or not condition_sequence:
            return 0.0
            
        # Use longest common subsequence algorithm
        lcs_length = self._longest_common_subsequence(pattern_sequence, condition_sequence)
        return lcs_length / max(len(pattern_sequence), len(condition_sequence))
        
    def _longest_common_subsequence(self,
                                  seq1: List[str],
                                  seq2: List[str]) -> int:
        """Calculate length of longest common subsequence."""
        m, n = len(seq1), len(seq2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if seq1[i-1] == seq2[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
                    
        return dp[m][n]
        
    def _calculate_progression_scores(self,
                                    features: Dict,
                                    patient_data: Dict) -> np.ndarray:
        """Calculate scores based on condition progression patterns."""
        progression_scores = []
        symptom_history = patient_data.get('symptom_history', [])
        
        for condition in self.conditions_db['conditions']:
            # Calculate progression match
            progression_score = self._analyze_progression(
                symptom_history,
                condition['clinical_patterns'],
                features.get('severity', 'mild')
            )
            progression_scores.append(progression_score)
            
        return np.array(progression_scores)
        
    def _analyze_progression(self,
                           symptom_history: List[Dict],
                           condition_patterns: List[str],
                           current_severity: str) -> float:
        """Analyze symptom progression patterns."""
        if not symptom_history:
            return 0.5
            
        # Calculate severity progression
        severity_progression = self._calculate_severity_progression(
            symptom_history,
            current_severity
        )
        
        # Calculate pattern progression
        pattern_progression = self._calculate_pattern_progression(
            symptom_history,
            condition_patterns
        )
        
        return (severity_progression + pattern_progression) / 2
        
    def _calculate_severity_progression(self,
                                      symptom_history: List[Dict],
                                      current_severity: str) -> float:
        """Calculate severity progression score."""
        if not symptom_history:
            return 0.5
            
        # Analyze severity changes over time
        severity_changes = [
            symptom['severity']
            for symptom in sorted(symptom_history, key=lambda x: x['timestamp'])
        ]
        
        # Calculate progression consistency
        return self._calculate_progression_consistency(severity_changes, current_severity)
        
    def _calculate_pattern_progression(self,
                                     symptom_history: List[Dict],
                                     condition_patterns: List[str]) -> float:
        """Calculate pattern progression score."""
        if not symptom_history:
            return 0.5
            
        # Analyze pattern emergence over time
        pattern_sequence = self._extract_pattern_sequence(symptom_history)
        
        # Calculate pattern progression consistency
        return self._calculate_progression_consistency(pattern_sequence, condition_patterns)
        
    def _calculate_progression_consistency(self,
                                         sequence: List[str],
                                         current_state: str) -> float:
        """Calculate consistency of progression pattern."""
        if not sequence:
            return 0.5
            
        # Implement progression consistency calculation
        return 0.7  # Placeholder
        
    def _combine_scores(self,
                       cosine_scores: np.ndarray,
                       pattern_scores: np.ndarray,
                       severity_scores: np.ndarray,
                       temporal_scores: np.ndarray,
                       progression_scores: np.ndarray,
                       risk_scores: np.ndarray,
                       weights: List[float]) -> np.ndarray:
        """Combine different similarity scores with weights."""
        return (
            weights[0] * cosine_scores +
            weights[1] * pattern_scores +
            weights[2] * severity_scores +
            weights[3] * temporal_scores +
            weights[4] * progression_scores +
            weights[5] * risk_scores
        )
        
    def _get_top_matches(self,
                        scores: np.ndarray,
                        threshold: float = 0.6) -> List[Tuple[int, float]]:
        """Get top matching conditions above threshold."""
        matches = [(i, score) for i, score in enumerate(scores) if score >= threshold]
        return sorted(matches, key=lambda x: x[1], reverse=True)
        
    def _calculate_risk_scores(self,
                             features: Dict,
                             patient_data: Dict) -> np.ndarray:
        """Calculate risk scores based on patient data and condition risk factors."""
        risk_scores = []
        
        for condition in self.conditions_db['conditions']:
            analysis_params = condition.get('analysis_parameters', {})
            risk_factors = analysis_params.get('risk_factors', [])
            
            if not risk_factors:
                risk_scores.append(0.5)
                continue
                
            # Calculate risk score based on patient data and risk factors
            patient_risk_score = 0
            for factor in risk_factors:
                factor_name = factor['factor'].lower()
                if factor_name in patient_data:
                    patient_risk_score += factor['impact'] * patient_data[factor_name]
                    
            risk_scores.append(min(1.0, patient_risk_score / len(risk_factors)))
            
        return np.array(risk_scores)
        
    def _calculate_pattern_confidence(self,
                                    feature_patterns: List[str],
                                    condition_patterns: List[str]) -> float:
        """Calculate confidence based on pattern matching."""
        if not feature_patterns or not condition_patterns:
            return 0.0
        matches = len(set(feature_patterns).intersection(set(condition_patterns)))
        return matches / len(condition_patterns)
        
    def _calculate_severity_confidence(self,
                                     feature_severity: str,
                                     condition_severity: Dict[str, float]) -> float:
        """Calculate confidence based on severity matching."""
        if feature_severity not in condition_severity:
            return 0.5
        return condition_severity[feature_severity]
        
    def _calculate_history_confidence(self,
                                    patient_data: Dict,
                                    condition: Dict) -> float:
        """Calculate confidence based on patient history relevance."""
        # Implement history-based confidence calculation
        return 0.7  # Placeholder
        
    def _calculate_temporal_confidence(self,
                                     patient_data: Dict,
                                     condition: Dict) -> float:
        """Calculate confidence based on temporal match."""
        return 0.7  # Placeholder
        
    def _calculate_temporal_factors(self,
                                  patient_data: Dict,
                                  condition: Dict) -> Dict[str, float]:
        """Calculate temporal factors for condition match."""
        return {
            'pattern_sequence': 0.7,  # Placeholder
            'severity_progression': 0.7,  # Placeholder
            'temporal_consistency': 0.7  # Placeholder
        }
        
    def _calculate_progression_score(self,
                                   patient_data: Dict,
                                   condition: Dict) -> float:
        """Calculate progression score for condition match."""
        return 0.7  # Placeholder
        
    def _get_matched_patterns(self,
                             feature_patterns: List[str],
                             condition_patterns: List[str]) -> List[str]:
        """Get list of matched clinical patterns."""
        return list(set(feature_patterns).intersection(set(condition_patterns)))
        
    def _analyze_stage(self,
                      features: Dict,
                      condition: Dict) -> Dict[str, float]:
        """Analyze the current stage of the condition based on symptoms and progression."""
        stage_scores = {}
        analysis_params = condition.get('analysis_parameters', {})
        progression_stages = analysis_params.get('progression_stages', [])
        
        for stage in progression_stages:
            # Calculate stage match based on symptoms
            symptom_matches = sum(
                1 for symptom in stage['symptoms']
                if symptom.lower() in [f.lower() for f in features.get('key_findings', [])]
            )
            stage_scores[stage['stage']] = symptom_matches / len(stage['symptoms'])
            
        return stage_scores
        
    def _get_treatment_suggestions(self,
                                 condition: Dict,
                                 stage: str) -> List[str]:
        """Get treatment suggestions based on condition stage."""
        analysis_params = condition.get('analysis_parameters', {})
        treatment_options = analysis_params.get('treatment_options', [])
        
        for option in treatment_options:
            if option['stage'] == stage:
                return option['options']
                
        return []
        
    def _calculate_risk_assessment(self,
                                 patient_data: Dict,
                                 condition: Dict) -> Dict[str, float]:
        """Calculate comprehensive risk assessment for the condition."""
        analysis_params = condition.get('analysis_parameters', {})
        risk_factors = analysis_params.get('risk_factors', [])
        
        risk_scores = {}
        for factor in risk_factors:
            factor_name = factor['factor']
            if factor_name.lower() in patient_data:
                risk_scores[factor_name] = factor['impact'] * patient_data[factor_name.lower()]
            else:
                risk_scores[factor_name] = 0.0
                
        return risk_scores 