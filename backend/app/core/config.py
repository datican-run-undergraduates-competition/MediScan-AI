from pydantic import BaseSettings
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables
load_dotenv()

# Database configuration
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Abioye@16")  # Your specific password
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "ai_med_system")

# URL encode the password to handle special characters
ENCODED_PASSWORD = quote_plus(DB_PASSWORD)

# Construct database URL with encoded password
DATABASE_URL = f"postgresql://{DB_USER}:{ENCODED_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Application settings
API_V1_STR = "/api/v1"
PROJECT_NAME = "MediScan AI"

class Settings(BaseSettings):
    PROJECT_NAME: str = PROJECT_NAME
    VERSION: str = "1.0.0"
    API_V1_STR: str = API_V1_STR
    
    DATABASE_URL: str = DATABASE_URL
    SECRET_KEY: str = SECRET_KEY
    ALGORITHM: str = ALGORITHM
    ACCESS_TOKEN_EXPIRE_MINUTES: int = ACCESS_TOKEN_EXPIRE_MINUTES
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Model settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "backend/models")
    XRAY_MODEL: str = os.getenv("XRAY_MODEL", "microsoft/resnet-50")
    MRI_MODEL: str = os.getenv("MRI_MODEL", "microsoft/resnet-50")
    CT_MODEL: str = os.getenv("CT_MODEL", "microsoft/resnet-50")
    USE_MOCK_MODELS: bool = os.getenv("USE_MOCK_MODELS", "False").lower() in ("true", "1", "t")
    
    # HuggingFace settings
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    HF_XRAY_MODEL: str = os.getenv("HF_XRAY_MODEL", "mediscan/xray-specialized-vit")
    HF_MRI_MODEL: str = os.getenv("HF_MRI_MODEL", "mediscan/mri-specialized-vit")
    HF_CT_MODEL: str = os.getenv("HF_CT_MODEL", "mediscan/ct-specialized-vit")
    
    class Config:
        case_sensitive = True

settings = Settings() 