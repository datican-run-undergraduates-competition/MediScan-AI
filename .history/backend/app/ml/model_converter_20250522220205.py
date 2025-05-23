"""
Model conversion utilities for MediScan AI.

This script provides utilities to convert and prepare ML models for use with MediScan AI.
"""

import os
import argparse
import json
import shutil
import logging
from typing import Dict, Any, Optional, List, Union
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
SUPPORTED_FRAMEWORKS = ["pytorch", "tensorflow", "onnx"]
SUPPORTED_TYPES = ["classification", "segmentation", "detection"]
SUPPORTED_MODALITIES = ["xray", "mri", "ct"]

def validate_metadata(metadata: Dict[str, Any]) -> List[str]:
    """
    Validate model metadata against requirements.
    
    Args:
        metadata: Model metadata dictionary
        
    Returns:
        List of validation errors (empty if valid)
    """
    errors = []
    
    # Check required fields
    required_fields = ["name", "type", "framework", "version", "input_shape", "output_shape", "modality"]
    for field in required_fields:
        if field not in metadata:
            errors.append(f"Missing required field: {field}")
    
    # Validate framework
    if "framework" in metadata and metadata["framework"].lower() not in SUPPORTED_FRAMEWORKS:
        errors.append(f"Unsupported framework: {metadata['framework']}. " +
                     f"Must be one of {', '.join(SUPPORTED_FRAMEWORKS)}")
    
    # Validate type
    if "type" in metadata and metadata["type"].lower() not in SUPPORTED_TYPES:
        errors.append(f"Unsupported model type: {metadata['type']}. " +
                     f"Must be one of {', '.join(SUPPORTED_TYPES)}")
    
    # Validate modality
    if "modality" in metadata and metadata["modality"].lower() not in SUPPORTED_MODALITIES:
        errors.append(f"Unsupported modality: {metadata['modality']}. " +
                     f"Must be one of {', '.join(SUPPORTED_MODALITIES)}")
    
    # Validate input shape
    if "input_shape" in metadata:
        if not isinstance(metadata["input_shape"], list):
            errors.append("input_shape must be a list")
        elif len(metadata["input_shape"]) < 3:
            errors.append("input_shape must have at least 3 dimensions (C, H, W) or (H, W, C)")
    
    # Validate output shape
    if "output_shape" in metadata:
        if not isinstance(metadata["output_shape"], list):
            errors.append("output_shape must be a list")
    
    # Validate labels for classification models
    if metadata.get("type") == "classification" and "labels" not in metadata:
        errors.append("Classification models should have 'labels' field")
    
    return errors

