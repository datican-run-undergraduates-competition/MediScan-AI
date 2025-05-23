"""
Image processing utilities for medical images.
"""

import os
import logging
from typing import Dict, Any, Optional, Tuple, List, Union
import numpy as np
from PIL import Image
import io

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
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# Setup logging
logger = logging.getLogger(__name__)

class ImageProcessor:
    """Base class for image processors"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
    
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
            if framework == "pytorch" and TORCH_AVAILABLE:
                # PyTorch expects (C, H, W) format
                image = np.transpose(image, (2, 0, 1))
            
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
            if framework == "pytorch" and TORCH_AVAILABLE:
                # PyTorch expects (C, H, W) format for 2D or (C, D, H, W) for 3D
                if len(image.shape) == 3:
                    image = np.transpose(image, (2, 0, 1))
                elif len(image.shape) == 4:
                    image = np.transpose(image, (3, 2, 0, 1))
            
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
            if framework == "pytorch" and TORCH_AVAILABLE:
                if len(image.shape) == 3:
                    image = np.transpose(image, (2, 0, 1))
                elif len(image.shape) == 4:
                    image = np.transpose(image, (3, 2, 0, 1))
            
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
