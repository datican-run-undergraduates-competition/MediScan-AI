from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    department: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

# Settings schemas
class NotificationSettings(BaseModel):
    email: bool = True
    push: bool = True
    analysis_complete: bool = True
    error_alerts: bool = True

class AppearanceSettings(BaseModel):
    theme: str = "light"
    font_size: str = "medium"
    language: str = "en"

class PrivacySettings(BaseModel):
    data_retention: int = 30
    share_analytics: bool = True
    auto_delete: bool = False

class UserSettingsBase(BaseModel):
    notifications: NotificationSettings
    appearance: AppearanceSettings
    privacy: PrivacySettings

class UserSettingsCreate(UserSettingsBase):
    pass

class UserSettings(UserSettingsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

# Upload schemas
class UploadBase(BaseModel):
    file_name: str
    file_type: str
    model_id: Optional[str] = None

class UploadCreate(UploadBase):
    pass

class Upload(UploadBase):
    id: int
    user_id: int
    file_path: str
    file_size: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

# Analysis schemas
class Finding(BaseModel):
    type: str
    description: str
    confidence: float
    location: Optional[Dict[str, float]] = None

class AnalysisBase(BaseModel):
    findings: List[Finding]
    recommendations: List[str]
    confidence_scores: Dict[str, float]
    processing_time: float

class AnalysisCreate(AnalysisBase):
    pass

class Analysis(AnalysisBase):
    id: int
    upload_id: int
    created_at: datetime

    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Response schemas
class AnalysisResponse(BaseModel):
    upload: Upload
    analysis: Analysis

class UserWithSettings(User):
    settings: Optional[UserSettings] = None

# Stats schemas
class UploadStats(BaseModel):
    total_uploads: int
    successful_uploads: int
    failed_uploads: int
    pending_uploads: int
    uploads_by_type: Dict[str, int]

class UploadTrend(BaseModel):
    date: str
    count: int

class DashboardStats(BaseModel):
    upload_stats: UploadStats
    recent_uploads: List[Upload]
    upload_trends: List[UploadTrend] 