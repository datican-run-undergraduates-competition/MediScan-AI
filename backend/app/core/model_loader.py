import os
from transformers import AutoModelForImageClassification, AutoFeatureExtractor
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    _models = {}
    _feature_extractors = {}
    
    @classmethod
    def load_model(cls, model_type: str):
        """Load a model and its feature extractor"""
        if model_type in cls._models:
            return cls._models[model_type], cls._feature_extractors[model_type]
            
        try:
            model_path = os.path.join(settings.MODEL_PATH, model_type)
            
            # Load model and feature extractor
            model = AutoModelForImageClassification.from_pretrained(model_path)
            feature_extractor = AutoFeatureExtractor.from_pretrained(model_path)
            
            # Cache the loaded models
            cls._models[model_type] = model
            cls._feature_extractors[model_type] = feature_extractor
            
            return model, feature_extractor
            
        except Exception as e:
            logger.error(f"Error loading {model_type} model: {str(e)}")
            return None, None
    
    @classmethod
    def get_xray_model(cls):
        return cls.load_model(settings.XRAY_MODEL)
    
    @classmethod
    def get_mri_model(cls):
        return cls.load_model(settings.MRI_MODEL)
    
    @classmethod
    def get_ct_model(cls):
        return cls.load_model(settings.CT_MODEL)
    
    @classmethod
    def clear_cache(cls):
        """Clear the model cache"""
        cls._models.clear()
        cls._feature_extractors.clear() 