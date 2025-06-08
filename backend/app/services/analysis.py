# Hello World
import os
import time
from typing import Dict, List, Optional, Any, Union
import torch
from PIL import Image
import numpy as np
from transformers import pipeline, AutoModelForImageClassification, AutoFeatureExtractor
import logging
import random
from ..core.config import settings
import json
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models.user import User
from ..models.analysis import Analysis
from ..ml.analysis.advanced_medical_analyzer import AdvancedMedicalAnalyzer
from ..ml.analysis.medical_case_processor import MedicalCaseProcessor
from ..ml.analysis.pattern_matcher import PatternMatcher

logger = logging.getLogger(__name__)

class AnalysisService:
    """Service class for handling medical analysis operations"""
    
    def __init__(self):
        """Initialize analysis service with required components"""
        self.advanced_analyzer = AdvancedMedicalAnalyzer()
        self.case_processor = MedicalCaseProcessor()
        self.pattern_matcher = PatternMatcher()
        self.models = {}
        self.online_mode = not settings.USE_MOCK_MODELS  # Use setting from config
        self.load_models()
        logger.info("Analysis service initialized")

    def load_models(self):
        """Load AI models for different types of analysis"""
        try:
            if self.online_mode:
                # Try to load models if online mode is enabled
                try:
                    # Set up device
                    device = 0 if torch.cuda.is_available() else -1
                    
                    # Load medical imaging models using HuggingFace token
                    model_ids = {
                        "xray": settings.HF_XRAY_MODEL,
                        "mri": settings.HF_MRI_MODEL,
                        "ct": settings.HF_CT_MODEL
                    }
                    
                    for model_type, model_id in model_ids.items():
                        try:
                            # Use token if available
                            if settings.HF_TOKEN:
                            self.models[model_type] = pipeline(
                                "image-classification",
                                model=model_id,
                                    device=device,
                                    token=settings.HF_TOKEN
                                )
                            else:
                                # Fallback to public models if no token
                                self.models[model_type] = pipeline(
                                    "image-classification",
                                    model="microsoft/resnet-50",  # Fallback to public model
                                device=device
                            )
                            logger.info(f"Loaded {model_type} model successfully")
                        except Exception as e:
                            logger.error(f"Error loading {model_type} model: {str(e)}")
                    
                    # Load text analysis model
                    try:
                        self.models["report"] = pipeline(
                            "text-classification",
                            model="distilbert-base-uncased",
                            device=device
                        )
                        logger.info("Loaded report analysis model successfully")
                    except Exception as e:
                        logger.error(f"Error loading report model: {str(e)}")
                    
                    if not self.models:
                        logger.warning("No models loaded, falling back to mock mode")
                        self.online_mode = False
                    
                except Exception as e:
                    logger.warning(f"Error initializing models, falling back to mock mode: {str(e)}")
                    self.online_mode = False
            
            if not self.online_mode:
                logger.info("Using mock mode for model predictions")
                
        except Exception as e:
            logger.error(f"Error in model initialization: {str(e)}")
            self.online_mode = False

    async def process_text(self, text: str, analysis_type: str = "general") -> Dict[str, Any]:
        """
        Process medical text and return analysis results
        
        Args:
            text: The medical text to analyze
            analysis_type: The type of analysis to perform (general, radiology, pathology, etc.)
            
        Returns:
            Dict containing analysis results
        """
        try:
            logger.info(f"Processing {analysis_type} text analysis: {text[:50]}...")
            
            # Use appropriate analysis method based on type
            if analysis_type == "radiology":
                results = self.advanced_analyzer.analyze_radiology_text(text)
            elif analysis_type == "pathology":
                results = self.advanced_analyzer.analyze_pathology_text(text)
            else:
                # Default general analysis
                results = self.advanced_analyzer.analyze_medical_text(text)
                
            # Enhance results with pattern matching
            patterns = self.pattern_matcher.identify_patterns(text)
            
            # Process the complete case
            case_results = self.case_processor.process_case(text)
            
            # Combine all results
            complete_results = {
                "primary_analysis": results,
                "identified_patterns": patterns,
                "case_processing": case_results,
                "analysis_type": analysis_type,
                "text_length": len(text)
            }
            
            return complete_results
            
        except Exception as e:
            logger.error(f"Error in text analysis: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Analysis processing error: {str(e)}"
            )
    
    async def process_image(self, 
                           image_path: str, 
                           image_type: str,
                           additional_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process medical images and return analysis results
        
        Args:
            image_path: Path to the image file
            image_type: Type of medical image (xray, mri, ct, etc.)
            additional_context: Optional additional context for the analysis
            
        Returns:
            Dict containing analysis results
        """
        try:
            logger.info(f"Processing {image_type} image analysis for {image_path}")
            
            if not os.path.exists(image_path):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Image file not found: {image_path}"
                )
            
            # Select appropriate analysis method based on image type
            if image_type == "xray":
                results = self.advanced_analyzer.analyze_xray(image_path)
            elif image_type == "mri":
                results = self.advanced_analyzer.analyze_mri(image_path)
            elif image_type == "ct":
                results = self.advanced_analyzer.analyze_ct_scan(image_path)
            else:
                results = self.advanced_analyzer.analyze_medical_image(image_path)
            
            # Process any additional context if provided
            context_results = {}
            if additional_context:
                context_text = json.dumps(additional_context)
                context_results = self.pattern_matcher.identify_patterns(context_text)
            
            complete_results = {
                "image_analysis": results,
                "context_analysis": context_results,
                "image_type": image_type,
                "file_path": image_path
            }
            
            return complete_results
            
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error in image analysis: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image processing error: {str(e)}"
            )
    
    async def save_analysis(self, 
                           user_id: int, 
                           analysis_data: Dict[str, Any],
                           analysis_type: str,
                           db: Session) -> Analysis:
        """
        Save analysis results to the database
        
        Args:
            user_id: ID of the user who requested the analysis
            analysis_data: Analysis results to save
            analysis_type: Type of analysis performed
            db: Database session
            
        Returns:
            Created Analysis model instance
        """
        try:
            # Create new analysis record
            analysis = Analysis(
                user_id=user_id,
                analysis_type=analysis_type,
                results=analysis_data
            )
            
            # Add and commit to database
            db.add(analysis)
            db.commit()
            db.refresh(analysis)
            
            logger.info(f"Analysis saved for user {user_id}, analysis ID: {analysis.id}")
            return analysis
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving analysis: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save analysis: {str(e)}"
            )
    
    async def get_user_analyses(self, 
                              user_id: int,
                              skip: int = 0,
                              limit: int = 100,
                              db: Session) -> List[Analysis]:
        """
        Retrieve analysis history for a user
        
        Args:
            user_id: ID of the user
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            db: Database session
            
        Returns:
            List of Analysis model instances
        """
        try:
            analyses = db.query(Analysis)\
                        .filter(Analysis.user_id == user_id)\
                        .order_by(Analysis.created_at.desc())\
                        .offset(skip)\
                        .limit(limit)\
                        .all()
                        
            return analyses
            
        except Exception as e:
            logger.error(f"Error retrieving analyses for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve analyses: {str(e)}"
            )
    
    async def get_analysis_by_id(self, analysis_id: int, user_id: int, db: Session) -> Analysis:
        """
        Retrieve a specific analysis by ID
        
        Args:
            analysis_id: ID of the analysis to retrieve
            user_id: ID of the user requesting the analysis
            db: Database session
            
        Returns:
            Analysis model instance
        """
        try:
            analysis = db.query(Analysis)\
                        .filter(Analysis.id == analysis_id)\
                        .first()
                        
            if not analysis:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Analysis with ID {analysis_id} not found"
                )
                
            # Check if the analysis belongs to the user
            if analysis.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to access this analysis"
                )
                
            return analysis
            
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error retrieving analysis {analysis_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve analysis: {str(e)}"
            )
            
    async def delete_analysis(self, analysis_id: int, user_id: int, db: Session) -> bool:
        """
        Delete an analysis record
        
        Args:
            analysis_id: ID of the analysis to delete
            user_id: ID of the user requesting deletion
            db: Database session
            
        Returns:
            Boolean indicating success
        """
        try:
            analysis = await self.get_analysis_by_id(analysis_id, user_id, db)
            
            # Delete the record
            db.delete(analysis)
            db.commit()
            
            logger.info(f"Analysis {analysis_id} deleted by user {user_id}")
            return True
            
        except HTTPException as he:
            raise he
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting analysis {analysis_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete analysis: {str(e)}"
            )

# Create singleton instance
analysis_service = AnalysisService() 