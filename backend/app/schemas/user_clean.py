from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
import re

# Password validation regex
PASSWORD_REGEX = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    requires_2fa: Optional[bool] = None
    temp_token: Optional[str] = None
    user_id: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str
    role: str
    department: str
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def password_strength(cls, v):
        if not PASSWORD_REGEX.match(v):
            raise ValueError(
                'Password must be at least 8 characters and include uppercase, '
                'lowercase, number, and special character'
            )
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_verified: Optional[bool] = None

    @validator('password')
    def password_strength(cls, v):
        if v is not None and not PASSWORD_REGEX.match(v):
            raise ValueError(
                'Password must be at least 8 characters and include uppercase, '
                'lowercase, number, and special character'
            )
        return v

class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str

class UserPreferences(BaseModel):
    notifications: Dict[str, Any] = Field(default_factory=dict)
    appearance: Dict[str, Any] = Field(default_factory=dict)
    privacy: Dict[str, Any] = Field(default_factory=dict)

class UserSettings(BaseModel):
    user_id: int
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True 