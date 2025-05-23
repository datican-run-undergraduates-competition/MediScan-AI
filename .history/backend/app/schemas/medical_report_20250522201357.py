from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

# Extracted Entity Schema
class ExtractedEntityBase(BaseModel):
    entity_type: str
    entity_value: str
    confidence_score: float

class ExtractedEntityCreate(ExtractedEntityBase):
    report_id: int

class ExtractedEntity(ExtractedEntityBase):
    id: int
    report_id: int
    extraction_date: datetime

    class Config:
        orm_mode = True

# Medical Report Schema
class MedicalReportBase(BaseModel):
    title: str
    content: str

class MedicalReportCreate(MedicalReportBase):
    user_id: int

class MedicalReport(MedicalReportBase):
    id: int
    user_id: int
    upload_date: datetime
    extracted_entities: List[ExtractedEntity] = []

    class Config:
        orm_mode = True 
