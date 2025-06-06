import logging
from typing import Dict, List, Optional, Union
import numpy as np
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    AutoModelForSequenceClassification,
    BertTokenizer,
    BertModel
)
from ..utils.text_processing import preprocess_text, postprocess_text
from ..utils.medical_knowledge import MedicalKnowledgeBase

class ModelEnsemble:
    def __init__(self, config: Dict):
        self.logger = logging.getLogger(__name__)
        self.config = config
        self.models = {}
        self.tokenizers = {}
        self.model_weights = config.get('model_weights', {})
        
    def add_model(self, name: str, model: torch.nn.Module, tokenizer, weight: float = 1.0):
        """Add a model to the ensemble."""
        self.models[name] = model
        self.tokenizers[name] = tokenizer
        self.model_weights[name] = weight
        
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text using the ensemble of models."""
        try:
            outputs = []
            weights = []
            
            for name, model in self.models.items():
                tokenizer = self.tokenizers[name]
                inputs = tokenizer(prompt, return_tensors='pt')
                
                with torch.no_grad():
                    output = model.generate(
                        inputs['input_ids'],
                        **kwargs
                    )
                    
                decoded = tokenizer.decode(output[0], skip_special_tokens=True)
                outputs.append(decoded)
                weights.append(self.model_weights[name])
                
            # Weighted ensemble
            weights = np.array(weights) / sum(weights)
            final_output = self._ensemble_outputs(outputs, weights)
            
            return final_output
            
        except Exception as e:
            self.logger.error(f"Error in model ensemble generation: {str(e)}")
            return ""
            
    def _ensemble_outputs(self, outputs: List[str], weights: np.ndarray) -> str:
        """Combine outputs from multiple models using weighted voting."""
        return outputs[np.argmax(weights)]

class ChatbotModel:
    def __init__(self, config: Dict):
        self.logger = logging.getLogger(__name__)
        self.config = config
        self.knowledge_base = MedicalKnowledgeBase()
        self.ensemble = ModelEnsemble(config)
        
        # Initialize models
        self._initialize_models()
        
    def _initialize_models(self):
        """Initialize all required models."""
        try:
            # Initialize II-Medical-8B
            self._initialize_medical_8b()
            
            # Initialize ClinicalBERT
            self._initialize_clinical_bert()
            
            # Initialize custom model if path provided
            if self.config.get('custom_model_path'):
                self._initialize_custom_model()
                
            self.logger.info("Successfully initialized all models")
        except Exception as e:
            self.logger.error(f"Error initializing models: {str(e)}")
            raise
            
    def _initialize_medical_8b(self):
        """Initialize II-Medical-8B model."""
        try:
            model_name = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForCausalLM.from_pretrained(model_name)
            
            self.ensemble.add_model(
                'medical_8b',
                model,
                tokenizer,
                weight=self.config.get('medical_8b_weight', 0.4)
            )
            
        except Exception as e:
            self.logger.error(f"Error initializing II-Medical-8B: {str(e)}")
            raise
            
    def _initialize_clinical_bert(self):
        """Initialize ClinicalBERT model."""
        try:
            model_name = "emilyalsentzer/Bio_ClinicalBERT"
            tokenizer = BertTokenizer.from_pretrained(model_name)
            model = BertModel.from_pretrained(model_name)
            
            self.ensemble.add_model(
                'clinical_bert',
                model,
                tokenizer,
                weight=self.config.get('clinical_bert_weight', 0.3)
            )
            
        except Exception as e:
            self.logger.error(f"Error initializing ClinicalBERT: {str(e)}")
            raise
            
    def _initialize_custom_model(self):
        """Initialize custom trained model."""
        try:
            model_path = self.config.get('custom_model_path')
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForCausalLM.from_pretrained(model_path)
            
            self.ensemble.add_model(
                'custom',
                model,
                tokenizer,
                weight=self.config.get('custom_model_weight', 0.3)
            )
            
        except Exception as e:
            self.logger.error(f"Error initializing custom model: {str(e)}")
            raise
            
    def generate_summary(self, context: Dict) -> str:
        """Generate a summary of the medical case analysis."""
        try:
            prompt = self._create_summary_prompt(context)
            return self.ensemble.generate(
                prompt,
                max_length=self.config.get('max_length', 512),
                temperature=self.config.get('temperature', 0.7),
                top_p=self.config.get('top_p', 0.9)
            )
        except Exception as e:
            self.logger.error(f"Error generating summary: {str(e)}")
            return "Unable to generate summary at this time."
            
    def explain_decision(self, decision: Dict, context: Dict) -> str:
        """Generate explanation for the decision made by the system."""
        try:
            prompt = self._create_decision_prompt(decision, context)
            return self.ensemble.generate(
                prompt,
                max_length=self.config.get('max_length', 512),
                temperature=self.config.get('temperature', 0.7),
                top_p=self.config.get('top_p', 0.9)
            )
        except Exception as e:
            self.logger.error(f"Error explaining decision: {str(e)}")
            return "Unable to explain decision at this time."
            
    def explain_conditions(self, conditions: List[Dict], context: Dict) -> str:
        """Generate explanation for the identified medical conditions."""
        try:
            prompt = self._create_conditions_prompt(conditions, context)
            return self.ensemble.generate(
                prompt,
                max_length=self.config.get('max_length', 512),
                temperature=self.config.get('temperature', 0.7),
                top_p=self.config.get('top_p', 0.9)
            )
        except Exception as e:
            self.logger.error(f"Error explaining conditions: {str(e)}")
            return "Unable to explain conditions at this time."
            
    def explain_recommendations(self, recommendations: List[Dict], context: Dict) -> str:
        """Generate explanation for the recommended actions."""
        try:
            prompt = self._create_recommendations_prompt(recommendations, context)
            return self.ensemble.generate(
                prompt,
                max_length=self.config.get('max_length', 512),
                temperature=self.config.get('temperature', 0.7),
                top_p=self.config.get('top_p', 0.9)
            )
        except Exception as e:
            self.logger.error(f"Error explaining recommendations: {str(e)}")
            return "Unable to explain recommendations at this time."
            
    def generate_follow_up_questions(self, context: Dict) -> List[str]:
        """Generate relevant follow-up questions based on the analysis."""
        try:
            prompt = self._create_follow_up_prompt(context)
            questions = self.ensemble.generate(
                prompt,
                max_length=self.config.get('max_length', 512),
                temperature=self.config.get('temperature', 0.7),
                top_p=self.config.get('top_p', 0.9)
            )
            return self._parse_questions(questions)
        except Exception as e:
            self.logger.error(f"Error generating follow-up questions: {str(e)}")
            return []
            
    def generate_response(self, input_data: Dict) -> Dict:
        """Generate a response to a user query."""
        try:
            query = input_data.get('query', '')
            context = input_data.get('context', {})
            
            # Preprocess query
            processed_query = preprocess_text(query)
            
            # Prepare prompt
            prompt = self._create_query_prompt(processed_query, context)
            
            # Generate response using ensemble
            response = self.ensemble.generate(
                prompt,
                max_length=self.config.get('max_length', 512),
                temperature=self.config.get('temperature', 0.7),
                top_p=self.config.get('top_p', 0.9)
            )
            
            # Postprocess response
            processed_response = postprocess_text(response)
            
            # Get confidence score
            confidence = self._calculate_confidence(processed_query, processed_response)
            
            # Get sources
            sources = self._get_sources(processed_query, processed_response)
            
            # Generate suggested questions
            suggested_questions = self._generate_suggested_questions(
                processed_query,
                processed_response,
                context
            )
            
            return {
                'text': processed_response,
                'confidence': confidence,
                'sources': sources,
                'suggested_questions': suggested_questions
            }
            
        except Exception as e:
            self.logger.error(f"Error generating response: {str(e)}")
            return {
                'text': 'I apologize, but I encountered an error processing your query.',
                'confidence': 0.0,
                'sources': [],
                'suggested_questions': []
            }
            
    def _create_summary_prompt(self, context: Dict) -> str:
        """Create prompt for summary generation."""
        return f"""Based on the following medical case analysis, provide a clear and concise summary:

