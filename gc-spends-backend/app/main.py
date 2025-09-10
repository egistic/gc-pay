from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.config import settings
import uuid
import time
from app.modules.users.router import router as users_router
from app.modules.users.roles_router import router as roles_router
from app.modules.requests.router import router as requests_router
from app.modules.files.router import router as files_router
# from app.modules.auth.router import router as auth_router
from app.modules.dictionaries.router import router as dictionaries_router
from app.modules.registry.router import router as registry_router
from app.modules.distribution.router import router as distribution_router

app = FastAPI(title="GC Spends API", version="0.1.0")

api = FastAPI()

# Add CORS middleware to both app and api
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRFToken",
        "X-API-Key",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=[
        "X-Process-Time",
        "X-Request-ID",
        "X-Total-Count"
    ],
    max_age=3600,  # Cache preflight requests for 1 hour
)

api.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language", 
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-CSRFToken",
        "X-API-Key",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=[
        "X-Process-Time",
        "X-Request-ID", 
        "X-Total-Count"
    ],
    max_age=3600,
)

# Add security middleware
if settings.app_env == "production":
    app.add_middleware(
        TrustedHostMiddleware, 
        allowed_hosts=["yourdomain.com", "*.yourdomain.com", "localhost"]
    )

# Add GZip compression middleware
app.add_middleware(
    GZipMiddleware, 
    minimum_size=1000  # Only compress responses > 1KB
)

# Add custom security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://gcback.openlayers.kz"
    
    # Remove server information
    if "Server" in response.headers:
        del response.headers["Server"]
    
    return response

# Add request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response

# Add process time middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Add explicit OPTIONS handler for API
@api.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": ", ".join(settings.allowed_origins),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-CSRFToken, X-API-Key, Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600"
        }
    )

app.mount(settings.api_prefix, api)

# Include all routers
# api.include_router(auth_router)  # Temporarily disabled for Phase 1
api.include_router(users_router)
api.include_router(roles_router)
api.include_router(requests_router)
api.include_router(files_router)
api.include_router(dictionaries_router)
api.include_router(registry_router)
api.include_router(distribution_router)

@app.options("/{path:path}")
async def app_options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight on main app"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": ", ".join(settings.allowed_origins),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-CSRFToken, X-API-Key, Origin, Access-Control-Request-Method, Access-Control-Request-Headers",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600"
        }
    )

@app.get("/health")
def health():
    return {"status": "ok"}
