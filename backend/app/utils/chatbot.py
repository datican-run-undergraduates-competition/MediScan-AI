"""
Chatbot utilities for MediScan AI.
"""

import os
import logging
from typing import Dict, Any, List, Optional, Tuple
import json
import re
import time
import random
from datetime import datetime
import uuid

# Setup logging
logger = logging.getLogger(__name__)

# Define intents and responses
DEFAULT_INTENTS = {
    "greeting": {
        "patterns": [
            "hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening"
        ],
        "responses": [
            "Hello! How can I assist you with MediScan AI today?",
            "Hi there! I'm here to help with your medical imaging needs.",
            "Hello! I'm the MediScan AI assistant. How can I help you?"
        ]
    },
    "goodbye": {
        "patterns": [
            "bye", "goodbye", "see you", "see you later", "good night", "farewell"
        ],
        "responses": [
            "Goodbye! Feel free to return if you have more questions.",
            "Have a great day! Come back anytime.",
            "Goodbye! Take care."
        ]
    },
    "thanks": {
        "patterns": [
            "thank you", "thanks", "appreciate it", "thank you so much", "thanks a lot"
        ],
        "responses": [
            "You're welcome! Is there anything else I can help with?",
            "Happy to help! Let me know if you need anything else.",
            "My pleasure! Don't hesitate to ask if you have more questions."
        ]
    },
    "about": {
        "patterns": [
            "what is mediscan", "what is mediscan ai", "tell me about mediscan", 
            "what does this app do", "what can this app do", "about this system"
        ],
        "responses": [
            "MediScan AI is a secure platform for medical imaging analysis. It helps healthcare professionals detect diseases early through AI-powered analysis of X-rays, MRIs, and CT scans.",
            "MediScan AI analyzes medical images like X-rays, MRIs, and CT scans to assist healthcare professionals in early disease detection and diagnosis.",
            "This platform provides AI-powered analysis of medical images to help healthcare professionals make more accurate diagnoses."
        ]
    },
    "help": {
        "patterns": [
            "help", "how to use", "instructions", "guide me", "how does this work", "how to"
        ],
        "responses": [
            "To use MediScan AI: 1) Log in, 2) Upload your medical image, 3) Select the analysis model, 4) Review the results. Would you like more specific help?",
            "You can upload medical images and analyze them using our AI models. Is there a specific feature you need help with?",
            "MediScan AI allows you to analyze medical images. You can upload an image and get AI-powered analysis. What would you like to know more about?"
        ]
    },
    "upload_image": {
        "patterns": [
            "how to upload", "upload image", "upload scan", "add image", "add scan", "upload a file"
        ],
        "responses": [
            "To upload an image: Go to the dashboard, click on 'Upload Image', select your file, choose the image type (X-ray, MRI, CT), then click 'Upload'.",
            "You can upload images from the main dashboard. Click the 'Upload' button, select your file, and follow the prompts.",
            "Image uploading is simple: Navigate to the upload section, select your file, choose the image type, and submit."
        ]
    },
    "analyze_image": {
        "patterns": [
            "how to analyze", "analyze image", "run analysis", "scan image", "detect disease",
            "process image", "examine image"
        ],
        "responses": [
            "To analyze an image: After uploading, select the image from your dashboard, click 'Analyze', choose the appropriate AI model, and click 'Run Analysis'.",
            "Once your image is uploaded, you can analyze it by selecting it and clicking the 'Analyze' button. Choose a model suited for your image type.",
            "Analysis is straightforward: Select your uploaded image, choose 'Analyze', select the appropriate AI model, and view the results."
        ]
    },
    "supported_images": {
        "patterns": [
            "what images", "image types", "supported images", "what scans", "scan types",
            "supported scans", "what kind of images", "what kind of scans"
        ],
        "responses": [
            "MediScan AI supports three types of medical images: X-rays, MRI scans, and CT scans.",
            "We currently support X-ray, MRI, and CT scan images for analysis.",
            "The platform can analyze X-rays, MRIs, and CT scans using specialized AI models for each type."
        ]
    },
    "models": {
        "patterns": [
            "what models", "ai models", "available models", "which models", "model types",
            "tell me about models", "what algorithms"
        ],
        "responses": [
            "MediScan AI uses specialized models for each image type. X-ray models detect conditions like pneumonia and tuberculosis. MRI models focus on neurological conditions. CT models detect abnormalities in various body parts.",
            "Our platform includes different AI models for X-rays, MRIs, and CT scans, each trained on specific medical conditions and anatomical regions.",
            "We have various models for different medical imaging modalities, optimized for specific diagnostic tasks and body regions."
        ]
    },
    "accuracy": {
        "patterns": [
            "how accurate", "accuracy", "precision", "reliable", "reliability", "how good is it",
            "confidence", "error rate", "how trustworthy"
        ],
        "responses": [
            "MediScan AI models achieve high accuracy rates, but they're designed to assist healthcare professionals, not replace them. The system provides confidence scores with each analysis.",
            "Our models are highly accurate, but they're intended as a diagnostic aid. Always consult with a healthcare professional for final diagnosis.",
            "The system achieves strong accuracy in identifying various conditions, but it's designed as a clinical decision support tool, not a replacement for medical expertise."
        ]
    },
    "security": {
        "patterns": [
            "how secure", "security", "data protection", "privacy", "confidential",
            "data security", "protected", "encryption"
        ],
        "responses": [
            "MediScan AI incorporates comprehensive security measures including end-to-end encryption, secure authentication, and strict data access controls to protect patient information.",
            "Security is a top priority. We use encryption, secure authentication, and follow healthcare data protection standards to keep your data safe.",
            "The platform includes multiple security layers: encrypted data storage, secure authentication, access controls, and comprehensive audit logging."
        ]
    },
    "fallback": {
        "patterns": [],
        "responses": [
            "I'm not sure I understand. Could you rephrase that or ask about a specific feature of MediScan AI?",
            "I don't have information about that. Would you like to know about uploading images, analysis features, or something else?",
            "I'm still learning and don't have an answer for that. Can I help you with using MediScan AI instead?"
        ]
    }
}

