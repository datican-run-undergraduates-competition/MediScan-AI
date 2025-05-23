"""
API routes for chatbot interface.
"""

import os
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, Body
from fastapi.responses import JSONResponse
import json
from datetime import datetime
import uuid

from ...core.security import get_current_active_user
from ...utils.chatbot import chatbot
from ...utils.speech import text_to_speech

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

@router.post("/message")
async def send_message(
    message: str = Body(..., embed=True),
    voice_response: bool = Body(False, embed=True),
    current_user = Depends(get_current_active_user)
):
    """
    Send a message to the chatbot and get a response.
    
    Args:
        message: User's message
        voice_response: Whether to include a voice response
    """
    try:
        # Get user ID from authentication
        user_id = str(current_user["id"])
        
        # Get response from chatbot
        response = chatbot.get_response(message, user_id)
        
        # Prepare result
        result = {
            "success": True,
            "message": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add voice response if requested
        if voice_response:
            success, audio_data = text_to_speech.text_to_speech(response)
            if success:
                import base64
                result["voice_response"] = base64.b64encode(audio_data).decode('utf-8')
                result["voice_content_type"] = "audio/mp3"
        
        return result
    
    except Exception as e:
        logger.error(f"Error in chatbot: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@router.get("/history")
async def get_conversation_history(
    current_user = Depends(get_current_active_user)
):
    """
    Get conversation history for the current user.
    """
    try:
        # Get user ID from authentication
        user_id = str(current_user["id"])
        
        # Get conversation history
        history = chatbot.get_conversation_history(user_id)
        
        return {
            "success": True,
            "history": history
        }
    
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversation history: {str(e)}"
        )

@router.post("/clear")
async def clear_conversation_history(
    current_user = Depends(get_current_active_user)
):
    """
    Clear conversation history for the current user.
    """
    try:
        # Get user ID from authentication
        user_id = str(current_user["id"])
        
        # Clear conversation history
        chatbot.clear_conversation_history(user_id)
        
        return {
            "success": True,
            "message": "Conversation history cleared"
        }
    
    except Exception as e:
        logger.error(f"Error clearing conversation history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing conversation history: {str(e)}"
        ) 
