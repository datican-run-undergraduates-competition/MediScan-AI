import numpy as np
import cv2
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import math

@dataclass
class Measurement:
    value: float
    unit: str
    confidence: float
    location: Tuple[int, int]
    type: str

class MeasurementProcessor:
    def __init__(self):
        # Calibration factors (pixels per mm) for different modalities
        self.calibration_factors = {
            'xray': 3.5,  # pixels per mm
            'mri': 2.8,
            'ct': 2.5
        }
        
        # Measurement thresholds
        self.thresholds = {
            'min_confidence': 0.85,
            'min_region_size': 10,  # pixels
            'max_region_size': 1000  # pixels
        }
        
        # Anatomical landmarks for reference
        self.landmarks = {
            'chest': {
                'rib_spacing': 20.0,  # mm
                'vertebra_width': 25.0,  # mm
                'heart_width': 120.0  # mm
            },
            'brain': {
                'skull_thickness': 7.0,  # mm
                'ventricle_width': 15.0,  # mm
                'sulcus_width': 3.0  # mm
            }
        }

    def process_measurements(
        self,
        image: np.ndarray,
        modality: str,
        region: str,
        detected_conditions: Dict
    ) -> Dict:
        """
        Process precise measurements from medical images
        
        Args:
            image: Medical image array
            modality: Imaging modality ('xray', 'mri', 'ct')
            region: Anatomical region ('chest', 'brain', etc.)
            detected_conditions: Dictionary of detected conditions
            
        Returns:
            Dictionary containing precise measurements
        """
        try:
            # Get calibration factor
            calibration = self.calibration_factors[modality]
            
            # Preprocess image
            processed = self._preprocess_image(image)
            
            # Extract regions of interest
            regions = self._extract_regions(processed, detected_conditions)
            
            # Calculate measurements
            measurements = {}
            for condition, region_data in regions.items():
                measurements[condition] = self._calculate_measurements(
                    region_data,
                    calibration,
                    region
                )
            
            # Validate measurements
            validated = self._validate_measurements(
                measurements,
                region,
                modality
            )
            
            return {
                'measurements': validated,
                'calibration_factor': calibration,
                'confidence_scores': self._calculate_confidence_scores(validated)
            }
            
        except Exception as e:
            raise Exception(f"Error processing measurements: {str(e)}")

    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for measurement extraction"""
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive thresholding
        processed = cv2.adaptiveThreshold(
            image,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11,
            2
        )
        
        # Remove noise
        processed = cv2.medianBlur(processed, 3)
        
        return processed

    def _extract_regions(
        self,
        image: np.ndarray,
        conditions: Dict
    ) -> Dict:
        """Extract regions of interest based on detected conditions"""
        regions = {}
        
        for condition, data in conditions.items():
            if data.get('detected', False):
                # Get condition-specific region
                region = self._get_condition_region(image, condition)
                if region is not None:
                    regions[condition] = region
        
        return regions

    def _get_condition_region(
        self,
        image: np.ndarray,
        condition: str
    ) -> Optional[np.ndarray]:
        """Get region of interest for specific condition"""
        # Define condition-specific parameters
        params = {
            'pneumonia': {
                'min_size': 50,
                'max_size': 500,
                'threshold': 0.7
            },
            'tuberculosis': {
                'min_size': 30,
                'max_size': 300,
                'threshold': 0.8
            },
            'cancer': {
                'min_size': 20,
                'max_size': 200,
                'threshold': 0.85
            }
        }
        
        if condition not in params:
            return None
        
        # Apply condition-specific processing
        param = params[condition]
        _, binary = cv2.threshold(
            image,
            int(255 * param['threshold']),
            255,
            cv2.THRESH_BINARY
        )
        
        # Find contours
        contours, _ = cv2.findContours(
            binary,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        # Filter contours by size
        valid_contours = [
            c for c in contours
            if param['min_size'] < cv2.contourArea(c) < param['max_size']
        ]
        
        if not valid_contours:
            return None
        
        # Create mask for largest contour
        mask = np.zeros_like(image)
        largest_contour = max(valid_contours, key=cv2.contourArea)
        cv2.drawContours(mask, [largest_contour], -1, 255, -1)
        
        return cv2.bitwise_and(image, mask)

    def _calculate_measurements(
        self,
        region: np.ndarray,
        calibration: float,
        anatomical_region: str
    ) -> List[Measurement]:
        """Calculate precise measurements from region"""
        measurements = []
        
        # Find contours
        contours, _ = cv2.findContours(
            region,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        for contour in contours:
            # Calculate basic measurements
            area = cv2.contourArea(contour) / (calibration ** 2)  # mm²
            perimeter = cv2.arcLength(contour, True) / calibration  # mm
            
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            width = w / calibration  # mm
            height = h / calibration  # mm
            
            # Calculate confidence based on region properties
            confidence = self._calculate_measurement_confidence(
                contour,
                anatomical_region
            )
            
            if confidence >= self.thresholds['min_confidence']:
                measurements.extend([
                    Measurement(
                        value=area,
                        unit='mm²',
                        confidence=confidence,
                        location=(x, y),
                        type='area'
                    ),
                    Measurement(
                        value=perimeter,
                        unit='mm',
                        confidence=confidence,
                        location=(x, y),
                        type='perimeter'
                    ),
                    Measurement(
                        value=width,
                        unit='mm',
                        confidence=confidence,
                        location=(x, y),
                        type='width'
                    ),
                    Measurement(
                        value=height,
                        unit='mm',
                        confidence=confidence,
                        location=(x, y),
                        type='height'
                    )
                ])
        
        return measurements

    def _calculate_measurement_confidence(
        self,
        contour: np.ndarray,
        anatomical_region: str
    ) -> float:
        """Calculate confidence score for measurement"""
        # Get contour properties
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        
        # Calculate shape regularity
        circularity = 4 * math.pi * area / (perimeter ** 2)
        
        # Get anatomical reference
        ref_measurements = self.landmarks.get(anatomical_region, {})
        
        # Calculate confidence based on multiple factors
        confidence_factors = [
            # Size confidence
            min(1.0, area / self.thresholds['max_region_size']),
            # Shape confidence
            circularity,
            # Anatomical consistency
            self._check_anatomical_consistency(contour, ref_measurements)
        ]
        
        return np.mean(confidence_factors)

    def _check_anatomical_consistency(
        self,
        contour: np.ndarray,
        ref_measurements: Dict
    ) -> float:
        """Check consistency with anatomical references"""
        if not ref_measurements:
            return 1.0
        
        # Calculate contour measurements
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        
        # Compare with reference measurements
        consistency_scores = []
        for ref_name, ref_value in ref_measurements.items():
            if 'width' in ref_name:
                x, y, w, h = cv2.boundingRect(contour)
                measured = w
            elif 'thickness' in ref_name:
                measured = perimeter / 4
            else:
                measured = area
            
            # Calculate consistency score
            diff = abs(measured - ref_value)
            consistency = 1.0 - (diff / ref_value)
            consistency_scores.append(max(0.0, consistency))
        
        return np.mean(consistency_scores) if consistency_scores else 1.0

    def _validate_measurements(
        self,
        measurements: Dict,
        region: str,
        modality: str
    ) -> Dict:
        """Validate measurements against anatomical constraints"""
        validated = {}
        
        for condition, condition_measurements in measurements.items():
            valid_measurements = []
            for measurement in condition_measurements:
                # Check against anatomical constraints
                if self._is_valid_measurement(
                    measurement,
                    region,
                    modality
                ):
                    valid_measurements.append(measurement)
            
            if valid_measurements:
                validated[condition] = valid_measurements
        
        return validated

    def _is_valid_measurement(
        self,
        measurement: Measurement,
        region: str,
        modality: str
    ) -> bool:
        """Check if measurement is valid based on anatomical constraints"""
        # Get reference measurements
        ref_measurements = self.landmarks.get(region, {})
        
        # Check against reference values
        for ref_name, ref_value in ref_measurements.items():
            if measurement.type in ref_name:
                # Allow 50% deviation from reference
                if abs(measurement.value - ref_value) > ref_value * 0.5:
                    return False
        
        return True

    def _calculate_confidence_scores(self, measurements: Dict) -> Dict:
        """Calculate overall confidence scores for measurements"""
        confidence_scores = {}
        
        for condition, condition_measurements in measurements.items():
            # Calculate weighted average confidence
            weights = {
                'area': 0.3,
                'perimeter': 0.2,
                'width': 0.25,
                'height': 0.25
            }
            
            weighted_confidence = sum(
                m.confidence * weights.get(m.type, 0.25)
                for m in condition_measurements
            )
            
            confidence_scores[condition] = weighted_confidence
        
        return confidence_scores 