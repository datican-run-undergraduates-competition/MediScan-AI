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
    
    # Check if account is locked
    if user.account_locked_until and user.account_locked_until > datetime.utcnow():
        log_security_event(
            db=db,
            user_id=user.id,
            event_type="login_blocked",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "account_locked"}
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Account locked until {user.account_locked_until}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        # Update failed login attempts
        user.failed_login_attempts += 1
        user.last_login_attempt = datetime.utcnow()
        
        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            user.account_locked_until = datetime.utcnow() + timedelta(minutes=30)
        
        db.commit()
        
        # Log failed login
        log_security_event(
            db=db,
            user_id=user.id,
            event_type="failed_login",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "invalid_password"}
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if 2FA is enabled
    if user.is_totp_enabled:
        # Set a temporary session cookie to identify the user for 2FA
        temp_token = secrets.token_urlsafe(32)
        response.set_cookie(
            key="temp_auth",
            value=temp_token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=300  # 5 minutes
        )
        
        # Store the token in the user session (in a real app, use Redis or similar)
        # For now, we'll just return a special response
        return {
            "access_token": None,
            "token_type": "bearer",
            "requires_2fa": True,
            "temp_token": temp_token,
            "user_id": user.id
        }
    
    # Reset failed login attempts
    user.failed_login_attempts = 0
    user.last_successful_login = datetime.utcnow()
    db.commit()
    
    # Generate tokens
    access_token, expires = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    # Generate CSRF token
    csrf_token = generate_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=True,
        secure=True,
        samesite="strict"
    )
    
    # Log successful login
    log_security_event(
        db=db,
        user_id=user.id,
        event_type="login",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_at": expires
    }

@router.post("/verify-2fa", response_model=Token)
async def verify_two_factor(
    totp_data: TwoFactorAuthRequest,
    response: Response,
    request: Request,
    temp_token: Optional[str] = Cookie(None),
    user_id: int = None,
    db: Session = Depends(get_db)
) -> Any:
    """
    Verify 2FA token and complete login.
    """
    if not temp_token or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication session",
        )
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication session",
        )
    
    # Verify TOTP
    if not verify_totp(user.totp_secret, totp_data.token):
        # Log failed 2FA attempt
        log_security_event(
            db=db,
            user_id=user.id,
            event_type="failed_2fa",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA token",
        )
    
    # Reset failed login attempts
    user.failed_login_attempts = 0
    user.last_successful_login = datetime.utcnow()
    db.commit()
    
    # Clear temporary token
    response.delete_cookie(key="temp_auth")
    
    # Generate tokens
    access_token, expires = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    # Generate CSRF token
    csrf_token = generate_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=True,
        secure=True,
        samesite="strict"
    )
    
    # Log successful login with 2FA
    log_security_event(
        db=db,
        user_id=user.id,
        event_type="login_2fa",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_at": expires
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Refresh access token using refresh token.
    """
    try:
        token_data = refresh_access_token(refresh_request.refresh_token)
        return token_data
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/setup-2fa", response_model=SetupTwoFactorResponse)
async def setup_two_factor(
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Set up two-factor authentication for a user.
    """
    # Get user
    user = db.query(User).filter(User.username == current_user["username"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Generate TOTP secret
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, user.email, "MediScanAI")
    
    # Store secret temporarily (in a real app, store in Redis with expiry)
    user.totp_secret = secret
    db.commit()
    
    # Log 2FA setup
    log_security_event(
        db=db,
        user_id=user.id,
        event_type="2fa_setup",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
    )
    
    return {
        "secret": secret,
        "uri": uri
    }

@router.post("/enable-2fa")
async def enable_two_factor(
    totp_data: TwoFactorAuthRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Enable two-factor authentication after setup.
    """
    # Get user
    user = db.query(User).filter(User.username == current_user["username"]).first()
    if not user or not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not set up",
        )
    
    # Verify TOTP
    if not verify_totp(user.totp_secret, totp_data.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA token",
        )
    
    # Enable 2FA
    user.is_totp_enabled = True
    db.commit()
    
    # Log 2FA enabled
    log_security_event(
        db=db,
        user_id=user.id,
        event_type="2fa_enabled",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
    )
    
    return {"message": "Two-factor authentication enabled"}

@router.post("/disable-2fa")
async def disable_two_factor(
    totp_data: TwoFactorAuthRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Disable two-factor authentication.
    """
    # Get user
    user = db.query(User).filter(User.username == current_user["username"]).first()
    if not user or not user.is_totp_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not enabled",
        )
    
    # Verify TOTP
    if not verify_totp(user.totp_secret, totp_data.token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA token",
        )
    
    # Disable 2FA
    user.is_totp_enabled = False
    db.commit()
    
    # Log 2FA disabled
    log_security_event(
        db=db,
        user_id=user.id,
        event_type="2fa_disabled",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
    )
    
    return {"message": "Two-factor authentication disabled"}

@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Logout user and invalidate tokens.
    """
    # In a real app, add token to blacklist in Redis
    
    # Clear cookies
    response.delete_cookie(key="csrf_token")
    
    # Get user
    user = db.query(User).filter(User.username == current_user["username"]).first()
    if user:
        # Log logout
        log_security_event(
            db=db,
            user_id=user.id,
            event_type="logout",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
        )
    
    return {"message": "Successfully logged out"}

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> Any:
    """
    Change user password.
    """
    # Get user
    user = db.query(User).filter(User.username == current_user["username"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user.hashed_password):
        # Log failed password change
        log_security_event(
            db=db,
            user_id=user.id,
            event_type="failed_password_change",
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", ""),
            details={"reason": "invalid_current_password"}
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect current password",
        )
    
    # Update password
    user.hashed_password = get_password_hash(password_data.new_password)
    user.password_changed_at = datetime.utcnow()
    db.commit()
    
    # Log password change
    log_security_event(
        db=db,
        user_id=user.id,
        event_type="password_change",
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
    )
    
    return {"message": "Password changed successfully"}

# Helper function for security logging
def log_security_event(
    db: Session,
    event_type: str,
    ip_address: str,
    user_agent: str,
    user_id: Optional[int] = None,
    details: Optional[dict] = None
):
    """
    Log security events to the database.
    """
    log = SecurityLog(
        user_id=user_id,
        event_type=event_type,
        ip_address=ip_address,
        user_agent=user_agent,
        details=details
    )
    db.add(log)
    db.commit() 
