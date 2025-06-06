from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # admin, doctor, radiologist, etc.
    department = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    settings = relationship("UserSettings", back_populates="user", uselist=False)
    uploads = relationship("Upload", back_populates="user")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    notifications = Column(JSON)  # Store notification preferences
    appearance = Column(JSON)  # Store UI preferences
    privacy = Column(JSON)  # Store privacy settings
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="settings")

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_name = Column(String)
    file_type = Column(String)  # xray, mri, ct, report
    file_path = Column(String)
    file_size = Column(Integer)  # in bytes
    status = Column(String)  # pending, processing, completed, failed
    model_id = Column(String, nullable=True)  # ID of the model used for analysis
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="uploads")
    analysis = relationship("Analysis", back_populates="upload", uselist=False)

class Analysis(Base):
    __tablename__ = "analysis"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"))
    findings = Column(JSON)  # List of findings
    recommendations = Column(JSON)  # List of recommendations
    confidence_scores = Column(JSON)  # Confidence scores for findings
    processing_time = Column(Float)  # Time taken to process in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    upload = relationship("Upload", back_populates="analysis") 