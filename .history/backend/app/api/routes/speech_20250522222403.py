"""
API routes for speech recognition and synthesis.
"""

import os
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Query
from fastapi.responses import JSONResponse, StreamingResponse
import json
import io
import base64

from ...core.security import get_current_active_user
from ...utils.speech import speech_to_text, text_to_speech

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

@router.post("/recognize")
async def recognize_speech(
    file: UploadFile = File(...),
    language: str = Form("en-US"),
    current_user = Depends(get_current_active_user)
):
    """
    Convert speech audio to text.
    
    Accepts audio file (WAV format) and returns the recognized text.
    """
    try:
        # Read audio file
        audio_content = await file.read()
        
        # Process audio with speech recognition
        success, result = speech_to_text.audio_to_text(audio_content, language=language)
        
        if success:
            return {"success": True, "text": result}
        else:
            return {"success": False, "error": result}
    
    except Exception as e:
        logger.error(f"Error in speech recognition: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing speech: {str(e)}"
        )

@router.post("/synthesize")
async def synthesize_speech(
    text: str = Form(...),
    language: str = Form("en"),
    output_format: str = Form("mp3"),
    current_user = Depends(get_current_active_user)
):
    """
    Convert text to speech.
    
    Returns audio file as downloadable content.
    """
    try:
        # Convert text to speech
        success, result = text_to_speech.text_to_speech(text, language=language)
        
        if not success:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"success": False, "error": result}
            )
        
        # Return audio file
        return StreamingResponse(
            io.BytesIO(result),
            media_type=f"audio/{output_format}",
            headers={"Content-Disposition": f"attachment; filename=speech.{output_format}"}
        )
    
    except Exception as e:
        logger.error(f"Error in speech synthesis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating speech: {str(e)}"
        )

@router.post("/synthesize/base64")
async def synthesize_speech_base64(
    text: str = Form(...),
    language: str = Form("en"),
    current_user = Depends(get_current_active_user)
):
    """
    Convert text to speech and return as base64 encoded string.
    
    Useful for web clients that need to play audio directly.
    """
    try:
        # Convert text to speech
        success, result = text_to_speech.text_to_speech(text, language=language)
        
        if not success:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"success": False, "error": result}
            )
        
        # Encode as base64
        audio_base64 = base64.b64encode(result).decode('utf-8')
        
        return {
            "success": True,
            "audio_data": audio_base64,
            "content_type": "audio/mp3"
        }
    
    except Exception as e:
        logger.error(f"Error in speech synthesis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating speech: {str(e)}"
        ) 
