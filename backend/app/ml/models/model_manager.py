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
            raise
            
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
            raise
            
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
            raise
            
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
            raise
            
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
            raise
            
    def _initialize_base_models(self):
        """Initialize base models that can be used across tasks."""
        try:
            # Initialize medical models
            for model_name, model_config in self.config['models'].items():
                model_id = model_config['model_id']
                weight = model_config['weight']
                
                if model_name in ['medical_8b', 'clinical_bert']:
                    # Load language models
                    tokenizer = AutoTokenizer.from_pretrained(model_id)
                    model = self._load_model_with_quantization(
                        model_id,
                        AutoModelForCausalLM if model_name == 'medical_8b' else BertModel
                    )
                else:
                    # Load vision models
                    tokenizer = AutoFeatureExtractor.from_pretrained(model_id)
                    model = self._load_model_with_quantization(
                        model_id,
                        AutoModelForImageClassification
                    )
                
                self.models[model_name] = model
                self.tokenizers[model_name] = tokenizer
                self.model_weights[model_name] = weight
                
        except Exception as e:
            self.logger.error(f"Error initializing base models: {str(e)}")
            raise
            
    def _initialize_task_models(self):
        """Initialize models for specific medical tasks."""
        try:
            # Initialize task-specific models based on task weights
            for task, weights in self.config['task_weights'].items():
                self.task_specific_models[task] = {
                    model_name: self.models[model_name]
                    for model_name in weights.keys()
                    if model_name in self.models
                }
                
        except Exception as e:
            self.logger.error(f"Error initializing task models: {str(e)}")
            raise
            
    def get_model(self, task: str) -> Union[torch.nn.Module, Dict[str, torch.nn.Module]]:
        """Get model(s) for a specific task."""
        return self.task_specific_models.get(task, {})
        
    def get_tokenizer(self, model_name: str) -> Optional[AutoTokenizer]:
        """Get tokenizer for a specific model."""
        return self.tokenizers.get(model_name)
        
    def ensemble_predict(self, task: str, input_data: Dict) -> Dict:
        """Make ensemble prediction using multiple models."""
        try:
            # Get task-specific models
            models = self._get_task_models(task)
            if not models:
                raise ValueError(f"No models available for task: {task}")
                
            # Get predictions from each model
            predictions = []
            weights = []
            confidences = []
            
            for model_name, model in models.items():
                # Get model weight
                weight = self._calculate_model_weight(model_name, task)
                
                # Make prediction
                prediction = self._make_prediction(model, input_data)
                
                # Calculate confidence
                confidence = self._calculate_prediction_confidence(prediction)
                
                predictions.append(prediction)
                weights.append(weight)
                confidences.append(confidence)
                
            # Combine predictions using weighted ensemble
            final_prediction = self._weighted_ensemble(
                predictions,
                weights,
                confidences
            )
            
            return final_prediction
            
        except Exception as e:
            self.logger.error(f"Error in ensemble prediction: {str(e)}")
            raise
            
    def _get_task_models(self, task: str) -> Dict[str, torch.nn.Module]:
        """Get models for a specific task."""
        return self.task_specific_models.get(task, {})
        
    def _calculate_model_weight(self, model_name: str, task: str) -> float:
        """Calculate weight for a model in a specific task."""
        task_weights = self.config['task_weights'].get(task, {})
        return task_weights.get(model_name, 0.0)
        
    def _calculate_prediction_confidence(self, prediction: Dict) -> float:
        """Calculate confidence score for a prediction."""
        # Simple confidence calculation based on prediction probabilities
        if 'probabilities' in prediction:
            return float(max(prediction['probabilities'].values()))
        return 0.5  # Default confidence
        
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
                return predictions[0] if predictions else {}
                
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
            raise
            
    def fine_tune_model(self, task: str, training_data: Dict, validation_data: Dict = None):
        """Fine-tune a model for a specific task."""
        try:
            # Get base model
            model = self.task_specific_models.get(task)
            if not model:
                raise ValueError(f"No model found for task: {task}")
                
            # Setup training arguments
            training_args = TrainingArguments(
                output_dir=f"models/fine_tuned/{task}",
                num_train_epochs=3,
                per_device_train_batch_size=8,
                per_device_eval_batch_size=8,
                warmup_steps=500,
                weight_decay=0.01,
                logging_dir=f"logs/fine_tuned/{task}",
                logging_steps=100,
                evaluation_strategy="steps" if validation_data else "no",
                eval_steps=500 if validation_data else None,
                save_strategy="steps",
                save_steps=500,
                load_best_model_at_end=True if validation_data else False
            )
            
            # Setup data collator based on task type
            if isinstance(model, AutoModelForSeq2SeqLM):
                data_collator = DataCollatorForSeq2Seq(
                    tokenizer=self.tokenizers.get('medical_8b'),
                    model=model
                )
            else:
                data_collator = DataCollatorForLanguageModeling(
                    tokenizer=self.tokenizers.get('medical_8b'),
                    mlm=False
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
            
            # Update model reference
            self.fine_tuned_models[task] = model_path
            
            return model_path
            
        except Exception as e:
            self.logger.error(f"Error fine-tuning model for task {task}: {str(e)}")
            raise
            
    def evaluate_model(self, task: str, test_data: Dict) -> Dict:
        """Evaluate a model's performance."""
        try:
            # Get model
            model = self.task_specific_models.get(task)
            if not model:
                raise ValueError(f"No model found for task: {task}")
                
            # Setup evaluation metrics
            metrics = {}
            
            # Evaluate based on task type
            if isinstance(model, AutoModelForSequenceClassification):
                predictions = model.predict(test_data)
                metrics['accuracy'] = np.mean(predictions.predictions.argmax(axis=-1) == test_data['labels'])
                metrics['f1'] = f1_score(test_data['labels'], predictions.predictions.argmax(axis=-1), average='weighted')
                
            elif isinstance(model, AutoModelForTokenClassification):
                predictions = model.predict(test_data)
                metrics['token_accuracy'] = np.mean(predictions.predictions.argmax(axis=-1) == test_data['labels'])
                
            elif isinstance(model, AutoModelForSeq2SeqLM):
                predictions = model.predict(test_data)
                metrics['bleu'] = compute_bleu(predictions.predictions, test_data['labels'])
                metrics['rouge'] = compute_rouge(predictions.predictions, test_data['labels'])
                
            return metrics
            
        except Exception as e:
            self.logger.error(f"Error evaluating model for task {task}: {str(e)}")
            raise
            
    def generate_prescription(self, patient_data: Dict, diagnosis: str) -> Dict:
        """Generate a prescription based on patient data and diagnosis."""
        try:
            # Get relevant models
            recommendation_model = self.task_specific_models['drug_recommendation']
            dosage_model = self.task_specific_models['dosage_calculation']
            interaction_model = self.task_specific_models['drug_interaction']
            contraindication_model = self.task_specific_models['contraindication_check']
            
            # Generate drug recommendations
            recommendations = recommendation_model.predict({
                'patient_data': patient_data,
                'diagnosis': diagnosis
            })
            
            # Calculate dosages
            dosages = dosage_model.predict({
                'patient_data': patient_data,
                'recommendations': recommendations
            })
            
            # Check for drug interactions
            interactions = interaction_model.predict({
                'patient_data': patient_data,
                'recommendations': recommendations
            })
            
            # Check for contraindications
            contraindications = contraindication_model.predict({
                'patient_data': patient_data,
                'recommendations': recommendations
            })
            
            # Generate prescription
            prescription = {
                'medications': recommendations.predictions,
                'dosages': dosages.predictions,
                'interactions': interactions.predictions,
                'contraindications': contraindications.predictions,
                'warnings': self._generate_warnings(interactions, contraindications),
                'instructions': self._generate_instructions(recommendations, dosages)
            }
            
            return prescription
            
        except Exception as e:
            self.logger.error(f"Error generating prescription: {str(e)}")
            raise
            
    def _generate_warnings(self, interactions: Dict, contraindications: Dict) -> List[str]:
        """Generate warnings based on interactions and contraindications."""
        try:
            warnings = []
            
            # Add interaction warnings
            if interactions.get('predictions'):
                for interaction in interactions['predictions']:
                    if interaction['severity'] > 0.7:  # High severity threshold
                        warnings.append(f"Severe interaction warning: {interaction['description']}")
                        
            # Add contraindication warnings
            if contraindications.get('predictions'):
                for contraindication in contraindications['predictions']:
                    if contraindication['severity'] > 0.7:  # High severity threshold
                        warnings.append(f"Contraindication warning: {contraindication['description']}")
                        
            return warnings
            
        except Exception as e:
            self.logger.error(f"Error generating warnings: {str(e)}")
            raise
            
    def _generate_instructions(self, recommendations: Dict, dosages: Dict) -> List[str]:
        """Generate medication instructions."""
        try:
            instructions = []
            
            # Generate instructions for each medication
            for med, dosage in zip(recommendations['predictions'], dosages['predictions']):
                instruction = {
                    'medication': med['name'],
                    'dosage': dosage['amount'],
                    'frequency': dosage['frequency'],
                    'duration': dosage['duration'],
                    'special_instructions': med.get('special_instructions', [])
                }
                instructions.append(instruction)
                
            return instructions
            
        except Exception as e:
            self.logger.error(f"Error generating instructions: {str(e)}")
            raise 