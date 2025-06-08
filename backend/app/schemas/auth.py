from typing import Optional
from pydantic import BaseModel
from datetime import datetime

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
