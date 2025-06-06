from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class AnalysisRequest(BaseModel):
    patient_data: Dict = Field(..., description="Patient demographic and history data")
    scan_data: Dict = Field(..., description="Medical imaging scan data")
    lab_results: Optional[Dict] = Field(None, description="Laboratory test results")
    clinical_notes: Optional[Dict] = Field(None, description="Clinical notes and observations")

class AnalysisResponse(BaseModel):
    success: bool = Field(..., description="Whether the analysis was successful")
    data: Dict = Field(..., description="Analysis results")
    message: str = Field(..., description="Response message")

class ErrorResponse(BaseModel):
    success: bool = Field(False, description="Always false for error responses")
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Detailed error information")

class PatternMatch(BaseModel):
    condition: str = Field(..., description="Matched medical condition")
    similarity_score: float = Field(..., description="Similarity score")
    matched_patterns: List[str] = Field(..., description="Matched clinical patterns")
    confidence_factors: Dict[str, float] = Field(..., description="Confidence factors")

class PrimaryDiagnosis(BaseModel):
    condition: str = Field(..., description="Primary diagnosis")
    confidence: float = Field(..., description="Confidence score")
    severity: str = Field(..., description="Severity level")
    urgency_level: str = Field(..., description="Urgency level")

class DifferentialDiagnosis(BaseModel):
    condition: str = Field(..., description="Differential diagnosis")
    confidence: float = Field(..., description="Confidence score")

class AnalysisResult(BaseModel):
    primary_diagnosis: PrimaryDiagnosis = Field(..., description="Primary diagnosis")
    differential_diagnoses: List[DifferentialDiagnosis] = Field(..., description="Differential diagnoses")
    key_findings: List[str] = Field(..., description="Key clinical findings")
    recommended_tests: List[str] = Field(..., description="Recommended diagnostic tests")
    pattern_matches: List[PatternMatch] = Field(..., description="Pattern matches")
    timestamp: datetime = Field(..., description="Analysis timestamp") 