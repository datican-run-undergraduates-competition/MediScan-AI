"""
Inference module for medical image analysis.
"""

import os
import logging
from typing import Dict, Any, Optional, List, Union, Tuple
import numpy as np
import json
from datetime import datetime
import time

# Project imports
from .model_loader import load_model, get_all_models
from .image_processor import get_processor

# Setup logging
logger = logging.getLogger(__name__)

class InferenceResult:
    """Class to store and format inference results"""
    
    def __init__(
        self,
        model_name: str,
        predictions: Union[np.ndarray, List, Dict],
        raw_output: Optional[Any] = None,
        labels: Optional[Dict[int, str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        inference_time: float = 0.0
    ):
        self.model_name = model_name
        self.predictions = predictions
        self.raw_output = raw_output
        self.labels = labels or {}
        self.metadata = metadata or {}
        self.inference_time = inference_time
        self.timestamp = datetime.utcnow().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary for API response"""
        result = {
            "model": self.model_name,
            "timestamp": self.timestamp,
            "inference_time_ms": round(self.inference_time * 1000, 2),
        }
        
        # Format predictions based on type
        if isinstance(self.predictions, np.ndarray):
            # Convert ndarray to list for JSON serialization
            if self.predictions.ndim == 1:
                # Classification result - convert to probabilities and labels
                if self.labels:
                    # Convert to sorted list of (label, probability) tuples
                    result["predictions"] = []
                    for i in np.argsort(-self.predictions):  # Sort in descending order
                        label = self.labels.get(int(i), f"class_{i}")
                        result["predictions"].append({
                            "label": label,
                            "probability": float(self.predictions[i])
                        })
                else:
                    # Return raw values
                    result["predictions"] = [float(x) for x in self.predictions]
            else:
                # Multi-dimensional output (e.g., segmentation)
                result["prediction_shape"] = list(self.predictions.shape)
                # Only include actual values if small enough (avoid huge responses)
                if np.prod(self.predictions.shape) < 1000:
                    result["predictions"] = self.predictions.tolist()
                else:
                    result["predictions"] = "Output too large to include in response"
        elif isinstance(self.predictions, dict):
            # Pre-formatted results
            result["predictions"] = self.predictions
        else:
            # Try to convert to list
            try:
                result["predictions"] = list(self.predictions)
            except:
                result["predictions"] = str(self.predictions)
        
        # Include metadata
        result["metadata"] = self.metadata
        
        return result

class InferenceEngine:
    """Engine for running inference with medical imaging models"""
    
    def __init__(self):
        self.model_cache = {}
    
    def get_available_models(self) -> Dict[str, Dict[str, Any]]:
        """Get information about available models"""
        return get_all_models()
    
    async def run_inference(
        self,
        model_name: str,
        image_data: Union[bytes, str, np.ndarray],
        modality: str,
        preprocessing_config: Optional[Dict[str, Any]] = None
    ) -> InferenceResult:
        """
        Run inference on an image using the specified model.
        
        Args:
            model_name: Name of the model to use
            image_data: Image data as bytes, file path, or numpy array
            modality: Image modality (xray, mri, ct)
            preprocessing_config: Configuration for preprocessing
            
        Returns:
            InferenceResult object containing predictions and metadata
        """
        try:
            # Load model if not already loaded
            model_info = load_model(model_name)
            if not model_info:
                raise ValueError(f"Failed to load model: {model_name}")
            
            model = model_info["model"]
            info = model_info["info"]
            
            # Prepare preprocessing config
            if preprocessing_config is None:
                preprocessing_config = {}
            
            # Add model framework to preprocessing config
            preprocessing_config["framework"] = info.framework
            
            # Get appropriate processor for modality
            processor = get_processor(modality, preprocessing_config)
            
            # Preprocess image
            preprocessed = processor.preprocess(image_data)
            
            # Prepare input for model based on framework
            framework = info.framework.lower()
            model_input = self._prepare_input(preprocessed, framework)
            
            # Run inference
            start_time = time.time()
            if framework == "pytorch":
                predictions = self._run_pytorch_inference(model, model_input)
            elif framework == "tensorflow":
                predictions = self._run_tensorflow_inference(model, model_input)
            elif framework == "onnx":
                predictions = self._run_onnx_inference(model, model_input, info)
            else:
                raise ValueError(f"Unsupported model framework: {framework}")
            inference_time = time.time() - start_time
            
            # Post-process results
            processed_results = self._postprocess_results(predictions, info)
            
            # Create result object
            result = InferenceResult(
                model_name=model_name,
                predictions=processed_results,
                raw_output=predictions,
                labels=info.labels,
                metadata={
                    "model_type": info.type,
                    "model_version": info.version,
                    "framework": info.framework,
                    **info.metadata
                },
                inference_time=inference_time
            )
            
            return result
        
        except Exception as e:
            logger.error(f"Error running inference with model {model_name}: {e}")
            raise
    
    def _prepare_input(self, preprocessed: np.ndarray, framework: str) -> Any:
        """Prepare input for specific framework"""
        if framework == "pytorch":
            import torch
            # Add batch dimension if not present
            if len(preprocessed.shape) == 3:
                preprocessed = np.expand_dims(preprocessed, axis=0)
            # Convert to torch tensor
            return torch.from_numpy(preprocessed).float()
        
        elif framework == "tensorflow":
            import tensorflow as tf
            # Add batch dimension if not present
            if len(preprocessed.shape) == 3:
                preprocessed = np.expand_dims(preprocessed, axis=0)
            # Convert to tensorflow tensor
            return tf.convert_to_tensor(preprocessed, dtype=tf.float32)
        
        elif framework == "onnx":
            # Add batch dimension if not present
            if len(preprocessed.shape) == 3:
                preprocessed = np.expand_dims(preprocessed, axis=0)
            # Return as numpy array
            return preprocessed.astype(np.float32)
        
        else:
            # Return as is
            return preprocessed
    
    def _run_pytorch_inference(self, model: Any, model_input: Any) -> np.ndarray:
        """Run inference with PyTorch model"""
        import torch
        device = next(model.parameters()).device  # Get model device
        
        # Move input to the same device as the model
        model_input = model_input.to(device)
        
        # Run inference
        with torch.no_grad():
            output = model(model_input)
            
            # Convert output to numpy
            if isinstance(output, tuple):
                # Multiple outputs
                return [o.cpu().numpy() for o in output]
            else:
                # Single output
                return output.cpu().numpy()
    
    def _run_tensorflow_inference(self, model: Any, model_input: Any) -> np.ndarray:
        """Run inference with TensorFlow model"""
        output = model(model_input, training=False)
        
        # Convert output to numpy
        if isinstance(output, list):
            # Multiple outputs
            return [o.numpy() for o in output]
        else:
            # Single output
            return output.numpy()
    
    def _run_onnx_inference(self, model: Any, model_input: np.ndarray, info: Any) -> np.ndarray:
        """Run inference with ONNX model"""
        # Get input and output names
        input_name = model.get_inputs()[0].name
        
        # Create input dict
        input_dict = {input_name: model_input}
        
        # Run inference
        outputs = model.run(None, input_dict)
        
        # Return first output or all outputs
        if len(outputs) == 1:
            return outputs[0]
        return outputs
    
    def _postprocess_results(self, predictions: Any, info: Any) -> Any:
        """
        Postprocess model output based on model type
        
        Args:
            predictions: Raw model output
            info: Model information
            
        Returns:
            Processed predictions
        """
        model_type = info.type.lower()
        
        try:
            if model_type == "classification":
                # Apply softmax for classification if needed
                if isinstance(predictions, np.ndarray) and predictions.ndim == 2:
                    # Batch predictions - take the first one (we only support single image inference for now)
                    predictions = predictions[0]
                
                # Ensure probabilities sum to 1
                if np.sum(predictions) != 1.0:
                    predictions = self._softmax(predictions)
                
                return predictions
            
            elif model_type == "segmentation":
                # For segmentation, return the class with highest probability for each pixel
                if isinstance(predictions, np.ndarray) and predictions.ndim > 3:
                    # Get argmax along class dimension
                    if predictions.shape[1] > 1:  # Multiple classes
                        # Assuming shape is (batch, classes, height, width)
                        return np.argmax(predictions[0], axis=0)
                    else:
                        # Binary segmentation - threshold at 0.5
                        return (predictions[0, 0] > 0.5).astype(np.int8)
                
                return predictions
            
            elif model_type == "detection":
                # For object detection, format as list of bounding boxes
                if isinstance(predictions, list):
                    # Format depends on the specific model
                    # Just return as is for now
                    return predictions
                
                return predictions
            
            else:
                # Unknown model type, return predictions as is
                return predictions
                
        except Exception as e:
            logger.error(f"Error in postprocessing: {e}")
            # Return original predictions if postprocessing fails
            return predictions
    
    def _softmax(self, x: np.ndarray) -> np.ndarray:
        """Compute softmax values for array x"""
        exp_x = np.exp(x - np.max(x))
        return exp_x / exp_x.sum()

# Create singleton instance
inference_engine = InferenceEngine() 
