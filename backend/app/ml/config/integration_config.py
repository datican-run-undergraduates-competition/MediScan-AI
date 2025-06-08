import os
import json
from typing import Dict, Any
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

def load_config() -> Dict[str, Any]:
    """
    Load integration configuration settings.
    
    Returns:
        Dictionary containing configuration settings
    """
    try:
        # Default configuration
        config = {
            'models': {
                'image_processor': {
                    'type': 'resnet50',
                    'weights': 'imagenet',
                    'input_size': (224, 224),
                    'batch_size': 32
                },
                'text_processor': {
                    'type': 'distilbert',
                    'max_length': 512,
                    'batch_size': 16
                },
                'decision_engine': {
                    'type': 'rule_based',
                    'confidence_threshold': 0.8
                },
                'measurement_processor': {
                    'type': 'statistical',
                    'normalization': 'standard'
                },
                'chatbot': {
                    'type': 'gpt',
                    'model': 'gpt-3.5-turbo',
                    'max_tokens': 150,
                    'temperature': 0.7
                }
            },
            'processing': {
                'image': {
                    'allowed_formats': ['jpg', 'jpeg', 'png', 'dicom'],
                    'max_size': 10 * 1024 * 1024,  # 10MB
                    'preprocessing': {
                        'resize': True,
                        'normalize': True,
                        'augment': False
                    }
                },
                'text': {
                    'max_length': 1000,
                    'preprocessing': {
                        'remove_special_chars': True,
                        'lowercase': True,
                        'remove_stopwords': True
                    }
                }
            },
            'analysis': {
                'confidence_threshold': 0.7,
                'max_recommendations': 5,
                'pattern_matching': {
                    'min_confidence': 0.6,
                    'max_patterns': 10
                }
            },
            'chatbot': {
                'max_history': 10,
                'response_timeout': 30,
                'fallback_responses': [
                    "I'm not sure I understand. Could you rephrase that?",
                    "I need more information to help you with that.",
                    "I'm still learning about this topic."
                ]
            },
            'storage': {
                'type': 'local',
                'path': 'data/processed',
                'backup': True,
                'retention_days': 30
            },
            'logging': {
                'level': 'INFO',
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                'file': 'logs/medical_processor.log'
            }
        }
        
        # Try to load custom config if exists
        config_path = Path(__file__).parent / 'custom_config.json'
        if config_path.exists():
            with open(config_path, 'r') as f:
                custom_config = json.load(f)
                # Update default config with custom settings
                config.update(custom_config)
                logger.info("Loaded custom configuration")
        
        return config
        
    except Exception as e:
        logger.error(f"Error loading configuration: {str(e)}")
        # Return default config if there's an error
        return config 