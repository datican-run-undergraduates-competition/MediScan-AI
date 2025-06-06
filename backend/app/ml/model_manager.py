import torch
import os
import json
from pathlib import Path
from typing import Dict, Optional
import hashlib
from transformers import AutoModel, AutoTokenizer, ViTForImageClassification

class ModelManager:
    def __init__(self, cache_dir: str = "model_cache"):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        # Model configurations
        self.model_configs = {
            'image': {
                'xray': {
                    'name': 'mediscan/xray-specialized-vit',
                    'type': 'vit',
                    'cache_key': 'xray_vit'
                },
                'mri': {
                    'name': 'mediscan/mri-specialized-vit',
                    'type': 'vit',
                    'cache_key': 'mri_vit'
                },
                'ct': {
                    'name': 'mediscan/ct-specialized-vit',
                    'type': 'vit',
                    'cache_key': 'ct_vit'
                }
            },
            'text': {
                'name': 'emilyalsentzer/Bio_ClinicalBERT',
                'type': 'bert',
                'cache_key': 'bioclinical_bert'
            }
        }
        
        # Initialize model cache
        self.model_cache = {}
        self._load_cached_models()

    def _load_cached_models(self):
        """Load models from cache if available"""
        for modality, config in self.model_configs['image'].items():
            cache_path = self.cache_dir / f"{config['cache_key']}.pt"
            if cache_path.exists():
                try:
                    if config['type'] == 'vit':
                        model = ViTForImageClassification.from_pretrained(
                            str(cache_path),
                            local_files_only=True
                        )
                    self.model_cache[config['cache_key']] = model.to(self.device)
                except Exception as e:
                    print(f"Error loading cached model {config['cache_key']}: {e}")

        # Load text model
        text_config = self.model_configs['text']
        cache_path = self.cache_dir / f"{text_config['cache_key']}.pt"
        if cache_path.exists():
            try:
                model = AutoModel.from_pretrained(
                    str(cache_path),
                    local_files_only=True
                )
                self.model_cache[text_config['cache_key']] = model.to(self.device)
            except Exception as e:
                print(f"Error loading cached text model: {e}")

    def get_model(self, modality: str, model_type: str = 'image') -> Optional[torch.nn.Module]:
        """
        Get model for specified modality, loading from cache or downloading if needed
        
        Args:
            modality: Image modality ('xray', 'mri', 'ct') or 'text'
            model_type: Type of model ('image' or 'text')
            
        Returns:
            Loaded model or None if loading fails
        """
        try:
            if model_type == 'image':
                config = self.model_configs['image'][modality]
            else:
                config = self.model_configs['text']
            
            cache_key = config['cache_key']
            
            # Check if model is in cache
            if cache_key in self.model_cache:
                return self.model_cache[cache_key]
            
            # Load and cache model
            if config['type'] == 'vit':
                model = ViTForImageClassification.from_pretrained(config['name'])
            else:
                model = AutoModel.from_pretrained(config['name'])
            
            # Save to cache
            cache_path = self.cache_dir / f"{cache_key}.pt"
            model.save_pretrained(str(cache_path))
            
            # Add to memory cache
            self.model_cache[cache_key] = model.to(self.device)
            
            return model
            
        except Exception as e:
            print(f"Error loading model for {modality}: {e}")
            return None

    def get_tokenizer(self, model_type: str = 'text') -> Optional[AutoTokenizer]:
        """Get tokenizer for specified model type"""
        try:
            config = self.model_configs[model_type]
            return AutoTokenizer.from_pretrained(config['name'])
        except Exception as e:
            print(f"Error loading tokenizer: {e}")
            return None

    def clear_cache(self):
        """Clear model cache"""
        self.model_cache.clear()
        for file in self.cache_dir.glob("*.pt"):
            file.unlink()

    def get_model_info(self) -> Dict:
        """Get information about cached models"""
        info = {
            'cached_models': list(self.model_cache.keys()),
            'cache_size': sum(
                os.path.getsize(self.cache_dir / f"{key}.pt")
                for key in self.model_cache.keys()
            ),
            'device': str(self.device)
        }
        return info

    def verify_model_integrity(self, modality: str) -> bool:
        """Verify model integrity using checksums"""
        try:
            if modality in self.model_configs['image']:
                config = self.model_configs['image'][modality]
            else:
                config = self.model_configs['text']
            
            cache_path = self.cache_dir / f"{config['cache_key']}.pt"
            if not cache_path.exists():
                return False
            
            # Calculate checksum
            with open(cache_path, 'rb') as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            
            # Compare with stored checksum
            checksum_path = self.cache_dir / f"{config['cache_key']}_checksum.json"
            if checksum_path.exists():
                with open(checksum_path, 'r') as f:
                    stored_checksum = json.load(f)['checksum']
                return file_hash == stored_checksum
            
            return False
            
        except Exception as e:
            print(f"Error verifying model integrity: {e}")
            return False

    def update_model_cache(self, modality: str):
        """Update model cache with latest version"""
        try:
            if modality in self.model_configs['image']:
                config = self.model_configs['image'][modality]
            else:
                config = self.model_configs['text']
            
            # Remove old cache
            cache_path = self.cache_dir / f"{config['cache_key']}.pt"
            if cache_path.exists():
                cache_path.unlink()
            
            # Load and cache new model
            self.get_model(modality)
            
            # Update checksum
            with open(cache_path, 'rb') as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()
            
            checksum_path = self.cache_dir / f"{config['cache_key']}_checksum.json"
            with open(checksum_path, 'w') as f:
                json.dump({'checksum': file_hash}, f)
            
        except Exception as e:
            print(f"Error updating model cache: {e}") 