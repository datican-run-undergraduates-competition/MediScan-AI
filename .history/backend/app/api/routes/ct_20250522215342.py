"""
API routes for CT scan analysis.
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
async def list_ct_models(current_user = Depends(get_current_active_user)):
    """
    List available CT scan analysis models.
    """
    # Get all models
    all_models = inference_engine.get_available_models()
    
    # Filter for CT models based on metadata
    ct_models = {}
    for name, model_info in all_models.items():
        # Check if model is for CT analysis
        if (model_info.get("info", {}).get("metadata", {}).get("modality", "").lower() == "ct" or
            "ct" in name.lower()):
            ct_models[name] = model_info
    
    return {"models": ct_models}

@router.post("/analyze")
async def analyze_ct(
    file: UploadFile = File(...),
    model_name: str = Form(None),
    preprocessing_params: Optional[str] = Form(None),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Analyze a CT scan using the specified model.
    """
    try:
        # Read image file
        image_content = await file.read()
        
        # Determine model to use - use default if not specified
        if not model_name:
            # Get available models
            all_models = inference_engine.get_available_models()
            ct_models = {
                name: info for name, info in all_models.items()
                if (info.get("info", {}).get("metadata", {}).get("modality", "").lower() == "ct" or
                   "ct" in name.lower())
            }
            
            if not ct_models:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No CT scan models available"
                )
            
            # Use the first available model
            model_name = next(iter(ct_models.keys()))
        
        # Parse preprocessing parameters if provided
        preprocessing_config = {}
        if preprocessing_params:
            try:
                preprocessing_config = json.loads(preprocessing_params)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON for preprocessing_params: {preprocessing_params}")
        
        # Apply default windowing for CT if not specified
        if "window_center" not in preprocessing_config or "window_width" not in preprocessing_config:
            # Default to lung window
            preprocessing_config["window_center"] = preprocessing_config.get("window_center", 40)
            preprocessing_config["window_width"] = preprocessing_config.get("window_width", 400)
        
        # Run inference
        result = await inference_engine.run_inference(
            model_name=model_name,
            image_data=image_content,
            modality="ct",
            preprocessing_config=preprocessing_config
        )
        
        # Return results
        return result.to_dict()
    
    except Exception as e:
        logger.error(f"Error analyzing CT scan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing CT scan: {str(e)}"
        ) 
