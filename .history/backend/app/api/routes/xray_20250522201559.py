import os
import shutil
from typing import Any, List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_active_user
from ...models.medical_image import MedicalImage, ImageType, AnalysisResult
from ...schemas.medical_image import MedicalImage as MedicalImageSchema, AnalysisResult as AnalysisResultSchema

router = APIRouter()

@router.post("/upload", response_model=MedicalImageSchema)
async def upload_xray(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
) -> Any:
    """
    Upload an X-ray image for analysis.
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )
    
    # Create directory for user if it doesn't exist
    user_dir = f"data/raw/xray/{current_user['username']}"
    os.makedirs(user_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid4()}{file_ext}"
    file_path = f"{user_dir}/{unique_filename}"
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # TODO: Get image dimensions
    width, height = 512, 512  # Placeholder values
    
    # Create database entry
    db_image = MedicalImage(
        filename=file.filename,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        image_type=ImageType.XRAY,
        width=width,
        height=height,
        user_id=current_user["id"]  # Assuming user ID is available in token
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    
    return db_image

@router.post("/analyze/{image_id}", response_model=List[AnalysisResultSchema])
async def analyze_xray(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
) -> Any:
    """
    Analyze an uploaded X-ray image.
    """
    # Get image from database
    image = db.query(MedicalImage).filter(MedicalImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    
    # Check if user owns the image
    if image.user_id != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this image",
        )
    
    # TODO: Implement actual analysis with ML model
    # For now, return placeholder results
    conditions = [
        {"condition": "Tuberculosis", "confidence": 0.85, "heatmap_path": None},
        {"condition": "Pneumonia", "confidence": 0.35, "heatmap_path": None},
        {"condition": "COVID-19", "confidence": 0.15, "heatmap_path": None},
    ]
    
    # Save results to database
    results = []
    for cond in conditions:
        result = AnalysisResult(
            image_id=image.id,
            condition=cond["condition"],
            confidence_score=cond["confidence"],
            heatmap_path=cond["heatmap_path"]
        )
        db.add(result)
        results.append(result)
    
    db.commit()
    for result in results:
        db.refresh(result)
    
    return results 