class Intent:
    """Class representing a conversational intent"""
    
    def __init__(self, name: str, patterns: List[str], responses: List[str]):
        self.name = name
        self.patterns = patterns
        self.responses = responses
    
    def matches(self, text: str) -> bool:
        """Check if the text matches this intent"""
        text = text.lower()
        
        # Check for exact matches in patterns
        for pattern in self.patterns:
            if pattern.lower() in text:
                return True
        
        return False
    
    def get_response(self) -> str:
        """Get a random response for this intent"""
        return random.choice(self.responses)

class ChatBot:
    """Simple rule-based chatbot for MediScan AI"""
    
    def __init__(self):
        self.intents = []
        self.conversation_history = {}
        self.load_default_intents()
    
    def load_default_intents(self) -> None:
        """Load default intents"""
        for intent_name, intent_data in DEFAULT_INTENTS.items():
            self.intents.append(Intent(
                name=intent_name,
                patterns=intent_data["patterns"],
                responses=intent_data["responses"]
            ))
    
    def load_intents_from_file(self, file_path: str) -> None:
        """Load intents from a JSON file"""
        try:
            with open(file_path, 'r') as f:
                intents_data = json.load(f)
            
            # Clear existing intents
            self.intents = []
            
            # Load intents from file
            for intent_name, intent_data in intents_data.items():
                self.intents.append(Intent(
                    name=intent_name,
                    patterns=intent_data.get("patterns", []),
                    responses=intent_data.get("responses", ["I don't know what to say."])
                ))
                
            logger.info(f"Loaded {len(self.intents)} intents from {file_path}")
        except Exception as e:
            logger.error(f"Error loading intents from file: {e}")
    
    def get_intent(self, text: str) -> Intent:
        """
        Determine the intent of the user's message
        
        Args:
            text: User's message
            
        Returns:
            Matching intent or fallback intent
        """
        # Check all intents for a match
        for intent in self.intents:
            if intent.name != "fallback" and intent.matches(text):
                return intent
        
        # Return fallback intent if no match found
        for intent in self.intents:
            if intent.name == "fallback":
                return intent
        
        # If no fallback intent, create one
        return Intent(
            name="fallback",
            patterns=[],
            responses=["I'm not sure how to respond to that."]
        )
    
    def get_response(self, text: str, user_id: str) -> str:
        """
        Get a response to the user's message
        
        Args:
            text: User's message
            user_id: User identifier for conversation tracking
            
        Returns:
            Chatbot response
        """
        # Create conversation entry if it doesn't exist
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        
        # Add user message to history
        self.conversation_history[user_id].append({
            "role": "user",
            "message": text,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Get intent and response
        intent = self.get_intent(text)
        response = intent.get_response()
        
        # Add bot response to history
        self.conversation_history[user_id].append({
            "role": "bot",
            "message": response,
            "intent": intent.name,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return response
    
    def get_conversation_history(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get conversation history for a user
        
        Args:
            user_id: User identifier
            
        Returns:
            List of conversation messages
        """
        return self.conversation_history.get(user_id, [])
    
    def clear_conversation_history(self, user_id: str) -> None:
        """
        Clear conversation history for a user
        
        Args:
            user_id: User identifier
        """
        if user_id in self.conversation_history:
            self.conversation_history[user_id] = []

# Create singleton instance
chatbot = ChatBot() 