Decision: {context.get('decision', {})}
Conditions: {context.get('pattern_matches', [])}
Recommendations: {context.get('recommendations', [])}

Summary:"""
            
    def _create_decision_prompt(self, decision: Dict, context: Dict) -> str:
        """Create prompt for decision explanation."""
        return f"""Explain the following medical decision in clear, non-technical language:

Primary Condition: {decision.get('primary_condition')}
Confidence: {decision.get('confidence')}
Severity: {decision.get('severity')}
Urgency: {decision.get('urgency')}
Supporting Evidence: {decision.get('supporting_evidence', [])}

Explanation:"""
            
    def _create_conditions_prompt(self, conditions: List[Dict], context: Dict) -> str:
        """Create prompt for conditions explanation."""
        return f"""Explain the following medical conditions in clear, non-technical language:

Conditions: {conditions}

Explanation:"""
            
    def _create_recommendations_prompt(self, recommendations: List[Dict], context: Dict) -> str:
        """Create prompt for recommendations explanation."""
        return f"""Explain the following medical recommendations in clear, non-technical language:

Recommendations: {recommendations}

Explanation:"""
            
    def _create_follow_up_prompt(self, context: Dict) -> str:
        """Create prompt for follow-up questions generation."""
        return f"""Based on the following medical case analysis, generate relevant follow-up questions:

Decision: {context.get('decision', {})}
Conditions: {context.get('pattern_matches', [])}
Recommendations: {context.get('recommendations', [])}

Follow-up Questions:"""
            
    def _create_query_prompt(self, query: str, context: Dict) -> str:
        """Create prompt for query response generation."""
        return f"""Based on the following medical case context, answer the user's question:

Context: {context}
Question: {query}

Answer:"""
            
    def _calculate_confidence(self, query: str, response: str) -> float:
        """Calculate confidence score for the generated response."""
        try:
            # Implement confidence calculation logic
            return 0.8  # Placeholder
        except Exception as e:
            self.logger.error(f"Error calculating confidence: {str(e)}")
            return 0.0
            
    def _get_sources(self, query: str, response: str) -> List[Dict]:
        """Get sources for the generated response."""
        try:
            # Implement source retrieval logic
            return []  # Placeholder
        except Exception as e:
            self.logger.error(f"Error getting sources: {str(e)}")
            return []
            
    def _generate_suggested_questions(self,
                                   query: str,
                                   response: str,
                                   context: Dict) -> List[str]:
        """Generate suggested follow-up questions."""
        try:
            # Implement suggested questions generation logic
            return []  # Placeholder
        except Exception as e:
            self.logger.error(f"Error generating suggested questions: {str(e)}")
            return []
            
    def _parse_questions(self, text: str) -> List[str]:
        """Parse and clean generated questions."""
        try:
            # Split text into questions
            questions = text.split('\n')
            
            # Clean questions
            cleaned_questions = [
                q.strip().strip('- ').strip()
                for q in questions
                if q.strip()
            ]
            
            return cleaned_questions
        except Exception as e:
            self.logger.error(f"Error parsing questions: {str(e)}")
            return [] 