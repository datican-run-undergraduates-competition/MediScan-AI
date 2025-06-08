from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base

class Analysis(Base):
    """Model for storing analysis results"""
    __tablename__ = "analysis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    analysis_type = Column(String(50), nullable=False)
    results = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="analyses")
    
    def __repr__(self):
        return f"<Analysis(id={self.id}, user_id={self.user_id}, type={self.analysis_type})>" 