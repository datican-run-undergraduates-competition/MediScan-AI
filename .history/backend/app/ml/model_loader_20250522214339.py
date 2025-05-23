"""
Model loader for managing ML models in MediScan AI.
"""

import os
import logging
from typing import Dict, Any, Optional, Union
import json

# ML frameworks
import numpy as np
try:
    import torch
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False

try:
    import tensorflow as tf
    from tensorflow.keras.models import load_model as load_keras_model
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

# Setup logging
logger = logging.getLogger(__name__)

# Global model registry
MODEL_REGISTRY = {}

# Model paths
MODEL_BASE_PATH = os.path.join(os.path.dirname(__file__), "models")
if not os.path.exists(MODEL_BASE_PATH):
    os.makedirs(MODEL_BASE_PATH, exist_ok=True)
    logger.info(f"Created models directory at {MODEL_BASE_PATH}")

class ModelInfo:
    """Store metadata about a loaded model"""
    def __init__(
        self,
        name: str,
        type: str,
        framework: str,
        input_shape: Any,
        output_shape: Any,
        labels: Optional[Dict[int, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        version: str = "1.0.0"
    ):
        self.name = name
        self.type = type  # classification, segmentation, etc.
        self.framework = framework  # pytorch, tensorflow, etc.
        self.input_shape = input_shape
        self.output_shape = output_shape
        self.labels = labels or {}
        self.metadata = metadata or {}
        self.version = version
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert model info to dictionary"""
        return {
            "name": self.name,
            "type": self.type,
            "framework": self.framework,
            "input_shape": self.input_shape,
            "output_shape": self.output_shape,
            "labels": self.labels,
            "metadata": self.metadata,
            "version": self.version
        }

def load_model(model_name: str) -> Optional[Dict[str, Any]]:
    """
    Load a machine learning model by name.
    
    Args:
        model_name: Name of the model to load
        
    Returns:
        Dictionary containing the loaded model and its metadata
    """
    # Check if model is already loaded
    if model_name in MODEL_REGISTRY:
        logger.info(f"Model {model_name} is already loaded")
        return MODEL_REGISTRY[model_name]
    
    # Construct model path
    model_dir = os.path.join(MODEL_BASE_PATH, model_name)
    if not os.path.exists(model_dir):
        logger.error(f"Model directory not found: {model_dir}")
        return None
    
    # Load model metadata
    metadata_path = os.path.join(model_dir, "metadata.json")
    if not os.path.exists(metadata_path):
        logger.error(f"Model metadata not found: {metadata_path}")
        return None
    
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    except Exception as e:
        logger.error(f"Error loading model metadata: {e}")
        return None
    
    # Load appropriate model based on framework
    framework = metadata.get("framework", "").lower()
    model_path = os.path.join(model_dir, "model")
    model = None
    
    try:
        if framework == "pytorch" and PYTORCH_AVAILABLE:
            model = load_pytorch_model(model_path, metadata)
        elif framework == "tensorflow" and TENSORFLOW_AVAILABLE:
            model = load_tensorflow_model(model_path, metadata)
        elif framework == "onnx":
            model = load_onnx_model(model_path, metadata)
        else:
            logger.error(f"Unsupported or unavailable model framework: {framework}")
            return None
    except Exception as e:
        logger.error(f"Error loading model {model_name}: {e}")
        return None
    
    # Create model info
    model_info = ModelInfo(
        name=model_name,
        type=metadata.get("type", "unknown"),
        framework=framework,
        input_shape=metadata.get("input_shape"),
        output_shape=metadata.get("output_shape"),
        labels=metadata.get("labels", {}),
        metadata=metadata,
        version=metadata.get("version", "1.0.0")
    )
    
    # Store in registry
    MODEL_REGISTRY[model_name] = {
        "model": model,
        "info": model_info
    }
    
    logger.info(f"Successfully loaded model: {model_name}")
    return MODEL_REGISTRY[model_name]

def load_pytorch_model(model_path: str, metadata: Dict[str, Any]) -> Any:
    """Load a PyTorch model"""
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = torch.load(f"{model_path}.pt", map_location=device)
    model.eval()  # Set to evaluation mode
    return model

def load_tensorflow_model(model_path: str, metadata: Dict[str, Any]) -> Any:
    """Load a TensorFlow/Keras model"""
    return load_keras_model(f"{model_path}.h5")

def load_onnx_model(model_path: str, metadata: Dict[str, Any]) -> Any:
    """Load an ONNX model"""
    try:
        import onnx
        import onnxruntime
        
        # Load and check ONNX model
        onnx_model = onnx.load(f"{model_path}.onnx")
        onnx.checker.check_model(onnx_model)
        
        # Create inference session
        session = onnxruntime.InferenceSession(f"{model_path}.onnx")
        
        return session
    except ImportError:
        logger.error("ONNX Runtime not installed. Install with: pip install onnx onnxruntime")
        return None

def get_all_models() -> Dict[str, Dict[str, Any]]:
    """
    Get information about all available models.
    
    Returns:
        Dictionary of model names and their information
    """
    models = {}
    
    # Check for model directories
    if not os.path.exists(MODEL_BASE_PATH):
        return models
    
    # List all model directories
    for model_dir in os.listdir(MODEL_BASE_PATH):
        dir_path = os.path.join(MODEL_BASE_PATH, model_dir)
        
        # Skip non-directories
        if not os.path.isdir(dir_path):
            continue
        
        # Look for metadata file
        metadata_path = os.path.join(dir_path, "metadata.json")
        if not os.path.exists(metadata_path):
            continue
        
        try:
            # Load metadata
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)
            
            # Create model info object
            model_info = ModelInfo(
                name=model_dir,
                type=metadata.get("type", "unknown"),
                framework=metadata.get("framework", "unknown"),
                input_shape=metadata.get("input_shape"),
                output_shape=metadata.get("output_shape"),
                labels=metadata.get("labels", {}),
                metadata=metadata,
                version=metadata.get("version", "1.0.0")
            )
            
            # Add to results
            models[model_dir] = {"info": model_info.to_dict(), "loaded": model_dir in MODEL_REGISTRY}
        except Exception as e:
            logger.error(f"Error loading model metadata for {model_dir}: {e}")
    
    return models 
