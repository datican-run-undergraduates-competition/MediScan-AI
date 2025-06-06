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

class ModelManager:
    def __init__(self, config: Dict):
        self.logger = logging.getLogger(__name__)
        self.config = config
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
            
            # Initialize specialized medical task handlers
            self._initialize_medical_handlers()
            
            self.logger.info("Successfully initialized all models")
        except Exception as e:
            self.logger.error(f"Error initializing models: {str(e)}")
            raise
            
    def _initialize_base_models(self):
        """Initialize base models that can be used across tasks."""
        try:
            # Initialize II-Medical-8B
            self._initialize_medical_8b()
            
            # Initialize ClinicalBERT
            self._initialize_clinical_bert()
            
            # Initialize custom model if path provided
            if self.config.get('custom_model_path'):
                self._initialize_custom_model()
                
        except Exception as e:
            self.logger.error(f"Error initializing base models: {str(e)}")
            raise
            
    def _initialize_task_models(self):
        """Initialize models for specific medical tasks."""
        try:
            # Initialize DICOM processing models
            self._initialize_dicom_models()
            
            # Initialize medical scan analysis models
            self._initialize_scan_models()
            
            # Initialize decision engine models
            self._initialize_decision_models()
            
        except Exception as e:
            self.logger.error(f"Error initializing task models: {str(e)}")
            raise
            
    def _initialize_medical_8b(self):
        """Initialize II-Medical-8B model."""
        try:
            model_name = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForCausalLM.from_pretrained(model_name)
            
            self.models['medical_8b'] = model
            self.tokenizers['medical_8b'] = tokenizer
            self.model_weights['medical_8b'] = self.config.get('medical_8b_weight', 0.4)
            
        except Exception as e:
            self.logger.error(f"Error initializing II-Medical-8B: {str(e)}")
            raise
            
    def _initialize_clinical_bert(self):
        """Initialize ClinicalBERT model."""
        try:
            model_name = "emilyalsentzer/Bio_ClinicalBERT"
            tokenizer = BertTokenizer.from_pretrained(model_name)
            model = BertModel.from_pretrained(model_name)
            
            self.models['clinical_bert'] = model
            self.tokenizers['clinical_bert'] = tokenizer
            self.model_weights['clinical_bert'] = self.config.get('clinical_bert_weight', 0.3)
            
        except Exception as e:
            self.logger.error(f"Error initializing ClinicalBERT: {str(e)}")
            raise
            
    def _initialize_custom_model(self):
        """Initialize custom trained model."""
        try:
            model_path = self.config.get('custom_model_path')
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForCausalLM.from_pretrained(model_path)
            
            self.models['custom'] = model
            self.tokenizers['custom'] = tokenizer
            self.model_weights['custom'] = self.config.get('custom_model_weight', 0.3)
            
        except Exception as e:
            self.logger.error(f"Error initializing custom model: {str(e)}")
            raise
            
    def _initialize_dicom_models(self):
        """Initialize models for DICOM processing."""
        try:
            # Initialize DICOM image analysis model
            dicom_model = AutoModelForImageClassification.from_pretrained(
                "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
            )
            self.task_specific_models['dicom_analysis'] = dicom_model
            
            # Initialize DICOM metadata processing model
            metadata_model = AutoModelForSequenceClassification.from_pretrained(
                "emilyalsentzer/Bio_ClinicalBERT"
            )
            self.task_specific_models['dicom_metadata'] = metadata_model
            
        except Exception as e:
            self.logger.error(f"Error initializing DICOM models: {str(e)}")
            raise
            
    def _initialize_scan_models(self):
        """Initialize models for medical scan analysis."""
        try:
            # Initialize scan quality assessment model
            quality_model = AutoModelForImageClassification.from_pretrained(
                "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
            )
            self.task_specific_models['scan_quality'] = quality_model
            
            # Initialize scan analysis model
            analysis_model = AutoModelForImageClassification.from_pretrained(
                "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
            )
            self.task_specific_models['scan_analysis'] = analysis_model
            
        except Exception as e:
            self.logger.error(f"Error initializing scan models: {str(e)}")
            raise
            
    def _initialize_decision_models(self):
        """Initialize models for decision engine."""
        try:
            # Initialize condition classification model
            condition_model = AutoModelForSequenceClassification.from_pretrained(
                "emilyalsentzer/Bio_ClinicalBERT"
            )
            self.task_specific_models['condition_classification'] = condition_model
            
            # Initialize severity assessment model
            severity_model = AutoModelForSequenceClassification.from_pretrained(
                "emilyalsentzer/Bio_ClinicalBERT"
            )
            self.task_specific_models['severity_assessment'] = severity_model
            
        except Exception as e:
            self.logger.error(f"Error initializing decision models: {str(e)}")
            raise
            
    def _initialize_medical_handlers(self):
        """Initialize specialized medical task handlers with advanced models."""
        try:
            # Initialize existing handlers
            self._initialize_radiology_handler()
            self._initialize_pathology_handler()
            self._initialize_clinical_text_handler()
            self._initialize_medical_imaging_handler()
            self._initialize_report_generation_handler()
            self._initialize_medical_qa_handler()
            self._initialize_medical_coding_handler()
            self._initialize_medical_summarization_handler()
            self._initialize_genomics_handler()
            self._initialize_pharmacogenomics_handler()
            self._initialize_clinical_trial_handler()
            self._initialize_medical_literature_handler()
            self._initialize_prescription_handler()
            self._initialize_diagnosis_handler()
            self._initialize_treatment_plan_handler()
            self._initialize_patient_monitoring_handler()
            
            # Initialize new specialized handlers
            self._initialize_emergency_handler()
            self._initialize_pediatric_handler()
            self._initialize_geriatric_handler()
            self._initialize_oncology_handler()
            self._initialize_cardiology_handler()
            self._initialize_neurology_handler()
            self._initialize_psychiatry_handler()
            self._initialize_infectious_disease_handler()
            
        except Exception as e:
            self.logger.error(f"Error initializing medical handlers: {str(e)}")
            raise
            
    def _initialize_radiology_handler(self):
        """Initialize radiology-specific models with advanced models."""
        try:
            # Initialize radiology image analysis model (using advanced medical vision model)
            radiology_model = AutoModelForImageClassification.from_pretrained(
                "microsoft/BiomedVLP-CXR-BERT-general",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['radiology_analysis'] = radiology_model
            
            # Initialize radiology report generation model
            report_model = AutoModelForSeq2SeqLM.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['radiology_report'] = report_model
            
            # Initialize radiology QA model
            qa_model = AutoModelForQuestionAnswering.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['radiology_qa'] = qa_model
            
        except Exception as e:
            self.logger.error(f"Error initializing radiology handler: {str(e)}")
            raise
            
    def _initialize_pathology_handler(self):
        """Initialize pathology-specific models with advanced models."""
        try:
            # Initialize pathology image analysis model
            pathology_model = AutoModelForImageClassification.from_pretrained(
                "microsoft/BiomedVLP-CXR-BERT-general",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['pathology_analysis'] = pathology_model
            
            # Initialize pathology report generation model
            report_model = AutoModelForSeq2SeqLM.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['pathology_report'] = report_model
            
            # Initialize pathology entity recognition model
            ner_model = AutoModelForTokenClassification.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['pathology_ner'] = ner_model
            
        except Exception as e:
            self.logger.error(f"Error initializing pathology handler: {str(e)}")
            raise
            
    def _initialize_clinical_text_handler(self):
        """Initialize clinical text analysis models with advanced models."""
        try:
            # Initialize clinical text analysis model
            text_model = AutoModelForSequenceClassification.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['clinical_text'] = text_model
            
            # Initialize medical entity recognition model
            ner_model = AutoModelForTokenClassification.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['medical_ner'] = ner_model
            
            # Initialize medical relation extraction model
            relation_model = AutoModelForTokenClassification.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['medical_relation'] = relation_model
            
        except Exception as e:
            self.logger.error(f"Error initializing clinical text handler: {str(e)}")
            raise
            
    def _initialize_medical_imaging_handler(self):
        """Initialize medical imaging analysis models with advanced models."""
        try:
            # Initialize medical image feature extractor
            feature_extractor = AutoFeatureExtractor.from_pretrained(
                "microsoft/BiomedVLP-CXR-BERT-general",
                cache_dir=self.cache_dir
            )
            self.feature_extractors['medical_image'] = feature_extractor
            
            # Initialize medical image analysis model
            image_model = AutoModelForImageClassification.from_pretrained(
                "microsoft/BiomedVLP-CXR-BERT-general",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['medical_image'] = image_model
            
            # Initialize medical image segmentation model
            segmentation_model = AutoModelForImageClassification.from_pretrained(
                "microsoft/BiomedVLP-CXR-BERT-general",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['medical_segmentation'] = segmentation_model
            
        except Exception as e:
            self.logger.error(f"Error initializing medical imaging handler: {str(e)}")
            raise
            
    def _initialize_report_generation_handler(self):
        """Initialize medical report generation models."""
        try:
            # Initialize general report generation model
            report_model = AutoModelForSeq2SeqLM.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['report_generation'] = report_model
            
            # Initialize structured report generation model
            structured_model = AutoModelForSeq2SeqLM.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['structured_report'] = structured_model
            
        except Exception as e:
            self.logger.error(f"Error initializing report generation handler: {str(e)}")
            raise
            
    def _initialize_medical_qa_handler(self):
        """Initialize medical question answering models."""
        try:
            # Initialize general medical QA model
            qa_model = AutoModelForQuestionAnswering.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['medical_qa'] = qa_model
            
            # Initialize specialized medical QA model
            specialized_qa_model = AutoModelForQuestionAnswering.from_pretrained(
                "microsoft/BioGPT-large",
                cache_dir=self.cache_dir
            )
            self.task_specific_models['specialized_qa'] = specialized_qa_model
            
        except Exception as e:
            self.logger.error(f"Error initializing medical QA handler: {str(e)}")
            raise
            
    def _initialize_medical_coding_handler(self):
        """Initialize medical coding models."""
        try:
            # Initialize ICD-10 coding model
            icd_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForTokenClassification
            )
            self.task_specific_models['icd_coding'] = icd_model
            
            # Initialize CPT coding model
            cpt_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForTokenClassification
            )
            self.task_specific_models['cpt_coding'] = cpt_model
            
            # Initialize SNOMED CT coding model
            snomed_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForTokenClassification
            )
            self.task_specific_models['snomed_coding'] = snomed_model
            
        except Exception as e:
            self.logger.error(f"Error initializing medical coding handler: {str(e)}")
            raise
            
    def _initialize_medical_summarization_handler(self):
        """Initialize medical summarization models."""
        try:
            # Initialize clinical note summarization model
            note_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSeq2SeqLM
            )
            self.task_specific_models['note_summarization'] = note_model
            
            # Initialize research paper summarization model
            paper_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSeq2SeqLM
            )
            self.task_specific_models['paper_summarization'] = paper_model
            
            # Initialize medical report summarization model
            report_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSeq2SeqLM
            )
            self.task_specific_models['report_summarization'] = report_model
            
        except Exception as e:
            self.logger.error(f"Error initializing medical summarization handler: {str(e)}")
            raise
            
    def _initialize_genomics_handler(self):
        """Initialize genomics analysis models."""
        try:
            # Initialize DNA sequence analysis model
            dna_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForTokenClassification
            )
            self.task_specific_models['dna_analysis'] = dna_model
            
            # Initialize gene expression analysis model
            expression_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['gene_expression'] = expression_model
            
            # Initialize variant calling model
            variant_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForTokenClassification
            )
            self.task_specific_models['variant_calling'] = variant_model
            
        except Exception as e:
            self.logger.error(f"Error initializing genomics handler: {str(e)}")
            raise
            
    def _initialize_pharmacogenomics_handler(self):
        """Initialize pharmacogenomics analysis models."""
        try:
            # Initialize drug-gene interaction model
            interaction_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['drug_gene_interaction'] = interaction_model
            
            # Initialize drug response prediction model
            response_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['drug_response'] = response_model
            
            # Initialize drug metabolism model
            metabolism_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['drug_metabolism'] = metabolism_model
            
        except Exception as e:
            self.logger.error(f"Error initializing pharmacogenomics handler: {str(e)}")
            raise
            
    def _initialize_clinical_trial_handler(self):
        """Initialize clinical trial analysis models."""
        try:
            # Initialize eligibility criteria model
            eligibility_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['eligibility_criteria'] = eligibility_model
            
            # Initialize outcome prediction model
            outcome_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['outcome_prediction'] = outcome_model
            
            # Initialize adverse event analysis model
            adverse_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['adverse_events'] = adverse_model
            
        except Exception as e:
            self.logger.error(f"Error initializing clinical trial handler: {str(e)}")
            raise
            
    def _initialize_medical_literature_handler(self):
        """Initialize medical literature analysis models."""
        try:
            # Initialize paper classification model
            classification_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['paper_classification'] = classification_model
            
            # Initialize citation analysis model
            citation_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['citation_analysis'] = citation_model
            
            # Initialize research trend analysis model
            trend_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['research_trends'] = trend_model
            
        except Exception as e:
            self.logger.error(f"Error initializing medical literature handler: {str(e)}")
            raise
            
    def _initialize_prescription_handler(self):
        """Initialize prescription and medication management models."""
        try:
            # Initialize drug recommendation model
            recommendation_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['drug_recommendation'] = recommendation_model
            
            # Initialize dosage calculation model
            dosage_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['dosage_calculation'] = dosage_model
            
            # Initialize drug interaction checker
            interaction_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['drug_interaction'] = interaction_model
            
            # Initialize contraindication checker
            contraindication_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['contraindication_check'] = contraindication_model
            
            # Initialize prescription validation model
            validation_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['prescription_validation'] = validation_model
            
        except Exception as e:
            self.logger.error(f"Error initializing prescription handler: {str(e)}")
            raise
            
    def _initialize_diagnosis_handler(self):
        """Initialize diagnosis and differential diagnosis models."""
        try:
            # Initialize primary diagnosis model
            diagnosis_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['primary_diagnosis'] = diagnosis_model
            
            # Initialize differential diagnosis model
            differential_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['differential_diagnosis'] = differential_model
            
            # Initialize symptom analysis model
            symptom_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['symptom_analysis'] = symptom_model
            
            # Initialize risk assessment model
            risk_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['risk_assessment'] = risk_model
            
        except Exception as e:
            self.logger.error(f"Error initializing diagnosis handler: {str(e)}")
            raise
            
    def _initialize_treatment_plan_handler(self):
        """Initialize treatment planning and management models."""
        try:
            # Initialize treatment recommendation model
            treatment_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['treatment_recommendation'] = treatment_model
            
            # Initialize treatment response prediction model
            response_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['treatment_response'] = response_model
            
            # Initialize follow-up planning model
            followup_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['followup_planning'] = followup_model
            
            # Initialize treatment adherence model
            adherence_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['treatment_adherence'] = adherence_model
            
        except Exception as e:
            self.logger.error(f"Error initializing treatment plan handler: {str(e)}")
            raise
            
    def _initialize_patient_monitoring_handler(self):
        """Initialize patient monitoring and follow-up models."""
        try:
            # Initialize vital signs monitoring model
            vitals_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['vitals_monitoring'] = vitals_model
            
            # Initialize progress tracking model
            progress_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['progress_tracking'] = progress_model
            
            # Initialize complication detection model
            complication_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['complication_detection'] = complication_model
            
            # Initialize recovery prediction model
            recovery_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['recovery_prediction'] = recovery_model
            
        except Exception as e:
            self.logger.error(f"Error initializing patient monitoring handler: {str(e)}")
            raise
            
    def _initialize_emergency_handler(self):
        """Initialize emergency medicine and critical care models."""
        try:
            # Initialize triage model
            triage_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['emergency_triage'] = triage_model
            
            # Initialize critical care prediction model
            critical_care_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['critical_care_prediction'] = critical_care_model
            
            # Initialize emergency intervention model
            intervention_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['emergency_intervention'] = intervention_model
            
            # Initialize vital signs monitoring model
            vitals_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['emergency_vitals'] = vitals_model
            
        except Exception as e:
            self.logger.error(f"Error initializing emergency handler: {str(e)}")
            raise
            
    def _initialize_pediatric_handler(self):
        """Initialize pediatric medicine models."""
        try:
            # Initialize growth assessment model
            growth_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['pediatric_growth'] = growth_model
            
            # Initialize developmental assessment model
            development_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['developmental_assessment'] = development_model
            
            # Initialize pediatric dosing model
            dosing_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['pediatric_dosing'] = dosing_model
            
            # Initialize vaccination schedule model
            vaccination_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['vaccination_schedule'] = vaccination_model
            
        except Exception as e:
            self.logger.error(f"Error initializing pediatric handler: {str(e)}")
            raise
            
    def _initialize_geriatric_handler(self):
        """Initialize geriatric medicine models."""
        try:
            # Initialize frailty assessment model
            frailty_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['frailty_assessment'] = frailty_model
            
            # Initialize cognitive assessment model
            cognitive_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['cognitive_assessment'] = cognitive_model
            
            # Initialize fall risk assessment model
            fall_risk_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['fall_risk_assessment'] = fall_risk_model
            
            # Initialize polypharmacy assessment model
            polypharmacy_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['polypharmacy_assessment'] = polypharmacy_model
            
        except Exception as e:
            self.logger.error(f"Error initializing geriatric handler: {str(e)}")
            raise
            
    def _initialize_oncology_handler(self):
        """Initialize oncology and cancer care models."""
        try:
            # Initialize cancer staging model
            staging_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['cancer_staging'] = staging_model
            
            # Initialize treatment response prediction model
            response_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['treatment_response'] = response_model
            
            # Initialize side effect prediction model
            side_effects_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['side_effects_prediction'] = side_effects_model
            
            # Initialize survival prediction model
            survival_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['survival_prediction'] = survival_model
            
        except Exception as e:
            self.logger.error(f"Error initializing oncology handler: {str(e)}")
            raise
            
    def _initialize_cardiology_handler(self):
        """Initialize cardiology and cardiovascular models."""
        try:
            # Initialize ECG analysis model
            ecg_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['ecg_analysis'] = ecg_model
            
            # Initialize cardiac risk assessment model
            risk_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['cardiac_risk'] = risk_model
            
            # Initialize heart failure prediction model
            hf_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['heart_failure_prediction'] = hf_model
            
            # Initialize arrhythmia detection model
            arrhythmia_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['arrhythmia_detection'] = arrhythmia_model
            
        except Exception as e:
            self.logger.error(f"Error initializing cardiology handler: {str(e)}")
            raise
            
    def _initialize_neurology_handler(self):
        """Initialize neurology and brain function models."""
        try:
            # Initialize seizure prediction model
            seizure_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['seizure_prediction'] = seizure_model
            
            # Initialize stroke assessment model
            stroke_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['stroke_assessment'] = stroke_model
            
            # Initialize cognitive decline prediction model
            cognitive_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['cognitive_decline'] = cognitive_model
            
            # Initialize neurological symptom analysis model
            symptom_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['neurological_symptoms'] = symptom_model
            
        except Exception as e:
            self.logger.error(f"Error initializing neurology handler: {str(e)}")
            raise
            
    def _initialize_psychiatry_handler(self):
        """Initialize psychiatry and mental health models."""
        try:
            # Initialize depression screening model
            depression_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['depression_screening'] = depression_model
            
            # Initialize anxiety assessment model
            anxiety_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['anxiety_assessment'] = anxiety_model
            
            # Initialize suicide risk assessment model
            suicide_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['suicide_risk'] = suicide_model
            
            # Initialize mental health treatment response model
            treatment_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['mental_health_treatment'] = treatment_model
            
        except Exception as e:
            self.logger.error(f"Error initializing psychiatry handler: {str(e)}")
            raise
            
    def _initialize_infectious_disease_handler(self):
        """Initialize infectious disease and epidemiology models."""
        try:
            # Initialize pathogen identification model
            pathogen_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['pathogen_identification'] = pathogen_model
            
            # Initialize antibiotic resistance prediction model
            resistance_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['antibiotic_resistance'] = resistance_model
            
            # Initialize outbreak prediction model
            outbreak_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['outbreak_prediction'] = outbreak_model
            
            # Initialize treatment effectiveness model
            effectiveness_model = self._load_model_with_quantization(
                "microsoft/BioGPT-large",
                AutoModelForSequenceClassification
            )
            self.task_specific_models['treatment_effectiveness'] = effectiveness_model
            
        except Exception as e:
            self.logger.error(f"Error initializing infectious disease handler: {str(e)}")
            raise
            
    def get_model(self, task: str) -> Union[torch.nn.Module, Dict[str, torch.nn.Module]]:
        """Get model(s) for a specific task."""
        try:
            if task in self.task_specific_models:
                return self.task_specific_models[task]
            elif task == 'ensemble':
                return self.models
            else:
                raise ValueError(f"Unknown task: {task}")
        except Exception as e:
            self.logger.error(f"Error getting model for task {task}: {str(e)}")
            raise
            
    def get_tokenizer(self, model_name: str) -> Optional[AutoTokenizer]:
        """Get tokenizer for a specific model."""
        try:
            return self.tokenizers.get(model_name)
        except Exception as e:
            self.logger.error(f"Error getting tokenizer for model {model_name}: {str(e)}")
            return None
            
    def ensemble_predict(self, task: str, input_data: Dict) -> Dict:
        """Make predictions using advanced ensemble methods."""
        try:
            predictions = []
            weights = []
            confidences = []
            
            # Get all relevant models for the task
            task_models = self._get_task_models(task)
            
            for model_name, model in task_models.items():
                # Make prediction with each model
                prediction = self._make_prediction(model, input_data)
                predictions.append(prediction)
                
                # Calculate model weight based on performance metrics
                weight = self._calculate_model_weight(model_name, task)
                weights.append(weight)
                
                # Calculate prediction confidence
                confidence = self._calculate_prediction_confidence(prediction)
                confidences.append(confidence)
                
            # Apply different ensemble methods based on task type
            if task in ['diagnosis', 'treatment_recommendation']:
                # Use weighted voting with confidence
                final_prediction = self._weighted_voting_with_confidence(
                    predictions, weights, confidences
                )
            elif task in ['risk_assessment', 'prognosis']:
                # Use Bayesian ensemble
                final_prediction = self._bayesian_ensemble(
                    predictions, weights, confidences
                )
            elif task in ['measurement', 'classification']:
                # Use stacking ensemble
                final_prediction = self._stacking_ensemble(
                    predictions, weights, confidences
                )
            else:
                # Use default weighted ensemble
                final_prediction = self._weighted_ensemble(
                    predictions, weights, confidences
                )
                
            return final_prediction
            
        except Exception as e:
            self.logger.error(f"Error in ensemble prediction for task {task}: {str(e)}")
            raise
            
    def _get_task_models(self, task: str) -> Dict[str, torch.nn.Module]:
        """Get all relevant models for a specific task."""
        try:
            models = {}
            
            # Get task-specific models
            if task in self.task_specific_models:
                models[task] = self.task_specific_models[task]
            
            # Get related models based on task type
            if task.startswith('medical_'):
                models.update(self._get_medical_models())
            elif task.startswith('clinical_'):
                models.update(self._get_clinical_models())
            elif task.startswith('imaging_'):
                models.update(self._get_imaging_models())
            
            return models
            
        except Exception as e:
            self.logger.error(f"Error getting task models: {str(e)}")
            raise
            
    def _calculate_model_weight(self, model_name: str, task: str) -> float:
        """Calculate model weight based on performance metrics."""
        try:
            # Get model performance metrics
            metrics = self._get_model_metrics(model_name, task)
            
            # Calculate weight based on multiple factors
            accuracy_weight = metrics.get('accuracy', 0.5)
            f1_weight = metrics.get('f1_score', 0.5)
            reliability_weight = metrics.get('reliability', 0.5)
            
            # Combine weights with task-specific importance
            task_importance = self._get_task_importance(task)
            combined_weight = (
                accuracy_weight * task_importance['accuracy'] +
                f1_weight * task_importance['f1'] +
                reliability_weight * task_importance['reliability']
            )
            
            return combined_weight
            
        except Exception as e:
            self.logger.error(f"Error calculating model weight: {str(e)}")
            raise
            
    def _calculate_prediction_confidence(self, prediction: Dict) -> float:
        """Calculate confidence score for a prediction."""
        try:
            # Get prediction probabilities
            probabilities = prediction.get('probabilities', [])
            if not probabilities:
                return 0.5
            
            # Calculate confidence based on probability distribution
            max_prob = max(probabilities)
            entropy = -sum(p * np.log(p) for p in probabilities if p > 0)
            confidence = max_prob * (1 - entropy)
            
            return confidence
            
        except Exception as e:
            self.logger.error(f"Error calculating prediction confidence: {str(e)}")
            raise
            
    def _weighted_voting_with_confidence(
        self,
        predictions: List[Dict],
        weights: List[float],
        confidences: List[float]
    ) -> Dict:
        """Combine predictions using weighted voting with confidence scores."""
        try:
            # Calculate combined weights
            combined_weights = [
                w * c for w, c in zip(weights, confidences)
            ]
            combined_weights = np.array(combined_weights) / sum(combined_weights)
            
            # Perform weighted voting
            votes = np.zeros_like(predictions[0]['predictions'])
            for pred, weight in zip(predictions, combined_weights):
                votes += weight * np.array(pred['predictions'])
            
            # Get final prediction
            final_prediction = np.argmax(votes, axis=-1)
            confidence = np.max(votes, axis=-1)
            
            return {
                'predictions': final_prediction.tolist(),
                'confidence_scores': confidence.tolist(),
                'ensemble_weights': combined_weights.tolist()
            }
            
        except Exception as e:
            self.logger.error(f"Error in weighted voting: {str(e)}")
            raise
            
    def _bayesian_ensemble(
        self,
        predictions: List[Dict],
        weights: List[float],
        confidences: List[float]
    ) -> Dict:
        """Combine predictions using Bayesian ensemble method."""
        try:
            # Calculate prior probabilities
            priors = np.array(weights) / sum(weights)
            
            # Calculate likelihoods
            likelihoods = np.array(confidences)
            
            # Calculate posterior probabilities
            posteriors = priors * likelihoods
            posteriors = posteriors / sum(posteriors)
            
            # Combine predictions using posterior probabilities
            combined_prediction = np.zeros_like(predictions[0]['predictions'])
            for pred, posterior in zip(predictions, posteriors):
                combined_prediction += posterior * np.array(pred['predictions'])
            
            return {
                'predictions': combined_prediction.tolist(),
                'posterior_probabilities': posteriors.tolist(),
                'ensemble_weights': weights
            }
            
        except Exception as e:
            self.logger.error(f"Error in Bayesian ensemble: {str(e)}")
            raise
            
    def _stacking_ensemble(
        self,
        predictions: List[Dict],
        weights: List[float],
        confidences: List[float]
    ) -> Dict:
        """Combine predictions using stacking ensemble method."""
        try:
            # Prepare features for meta-learner
            features = np.array([pred['predictions'] for pred in predictions])
            
            # Train meta-learner (using a simple weighted average for demonstration)
            meta_weights = np.array(weights) * np.array(confidences)
            meta_weights = meta_weights / sum(meta_weights)
            
            # Make final prediction
            final_prediction = np.average(features, weights=meta_weights, axis=0)
            
            return {
                'predictions': final_prediction.tolist(),
                'meta_weights': meta_weights.tolist(),
                'base_predictions': features.tolist()
            }
            
        except Exception as e:
            self.logger.error(f"Error in stacking ensemble: {str(e)}")
            raise
            
    def _weighted_ensemble(
        self,
        predictions: List[Dict],
        weights: List[float],
        confidences: List[float]
    ) -> Dict:
        """Combine predictions using weighted ensemble method."""
        try:
            # Calculate combined weights
            combined_weights = np.array(weights) * np.array(confidences)
            combined_weights = combined_weights / sum(combined_weights)
            
            # Combine predictions
            combined_prediction = np.zeros_like(predictions[0]['predictions'])
            for pred, weight in zip(predictions, combined_weights):
                combined_prediction += weight * np.array(pred['predictions'])
            
            return {
                'predictions': combined_prediction.tolist(),
                'ensemble_weights': combined_weights.tolist(),
                'confidence_scores': confidences
            }
            
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