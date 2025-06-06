"""
Image processing utilities for medical images.
"""

import os
import logging
from typing import Dict, Any, Optional, Tuple, List, Union
import numpy as np
from PIL import Image
import io
import torch
import torch.nn as nn
from transformers import ViTModel, ViTConfig, ViTForImageClassification
import torchvision.transforms as transforms
from .measurement_processor import MeasurementProcessor
from datetime import datetime

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import pydicom
    DICOM_AVAILABLE = True
except ImportError:
    DICOM_AVAILABLE = False

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# Setup logging
logger = logging.getLogger(__name__)

class ImageProcessor:
    """Base class for image processors"""
    
    def __init__(self, device: str = "cuda" if torch.cuda.is_available() else "cpu"):
        self.device = device
        self.measurement_processor = MeasurementProcessor()
        
        # WHO-compliant image preprocessing
        self.preprocessing = {
            'xray': transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ]),
            'mri': transforms.Compose([
                transforms.Resize((256, 256)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ]),
            'ct': transforms.Compose([
                transforms.Resize((256, 256)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
        }
        
        # Initialize models
        self.models = {}
        self._load_models()
        
        # Quality thresholds
        self.quality_thresholds = {
            'contrast': 0.7,
            'noise': 0.3,
            'sharpness': 0.8,
            'brightness': 0.6
        }

    def _load_models(self):
        """Load specialized models for each modality"""
        # Load models for each modality
        for modality in ['xray', 'mri', 'ct']:
            try:
                model = ViTForImageClassification.from_pretrained(
                    f'mediscan/{modality}-specialized-vit'
                )
                model.to(self.device)
                model.eval()
                self.models[modality] = model
            except Exception as e:
                print(f"Error loading {modality} model: {e}")

    def preprocess(self, image_data: Union[bytes, str, np.ndarray]) -> np.ndarray:
        """
        Preprocess an image for model inference.
        
        Args:
            image_data: Image data as bytes, file path, or numpy array
            
        Returns:
            Preprocessed image as numpy array
        """
        # Load image
        if isinstance(image_data, bytes):
            image = self._load_from_bytes(image_data)
        elif isinstance(image_data, str):
            image = self._load_from_path(image_data)
        elif isinstance(image_data, np.ndarray):
            image = image_data
        else:
            raise ValueError(f"Unsupported image data type: {type(image_data)}")
        
        # Apply preprocessing
        return self._preprocess_image(image)
    
    def _load_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        """Load image from bytes"""
        try:
            # First try to load as DICOM if available
            if DICOM_AVAILABLE:
                try:
                    with io.BytesIO(image_bytes) as buffer:
                        dicom = pydicom.dcmread(buffer)
                        return self._dicom_to_numpy(dicom)
                except Exception:
                    pass  # Not a DICOM file, try other formats
            
            # Try to load with PIL
            image = Image.open(io.BytesIO(image_bytes))
            return np.array(image)
        except Exception as e:
            logger.error(f"Error loading image from bytes: {e}")
            raise
    
    def _load_from_path(self, image_path: str) -> np.ndarray:
        """Load image from file path"""
        try:
            # Check file extension
            _, ext = os.path.splitext(image_path.lower())
            
            # Handle DICOM files
            if ext == '.dcm' and DICOM_AVAILABLE:
                dicom = pydicom.dcmread(image_path)
                return self._dicom_to_numpy(dicom)
            
            # Handle other image formats
            if CV2_AVAILABLE:
                return cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            else:
                return np.array(Image.open(image_path))
        except Exception as e:
            logger.error(f"Error loading image from path: {e}")
            raise
    
    def _dicom_to_numpy(self, dicom) -> np.ndarray:
        """Convert DICOM object to numpy array"""
        try:
            # Get image array from DICOM
            image = dicom.pixel_array
            
            # Apply windowing if specified in config
            if "window_center" in self.config and "window_width" in self.config:
                image = self._apply_windowing(
                    image, 
                    self.config["window_center"], 
                    self.config["window_width"]
                )
            
            # Normalize to 0-255 for visualization if not float
            if image.dtype != np.float32 and image.dtype != np.float64:
                image = image.astype(np.float32)
                image = (image - image.min()) / (image.max() - image.min()) * 255.0
                image = image.astype(np.uint8)
            
            return image
        except Exception as e:
            logger.error(f"Error converting DICOM to numpy: {e}")
            raise
    
    def _apply_windowing(self, image: np.ndarray, center: int, width: int) -> np.ndarray:
        """Apply windowing to image"""
        try:
            # Convert to float for calculation
            img_min = center - width // 2
            img_max = center + width // 2
            
            # Apply windowing
            image = np.clip(image, img_min, img_max)
            
            # Normalize to 0-255
            image = ((image - img_min) / (img_max - img_min)) * 255.0
            return image.astype(np.uint8)
        except Exception as e:
            logger.error(f"Error applying windowing: {e}")
            return image
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Apply preprocessing to image. 
        Override this method in subclasses.
        """
        # Default implementation: just return the image
        return image

    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Preprocess the input image for model inference."""
        return self.preprocessing['xray'](image).unsqueeze(0).to(self.device)

    def process_image(
        self,
        image_path: str,
        modality: str = 'xray',
        region: str = 'chest'
    ) -> Dict:
        """
        Process medical image with precise measurements
        
        Args:
            image_path: Path to medical image
            modality: Imaging modality ('xray', 'mri', 'ct')
            region: Anatomical region ('chest', 'brain', etc.)
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Load and preprocess image
            image = Image.open(image_path)
            image_array = np.array(image)
            
            # Get model predictions
            predictions = self._get_predictions(image, modality)
            
            # Process measurements
            measurements = self.measurement_processor.process_measurements(
                image_array,
                modality,
                region,
                predictions
            )
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(image_array)
            
            # Generate attention map
            attention_map = self._generate_attention_map(
                image,
                predictions,
                modality
            )
            
            # Prepare results
            results = {
                'predictions': predictions,
                'measurements': measurements,
                'quality_metrics': quality_metrics,
                'attention_map': attention_map,
                'metadata': {
                    'modality': modality,
                    'region': region,
                    'image_size': image.size,
                    'processing_timestamp': str(datetime.now())
                }
            }
            
            return results
            
        except Exception as e:
            raise Exception(f"Error processing image: {str(e)}")

    def _get_predictions(
        self,
        image: Image.Image,
        modality: str
    ) -> Dict:
        """Get model predictions for image"""
        if modality not in self.models:
            raise ValueError(f"Unsupported modality: {modality}")
        
        # Preprocess image
        preprocessed = self.preprocessing[modality](image)
        preprocessed = preprocessed.unsqueeze(0).to(self.device)
        
        # Get predictions
        with torch.no_grad():
            outputs = self.models[modality](preprocessed)
            probabilities = torch.softmax(outputs.logits, dim=1)
            
            # Get top predictions
            top_probs, top_indices = torch.topk(probabilities, 3)
            
            predictions = {}
            for prob, idx in zip(top_probs[0], top_indices[0]):
                condition = self.models[modality].config.id2label[idx.item()]
                predictions[condition] = {
                    'probability': prob.item(),
                    'detected': prob.item() > 0.5
                }
        
        return predictions

    def _calculate_quality_metrics(self, image: np.ndarray) -> Dict:
        """Calculate image quality metrics"""
        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # Calculate contrast
        contrast = np.std(gray) / 128.0
        
        # Calculate noise
        noise = self._estimate_noise(gray)
        
        # Calculate sharpness
        sharpness = self._calculate_sharpness(gray)
        
        # Calculate brightness
        brightness = np.mean(gray) / 255.0
        
        return {
            'contrast': float(contrast),
            'noise': float(noise),
            'sharpness': float(sharpness),
            'brightness': float(brightness),
            'overall_quality': self._calculate_overall_quality(
                contrast,
                noise,
                sharpness,
                brightness
            )
        }

    def _estimate_noise(self, image: np.ndarray) -> float:
        """Estimate image noise using Laplacian variance"""
        laplacian = cv2.Laplacian(image, cv2.CV_64F)
        return np.var(laplacian) / 255.0

    def _calculate_sharpness(self, image: np.ndarray) -> float:
        """Calculate image sharpness using Sobel operator"""
        sobelx = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3)
        magnitude = np.sqrt(sobelx**2 + sobely**2)
        return np.mean(magnitude) / 255.0

    def _calculate_overall_quality(
        self,
        contrast: float,
        noise: float,
        sharpness: float,
        brightness: float
    ) -> float:
        """Calculate overall image quality score"""
        weights = {
            'contrast': 0.3,
            'noise': 0.2,
            'sharpness': 0.3,
            'brightness': 0.2
        }
        
        scores = {
            'contrast': min(contrast / self.quality_thresholds['contrast'], 1.0),
            'noise': 1.0 - min(noise / self.quality_thresholds['noise'], 1.0),
            'sharpness': min(sharpness / self.quality_thresholds['sharpness'], 1.0),
            'brightness': min(brightness / self.quality_thresholds['brightness'], 1.0)
        }
        
        return sum(
            score * weights[metric]
            for metric, score in scores.items()
        )

    def _generate_attention_map(
        self,
        image: Image.Image,
        predictions: Dict,
        modality: str
    ) -> Dict:
        """Generate attention map for image"""
        # Get model attention
        with torch.no_grad():
            preprocessed = self.preprocessing[modality](image)
            preprocessed = preprocessed.unsqueeze(0).to(self.device)
            
            # Get attention weights
            outputs = self.models[modality](
                preprocessed,
                output_attentions=True
            )
            
            # Process attention weights
            attention = outputs.attentions[-1][0]  # Last layer attention
            attention = attention.mean(dim=1)  # Average over heads
            
            # Reshape attention to image size
            attention = attention.reshape(
                int(np.sqrt(attention.shape[1])),
                int(np.sqrt(attention.shape[1]))
            )
            
            # Normalize attention
            attention = (attention - attention.min()) / (attention.max() - attention.min())
            
            # Convert to heatmap
            heatmap = cv2.applyColorMap(
                (attention * 255).astype(np.uint8),
                cv2.COLORMAP_JET
            )
            
            # Overlay heatmap on original image
            original = np.array(image)
            if len(original.shape) == 2:
                original = cv2.cvtColor(original, cv2.COLOR_GRAY2BGR)
            
            heatmap = cv2.resize(
                heatmap,
                (original.shape[1], original.shape[0])
            )
            
            overlay = cv2.addWeighted(
                original,
                0.7,
                heatmap,
                0.3,
                0
            )
            
            return {
                'attention_map': overlay.tolist(),
                'attention_weights': attention.tolist(),
                'regions_of_interest': self._extract_regions_of_interest(
                    attention,
                    predictions
                )
            }

    def _extract_regions_of_interest(
        self,
        attention: np.ndarray,
        predictions: Dict
    ) -> List[Dict]:
        """Extract regions of interest from attention map"""
        regions = []
        
        # Threshold attention map
        threshold = np.mean(attention) + np.std(attention)
        binary = (attention > threshold).astype(np.uint8)
        
        # Find contours
        contours, _ = cv2.findContours(
            binary,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )
        
        # Process each contour
        for contour in contours:
            # Get contour properties
            area = cv2.contourArea(contour)
            if area < 100:  # Filter small regions
                continue
            
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            
            # Calculate attention score
            attention_score = np.mean(attention[y:y+h, x:x+w])
            
            # Get associated conditions
            conditions = [
                condition
                for condition, data in predictions.items()
                if data['detected'] and data['probability'] > 0.7
            ]
            
            regions.append({
                'location': {
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h)
                },
                'area': float(area),
                'attention_score': float(attention_score),
                'associated_conditions': conditions
            })
        
        return regions

class XRayProcessor(ImageProcessor):
    """Processor for X-ray images"""
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess X-ray image"""
        try:
            # Ensure image is grayscale
            if len(image.shape) > 2 and image.shape[2] > 1:
                if CV2_AVAILABLE:
                    image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
                else:
                    # Just take the first channel if CV2 not available
                    image = image[:, :, 0]
            
            # Resize to target shape if specified
            target_size = self.config.get("target_size", (224, 224))
            if image.shape[0] != target_size[0] or image.shape[1] != target_size[1]:
                if CV2_AVAILABLE:
                    image = cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)
                else:
                    image = np.array(Image.fromarray(image).resize(target_size, Image.BILINEAR))
            
            # Normalize
            if "normalize" in self.config and self.config["normalize"]:
                image = (image - image.mean()) / (image.std() + 1e-8)
            elif "scale" in self.config and self.config["scale"]:
                image = image / 255.0
            
            # Add channel dimension if needed
            if len(image.shape) == 2:
                image = np.expand_dims(image, axis=-1)
            
            # Convert to specific framework format if needed
            framework = self.config.get("framework", "").lower()
            if framework == "pytorch" and TF_AVAILABLE:
                # TensorFlow expects (H, W, C) format
                image = np.transpose(image, (1, 0, 2))
            
            return image
        except Exception as e:
            logger.error(f"Error preprocessing X-ray image: {e}")
            raise

class MRIProcessor(ImageProcessor):
    """Processor for MRI images"""
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess MRI image"""
        try:
            # Ensure we have expected dimensions
            if len(image.shape) < 3:
                # Single slice - add channel dimension
                image = np.expand_dims(image, axis=-1)
            
            # Resize
            target_size = self.config.get("target_size", (224, 224))
            if image.shape[0] != target_size[0] or image.shape[1] != target_size[1]:
                if CV2_AVAILABLE:
                    # For 3D volumes, resize each slice
                    if len(image.shape) > 3:
                        resized = np.zeros((target_size[0], target_size[1], image.shape[2], image.shape[3]))
                        for i in range(image.shape[2]):
                            for j in range(image.shape[3]):
                                resized[:, :, i, j] = cv2.resize(
                                    image[:, :, i, j], target_size, interpolation=cv2.INTER_LINEAR
                                )
                        image = resized
                    else:
                        image = cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)
            
            # Normalize
            if "normalize" in self.config and self.config["normalize"]:
                image = (image - image.mean()) / (image.std() + 1e-8)
            elif "scale" in self.config and self.config["scale"]:
                image = image / image.max()
            
            # Convert to specific framework format if needed
            framework = self.config.get("framework", "").lower()
            if framework == "pytorch" and TF_AVAILABLE:
                # TensorFlow expects (H, W, C) format for 2D or (D, H, W, C) for 3D
                if len(image.shape) == 3:
                    image = np.transpose(image, (1, 0, 2))
                elif len(image.shape) == 4:
                    image = np.transpose(image, (3, 1, 0, 2))
            
            return image
        except Exception as e:
            logger.error(f"Error preprocessing MRI image: {e}")
            raise

class CTScanProcessor(ImageProcessor):
    """Processor for CT scan images"""
    
    def _preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess CT scan image"""
        try:
            # Apply Hounsfield unit windowing if specified
            if "window_center" in self.config and "window_width" in self.config:
                image = self._apply_windowing(
                    image, 
                    self.config["window_center"], 
                    self.config["window_width"]
                )
            
            # Resize
            target_size = self.config.get("target_size", (224, 224))
            if len(image.shape) >= 2 and (image.shape[0] != target_size[0] or image.shape[1] != target_size[1]):
                if CV2_AVAILABLE:
                    if len(image.shape) == 3 and image.shape[2] > 1:
                        # Multiple slices
                        resized = np.zeros((target_size[0], target_size[1], image.shape[2]))
                        for i in range(image.shape[2]):
                            resized[:, :, i] = cv2.resize(
                                image[:, :, i], target_size, interpolation=cv2.INTER_LINEAR
                            )
                        image = resized
                    else:
                        image = cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)
            
            # Normalize
            if "normalize" in self.config and self.config["normalize"]:
                image = (image - image.mean()) / (image.std() + 1e-8)
            elif "scale" in self.config and self.config["scale"]:
                image = image / 255.0
            
            # Add channel dimension if needed
            if len(image.shape) == 2:
                image = np.expand_dims(image, axis=-1)
            
            # Convert to specific framework format if needed
            framework = self.config.get("framework", "").lower()
            if framework == "pytorch" and TF_AVAILABLE:
                if len(image.shape) == 3:
                    image = np.transpose(image, (1, 0, 2))
                elif len(image.shape) == 4:
                    image = np.transpose(image, (3, 1, 0, 2))
            
            return image
        except Exception as e:
            logger.error(f"Error preprocessing CT scan image: {e}")
            raise

def get_processor(modality: str, config: Dict[str, Any] = None) -> ImageProcessor:
    """
    Get image processor for specific modality.
    
    Args:
        modality: Image modality (xray, mri, ct)
        config: Configuration options
        
    Returns:
        Image processor
    """
    modality = modality.lower()
    if modality == "xray":
        return XRayProcessor(config)
    elif modality == "mri":
        return MRIProcessor(config)
    elif modality == "ct":
        return CTScanProcessor(config)
    else:
        logger.warning(f"Unknown modality: {modality}. Using default processor.")
        return ImageProcessor(config) 
