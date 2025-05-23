from datetime import datetime, timedelta
from typing import Any, Optional
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import pyotp
from pydantic import BaseModel

from ...core.security import (
    create_access_token,
    create_refresh_token,
    refresh_access_token,
    get_password_hash,
    verify_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    generate_totp_secret,
    get_totp_uri,
    verify_totp,
    generate_csrf_token,
    validate_csrf_token,
    Token,
    TwoFactorSetup,
)
from ...core.database import get_db
from ...models.user import User, SecurityLog
from ...schemas.user import UserCreate, UserInDB, User as UserSchema

router = APIRouter()

# Additional schema models
class TwoFactorAuthRequest(BaseModel):
    token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class SetupTwoFactorResponse(BaseModel):
    secret: str
    uri: str

@router.post("/register", response_model=UserSchema)
async def register_user(
    user_in: UserCreate, 
    request: Request,
    db: Session = Depends(get_db)
) -> Any:
    """
    Register a new user.
    """
    # Check if user with this email already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    
    # Check if user with this username already exists
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists",
        )
    
    # Create new user
    user_data = user_in.dict(exclude={"password"})
    user_obj = User(**user_data, hashed_password=get_password_hash(user_in.password))
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    
    # Log registration event
    log_security_event(
        db=db,
        user_id=user_obj.id,
        event_type="registration",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
    )
    
    return user_obj

@router.post("/token", response_model=Token)
async def login_for_access_token(
    response: Response,
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Try to authenticate with username
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        # Try to authenticate with email
        user = db.query(User).filter(User.email == form_data.username).first()
        if not user:
            # Log failed login attempt
            log_security_event(
                db=db,
                user_id=None,
                event_type="failed_login",
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent", ""),
                details={"reason": "user_not_found", "username": form_data.username}
            )
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"} 
