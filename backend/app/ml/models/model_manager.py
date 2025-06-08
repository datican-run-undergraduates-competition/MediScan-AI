import logging
from typing import Dict, List, Optional, Union
import torch
import numpy as np
import os
from pathlib import Path
import shutil
import time
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    AutoModelForSequenceClassification,
    BertTokenizer,
    BertModel,
    AutoModelForImageClassification,
    AutoFeatureExtractor,
    AutoModelForTokenClassification,
    AutoModelForQuestionAnswering,
    AutoModelForSeq2SeqLM,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling,
    DataCollatorForSeq2Seq
)
from ..utils.medical_knowledge import MedicalKnowledgeBase
from ...config.model_config import MODEL_CONFIG

class ModelManager:
    def __init__(self, config: Dict = None):
        self.logger = logging.getLogger(__name__)
        self.config = config or MODEL_CONFIG
        self.knowledge_base = MedicalKnowledgeBase()
        self.models = {}
        self.tokenizers = {}
        self.model_weights = {}
        self.task_specific_models = {}
        self.feature_extractors = {}
        self.fine_tuned_models = {}
        
        # Setup quantization config with accuracy preservation
        self._setup_quantization()
        
        # Setup cache directory with cloud deployment optimization
        self._setup_cache_directory()
        
        # Initialize models
        self._initialize_models()
        
    def _setup_quantization(self):
        """Setup model quantization configuration with accuracy preservation."""
        try:
            quant_config = self.config.get('model_management', {}).get('quantization', {})
            
            # Dynamic quantization based on task requirements
            if quant_config.get('dynamic_quantization', True):
                self.quantization_config = BitsAndBytesConfig(
                    load_in_8bit=True,
                    llm_int8_threshold=6.0,
                    llm_int8_has_fp16_weight=False,
                    llm_int8_enable_fp32_cpu_offload=True,  # Preserve accuracy
                    llm_int8_skip_modules=["lm_head"]  # Skip quantization for critical layers
                )
            elif quant_config.get('use_4bit', False):
                self.quantization_config = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.float16,
                    bnb_4bit_use_double_quant=True,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_quant_storage=torch.float16  # Preserve accuracy
                )
            else:
                self.quantization_config = None
                
        except Exception as e:
            self.logger.error(f"Error setting up quantization: {str(e)}")
            self.quantization_config = None
            
    def _setup_cache_directory(self):
        """Setup cache directory with cloud deployment optimization."""
        try:
            # Get cache configuration
            cache_config = self.config.get('model_management', {}).get('remote_models', {})
            
            # Use environment variable for cache directory if available
            cache_dir = os.getenv('MODEL_CACHE_DIR', cache_config.get('cache_dir', 'models/cache'))
            self.cache_dir = Path(cache_dir)
            
            # Create cache directory if it doesn't exist
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            
            # Set cache size limit from environment or config
            max_size_gb = float(os.getenv('CACHE_SIZE_GB', cache_config.get('max_cache_size_gb', 2)))
            self.max_cache_size = max_size_gb * 1024 * 1024 * 1024
            
            # Setup cache cleanup schedule
            self.cleanup_interval = cache_config.get('cleanup_interval_hours', 24)
            self.last_cleanup = 0
            
            # Clean cache if needed
            self._clean_cache_if_needed()
            
        except Exception as e:
            self.logger.error(f"Error setting up cache directory: {str(e)}")
            self.cache_dir = Path('models/cache')
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            
    def _clean_cache_if_needed(self):
        """Clean cache if it exceeds size limit or cleanup interval has passed."""
        try:
            current_time = time.time()
            current_size = sum(f.stat().st_size for f in self.cache_dir.rglob('*') if f.is_file())
            
            # Check if cleanup is needed
            if (current_size > self.max_cache_size or 
                current_time - self.last_cleanup > self.cleanup_interval * 3600):
                
                self.logger.info(f"Cache size: {current_size/1024/1024:.2f}MB, Cleaning...")
                
                # Get file access patterns
                files = [(f, f.stat().st_mtime, f.stat().st_atime) for f in self.cache_dir.rglob('*') if f.is_file()]
                
                # Sort by last access time and size
                files.sort(key=lambda x: (x[2], -x[1]))
                
                # Remove files until we're under the limit
                for file, _, _ in files:
                    if current_size <= self.max_cache_size * 0.8:  # Leave 20% buffer
                        break
                    current_size -= file.stat().st_size
                    file.unlink()
                    
                self.last_cleanup = current_time
                self.logger.info(f"Cache cleaned. New size: {current_size/1024/1024:.2f}MB")
                
        except Exception as e:
            self.logger.error(f"Error cleaning cache: {str(e)}")
            
    def _load_model_with_quantization(self, model_name: str, model_class, **kwargs):
        """Load model with quantization if configured."""
        try:
            if self.quantization_config:
                return model_class.from_pretrained(
                    model_name,
                    quantization_config=self.quantization_config,
                    cache_dir=self.cache_dir,
                    **kwargs
                )
            else:
                return model_class.from_pretrained(
                    model_name,
                    cache_dir=self.cache_dir,
                    **kwargs
                )
        except Exception as e:
            self.logger.error(f"Error loading model {model_name}: {str(e)}")
            return None
            
    def _initialize_models(self):
        """Initialize all required models for different tasks."""
        try:
            # Initialize base models
            self._initialize_base_models()
            
            # Initialize task-specific models
            self._initialize_task_models()
            
            self.logger.info("Successfully initialized all models")
        except Exception as e:
            self.logger.error(f"Error initializing models: {str(e)}")
            
    def _initialize_base_models(self):
        """Initialize base models that can be used across tasks."""
        try:
            # Initialize medical models
            for model_name, model_config in self.config['models'].items():
                model_id = model_config['model_id']
                weight = model_config['weight']
                
                try:
                    if model_name in ['medical_8b', 'clinical_bert']:
                        # Load language models
                        self.logger.info(f"Loading language model: {model_id}")
                        tokenizer = AutoTokenizer.from_pretrained(
                            model_id,
                            cache_dir=self.cache_dir,
                            trust_remote_code=True
                        )
                        model = self._load_model_with_quantization(
                            model_id,
                            AutoModelForCausalLM if model_name == 'medical_8b' else BertModel,
                            trust_remote_code=True
                        )
                    else:
                        # Load vision models
                        self.logger.info(f"Loading vision model: {model_id}")
                        tokenizer = AutoFeatureExtractor.from_pretrained(
                            model_id,
                            cache_dir=self.cache_dir,
                            trust_remote_code=True
                        )
                        model = self._load_model_with_quantization(
                            model_id,
                            AutoModelForImageClassification,
                            trust_remote_code=True
                        )
                    
                    if model is not None:
                        self.models[model_name] = model
                        self.tokenizers[model_name] = tokenizer
                        self.model_weights[model_name] = weight
                        self.logger.info(f"Successfully loaded model {model_name}")
                    else:
                        self.logger.warning(f"Failed to load model {model_name}")
                        
                except Exception as e:
                    self.logger.error(f"Error loading model {model_name}: {str(e)}")
                    continue
                    
        except Exception as e:
            self.logger.error(f"Error initializing base models: {str(e)}")
            # Initialize with empty models instead of failing
            self.models = {}
            self.tokenizers = {}
            self.model_weights = {}
            
    def _initialize_task_models(self):
        """Initialize task-specific models."""
        try:
            for task, weights in self.config['task_weights'].items():
                task_models = {}
                for model_name, weight in weights.items():
                    if model_name in self.models:
                        task_models[model_name] = {
                            'model': self.models[model_name],
                            'weight': weight
                        }
                if task_models:
                    self.task_specific_models[task] = task_models
                    
        except Exception as e:
            self.logger.error(f"Error initializing task models: {str(e)}")
            
    def get_model(self, task: str) -> Union[torch.nn.Module, Dict[str, torch.nn.Module]]:
        """Get model for specific task."""
        return self.task_specific_models.get(task, {})
        
    def get_tokenizer(self, model_name: str) -> Optional[AutoTokenizer]:
        """Get tokenizer for specific model."""
        return self.tokenizers.get(model_name)
        
    def ensemble_predict(self, task: str, input_data: Dict) -> Dict:
        """Make ensemble prediction using multiple models."""
        try:
            task_models = self._get_task_models(task)
            if not task_models:
                return {'error': 'No models available for task'}
                
            predictions = []
            weights = []
            confidences = []
            
            for model_name, model_info in task_models.items():
                model = model_info['model']
                weight = model_info['weight']
                
                try:
                    # Make prediction
                    prediction = model(**input_data)
                    confidence = self._calculate_prediction_confidence(prediction)
                    
                    predictions.append(prediction)
                    weights.append(weight)
                    confidences.append(confidence)
                    
                except Exception as e:
                    self.logger.error(f"Error making prediction with {model_name}: {str(e)}")
                    continue
                    
            if not predictions:
                return {'error': 'No valid predictions'}
                
            # Combine predictions
            final_prediction = self._weighted_ensemble(predictions, weights, confidences)
            return final_prediction
            
        except Exception as e:
            self.logger.error(f"Error in ensemble prediction: {str(e)}")
            return {'error': str(e)}
            
    def _get_task_models(self, task: str) -> Dict[str, torch.nn.Module]:
        """Get models for specific task."""
        return self.task_specific_models.get(task, {})
        
    def _calculate_model_weight(self, model_name: str, task: str) -> float:
        """Calculate weight for model in ensemble."""
        return self.config['task_weights'].get(task, {}).get(model_name, 0.0)
        
    def _calculate_prediction_confidence(self, prediction: Dict) -> float:
        """Calculate confidence score for prediction."""
        try:
            if 'logits' in prediction:
                probs = torch.softmax(prediction['logits'], dim=-1)
                return float(torch.max(probs))
            return 0.5
        except Exception:
            return 0.5
            
    def _weighted_ensemble(
        self,
        predictions: List[Dict],
        weights: List[float],
        confidences: List[float]
    ) -> Dict:
        """Combine predictions using weighted ensemble."""
        try:
            # Normalize weights
            total_weight = sum(w * c for w, c in zip(weights, confidences))
            if total_weight == 0:
                return {'error': 'No valid predictions'}
                
            normalized_weights = [w * c / total_weight for w, c in zip(weights, confidences)]
            
            # Combine predictions
            combined_prediction = {}
            for pred, weight in zip(predictions, normalized_weights):
                for key, value in pred.items():
                    if key not in combined_prediction:
                        combined_prediction[key] = 0
                    combined_prediction[key] += value * weight
                    
            return combined_prediction
            
        except Exception as e:
            self.logger.error(f"Error in weighted ensemble: {str(e)}")
            return {'error': str(e)}
            
    def fine_tune_model(self, task: str, training_data: Dict, validation_data: Dict = None):
        """Fine-tune model for specific task."""
        try:
            task_models = self._get_task_models(task)
            if not task_models:
                raise ValueError(f"No models available for task {task}")
                
            for model_name, model_info in task_models.items():
                model = model_info['model']
                
                # Setup training arguments
                training_args = TrainingArguments(
                    output_dir=f"models/fine_tuned/{task}/{model_name}",
                    num_train_epochs=3,
                    per_device_train_batch_size=8,
                    per_device_eval_batch_size=8,
                    warmup_steps=500,
                    weight_decay=0.01,
                    logging_dir=f"logs/{task}/{model_name}",
                    logging_steps=10,
                    evaluation_strategy="steps",
                    eval_steps=100,
                    save_strategy="steps",
                    save_steps=100,
                    load_best_model_at_end=True
                )
                
                # Setup trainer
                trainer = Trainer(
                    model=model,
                    args=training_args,
                    train_dataset=training_data,
                    eval_dataset=validation_data,
                    data_collator=DataCollatorForLanguageModeling(
                        tokenizer=self.get_tokenizer(model_name)
                    )
                )
                
                # Train model
                trainer.train()
                
                # Save fine-tuned model
                model.save_pretrained(f"models/fine_tuned/{task}/{model_name}")
                
        except Exception as e:
            self.logger.error(f"Error fine-tuning model: {str(e)}")
            raise
            
    def evaluate_model(self, task: str, test_data: Dict) -> Dict:
        """Evaluate model performance on test data."""
        try:
            task_models = self._get_task_models(task)
            if not task_models:
                raise ValueError(f"No models available for task {task}")
                
            results = {}
            for model_name, model_info in task_models.items():
                model = model_info['model']
                
                # Setup trainer for evaluation
                trainer = Trainer(
                    model=model,
                    args=TrainingArguments(
                        output_dir=f"models/evaluation/{task}/{model_name}",
                        per_device_eval_batch_size=8
                    ),
                    eval_dataset=test_data,
                    data_collator=DataCollatorForLanguageModeling(
                        tokenizer=self.get_tokenizer(model_name)
                    )
                )
                
                # Evaluate model
                eval_results = trainer.evaluate()
                results[model_name] = eval_results
                
            return results
            
        except Exception as e:
            self.logger.error(f"Error evaluating model: {str(e)}")
            raise
            
    def generate_prescription(self, patient_data: Dict, diagnosis: str) -> Dict:
        """Generate prescription based on patient data and diagnosis."""
        try:
            # Get medication recommendations
            recommendations = self.ensemble_predict('treatment', {
                'patient_data': patient_data,
                'diagnosis': diagnosis
            })
            
            if 'error' in recommendations:
                return recommendations
                
            # Get medication information
            medications = {}
            for med in recommendations.get('medications', []):
                med_info = self.knowledge_base.get_medication_info(med)
                if med_info:
                    medications[med] = med_info
                    
            # Generate warnings
            warnings = self._generate_warnings(
                recommendations.get('interactions', {}),
                recommendations.get('contraindications', {})
            )
            
            # Generate instructions
            instructions = self._generate_instructions(
                recommendations.get('recommendations', {}),
                recommendations.get('dosages', {})
            )
            
            return {
                'medications': medications,
                'warnings': warnings,
                'instructions': instructions
            }
            
        except Exception as e:
            self.logger.error(f"Error generating prescription: {str(e)}")
            return {'error': str(e)}
            
    def _generate_warnings(self, interactions: Dict, contraindications: Dict) -> List[str]:
        """Generate warnings based on interactions and contraindications."""
        warnings = []
        
        # Add interaction warnings
        for med1, med2 in interactions.items():
            warnings.append(f"Warning: {med1} may interact with {med2}")
            
        # Add contraindication warnings
        for med, conditions in contraindications.items():
            for condition in conditions:
                warnings.append(f"Warning: {med} is contraindicated in {condition}")
                
        return warnings
        
    def _generate_instructions(self, recommendations: Dict, dosages: Dict) -> List[str]:
        """Generate instructions based on recommendations and dosages."""
        instructions = []
        
        # Add dosage instructions
        for med, dosage in dosages.items():
            instructions.append(f"Take {med} {dosage['amount']} {dosage['unit']} {dosage['frequency']}")
            
        # Add general instructions
        for med, recs in recommendations.items():
            for rec in recs:
                instructions.append(f"For {med}: {rec}")
                
        return instructions 