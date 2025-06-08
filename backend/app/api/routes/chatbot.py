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
from ...core.database import get_db
from sqlalchemy.orm import Session
from ...models.user import User
from ...models.chat import ChatMessage
from ...core.security import get_current_user
import time
import openai
from ...core.config import settings

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

@router.post("/", response_model=Dict[str, Any])
async def chat_endpoint(
    chat_data: Dict[str, Any] = Body(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process a chat message and return a response
    """
    message = chat_data.get("message", "")
    user_id = chat_data.get("user_id", "guest")
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message is required"
        )
    
    try:
        # Log the message
        logger.info(f"Processing chat message from user {user_id}: {message[:50]}...")
        
        # Process the message
        start_time = time.time()
        
        # Use OpenAI if API key is available, otherwise use a mock response
        if hasattr(settings, "OPENAI_API_KEY") and settings.OPENAI_API_KEY:
            try:
                openai.api_key = settings.OPENAI_API_KEY
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an AI medical assistant that provides helpful, accurate, and ethical information. Always be clear when you don't know something and avoid making up medical facts."},
                        {"role": "user", "content": message}
                    ],
                    max_tokens=500,
                    temperature=0.7
                )
                response_text = response.choices[0].message.content
            except Exception as e:
                logger.error(f"Error with OpenAI API: {e}")
                response_text = generate_mock_response(message)
        else:
            response_text = generate_mock_response(message)
        
        processing_time = time.time() - start_time
        
        # Save the message to the database if user is authenticated
        if current_user:
            try:
                # Save user message
                user_chat_message = ChatMessage(
                    user_id=current_user.id,
                    content=message,
                    is_from_user=True
                )
                db.add(user_chat_message)
                
                # Save AI response
                ai_chat_message = ChatMessage(
                    user_id=current_user.id,
                    content=response_text,
                    is_from_user=False
                )
                db.add(ai_chat_message)
                
                db.commit()
            except Exception as e:
                logger.error(f"Error saving chat messages: {e}")
                db.rollback()
        
        return {
            "response": response_text,
            "processing_time": processing_time
        }
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat message: {str(e)}"
        )

@router.get("/history", response_model=Dict[str, Any])
async def get_chat_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get chat history for the current user
    """
    try:
        chat_messages = db.query(ChatMessage)\
            .filter(ChatMessage.user_id == current_user.id)\
            .order_by(ChatMessage.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        # Convert to response format
        history = []
        for i in range(0, len(chat_messages), 2):
            if i + 1 < len(chat_messages):
                history.append({
                    "user_message": chat_messages[i].content if chat_messages[i].is_from_user else chat_messages[i+1].content,
                    "ai_response": chat_messages[i+1].content if not chat_messages[i+1].is_from_user else chat_messages[i].content,
                    "timestamp": chat_messages[i].created_at.isoformat()
                })
        
        return {
            "history": history,
            "total": db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).count() // 2
        }
        
    except Exception as e:
        logger.error(f"Error retrieving chat history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving chat history: {str(e)}"
        )

def generate_mock_response(message: str) -> str:
    """Generate a mock response based on the message"""
    message_lower = message.lower()
    
    if "headache" in message_lower:
        return "Headaches can be caused by various factors including stress, dehydration, lack of sleep, or more serious conditions. If you're experiencing severe or persistent headaches, it's important to consult with a healthcare professional."
    
    elif "blood pressure" in message_lower:
        return "Normal blood pressure is generally considered to be below 120/80 mmHg. High blood pressure (hypertension) is generally defined as 130/80 mmHg or higher. Regular monitoring and lifestyle changes such as reduced sodium intake, regular exercise, and stress management can help manage blood pressure."
    
    elif "covid" in message_lower or "coronavirus" in message_lower:
        return "COVID-19 symptoms may include fever, cough, shortness of breath, fatigue, body aches, loss of taste or smell, sore throat, and congestion. If you're experiencing symptoms, consider getting tested and follow isolation guidelines to prevent spreading the virus to others."
    
    elif "diet" in message_lower or "nutrition" in message_lower:
        return "A balanced diet typically includes a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. The specific dietary needs vary from person to person based on factors like age, gender, activity level, and health conditions. Consider consulting with a registered dietitian for personalized nutrition advice."
    
    elif "exercise" in message_lower:
        return "Regular physical activity has numerous health benefits, including improved cardiovascular health, better mood, weight management, and reduced risk of chronic diseases. Adults should aim for at least 150 minutes of moderate-intensity or 75 minutes of vigorous-intensity aerobic activity per week, along with muscle-strengthening activities on 2 or more days per week."
    
    elif "sleep" in message_lower:
        return "Most adults need 7-9 hours of sleep per night. Poor sleep can affect your physical and mental health, including your immune function, weight, and risk for chronic conditions. If you're having trouble sleeping, consider establishing a regular sleep schedule, creating a restful environment, and limiting screen time before bed."
    
    else:
        return "I understand you're asking about \"" + message + "\". As an AI medical assistant, I can provide general information, but for specific medical advice, please consult with a healthcare professional who can provide personalized recommendations based on your individual health situation." 
