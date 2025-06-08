"""
Model configuration settings for the medical AI system.
"""

MODEL_CONFIG = {
    'model_management': {
        'quantization': {
            'dynamic_quantization': True,
            'use_4bit': False
        },
        'remote_models': {
            'cache_dir': 'models/cache',
            'max_cache_size_gb': 2,
            'cleanup_interval_hours': 24
        }
    },
    'models': {
        'xray': {
            'model_id': 'microsoft/resnet-50',
            'weight': 0.4
        },
        'mri': {
            'model_id': 'microsoft/resnet-50',
            'weight': 0.4
        },
        'ct': {
            'model_id': 'microsoft/resnet-50',
            'weight': 0.4
        },
        'medical_8b': {
            'model_id': 'microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext',
            'weight': 0.4
        },
        'clinical_bert': {
            'model_id': 'emilyalsentzer/Bio_ClinicalBERT',
            'weight': 0.3
        }
    },
    'task_weights': {
        'diagnosis': {
            'medical_8b': 0.4,
            'clinical_bert': 0.3,
            'xray': 0.15,
            'mri': 0.15
        },
        'treatment': {
            'medical_8b': 0.4,
            'clinical_bert': 0.3,
            'xray': 0.15,
            'mri': 0.15
        }
    }
} 