"""
Automatic metadata generator for ML models.

This script analyzes machine learning models and automatically generates
appropriate metadata.json files for use with MediScan AI.
"""

import os
import sys
import json
import argparse
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
MODEL_BASE_PATH = os.path.join(os.path.dirname(__file__), "models")
SUPPORTED_MODALITIES = ["xray", "mri", "ct"]

class ModelAnalyzer:
    """Base class for model analyzers"""
    
    def analyze_model(self, model_path: str) -> Dict[str, Any]:
        """
        Analyze a model and return its metadata
        
        Args:
            model_path: Path to model file
            
        Returns:
            Dictionary containing model metadata
        """
        raise NotImplementedError("Subclasses must implement analyze_model method")

class PyTorchAnalyzer(ModelAnalyzer):
    """Analyzer for PyTorch models"""
    
    def analyze_model(self, model_path: str) -> Dict[str, Any]:
        """Analyze a PyTorch model"""
        try:
            import torch
            
            # Load the model
            logger.info(f"Loading PyTorch model from {model_path}")
            model = torch.load(model_path, map_location=torch.device('cpu'))
            
            # Set to evaluation mode
            model.eval()
            
            # Get model type
            model_type = self._determine_model_type(model)
            
            # Get input and output shapes
            input_shape, output_shape = self._determine_shapes(model) 
            
            # Get number of output classes if classification
            num_classes = output_shape[1] if model_type == "classification" else None
            
            # Create metadata dictionary
            metadata = {
                "framework": "pytorch",
                "type": model_type,
                "version": "1.0.0",
                "input_shape": input_shape,
                "output_shape": output_shape
            }
            
            # If classification model, add placeholder labels
            if model_type == "classification" and num_classes is not None:
                metadata["labels"] = {str(i): f"class_{i}" for i in range(num_classes)}
                
            return metadata
        
        except Exception as e:
            logger.error(f"Error analyzing PyTorch model: {e}")
            raise
    
    def _determine_model_type(self, model) -> str:
        """Determine model type based on architecture"""
        import torch.nn as nn
        
        # Check for common segmentation architectures
        segmentation_modules = ["unet", "segnet", "deeplabv3", "fcn"]
        model_str = str(model).lower()
        
        # Check model name for hints
        for module in segmentation_modules:
            if module in model_str:
                return "segmentation"
                
        # Check for object detection architectures
        detection_modules = ["rcnn", "ssd", "yolo", "retinanet", "detection"]
        for module in detection_modules:
            if module in model_str:
                return "detection"
        
        # Check output layer to determine if it's likely a classification model
        # Look for softmax or sigmoid activations in the last layer
        last_layers = str(list(model.modules())[-1]).lower()
        if "softmax" in last_layers or "sigmoid" in last_layers or "linear" in last_layers:
            return "classification"
        
        # Default to classification if unsure
        return "classification"
    
    def _determine_shapes(self, model) -> Tuple[List[int], List[int]]:
        """Determine input and output shapes by analyzing the model"""
        import torch
        import inspect
        
        # Try to find input shape from model attributes
        input_shape = None
        
        # Try to get first layer info
        first_layer = list(model.modules())[1]  # Skip the Sequential module
        if hasattr(first_layer, 'in_channels') and hasattr(first_layer, 'kernel_size'):
            # For CNNs, common case
            channels = getattr(first_layer, 'in_channels', 3)
            # Default to 224x224 for common image models
            input_shape = [1, channels, 224, 224]
        else:
            # Default shape for image models
            input_shape = [1, 3, 224, 224]
        
        # Try to determine output shape
        output_shape = None
        
        # Look for the last layer
        last_layer = None
        for layer in reversed(list(model.modules())):
            if hasattr(layer, 'out_features'):
                last_layer = layer
                break
                
        if last_layer is not None and hasattr(last_layer, 'out_features'):
            # Linear layer with known output size
            output_size = last_layer.out_features
            output_shape = [1, output_size]
        else:
            # Make a very conservative guess
            output_shape = [1, 1000]  # Default to 1000 classes (ImageNet size)
            
        return input_shape, output_shape

