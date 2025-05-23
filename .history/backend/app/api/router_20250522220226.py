"""
Main API router for MediScan AI.
"""

from fastapi import APIRouter, Depends

from .routes import auth, users, xray, mri, ct

# Create main API router
router = APIRouter()

# Include all API routes
router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(users.router, prefix="/users", tags=["users"])

# Medical imaging analysis routes
router.include_router(xray.router, prefix="/xray", tags=["xray"])
router.include_router(mri.router, prefix="/mri", tags=["mri"])
router.include_router(ct.router, prefix="/ct", tags=["ct"])

@router.get("/")
async def root():
    """
    API root endpoint.
    """
    return {
        "name": "MediScan AI API",
        "version": "0.1.0",
        "description": "Early Disease Detection Through Multi-modal Medical Imaging Analysis"
    } 
