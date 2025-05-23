import os
import re
import time
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, List

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv
import pyotp
import base64

# Load environment variables
load_dotenv()

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "insecure_key_for_dev")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

# Rate limiting
RATE_LIMIT_DURATION = 60  # seconds
MAX_REQUESTS = 30  # per RATE_LIMIT_DURATION
rate_limit_data: Dict[str, List[float]] = {}

# Password policy
PASSWORD_MIN_LENGTH = 8
PASSWORD_REGEX = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')

# Token models
class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: Optional[str] = None
    expires_at: datetime

class TokenData(BaseModel):
    username: Optional[str] = None
    scopes: List[str] = []

# 2FA models
class TwoFactorSetup(BaseModel):
    secret: str
    uri: str

# Password verification
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Password hashing
def get_password_hash(password):
    if not validate_password(password):
        raise ValueError("Password does not meet security requirements")
    return pwd_context.hash(password)

# Password validation
def validate_password(password: str) -> bool:
    """
    Validates that a password:
    - Is at least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    """
    if len(password) < PASSWORD_MIN_LENGTH:
        return False
    
    return bool(PASSWORD_REGEX.match(password))

# Create access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire

# Create refresh token
def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Verify refresh token and create new access token
def refresh_access_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token_data = TokenData(username=username)
        access_token, expire = create_access_token(data={"sub": username})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_at": expire
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Rate limiting middleware
async def rate_limiter(request: Request):
    client_ip = request.client.host
    now = time.time()
    
    if client_ip not in rate_limit_data:
        rate_limit_data[client_ip] = []
    
    # Remove timestamps older than RATE_LIMIT_DURATION
    rate_limit_data[client_ip] = [t for t in rate_limit_data[client_ip] if now - t < RATE_LIMIT_DURATION]
    
    # Check if client has made too many requests
    if len(rate_limit_data[client_ip]) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {MAX_REQUESTS} requests per {RATE_LIMIT_DURATION} seconds."
        )
    
    # Add current timestamp
    rate_limit_data[client_ip].append(now)

# Get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    # In a real application, you would fetch the user from the database here
    # For now, we just return the username
    return {"username": token_data.username}

# Get current active user
async def get_current_active_user(current_user = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# 2FA functions
def generate_totp_secret():
    """Generate a random secret for TOTP."""
    return pyotp.random_base32()

def get_totp_uri(secret: str, account_name: str, issuer: str = "MediScanAI"):
    """Generate the URI for QR code."""
    return pyotp.totp.TOTP(secret).provisioning_uri(
        name=account_name, issuer_name=issuer
    )

def verify_totp(secret: str, token: str) -> bool:
    """Verify a TOTP token."""
    totp = pyotp.TOTP(secret)
    return totp.verify(token)

# Generate CSRF token
def generate_csrf_token() -> str:
    """Generate a secure CSRF token."""
    return secrets.token_hex(32)

# Validate CSRF token
def validate_csrf_token(request_token: str, session_token: str) -> bool:
    """Validate the CSRF token from the request against the session token."""
    if not request_token or not session_token:
        return False
    return secrets.compare_digest(request_token, session_token) 