class TensorFlowAnalyzer(ModelAnalyzer):
    """Analyzer for TensorFlow/Keras models"""
    
    def analyze_model(self, model_path: str) -> Dict[str, Any]:
        """Analyze a TensorFlow/Keras model"""
        try:
            import tensorflow as tf
            
            # Load the model
            logger.info(f"Loading TensorFlow model from {model_path}")
            model = tf.keras.models.load_model(model_path)
            
            # Get model information
            input_shape = list(model.input_shape)
            if input_shape[0] is None:  # Batch dimension
                input_shape[0] = 1
                
            output_shape = list(model.output_shape)
            if output_shape[0] is None:  # Batch dimension
                output_shape[0] = 1
                
            # Determine model type
            model_type = self._determine_model_type(model)
            
            # Get number of output classes if classification
            num_classes = output_shape[1] if model_type == "classification" and len(output_shape) == 2 else None
            
            # Create metadata dictionary
            metadata = {
                "framework": "tensorflow",
                "type": model_type,
                "version": "1.0.0",
                "input_shape": input_shape,
                "output_shape": output_shape
            }
            
            # If classification model, add placeholder labels
            if model_type == "classification" and num_classes is not None:
                metadata["labels"] = {str(i): f"class_{i}" for i in range(num_classes)}
                
            return metadata
            
        except Exception as e:
            logger.error(f"Error analyzing TensorFlow model: {e}")
            raise
    
    def _determine_model_type(self, model) -> str:
        """Determine model type from TensorFlow model"""
        # Check model name
        model_name = model.name.lower()
        
        # Check for segmentation indicators
        if any(x in model_name for x in ["unet", "segnet", "segmentation", "mask"]):
            return "segmentation"
            
        # Check for detection indicators
        if any(x in model_name for x in ["rcnn", "ssd", "yolo", "detection"]):
            return "detection"
        
        # Check output layer activation for classification
        try:
            output_layer = model.layers[-1]
            if hasattr(output_layer, 'activation'):
                activation_name = output_layer.activation.__name__
                if activation_name in ['softmax', 'sigmoid']:
                    return "classification"
        except:
            pass
        
        # Check output shape for classification models
        output_shape = model.output_shape
        if len(output_shape) == 2:  # [batch_size, num_classes]
            return "classification"
            
        # Default to classification
        return "classification"

class ONNXAnalyzer(ModelAnalyzer):
    """Analyzer for ONNX models"""
    
    def analyze_model(self, model_path: str) -> Dict[str, Any]:
        """Analyze an ONNX model"""
        try:
            import onnx
            
            # Load the model
            logger.info(f"Loading ONNX model from {model_path}")
            model = onnx.load(model_path)
            
            # Get input and output info
            input_shape = []
            for input_tensor in model.graph.input:
                shape = []
                for dim in input_tensor.type.tensor_type.shape.dim:
                    if dim.dim_param:  # Dynamic dimension
                        shape.append(1)  # Default to 1 for dynamic dimensions
                    else:
                        shape.append(dim.dim_value)
                if shape:
                    input_shape = shape
                    break
                    
            output_shape = []
            for output_tensor in model.graph.output:
                shape = []
                for dim in output_tensor.type.tensor_type.shape.dim:
                    if dim.dim_param:  # Dynamic dimension
                        shape.append(1)  # Default to 1 for dynamic dimensions
                    else:
                        shape.append(dim.dim_value)
                if shape:
                    output_shape = shape
                    break
            
            # Determine model type
            model_type = self._determine_model_type(model, output_shape)
            
            # Get number of output classes if classification
            num_classes = output_shape[1] if model_type == "classification" and len(output_shape) >= 2 else None
            
            # Create metadata dictionary
            metadata = {
                "framework": "onnx",
                "type": model_type,
                "version": "1.0.0",
                "input_shape": input_shape if input_shape else [1, 3, 224, 224],
                "output_shape": output_shape if output_shape else [1, 1000]
            }
            
            # If classification model, add placeholder labels
            if model_type == "classification" and num_classes is not None:
                metadata["labels"] = {str(i): f"class_{i}" for i in range(num_classes)}
                
            return metadata
            
        except Exception as e:
            logger.error(f"Error analyzing ONNX model: {e}")
            raise
    
    def _determine_model_type(self, model, output_shape) -> str:
        """Determine model type from ONNX model"""
        # Check for segmentation-related operations
        op_types = [node.op_type for node in model.graph.node]
        
        # Check output shape for clues
        if len(output_shape) == 4 and output_shape[2] > 1 and output_shape[3] > 1:
            # Output has spatial dimensions - likely segmentation
            return "segmentation"
            
        # Check for classification indicators in operation types
        if "Softmax" in op_types and len(output_shape) == 2:
            return "classification"
            
        # Check for object detection operations
        detection_ops = ["NonMaxSuppression", "TopK", "RoiAlign"]
        if any(op in op_types for op in detection_ops):
            return "detection"
            
        # Default to classification
        return "classification"

def get_framework_from_extension(file_path: str) -> str:
    """Determine framework from file extension"""
    _, ext = os.path.splitext(file_path.lower())
    
    if ext == '.pt' or ext == '.pth':
        return "pytorch"
    elif ext == '.h5' or ext == '.keras':
        return "tensorflow"
    elif ext == '.onnx':
        return "onnx"
    else:
        return None

