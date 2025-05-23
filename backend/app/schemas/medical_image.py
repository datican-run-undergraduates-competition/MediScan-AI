from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from ..models.medical_image import ImageType

# Analysis Result Schema
class AnalysisResultBase(BaseModel):
    condition: str
    confidence_score: float
    heatmap_path: Optional[str] = None

class AnalysisResultCreate(AnalysisResultBase):
    image_id: int

class AnalysisResult(AnalysisResultBase):
    id: int
    image_id: int
    analysis_date: datetime

    class Config:
        orm_mode = True

# Medical Image Schema
class MedicalImageBase(BaseModel):
    filename: str
    image_type: ImageType

class MedicalImageCreate(MedicalImageBase):
    file_path: str
    file_size: int
    width: int
    height: int
    user_id: int

class MedicalImage(MedicalImageBase):
    id: int
    file_path: str
    file_size: int
    width: int
    height: int
    user_id: int
    upload_date: datetime
    analysis_results: List[AnalysisResult] = []

    class Config:
        orm_mode = True 
