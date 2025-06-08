from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..core.database import Base

class ChatMessage(Base):
    """Model for storing chat messages"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_from_user = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_messages")
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, user_id={self.user_id}, is_from_user={self.is_from_user})>" 