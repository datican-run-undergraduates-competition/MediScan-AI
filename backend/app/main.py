from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
import logging
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import datetime, timedelta
import shutil
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate
from app.schemas.token import Token
import auth
from app.core.database import engine, get_db
import json
import time

from app.core.middleware import setup_middlewares
from app.db_init import init as init_database
from app.utils.audit_logger import initialize as init_audit_logger, shutdown as shutdown_audit_logger
from app.api.endpoints import analysis
from app.scheduler import upload_scheduler
from app.middleware.auth import AuthMiddleware

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="MediScan AI",
    description="Early Disease Detection Through Multi-modal Medical Imaging Analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up security middleware
setup_middlewares(app)

# Add authentication middleware
app.add_middleware(AuthMiddleware)

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize database and audit logger on startup
@app.on_event("startup")
async def startup_event():
    logger.info("Starting MediScan AI application...")
    
    # Initialize database in a separate thread to avoid blocking
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, init_database)
    
    if result:
        logger.info("Database initialized successfully")
    else:
        logger.warning("Database initialization issues encountered")
    
    # Initialize audit logger
    await init_audit_logger()
    logger.info("Audit logger initialized successfully")

    # Start upload scheduler
    upload_scheduler.start()

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down MediScan AI application...")
    
    # Shutdown audit logger
    await shutdown_audit_logger()
    logger.info("Audit logger shut down successfully")

    # Stop upload scheduler
    upload_scheduler.stop()

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint returning API information."""
    return {
        "name": "MediScan AI",
        "version": "1.0.0",
        "description": "Early Disease Detection Through Multi-modal Medical Imaging Analysis",
        "endpoints": {
            "analyze": "/api/v1/analyze",
            "documentation": "/docs"
        }
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include routers
from .api.routes import (
    auth_router, xray_router, mri_router, ct_router, report_router
)
from .api.routes.dicom import router as dicom_router
from .api.routes.audit import router as audit_router
from .api.routes.preferences import router as preferences_router
from .api.routes.voice import router as voice_router
from .api.routes.chatbot import router as chat_router

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(xray_router, prefix="/api/xray", tags=["X-Ray Analysis"])
app.include_router(mri_router, prefix="/api/mri", tags=["MRI Analysis"])
app.include_router(ct_router, prefix="/api/ct", tags=["CT Scan Analysis"])
app.include_router(report_router, prefix="/api/report", tags=["Report Analysis"])
app.include_router(dicom_router, prefix="/api/dicom", tags=["DICOM Processing"])
app.include_router(audit_router, prefix="/api/audit", tags=["Audit Logging"])
app.include_router(preferences_router, prefix="/api/preferences", tags=["User Preferences"])
app.include_router(voice_router, prefix="/api/voice", tags=["Voice Processing"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat Bot"])

app.include_router(
    analysis.router,
    prefix="/api/v1",
    tags=["analysis"]
)

# Authentication routes
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User routes
@app.post("/users/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        department=user.department
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me/", response_model=UserSchema)
def read_users_me(current_user: User = Depends(auth.get_current_active_user)):
    return current_user

# Settings routes
@app.get("/settings/", response_model=UserSchema)
def get_user_settings(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    settings = db.query(UserSchema).filter(
        UserSchema.user_id == current_user.id
    ).first()
    if not settings:
        # Create default settings
        settings = UserSchema(
            user_id=current_user.id,
            notifications=UserSchema().dict(),
            appearance=UserSchema().dict(),
            privacy=UserSchema().dict()
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.put("/settings/", response_model=UserSchema)
def update_user_settings(
    settings: UserSchema,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_settings = db.query(UserSchema).filter(
        UserSchema.user_id == current_user.id
    ).first()
    if not db_settings:
        db_settings = UserSchema(user_id=current_user.id)
    
    db_settings.notifications = settings.notifications.dict()
    db_settings.appearance = settings.appearance.dict()
    db_settings.privacy = settings.privacy.dict()
    
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings

# Upload routes
@app.post("/uploads/", response_model=UserSchema)
async def create_upload(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    model_id: Optional[str] = Form(None),
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create upload record
    db_upload = UserSchema(
        user_id=current_user.id,
        file_name=file.filename,
        file_type=file_type,
        file_path=file_path,
        file_size=os.path.getsize(file_path),
        status="pending",
        model_id=model_id
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    
    # TODO: Start async analysis task
    # For now, we'll just update the status
    db_upload.status = "completed"
    db.commit()
    
    return db_upload

@app.get("/uploads/", response_model=List[UserSchema])
def get_user_uploads(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    return db.query(UserSchema).filter(UserSchema.user_id == current_user.id).all()

@app.get("/uploads/{upload_id}", response_model=UserSchema)
def get_upload_analysis(
    upload_id: int,
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    upload = db.query(UserSchema).filter(
        UserSchema.id == upload_id,
        UserSchema.user_id == current_user.id
    ).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    
    analysis = db.query(UserSchema).filter(
        UserSchema.upload_id == upload_id
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {"upload": upload, "analysis": analysis}

# Dashboard routes
@app.get("/dashboard/stats", response_model=UserSchema)
def get_dashboard_stats(
    current_user: User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get upload stats
    uploads = db.query(UserSchema).filter(
        UserSchema.user_id == current_user.id
    ).all()
    
    upload_stats = {
        "total_uploads": len(uploads),
        "successful_uploads": len([u for u in uploads if u.status == "completed"]),
        "failed_uploads": len([u for u in uploads if u.status == "failed"]),
        "pending_uploads": len([u for u in uploads if u.status == "pending"]),
        "uploads_by_type": {
            "xray": len([u for u in uploads if u.file_type == "xray"]),
            "mri": len([u for u in uploads if u.file_type == "mri"]),
            "ct": len([u for u in uploads if u.file_type == "ct"]),
            "report": len([u for u in uploads if u.file_type == "report"]),
        }
    }
    
    # Get recent uploads
    recent_uploads = db.query(UserSchema).filter(
        UserSchema.user_id == current_user.id
    ).order_by(UserSchema.created_at.desc()).limit(5).all()
    
    # Get upload trends (last 7 days)
    today = datetime.now().date()
    trends = []
    for i in range(7):
        date = today - timedelta(days=i)
        count = db.query(UserSchema).filter(
            UserSchema.user_id == current_user.id,
            UserSchema.created_at >= date,
            UserSchema.created_at < date + timedelta(days=1)
        ).count()
        trends.append({"date": date.strftime("%Y-%m-%d"), "count": count})
    
    return {
        "upload_stats": upload_stats,
        "recent_uploads": recent_uploads,
        "upload_trends": trends
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Global exception handler for HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 
