"""
Middleware for Kronos Chat Server.
"""
import time
import uuid
from typing import Callable

from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .config import get_settings

settings = get_settings()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests and responses."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Log request start (skip detailed logging for OPTIONS requests)
        if request.method != "OPTIONS":
            print(
                f"Request started: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "query_params": str(request.query_params),
                    "client_ip": request.client.host if request.client else None,
                    "user_agent": request.headers.get("user-agent")
                }
            )
        
        # Process request
        try:
            response = await call_next(request)
        except Exception as e:
            # Log error
            duration = time.time() - start_time
            print(
                f"Request failed: {request.method} {request.url.path} - {str(e)} ({duration:.3f}s)",
                exc_info=True,
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration": duration,
                    "error": str(e)
                }
            )
            raise
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        # Log request completion (skip detailed logging for OPTIONS requests)
        if request.method != "OPTIONS":
            print(
                f"Request completed: {request.method} {request.url.path} - {response.status_code} ({duration:.3f}s)",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration": duration
                }
            )
        
        # Add timing header
        response.headers["X-Process-Time"] = f"{duration:.3f}"
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip security headers for preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)
        
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Add CSP header (adjust as needed for your app)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://backend.composio.dev https://generativelanguage.googleapis.com"
        )
        
        # Add Permissions Policy
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), magnetometer=(), gyroscope=(), "
            "accelerometer=(), ambient-light-sensor=()"
        )
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware (basic implementation)."""
    
    def __init__(self, app: ASGIApp, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting for health checks, docs, and preflight requests
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"] or request.method == "OPTIONS":
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Get current time
        now = time.time()
        
        # Clean old entries
        self.clients = {
            ip: timestamps for ip, timestamps in self.clients.items()
            if any(timestamp > now - self.period for timestamp in timestamps)
        }
        
        # Check rate limit
        if client_ip in self.clients:
            # Filter recent requests
            recent_requests = [
                timestamp for timestamp in self.clients[client_ip]
                if timestamp > now - self.period
            ]
            
            if len(recent_requests) >= self.calls:
                print(
                    f"Rate limit exceeded for {client_ip}",
                    extra={
                        "client_ip": client_ip,
                        "requests": len(recent_requests),
                        "limit": self.calls,
                        "period": self.period
                    }
                )
                return Response(
                    content='{"error": {"code": "RATE_LIMIT_EXCEEDED", "message": "Too many requests"}}',
                    status_code=429,
                    media_type="application/json"
                )
            
            self.clients[client_ip] = recent_requests + [now]
        else:
            self.clients[client_ip] = [now]
        
        return await call_next(request)


def setup_middleware(app):
    """Add middleware to FastAPI app."""
    
    # NOTE: Middleware is executed in reverse order of addition (last added = first executed)
    # So we add them in reverse order of desired execution
    
    # Add request logging middleware (executed last - logs final response)
    app.add_middleware(RequestLoggingMiddleware)
    
    # Add rate limiting in production (executed before logging)
    if settings.app.is_production:
        app.add_middleware(RateLimitMiddleware, calls=100, period=60)
    
    # Add security headers middleware (executed before rate limiting)
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Add compression middleware (executed before security headers)
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Add CORS middleware (executed FIRST - most important for preflight requests)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.security.allowed_hosts,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time"],
        max_age=3600  # Cache preflight response for 1 hour
    )
    
    print("Middleware configured successfully")
