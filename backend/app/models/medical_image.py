from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.sql.sqltypes import DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from ..core.database import Base

class ImageType(str, enum.Enum):
    XRAY = "xray"
    MRI = "mri"
    CT = "ct"

class MedicalImage(Base):
    __tablename__ = "medical_images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)  # in bytes
    image_type = Column(Enum(ImageType))
    width = Column(Integer)
    height = Column(Integer)
    user_id = Column(Integer, ForeignKey("users.id"))
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="images")
    analysis_results = relationship("AnalysisResult", back_populates="image")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("medical_images.id"))
    condition = Column(String)
    confidence_score = Column(Float)
    heatmap_path = Column(String, nullable=True)
    analysis_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    image = relationship("MedicalImage", back_populates="analysis_results") 
