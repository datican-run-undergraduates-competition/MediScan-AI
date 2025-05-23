from sqlalchemy import Boolean, Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from ..core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    # Two-factor authentication
    totp_secret = Column(String, nullable=True)
    is_totp_enabled = Column(Boolean, default=False)
    
    # Account security
    failed_login_attempts = Column(Integer, default=0)
    last_login_attempt = Column(DateTime(timezone=True), nullable=True)
    last_successful_login = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    account_locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # User preferences
    preferences = Column(JSON, default={})
    
    # Profile data
    bio = Column(Text, nullable=True)
    profile_image_url = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    images = relationship("MedicalImage", back_populates="user")
    reports = relationship("MedicalReport", back_populates="user")
    security_logs = relationship("SecurityLog", back_populates="user")

class SecurityLog(Base):
    __tablename__ = "security_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, Column(Integer, nullable=True))
    event_type = Column(String, index=True)  # login, logout, password_change, etc.
    ip_address = Column(String)
    user_agent = Column(String)
    details = Column(JSON, nullable=True)  # Any additional information
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="security_logs") 
