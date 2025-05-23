from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
import logging
import asyncio

from .core.middleware import setup_middlewares
from .db_init import init as init_database
from .utils.audit_logger import initialize as init_audit_logger, shutdown as shutdown_audit_logger

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
    version="0.1.0",
)

# Set up security middleware
setup_middlewares(app)

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

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down MediScan AI application...")
    
    # Shutdown audit logger
    await shutdown_audit_logger()
    logger.info("Audit logger shut down successfully")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to MediScan AI API",
        "status": "active",
        "version": "0.1.0"
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

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(xray_router, prefix="/api/xray", tags=["X-Ray Analysis"])
app.include_router(mri_router, prefix="/api/mri", tags=["MRI Analysis"])
app.include_router(ct_router, prefix="/api/ct", tags=["CT Scan Analysis"])
app.include_router(report_router, prefix="/api/report", tags=["Report Analysis"])
app.include_router(dicom_router, prefix="/api/dicom", tags=["DICOM Processing"])
app.include_router(audit_router, prefix="/api/audit", tags=["Audit Logging"])
app.include_router(preferences_router, prefix="/api/preferences", tags=["User Preferences"])

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    ) 
