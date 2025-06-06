from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Optional
from ...services.medical_analysis_service import MedicalAnalysisService
from ...schemas.medical_analysis import (
    AnalysisRequest,
    AnalysisResponse,
    ErrorResponse
)

router = APIRouter()
medical_analysis_service = MedicalAnalysisService()

@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def analyze_medical_case(request: AnalysisRequest) -> AnalysisResponse:
    """
    Analyze a medical case using the advanced analysis engine.
    """
    try:
        # Validate request data
        if not request.patient_data or not request.scan_data:
            raise HTTPException(
                status_code=400,
                detail="Patient data and scan data are required"
            )
        
        # Perform analysis
        analysis_result = await medical_analysis_service.analyze_medical_case(
            patient_data=request.patient_data,
            scan_data=request.scan_data,
            lab_results=request.lab_results or {},
            clinical_notes=request.clinical_notes or {}
        )
        
        return AnalysisResponse(
            success=True,
            data=analysis_result,
            message="Analysis completed successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during medical analysis: {str(e)}"
        )

@router.get(
    "/conditions",
    response_model=Dict,
    responses={
        500: {"model": ErrorResponse}
    }
)
async def get_medical_conditions() -> Dict:
    """
    Get the list of medical conditions in the database.
    """
    try:
        conditions = medical_analysis_service._load_conditions_db()
        return {
            "success": True,
            "data": conditions,
            "message": "Conditions retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving conditions: {str(e)}"
        ) 