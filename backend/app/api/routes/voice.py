from fastapi import APIRouter, Depends, HTTPException, status, Body
from typing import Dict, Any, Optional
from ...core.database import get_db
from sqlalchemy.orm import Session
from ...models.user import User
from ...core.security import get_current_user
import logging
import time
import openai
import os
from ...core.config import settings
from ...services.analysis import AnalysisService

router = APIRouter()
logger = logging.getLogger(__name__)

analysis_service = AnalysisService()

@router.post("/query", response_model=Dict[str, Any])
async def process_voice_query(
    query_data: Dict[str, Any] = Body(...),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process a voice query and return a response
    """
    query = query_data.get("query", "")
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query is required"
        )
    
    try:
        # Log the query
        logger.info(f"Processing voice query: {query[:50]}...")
        
        # Process the query
        start_time = time.time()
        
        # Use OpenAI if API key is available, otherwise use a mock response
        if hasattr(settings, "OPENAI_API_KEY") and settings.OPENAI_API_KEY:
            try:
                openai.api_key = settings.OPENAI_API_KEY
                response = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an AI medical assistant that provides helpful, accurate, and ethical information. Always be clear when you don't know something and avoid making up medical facts."},
                        {"role": "user", "content": query}
                    ],
                    max_tokens=500,
                    temperature=0.7
                )
                response_text = response.choices[0].message.content
            except Exception as e:
                logger.error(f"Error with OpenAI API: {e}")
                response_text = generate_mock_response(query)
        else:
            response_text = generate_mock_response(query)
        
        processing_time = time.time() - start_time
        
        # Save the query to the database if user is authenticated
        if current_user:
            # Implementation for saving voice interaction history
            pass
        
        return {
            "response": response_text,
            "processing_time": processing_time
        }
        
    except Exception as e:
        logger.error(f"Error processing voice query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing voice query: {str(e)}"
        )

def generate_mock_response(query: str) -> str:
    """Generate a mock response based on the query"""
    query_lower = query.lower()
    
    if "headache" in query_lower:
        return "Headaches can be caused by various factors including stress, dehydration, lack of sleep, or more serious conditions. If you're experiencing severe or persistent headaches, it's important to consult with a healthcare professional."
    
    elif "blood pressure" in query_lower:
        return "Normal blood pressure is generally considered to be below 120/80 mmHg. High blood pressure (hypertension) is generally defined as 130/80 mmHg or higher. Regular monitoring and lifestyle changes such as reduced sodium intake, regular exercise, and stress management can help manage blood pressure."
    
    elif "covid" in query_lower or "coronavirus" in query_lower:
        return "COVID-19 symptoms may include fever, cough, shortness of breath, fatigue, body aches, loss of taste or smell, sore throat, and congestion. If you're experiencing symptoms, consider getting tested and follow isolation guidelines to prevent spreading the virus to others."
    
    elif "diet" in query_lower or "nutrition" in query_lower:
        return "A balanced diet typically includes a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. The specific dietary needs vary from person to person based on factors like age, gender, activity level, and health conditions. Consider consulting with a registered dietitian for personalized nutrition advice."
    
    elif "exercise" in query_lower:
        return "Regular physical activity has numerous health benefits, including improved cardiovascular health, better mood, weight management, and reduced risk of chronic diseases. Adults should aim for at least 150 minutes of moderate-intensity or 75 minutes of vigorous-intensity aerobic activity per week, along with muscle-strengthening activities on 2 or more days per week."
    
    elif "sleep" in query_lower:
        return "Most adults need 7-9 hours of sleep per night. Poor sleep can affect your physical and mental health, including your immune function, weight, and risk for chronic conditions. If you're having trouble sleeping, consider establishing a regular sleep schedule, creating a restful environment, and limiting screen time before bed."
    
    else:
        return "I understand you're asking about \"" + query + "\". As an AI medical assistant, I can provide general information, but for specific medical advice, please consult with a healthcare professional who can provide personalized recommendations based on your individual health situation." 