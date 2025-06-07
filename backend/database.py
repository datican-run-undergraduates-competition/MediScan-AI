from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment variable or use default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/ai_med_system"
)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

class UserRole(str, enum.Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    RADIOLOGIST = "radiologist"
    RESEARCHER = "researcher"
    ADMIN = "admin"

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    organization = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    phone_number = Column(String(20), nullable=False)
    department = Column(String(100))
    years_of_experience = Column(Integer)
    npi_number = Column(String(30))
    medical_school = Column(String(100))
    board_certified = Column(Boolean, default=False)
    languages_spoken = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    medical_licenses = relationship("MedicalLicense", back_populates="user")
    specializations = relationship("Specialization", secondary="user_specializations")
    patients = relationship("Patient", back_populates="primary_doctor")
    analyses = relationship("MedicalAnalysis", back_populates="user")

class MedicalLicense(Base):
    __tablename__ = 'medical_licenses'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    license_number = Column(String(50), unique=True, nullable=False)
    issuing_authority = Column(String(100), nullable=False)
    issue_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    is_verified = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="medical_licenses")

class Specialization(Base):
    __tablename__ = 'specializations'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    
    users = relationship("User", secondary="user_specializations")

class UserSpecialization(Base):
    __tablename__ = 'user_specializations'
    
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    specialization_id = Column(Integer, ForeignKey('specializations.id'), primary_key=True)
    certification_date = Column(DateTime, nullable=False)
    certification_body = Column(String(100), nullable=False)

class Patient(Base):
    __tablename__ = 'patients'
    
    id = Column(Integer, primary_key=True)
    mrn = Column(String(50), unique=True, nullable=False)  # Medical Record Number
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    gender = Column(String(10), nullable=False)
    primary_doctor_id = Column(Integer, ForeignKey('users.id'))
    contact_number = Column(String(20))
    email = Column(String(120))
    address = Column(Text)
    medical_history = Column(Text)
    allergies = Column(Text)
    insurance_provider = Column(String(100))
    insurance_number = Column(String(50))
    emergency_contact = Column(String(100))
    blood_type = Column(String(5))
    chronic_conditions = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    primary_doctor = relationship("User", back_populates="patients")
    analyses = relationship("MedicalAnalysis", back_populates="patient")

class MedicalAnalysis(Base):
    __tablename__ = 'medical_analyses'
    
    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey('patients.id'))
    user_id = Column(Integer, ForeignKey('users.id'))
    analysis_type = Column(String(50), nullable=False)  # CT, MRI, X-ray, etc.
    analysis_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), nullable=False)  # pending, completed, failed
    findings = Column(Text)
    recommendations = Column(Text)
    confidence_score = Column(Float)
    file_path = Column(String(255))
    referring_physician = Column(String(100))
    scan_machine_id = Column(String(50))
    contrast_used = Column(Boolean, default=False)
    report_status = Column(String(30))
    
    patient = relationship("Patient", back_populates="analyses")
    user = relationship("User", back_populates="analyses")

def init_db():
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 