from fastapi import APIRouter

from .auth import router as auth_router
from .xray import router as xray_router
from .mri import router as mri_router
from .ct import router as ct_router
from .report import router as report_router

# Export routers
__all__ = [
    "auth_router",
    "xray_router",
    "mri_router",
    "ct_router",
    "report_router",
] 