def analyze_model(model_path: str, model_name: str, modality: str) -> Dict[str, Any]:
    """
    Analyze model and generate metadata
    
    Args:
        model_path: Path to model file
        model_name: Name to give the model
        modality: Medical image modality (xray, mri, ct)
        
    Returns:
        Dictionary containing model metadata
    """
    # Determine framework from file extension
    framework = get_framework_from_extension(model_path)
    
    if framework is None:
        raise ValueError(f"Could not determine framework from file extension: {model_path}")
    
    # Create appropriate analyzer
    if framework == "pytorch":
        analyzer = PyTorchAnalyzer()
    elif framework == "tensorflow":
        analyzer = TensorFlowAnalyzer()
    elif framework == "onnx":
        analyzer = ONNXAnalyzer()
    else:
        raise ValueError(f"Unsupported framework: {framework}")
    
    # Analyze model
    metadata = analyzer.analyze_model(model_path)
    
    # Add model name and modality
    metadata["name"] = model_name
    metadata["modality"] = modality.lower()
    
    # Add preprocessing configuration
    metadata["preprocessing"] = {
        "normalize": True,
        "target_size": [metadata["input_shape"][2], metadata["input_shape"][3]] 
            if len(metadata["input_shape"]) == 4 else [224, 224]
    }
    
    return metadata

def save_model_with_metadata(
    model_path: str,
    model_name: str,
    modality: str,
    output_dir: Optional[str] = None,
    labels_file: Optional[str] = None
) -> str:
    """
    Analyze model, generate metadata, and save to proper directory structure
    
    Args:
        model_path: Path to model file
        model_name: Name to give the model
        modality: Medical image modality
        output_dir: Custom output directory (defaults to standard models directory)
        labels_file: Optional JSON file with label mapping
        
    Returns:
        Path to model directory
    """
    # Validate modality
    if modality.lower() not in SUPPORTED_MODALITIES:
        raise ValueError(f"Unsupported modality: {modality}. Must be one of: {', '.join(SUPPORTED_MODALITIES)}")
    
    # Generate metadata
    metadata = analyze_model(model_path, model_name, modality)
    
    # Load labels if provided
    if labels_file:
        try:
            with open(labels_file, 'r') as f:
                labels = json.load(f)
            metadata["labels"] = labels
        except Exception as e:
            logger.error(f"Error loading labels file: {e}")
    
    # Determine output directory
    if output_dir:
        model_dir = os.path.join(output_dir, model_name)
    else:
        model_dir = os.path.join(MODEL_BASE_PATH, model_name)
    
    # Create directory if it doesn't exist
    os.makedirs(model_dir, exist_ok=True)
    
    # Determine target model filename
    framework = metadata["framework"]
    if framework == "pytorch":
        target_file = "model.pt"
    elif framework == "tensorflow":
        target_file = "model.h5"
    elif framework == "onnx":
        target_file = "model.onnx"
    else:
        raise ValueError(f"Unsupported framework: {framework}")
    
    # Copy model file
    target_path = os.path.join(model_dir, target_file)
    import shutil
    shutil.copy2(model_path, target_path)
    
    # Save metadata
    metadata_path = os.path.join(model_dir, "metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    
    logger.info(f"Model installed at {model_dir}")
    return model_dir

def main():
    """Command-line interface for auto-generating model metadata"""
    parser = argparse.ArgumentParser(
        description="Automatically analyze ML models and generate metadata.json files"
    )
    
    parser.add_argument(
        "model_path", 
        help="Path to the model file (.pt, .h5, .onnx)"
    )
    
    parser.add_argument(
        "--name", 
        required=True,
        help="Name to give the model"
    )
    
    parser.add_argument(
        "--modality", 
        required=True, 
        choices=SUPPORTED_MODALITIES,
        help="Medical image modality (xray, mri, ct)"
    )
    
    parser.add_argument(
        "--output-dir", 
        help="Custom output directory (defaults to models/<name>)"
    )
    
    parser.add_argument(
        "--labels-file", 
        help="JSON file containing class label mapping"
    )
    
    parser.add_argument(
        "--analyze-only", 
        action="store_true",
        help="Only analyze and print metadata without saving"
    )
    
    args = parser.parse_args()
    
    try:
        if args.analyze_only:
            # Just analyze and print metadata
            metadata = analyze_model(args.model_path, args.name, args.modality)
            print(json.dumps(metadata, indent=2))
        else:
            # Save model with metadata
            model_dir = save_model_with_metadata(
                args.model_path,
                args.name,
                args.modality,
                args.output_dir,
                args.labels_file
            )
            print(f"Model successfully installed at: {model_dir}")
            
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 
