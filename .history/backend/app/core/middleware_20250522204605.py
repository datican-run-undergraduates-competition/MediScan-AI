from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
import uuid
from typing import Callable

from .security import rate_limiter

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to responses.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        
        return response

class RequestTracingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for tracing requests with unique IDs.
    """
    async def dispatch(self, request: Request, call_next):
        # Generate a request ID
        request_id = str(uuid.uuid4())
        
        # Add the request ID to the request state
        request.state.request_id = request_id
        
        # Start timer
        start_time = time.time()
        
        # Process the request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Add headers to the response
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting.
    """
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths
        if not request.url.path.startswith("/api/"):
            return await call_next(request)
        
        # Apply rate limiting
        await rate_limiter(request)
        
        return await call_next(request)

def setup_middlewares(app: FastAPI):
    """
    Configure all middlewares for the FastAPI app.
    """
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:8000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Security middlewares
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestTracingMiddleware)
    app.add_middleware(RateLimitMiddleware)
    
    # Trusted host middleware
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1"]
    ) 
