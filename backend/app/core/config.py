from pydantic import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Medical System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ai_medical_system")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
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