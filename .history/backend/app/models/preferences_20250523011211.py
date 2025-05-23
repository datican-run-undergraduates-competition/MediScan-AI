from sqlalchemy import Column, String, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..db_init import Base

class UserPreferences(Base):
    """
    Model for storing user preferences
    """
    __tablename__ = "user_preferences"
    
    user_id = Column(String(36), ForeignKey("users.id"), primary_key=True)
    preferences_json = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to user
    user = relationship("User", back_populates="preferences")
    
    def __repr__(self):
        return f"<UserPreferences(user_id='{self.user_id}')>" 
