from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from ..core.config import settings
from ..core.security import oauth2_scheme
from typing import Optional
import time

security = HTTPBearer()

class AuthMiddleware:
    def __init__(self):
        self.security = security

    async def __call__(self, request: Request, call_next):
        # Skip auth for public routes
        if request.url.path in ["/docs", "/redoc", "/openapi.json", "/token", "/register"]:
            return await call_next(request)

        try:
            # Get token from header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            token = auth_header.split(" ")[1]
            
            # Verify token
            try:
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=[settings.ALGORITHM]
                )
                
                # Check if token is expired
                if payload.get("exp") < time.time():
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has expired",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                
                # Add user info to request state
                request.state.user = payload
                
            except JWTError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Add rate limiting
            client_ip = request.client.host
            current_time = time.time()
            
            if not hasattr(request.state, "rate_limit"):
                request.state.rate_limit = {
                    "count": 0,
                    "reset_time": current_time + settings.RATE_LIMIT_DURATION
                }
            
            if current_time > request.state.rate_limit["reset_time"]:
                request.state.rate_limit = {
                    "count": 1,
                    "reset_time": current_time + settings.RATE_LIMIT_DURATION
                }
            else:
                request.state.rate_limit["count"] += 1
                
                if request.state.rate_limit["count"] > settings.MAX_REQUESTS:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests",
                    )

            # Process the request
            response = await call_next(request)
            return response

        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error",
            )

# Dependency for protected routes
async def get_current_user(request: Request):
    if not hasattr(request.state, "user"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return request.state.user 