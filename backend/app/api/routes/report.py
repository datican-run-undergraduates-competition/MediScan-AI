from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_active_user
from ...models.medical_report import MedicalReport, ExtractedEntity
from ...schemas.medical_report import MedicalReport as MedicalReportSchema, ExtractedEntity as ExtractedEntitySchema

router = APIRouter()

@router.post("/create", response_model=MedicalReportSchema)
async def create_report(
    title: str = Body(...),
    content: str = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
) -> Any:
    """
    Create a new medical report.
    """
    # Create database entry
    db_report = MedicalReport(
        title=title,
        content=content,
        user_id=current_user["id"]
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report

@router.get("/list", response_model=List[MedicalReportSchema])
async def list_reports(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
) -> Any:
    """
    List all medical reports for the current user.
    """
    reports = db.query(MedicalReport).filter(
        MedicalReport.user_id == current_user["id"]
    ).offset(skip).limit(limit).all()
    
    return reports

@router.get("/{report_id}", response_model=MedicalReportSchema)
async def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
) -> Any:
    """
    Get a specific medical report.
    """
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Check if user owns the report
    if report.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this report",
        )
    
    return report

@router.post("/analyze/{report_id}", response_model=List[ExtractedEntitySchema])
async def analyze_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
) -> Any:
    """
    Analyze a medical report to extract entities.
    """
    # Get report from database
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # Check if user owns the report
    if report.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this report",
        )
    
    # TODO: Implement actual analysis with NLP model
    # For now, return placeholder results
    entities = [
        {"entity_type": "symptom", "entity_value": "fever", "confidence_score": 0.95},
        {"entity_type": "symptom", "entity_value": "cough", "confidence_score": 0.90},
        {"entity_type": "condition", "entity_value": "pneumonia", "confidence_score": 0.75},
        {"entity_type": "medication", "entity_value": "antibiotics", "confidence_score": 0.85},
    ]
    
    # Save results to database
    results = []
    for entity in entities:
        result = ExtractedEntity(
            report_id=report.id,
            entity_type=entity["entity_type"],
            entity_value=entity["entity_value"],
            confidence_score=entity["confidence_score"]
        )
        db.add(result)
        results.append(result)
    
    db.commit()
    for result in results:
        db.refresh(result)
    
    return results 
