"""
API routes for MRI image analysis.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Body
from fastapi.responses import JSONResponse
import json
from datetime import datetime
import uuid

from ...core.security import get_current_active_user
from ...core.database import get_db
from ...ml.inference import inference_engine
from sqlalchemy.orm import Session

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

@router.get("/models")
async def list_mri_models(current_user = Depends(get_current_active_user)):
    """
    List available MRI analysis models.
    """
    # Get all models
    all_models = inference_engine.get_available_models()
    
    # Filter for MRI models based on metadata
    mri_models = {}
    for name, model_info in all_models.items():
        # Check if model is for MRI analysis
        if (model_info.get("info", {}).get("metadata", {}).get("modality", "").lower() == "mri" or
            "mri" in name.lower()):
            mri_models[name] = model_info
    
    return {"models": mri_models}

@router.post("/analyze")
async def analyze_mri(
    file: UploadFile = File(...),
    model_name: str = Form(None),
    preprocessing_params: Optional[str] = Form(None),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Analyze an MRI image using the specified model.
    """
    try:
        # Read image file
        image_content = await file.read()
        
        # Determine model to use - use default if not specified
        if not model_name:
            # Get available models
            all_models = inference_engine.get_available_models()
            mri_models = {
                name: info for name, info in all_models.items()
                if (info.get("info", {}).get("metadata", {}).get("modality", "").lower() == "mri" or
                   "mri" in name.lower())
            }
            
            if not mri_models:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No MRI models available"
                )
            
            # Use the first available model
            model_name = next(iter(mri_models.keys()))
        
        # Parse preprocessing parameters if provided
        preprocessing_config = {}
        if preprocessing_params:
            try:
                preprocessing_config = json.loads(preprocessing_params)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON for preprocessing_params: {preprocessing_params}")
        
        # Run inference
        result = await inference_engine.run_inference(
            model_name=model_name,
            image_data=image_content,
            modality="mri",
            preprocessing_config=preprocessing_config
        )
        
        # Return results
        return result.to_dict()
    
    except Exception as e:
        logger.error(f"Error analyzing MRI image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing MRI: {str(e)}"
        ) 
