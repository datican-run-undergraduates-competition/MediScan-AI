import os
import time
from typing import Dict, List, Optional
import torch
from PIL import Image
import numpy as np
from transformers import pipeline
import logging

logger = logging.getLogger(__name__)

class AnalysisService:
    def __init__(self):
        self.models = {}
        self.load_models()

    def load_models(self):
        """Load AI models for different types of analysis"""
        try:
            # Load image classification model
            self.models["xray"] = pipeline(
                "image-classification",
                model="microsoft/resnet-50",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Load text analysis model
            self.models["report"] = pipeline(
                "text-classification",
                model="distilbert-base-uncased",
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise

    async def analyze_image(self, file_path: str, model_id: Optional[str] = None) -> Dict:
        """Analyze a medical image"""
        try:
            start_time = time.time()
            
            # Load and preprocess image
            image = Image.open(file_path)
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Get predictions
            predictions = self.models["xray"](image)
            
            # Process results
            findings = []
            for pred in predictions:
                findings.append({
                    "type": "abnormality" if pred["label"] != "normal" else "normal",
                    "description": f"Detected {pred['label']} with confidence {pred['score']:.2f}",
                    "confidence": float(pred["score"]),
                    "location": None  # Add location if available
                })
            
            # Generate recommendations
            recommendations = self._generate_recommendations(findings)
            
            processing_time = time.time() - start_time
            
            return {
                "findings": findings,
                "recommendations": recommendations,
                "confidence_scores": {f["description"]: f["confidence"] for f in findings},
                "processing_time": processing_time
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image: {str(e)}")
            raise

    async def analyze_report(self, file_path: str) -> Dict:
        """Analyze a medical report"""
        try:
            start_time = time.time()
            
            # Read report text
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
            
            # Get predictions
            predictions = self.models["report"](text)
            
            # Process results
            findings = []
            for pred in predictions:
                findings.append({
                    "type": "abnormality" if pred["label"] != "normal" else "normal",
                    "description": f"Detected {pred['label']} with confidence {pred['score']:.2f}",
                    "confidence": float(pred["score"]),
                    "location": None
                })
            
            # Generate recommendations
            recommendations = self._generate_recommendations(findings)
            
            processing_time = time.time() - start_time
            
            return {
                "findings": findings,
                "recommendations": recommendations,
                "confidence_scores": {f["description"]: f["confidence"] for f in findings},
                "processing_time": processing_time
            }
            
        except Exception as e:
            logger.error(f"Error analyzing report: {str(e)}")
            raise

    def _generate_recommendations(self, findings: List[Dict]) -> List[str]:
        """Generate recommendations based on findings"""
        recommendations = []
        
        # Add general recommendations
        recommendations.append("Consult with a medical professional for detailed interpretation")
        
        # Add specific recommendations based on findings
        for finding in findings:
            if finding["type"] == "abnormality":
                if finding["confidence"] > 0.8:
                    recommendations.append("Consider immediate follow-up with specialist")
                elif finding["confidence"] > 0.5:
                    recommendations.append("Schedule follow-up appointment")
        
        return recommendations

# Create singleton instance
analysis_service = AnalysisService() 