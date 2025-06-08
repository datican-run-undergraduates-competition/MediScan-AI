import logging
from typing import Dict, List, Optional, Union, Any
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

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.tokenizers: Dict[str, Any] = {}
        self.feature_extractors: Dict[str, Any] = {}
        self.weights: Dict[str, float] = {}
        self.medical_kb = None
        self.cache_dir = Path("model_cache")
        self.cache_dir.mkdir(exist_ok=True)
        self._initialize_models()

    def _initialize_models(self):
        """Initialize all models with error handling."""
        try:
            # Initialize medical knowledge base
            self.medical_kb = MedicalKnowledgeBase()
            
            # Set up quantization
            quantization_config = MODEL_CONFIG["model_management"]["quantization"]
            if quantization_config["enabled"]:
                torch.quantization.quantize_dynamic(
                    torch.nn.Module,
                    {torch.nn.Linear},
                    dtype=torch.qint8
                )

            # Initialize base models
            self._initialize_base_models()
            
            # Set up task weights
            self.weights = MODEL_CONFIG["task_weights"]
            
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}")
            # Initialize with empty dictionaries if initialization fails
            self.models = {}
            self.tokenizers = {}
            self.weights = {}

    def _initialize_base_models(self):
        """Initialize base models with fallback options."""
        try:
            # Load medical models
            self._load_model_with_fallback("xray", MODEL_CONFIG["models"]["xray"])
            self._load_model_with_fallback("mri", MODEL_CONFIG["models"]["mri"])
            self._load_model_with_fallback("ct", MODEL_CONFIG["models"]["ct"])
            
            # Load language models
            self._load_model_with_fallback("medical_8b", MODEL_CONFIG["models"]["medical_8b"])
            self._load_model_with_fallback("clinical_bert", MODEL_CONFIG["models"]["clinical_bert"])
            
        except Exception as e:
            logger.error(f"Error loading base models: {str(e)}")

    def _load_model_with_fallback(
        self,
        model_id: str,
        fallback_id: str,
        model_type: str = "model"
    ) -> Optional[Any]:
        """Load a model with fallback option."""
        try:
            # Try primary model
            if model_type == "model":
                return AutoModelForImageClassification.from_pretrained(
                    model_id,
                    trust_remote_code=True,
                    cache_dir=self.cache_dir
                )
            elif model_type == "tokenizer":
                return AutoTokenizer.from_pretrained(
                    model_id,
                    trust_remote_code=True,
                    cache_dir=self.cache_dir
                )
            elif model_type == "feature_extractor":
                return AutoFeatureExtractor.from_pretrained(
                    model_id,
                    trust_remote_code=True,
                    cache_dir=self.cache_dir
                )
        except Exception as e:
            logger.warning(f"Failed to load {model_type} {model_id}: {str(e)}")
            
            if model_id != fallback_id:
                logger.info(f"Attempting to load fallback {model_type} {fallback_id}")
                try:
                    if model_type == "model":
                        return AutoModelForImageClassification.from_pretrained(
                            fallback_id,
                            trust_remote_code=True,
                            cache_dir=self.cache_dir
                        )
                    elif model_type == "tokenizer":
                        return AutoTokenizer.from_pretrained(
                            fallback_id,
                            trust_remote_code=True,
                            cache_dir=self.cache_dir
                        )
                    elif model_type == "feature_extractor":
                        return AutoFeatureExtractor.from_pretrained(
                            fallback_id,
                            trust_remote_code=True,
                            cache_dir=self.cache_dir
                        )
                except Exception as fallback_error:
                    logger.error(f"Failed to load fallback {model_type} {fallback_id}: {str(fallback_error)}")
                    
        return None

    def _load_model(self, model_type: str, model_id: str):
        """Load a specific model and its tokenizer."""
        try:
            # Load model based on type
            if model_type in ["xray", "mri", "ct"]:
                self.models[model_type] = AutoModelForImageClassification.from_pretrained(
                    model_id,
                    trust_remote_code=True,
                    cache_dir=self.cache_dir
                )
            else:
                self.models[model_type] = AutoModelForSequenceClassification.from_pretrained(
                    model_id,
                    trust_remote_code=True,
                    cache_dir=self.cache_dir
                )
            
            # Load tokenizer
            self.tokenizers[model_type] = AutoTokenizer.from_pretrained(
                model_id,
                trust_remote_code=True,
                cache_dir=self.cache_dir
            )
            
            logger.info(f"Successfully loaded model {model_id} for {model_type}")
            
        except Exception as e:
            logger.error(f"Error loading model {model_id} for {model_type}: {str(e)}")
            # Initialize with None to indicate loading failure
            self.models[model_type] = None
            self.tokenizers[model_type] = None
            raise

    def get_model(self, model_type: str) -> Optional[Any]:
        """Get a specific model."""
        return self.models.get(model_type)

    def get_tokenizer(self, model_type: str) -> Optional[Any]:
        """Get a specific tokenizer."""
        return self.tokenizers.get(model_type)

    def get_weight(self, task: str, model_type: str) -> float:
        """Get the weight for a specific model in a task."""
        return self.weights.get(task, {}).get(model_type, 0.0)

    def get_medical_knowledge(self) -> Optional[MedicalKnowledgeBase]:
        """Get the medical knowledge base."""
        return self.medical_kb

    def _setup_quantization(self):
        """Setup model quantization configuration with accuracy preservation."""
        try:
            quant_config = MODEL_CONFIG.get('model_management', {}).get('quantization', {})
            
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
            logger.error(f"Error setting up quantization: {str(e)}")
            self.quantization_config = None
            
    def _setup_cache_directory(self):
        """Setup cache directory with cloud deployment optimization."""
        try:
            # Get cache configuration
            cache_config = MODEL_CONFIG.get('model_management', {}).get('remote_models', {})
            
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
            logger.error(f"Error setting up cache directory: {str(e)}")
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
                
                logger.info(f"Cache size: {current_size/1024/1024:.2f}MB, Cleaning...")
                
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
                logger.info(f"Cache cleaned. New size: {current_size/1024/1024:.2f}MB")
                
        except Exception as e:
            logger.error(f"Error cleaning cache: {str(e)}")
            
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
            logger.error(f"Error loading model {model_name}: {str(e)}")
            # Try loading without quantization
            try:
                return model_class.from_pretrained(
                    model_name,
                    cache_dir=self.cache_dir,
                    **kwargs
                )
            except Exception as e2:
                logger.error(f"Error loading model {model_name} without quantization: {str(e2)}")
                return None
            
    def ensemble_predict(self, task: str, input_data: Dict) -> Dict:
        """Make predictions using an ensemble of models."""
        try:
            # Get models for the task
            models = self._get_task_models(task)
            if not models:
                raise ValueError(f"No models available for task: {task}")
                
            # Get predictions from each model
            predictions = []
            weights = []
            confidences = []
            
            for model_name, model in models.items():
                if model is None:
                    continue
                    
                try:
                    # Get model weight
                    weight = self._calculate_model_weight(model_name, task)
                    
                    # Make prediction
                    prediction = model(input_data)
                    
                    # Calculate confidence
                    confidence = self._calculate_prediction_confidence(prediction)
                    
                    predictions.append(prediction)
                    weights.append(weight)
                    confidences.append(confidence)
                    
                except Exception as e:
                    logger.error(f"Error getting prediction from model {model_name}: {str(e)}")
                    continue
                    
            if not predictions:
                raise ValueError("No valid predictions obtained")
                
            # Combine predictions using weighted ensemble
            return self._weighted_ensemble(predictions, weights, confidences)
            
        except Exception as e:
            logger.error(f"Error in ensemble prediction: {str(e)}")
            return {}
            
    def _get_task_models(self, task: str) -> Dict[str, torch.nn.Module]:
        """Get models for a specific task."""
        return self.weights.get(task, {})
        
    def _calculate_model_weight(self, model_name: str, task: str) -> float:
        """Calculate weight for a model in a specific task."""
        return self.weights.get(task, {}).get(model_name, 0.0)
        
    def _calculate_prediction_confidence(self, prediction: Dict) -> float:
        """Calculate confidence score for a prediction."""
        try:
            # Implement confidence calculation based on prediction structure
            return 0.8  # Placeholder
        except Exception as e:
            logger.error(f"Error calculating prediction confidence: {str(e)}")
            return 0.0
            
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
                return {}
                
            normalized_weights = [w * c / total_weight for w, c in zip(weights, confidences)]
            
            # Combine predictions
            combined_prediction = {}
            for pred, weight in zip(predictions, normalized_weights):
                for key, value in pred.items():
                    if key not in combined_prediction:
                        combined_prediction[key] = 0.0
                    combined_prediction[key] += value * weight
                    
            return combined_prediction
            
        except Exception as e:
            logger.error(f"Error in weighted ensemble: {str(e)}")
            return {}
            
    def fine_tune_model(self, task: str, training_data: Dict, validation_data: Dict = None):
        """Fine-tune a model for a specific task."""
        try:
            # Get base model
            model = self.get_model(task)
            if not model:
                raise ValueError(f"No model available for task: {task}")
                
            # Prepare training arguments
            training_args = TrainingArguments(
                output_dir=f"models/fine_tuned/{task}",
                num_train_epochs=3,
                per_device_train_batch_size=8,
                per_device_eval_batch_size=8,
                warmup_steps=500,
                weight_decay=0.01,
                logging_dir=f"logs/fine_tuned/{task}",
                logging_steps=10,
                evaluation_strategy="steps",
                eval_steps=100,
                save_strategy="steps",
                save_steps=100,
                load_best_model_at_end=True
            )
            
            # Prepare data collator
            if task in ['medical_8b', 'clinical_bert']:
                data_collator = DataCollatorForLanguageModeling(
                    tokenizer=self.get_tokenizer(task),
                    mlm=True
                )
            else:
                data_collator = DataCollatorForSeq2Seq(
                    tokenizer=self.get_tokenizer(task)
                )
                
            # Initialize trainer
            trainer = Trainer(
                model=model,
                args=training_args,
                train_dataset=training_data,
                eval_dataset=validation_data,
                data_collator=data_collator
            )
            
            # Train model
            trainer.train()
            
            # Save fine-tuned model
            model_path = f"models/fine_tuned/{task}"
            trainer.save_model(model_path)
            
        except Exception as e:
            logger.error(f"Error fine-tuning model: {str(e)}")
            
    def evaluate_model(self, task: str, test_data: Dict) -> Dict:
        """Evaluate a model's performance on test data."""
        try:
            # Get model
            model = self.get_model(task)
            if not model:
                raise ValueError(f"No model available for task: {task}")
                
            # Prepare evaluation arguments
            eval_args = TrainingArguments(
                output_dir=f"models/evaluation/{task}",
                per_device_eval_batch_size=8,
                logging_dir=f"logs/evaluation/{task}",
                logging_steps=10
            )
            
            # Initialize trainer
            trainer = Trainer(
                model=model,
                args=eval_args,
                eval_dataset=test_data
            )
            
            # Evaluate model
            metrics = trainer.evaluate()
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error evaluating model: {str(e)}")
            return {}
            
    def generate_prescription(self, patient_data: Dict, diagnosis: str) -> Dict:
        """Generate a prescription based on patient data and diagnosis."""
        try:
            # Get relevant models
            medical_model = self.get_model('medical_8b')
            clinical_model = self.get_model('clinical_bert')
            
            if not medical_model or not clinical_model:
                raise ValueError("Required models not available")
                
            # Generate prescription using ensemble
            prescription = self.ensemble_predict('treatment', {
                'patient_data': patient_data,
                'diagnosis': diagnosis
            })
            
            # Add warnings and instructions
            prescription['warnings'] = self._generate_warnings(
                prescription.get('interactions', {}),
                prescription.get('contraindications', {})
            )
            
            prescription['instructions'] = self._generate_instructions(
                prescription.get('recommendations', {}),
                prescription.get('dosages', {})
            )
            
            return prescription
            
        except Exception as e:
            logger.error(f"Error generating prescription: {str(e)}")
            return {}
            
    def _generate_warnings(self, interactions: Dict, contraindications: Dict) -> List[str]:
        """Generate warnings based on interactions and contraindications."""
        warnings = []
        
        # Add interaction warnings
        for med1, med2 in interactions.items():
            warnings.append(f"Warning: {med1} may interact with {med2}")
            
        # Add contraindication warnings
        for med, condition in contraindications.items():
            warnings.append(f"Warning: {med} is contraindicated in {condition}")
            
        return warnings
        
    def _generate_instructions(self, recommendations: Dict, dosages: Dict) -> List[str]:
        """Generate instructions based on recommendations and dosages."""
        instructions = []
        
        # Add dosage instructions
        for medication, dosage in dosages.items():
            instructions.append(f"Take {medication} {dosage}")
            
        # Add general recommendations
        for category, items in recommendations.items():
            instructions.extend(items)
            
        return instructions