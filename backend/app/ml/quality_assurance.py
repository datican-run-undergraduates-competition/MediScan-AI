import numpy as np
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum
import json
from pathlib import Path

class QualityLevel(Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    NEEDS_IMPROVEMENT = "needs_improvement"
    UNACCEPTABLE = "unacceptable"

@dataclass
class QualityMetrics:
    image_quality: float
    text_quality: float
    correlation_score: float
    confidence_score: float
    completeness_score: float
    standardization_score: float

class QualityAssurance:
    def __init__(self, standards_path: Optional[str] = None):
        self.standards_path = Path(standards_path) if standards_path else Path("standards")
        self.standards_path.mkdir(exist_ok=True)
        
        # WHO-compliant quality thresholds
        self.thresholds = {
            'image_quality': {
                'excellent': 0.9,
                'good': 0.8,
                'acceptable': 0.7,
                'needs_improvement': 0.6
            },
            'text_quality': {
                'excellent': 0.9,
                'good': 0.8,
                'acceptable': 0.7,
                'needs_improvement': 0.6
            },
            'correlation': {
                'excellent': 0.85,
                'good': 0.75,
                'acceptable': 0.65,
                'needs_improvement': 0.55
            },
            'confidence': {
                'excellent': 0.9,
                'good': 0.8,
                'acceptable': 0.7,
                'needs_improvement': 0.6
            }
        }
        
        # Load facility-specific standards
        self.facility_standards = self._load_facility_standards()

    def _load_facility_standards(self) -> Dict:
        """Load facility-specific quality standards"""
        standards = {}
        standards_file = self.standards_path / "facility_standards.json"
        
        if standards_file.exists():
            with open(standards_file, 'r') as f:
                standards = json.load(f)
        
        return standards

    def assess_quality(
        self,
        image_metrics: Dict,
        text_metrics: Dict,
        correlation_metrics: Dict,
        facility_id: Optional[str] = None
    ) -> Dict:
        """
        Assess overall quality of analysis
        
        Args:
            image_metrics: Image quality metrics
            text_metrics: Text quality metrics
            correlation_metrics: Correlation metrics between modalities
            facility_id: Optional facility identifier
            
        Returns:
            Dictionary containing quality assessment results
        """
        try:
            # Calculate quality scores
            quality_metrics = QualityMetrics(
                image_quality=self._calculate_image_quality(image_metrics),
                text_quality=self._calculate_text_quality(text_metrics),
                correlation_score=self._calculate_correlation_quality(correlation_metrics),
                confidence_score=self._calculate_confidence_quality(correlation_metrics),
                completeness_score=self._calculate_completeness(image_metrics, text_metrics),
                standardization_score=self._calculate_standardization(
                    image_metrics,
                    text_metrics,
                    facility_id
                )
            )
            
            # Determine overall quality level
            overall_quality = self._determine_quality_level(quality_metrics)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                quality_metrics,
                overall_quality
            )
            
            return {
                'quality_level': overall_quality.value,
                'metrics': {
                    'image_quality': float(quality_metrics.image_quality),
                    'text_quality': float(quality_metrics.text_quality),
                    'correlation_score': float(quality_metrics.correlation_score),
                    'confidence_score': float(quality_metrics.confidence_score),
                    'completeness_score': float(quality_metrics.completeness_score),
                    'standardization_score': float(quality_metrics.standardization_score)
                },
                'recommendations': recommendations
            }
            
        except Exception as e:
            raise Exception(f"Error in quality assessment: {str(e)}")

    def _calculate_image_quality(self, metrics: Dict) -> float:
        """Calculate image quality score"""
        weights = {
            'contrast': 0.3,
            'noise': 0.2,
            'sharpness': 0.3,
            'brightness': 0.2
        }
        
        score = sum(
            metrics.get(key, 0) * weight
            for key, weight in weights.items()
        )
        
        return min(score, 1.0)

    def _calculate_text_quality(self, metrics: Dict) -> float:
        """Calculate text quality score"""
        weights = {
            'completeness': 0.4,
            'clarity': 0.3,
            'consistency': 0.3
        }
        
        score = sum(
            metrics.get(key, 0) * weight
            for key, weight in weights.items()
        )
        
        return min(score, 1.0)

    def _calculate_correlation_quality(self, metrics: Dict) -> float:
        """Calculate correlation quality score"""
        weights = {
            'mean_correlation': 0.4,
            'max_correlation': 0.3,
            'correlation_std': 0.3
        }
        
        score = sum(
            metrics.get(key, 0) * weight
            for key, weight in weights.items()
        )
        
        return min(score, 1.0)

    def _calculate_confidence_quality(self, metrics: Dict) -> float:
        """Calculate confidence quality score"""
        return min(metrics.get('confidence_score', 0), 1.0)

    def _calculate_completeness(
        self,
        image_metrics: Dict,
        text_metrics: Dict
    ) -> float:
        """Calculate completeness score"""
        image_completeness = image_metrics.get('completeness', 0)
        text_completeness = text_metrics.get('completeness', 0)
        
        return (image_completeness + text_completeness) / 2

    def _calculate_standardization(
        self,
        image_metrics: Dict,
        text_metrics: Dict,
        facility_id: Optional[str]
    ) -> float:
        """Calculate standardization score"""
        if not facility_id or facility_id not in self.facility_standards:
            return 1.0
        
        facility_standards = self.facility_standards[facility_id]
        
        # Compare metrics against facility standards
        image_standardization = self._compare_against_standards(
            image_metrics,
            facility_standards.get('image', {})
        )
        
        text_standardization = self._compare_against_standards(
            text_metrics,
            facility_standards.get('text', {})
        )
        
        return (image_standardization + text_standardization) / 2

    def _compare_against_standards(
        self,
        metrics: Dict,
        standards: Dict
    ) -> float:
        """Compare metrics against facility standards"""
        if not standards:
            return 1.0
        
        differences = []
        for key, value in metrics.items():
            if key in standards:
                diff = abs(value - standards[key])
                differences.append(1.0 - diff)
        
        return np.mean(differences) if differences else 1.0

    def _determine_quality_level(self, metrics: QualityMetrics) -> QualityLevel:
        """Determine overall quality level"""
        scores = [
            metrics.image_quality,
            metrics.text_quality,
            metrics.correlation_score,
            metrics.confidence_score,
            metrics.completeness_score,
            metrics.standardization_score
        ]
        
        avg_score = np.mean(scores)
        
        if avg_score >= self.thresholds['image_quality']['excellent']:
            return QualityLevel.EXCELLENT
        elif avg_score >= self.thresholds['image_quality']['good']:
            return QualityLevel.GOOD
        elif avg_score >= self.thresholds['image_quality']['acceptable']:
            return QualityLevel.ACCEPTABLE
        elif avg_score >= self.thresholds['image_quality']['needs_improvement']:
            return QualityLevel.NEEDS_IMPROVEMENT
        else:
            return QualityLevel.UNACCEPTABLE

    def _generate_recommendations(
        self,
        metrics: QualityMetrics,
        quality_level: QualityLevel
    ) -> List[str]:
        """Generate quality improvement recommendations"""
        recommendations = []
        
        if metrics.image_quality < self.thresholds['image_quality']['good']:
            recommendations.append(
                "Improve image quality: Ensure proper contrast and reduce noise"
            )
        
        if metrics.text_quality < self.thresholds['text_quality']['good']:
            recommendations.append(
                "Enhance report quality: Include all required sections and maintain clarity"
            )
        
        if metrics.correlation_score < self.thresholds['correlation']['good']:
            recommendations.append(
                "Improve correlation between image and text findings"
            )
        
        if metrics.confidence_score < self.thresholds['confidence']['good']:
            recommendations.append(
                "Increase confidence in findings through additional validation"
            )
        
        if metrics.completeness_score < 0.8:
            recommendations.append(
                "Ensure complete documentation of all relevant findings"
            )
        
        if metrics.standardization_score < 0.8:
            recommendations.append(
                "Adhere to facility-specific standards for documentation"
            )
        
        return recommendations

    def update_facility_standards(
        self,
        facility_id: str,
        standards: Dict
    ):
        """Update facility-specific standards"""
        self.facility_standards[facility_id] = standards
        
        # Save to file
        standards_file = self.standards_path / "facility_standards.json"
        with open(standards_file, 'w') as f:
            json.dump(self.facility_standards, f, indent=2)

    def get_facility_standards(self, facility_id: str) -> Optional[Dict]:
        """Get facility-specific standards"""
        return self.facility_standards.get(facility_id)

    def get_quality_thresholds(self) -> Dict:
        """Get current quality thresholds"""
        return self.thresholds 