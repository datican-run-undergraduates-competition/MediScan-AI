from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.sql.sqltypes import DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reports")
    extracted_entities = relationship("ExtractedEntity", back_populates="report")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("medical_reports.id"))
    entity_type = Column(String)  # e.g., "symptom", "condition", "medication"
    entity_value = Column(String)
    confidence_score = Column(Integer)
    extraction_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    report = relationship("MedicalReport", back_populates="extracted_entities") 