def setup_model_directory(model_name: str, metadata: Dict[str, Any], model_path: str) -> bool:
    """
    Set up a model directory with metadata and model file.
    
    Args:
        model_name: Name to use for the model directory
        metadata: Model metadata
        model_path: Path to the model file
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create model directory
        model_dir = os.path.join(MODELS_DIR, model_name)
        os.makedirs(model_dir, exist_ok=True)
        
        # Determine appropriate model filename based on framework
        framework = metadata["framework"].lower()
        if framework == "pytorch":
            model_filename = "model.pt"
        elif framework == "tensorflow":
            model_filename = "model.h5"
        elif framework == "onnx":
            model_filename = "model.onnx"
        else:
            return False
        
        # Copy model file
        target_path = os.path.join(model_dir, model_filename)
        shutil.copy2(model_path, target_path)
        
        # Write metadata file
        metadata_path = os.path.join(model_dir, "metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=4)
        
        logger.info(f"Model successfully installed at {model_dir}")
        return True
    
    except Exception as e:
        logger.error(f"Error setting up model directory: {e}")
        return False

def convert_pytorch_to_onnx(model_path: str, output_path: str, input_shape: List[int]) -> bool:
    """
    Convert a PyTorch model to ONNX format.
    
    Args:
        model_path: Path to PyTorch model (.pt)
        output_path: Path for output ONNX model
        input_shape: Input shape for the model [B, C, H, W]
        
    Returns:
        True if successful, False otherwise
    """
    try:
        import torch
        import onnx
        
        logger.info(f"Loading PyTorch model from {model_path}")
        model = torch.load(model_path)
        model.eval()
        
        # Create dummy input tensor
        dummy_input = torch.randn(*input_shape)
        
        # Export to ONNX
        logger.info(f"Converting to ONNX format at {output_path}")
        torch.onnx.export(
            model,
            dummy_input,
            output_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=['input'],
            output_names=['output'],
            dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
        )
        
        # Verify ONNX model
        onnx_model = onnx.load(output_path)
        onnx.checker.check_model(onnx_model)
        logger.info("ONNX model verified successfully")
        
        return True
    
    except Exception as e:
        logger.error(f"Error converting PyTorch model to ONNX: {e}")
        return False

def convert_tensorflow_to_onnx(model_path: str, output_path: str) -> bool:
    """
    Convert a TensorFlow/Keras model to ONNX format.
    
    Args:
        model_path: Path to TensorFlow model (.h5)
        output_path: Path for output ONNX model
        
    Returns:
        True if successful, False otherwise
    """
    try:
        import tf2onnx
        import tensorflow as tf
        
        logger.info(f"Loading TensorFlow model from {model_path}")
        model = tf.keras.models.load_model(model_path)
        
        # Get model signature
        concrete_func = tf.function(lambda x: model(x))
        concrete_func = concrete_func.get_concrete_function(
            tf.TensorSpec([None] + model.inputs[0].shape[1:], model.inputs[0].dtype)
        )
        
        # Convert to ONNX
        logger.info(f"Converting to ONNX format at {output_path}")
        tf2onnx.convert.from_concrete_function(
            concrete_func, 
            output_path=output_path
        )
        
        logger.info("TensorFlow model converted to ONNX")
        return True
    
    except Exception as e:
        logger.error(f"Error converting TensorFlow model to ONNX: {e}")
        return False

def add_model_from_cli():
    """Command-line interface for adding a model to MediScan AI"""
    parser = argparse.ArgumentParser(description="Add a model to MediScan AI")
    
    # Model info arguments
    parser.add_argument("--model-path", required=True, help="Path to the model file")
    parser.add_argument("--name", required=True, help="Name for the model")
    parser.add_argument("--framework", required=True, choices=SUPPORTED_FRAMEWORKS,
                        help="Model framework (pytorch, tensorflow, onnx)")
    parser.add_argument("--type", required=True, choices=SUPPORTED_TYPES,
                        help="Model type (classification, segmentation, detection)")
    parser.add_argument("--modality", required=True, choices=SUPPORTED_MODALITIES,
                        help="Image modality (xray, mri, ct)")
    parser.add_argument("--version", default="1.0.0", help="Model version")
    
    # Shape arguments
    parser.add_argument("--input-shape", required=True, 
                        help="Input shape as comma-separated integers (e.g., '1,3,224,224')")
    parser.add_argument("--output-shape", required=True,
                        help="Output shape as comma-separated integers (e.g., '1,14')")
    
    # Optional arguments
    parser.add_argument("--labels", help="JSON file with class labels")
    parser.add_argument("--convert-to-onnx", action="store_true", 
                        help="Convert model to ONNX format")
    parser.add_argument("--metadata-file", help="Path to metadata JSON file (overrides other options)")
    
    args = parser.parse_args()
    
    # Create metadata dictionary
    if args.metadata_file:
        # Load metadata from file
        try:
            with open(args.metadata_file, 'r') as f:
                metadata = json.load(f)
        except Exception as e:
            logger.error(f"Error loading metadata file: {e}")
            return False
    else:
        # Create metadata from arguments
        metadata = {
            "name": args.name,
            "type": args.type,
            "framework": args.framework,
            "version": args.version,
            "input_shape": [int(x) for x in args.input_shape.split(",")],
            "output_shape": [int(x) for x in args.output_shape.split(",")],
            "modality": args.modality
        }
        
        # Add labels if provided
        if args.labels:
            try:
                with open(args.labels, 'r') as f:
                    metadata["labels"] = json.load(f)
            except Exception as e:
                logger.error(f"Error loading labels file: {e}")
    
    # Validate metadata
    errors = validate_metadata(metadata)
    if errors:
        logger.error("Metadata validation errors:")
        for error in errors:
            logger.error(f"- {error}")
        return False
    
    # Convert to ONNX if requested
    model_path = args.model_path
    if args.convert_to_onnx and args.framework != "onnx":
        onnx_path = os.path.splitext(model_path)[0] + ".onnx"
        
        if args.framework == "pytorch":
            if convert_pytorch_to_onnx(model_path, onnx_path, metadata["input_shape"]):
                model_path = onnx_path
                metadata["framework"] = "onnx"
            else:
                logger.error("Failed to convert PyTorch model to ONNX")
                return False
        
        elif args.framework == "tensorflow":
            if convert_tensorflow_to_onnx(model_path, onnx_path):
                model_path = onnx_path
                metadata["framework"] = "onnx"
            else:
                logger.error("Failed to convert TensorFlow model to ONNX")
                return False
    
    # Set up model directory
    if setup_model_directory(args.name, metadata, model_path):
        logger.info(f"Model {args.name} added successfully!")
        return True
    else:
        logger.error(f"Failed to add model {args.name}")
        return False

if __name__ == "__main__":
    # Make sure models directory exists
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Run CLI
    add_model_from_cli() 