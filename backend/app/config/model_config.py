"""
Model configuration settings for the medical AI system.
"""

MODEL_CONFIG = {
    "model_management": {
        "quantization": {
            "enabled": True,
            "bits": 8,
            "group_size": 128
        },
        "remote_models": {
            "enabled": True,
            "cache_dir": "model_cache"
        }
    },
    "models": {
        "xray": {
            "model_id": "microsoft/resnet-50",
            "fallback_model_id": "microsoft/resnet-50",
            "weights": {
                "diagnosis": 0.7,
                "treatment": 0.3
            }
        },
        "mri": {
            "model_id": "microsoft/resnet-50",
            "fallback_model_id": "microsoft/resnet-50",
            "weights": {
                "diagnosis": 0.7,
                "treatment": 0.3
            }
        },
        "ct": {
            "model_id": "microsoft/resnet-50",
            "fallback_model_id": "microsoft/resnet-50",
            "weights": {
                "diagnosis": 0.7,
                "treatment": 0.3
            }
        },
        "medical_8b": {
            "model_id": "microsoft/BiomedVLP-CXR-BERT-general",
            "fallback_model_id": "microsoft/BiomedVLP-CXR-BERT-general",
            "weights": {
                "diagnosis": 0.6,
                "treatment": 0.4
            }
        },
        "clinical_bert": {
            "model_id": "emilyalsentzer/Bio_ClinicalBERT",
            "fallback_model_id": "emilyalsentzer/Bio_ClinicalBERT",
            "weights": {
                "diagnosis": 0.5,
                "treatment": 0.5
            }
        }
    },
    "task_weights": {
        "diagnosis": {
            "xray": 0.3,
            "mri": 0.3,
            "ct": 0.3,
            "medical_8b": 0.05,
            "clinical_bert": 0.05
        },
        "treatment": {
            "xray": 0.2,
            "mri": 0.2,
            "ct": 0.2,
            "medical_8b": 0.2,
            "clinical_bert": 0.2
        }
    }
} 