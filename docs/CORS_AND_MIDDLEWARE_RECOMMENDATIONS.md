# CORS and Middleware Recommendations for Production

## Overview
This document provides comprehensive recommendations for configuring CORS (Cross-Origin Resource Sharing) and middleware for the GrainChain Spends application in a production environment.

## CORS Configuration

### Current Configuration Issues
The current FastAPI configuration allows all origins (`allow_origins=["*"]`), which is suitable for development but poses security risks in production.

### Production CORS Configuration

#### 1. Backend CORS Settings (app/main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title="GC Spends API", version="0.1.0")

# Production CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Use environment-specific origins
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
        "X-API-Key"
    ],
    expose_headers=[
        "X-Process-Time",
        "X-Request-ID",
        "X-Total-Count"
    ],
    max_age=3600,  # Cache preflight requests for 1 hour
)
```

#### 2. Environment-Specific CORS Origins

Update `app/core/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Production CORS configuration
    cors_origins: List[str] = [
        "https://yourdomain.com",
        "https://www.yourdomain.com",
        "https://api.yourdomain.com"
    ]
    
    # Development CORS configuration (override in .env for dev)
    cors_origins_dev: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]
    
    @property
    def allowed_origins(self) -> List[str]:
        """Return appropriate origins based on environment"""
        if self.app_env == "production":
            return self.cors_origins
        return self.cors_origins_dev
```

#### 3. Environment Variables

Create `.env.production`:

```env
APP_ENV=production
CORS_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]
JWT_SECRET=your_very_secure_jwt_secret_here
DATABASE_URL=postgresql+psycopg://kads_user:kads_password@fast_api_backend_postgres_1:5432/grainchain
```

## Security Middleware Recommendations

### 1. Trusted Host Middleware

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Add after CORS middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["yourdomain.com", "*.yourdomain.com", "localhost"]
)
```

### 2. HTTPS Redirect Middleware (if not using reverse proxy)

```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# Only add if not using a reverse proxy that handles HTTPS
if settings.app_env == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

### 3. GZip Compression Middleware

```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(
    GZipMiddleware, 
    minimum_size=1000  # Only compress responses > 1KB
)
```

### 4. Custom Security Headers Middleware

```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # Remove server information
    response.headers.pop("Server", None)
    
    return response
```

### 5. Request ID Middleware

```python
import uuid
from fastapi import Request

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response
```

### 6. Rate Limiting Middleware (Optional)

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to specific routes
@app.get("/api/v1/users")
@limiter.limit("100/minute")
async def get_users(request: Request):
    # Your endpoint logic
    pass
```

## Frontend CORS Considerations

### 1. API Base URL Configuration

Update your frontend service configuration:

```typescript
// src/services/httpClient.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.yourdomain.com/api/v1'
  : 'http://localhost:8000/api/v1';
```

### 2. Request Headers

Ensure your frontend sends appropriate headers:

```typescript
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});
```

## Reverse Proxy Configuration (Nginx)

### 1. Nginx CORS Headers

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # CORS headers for API
    location /api/ {
        add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment-Specific Configurations

### Development
- Allow localhost origins
- Enable debug logging
- Relaxed CORS policies
- No HTTPS redirect

### Staging
- Limited production-like origins
- Enhanced logging
- Security headers enabled
- Rate limiting enabled

### Production
- Strict origin validation
- Full security headers
- Rate limiting
- HTTPS enforcement
- Monitoring and alerting

## Monitoring and Logging

### 1. CORS Violation Monitoring

```python
@app.middleware("http")
async def log_cors_violations(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin and origin not in settings.allowed_origins:
        logger.warning(f"CORS violation attempt from origin: {origin}")
    
    response = await call_next(request)
    return response
```

### 2. Security Event Logging

```python
import logging

security_logger = logging.getLogger("security")

@app.middleware("http")
async def security_logging(request: Request, call_next):
    # Log suspicious patterns
    if request.headers.get("user-agent") in ["", "curl", "wget"]:
        security_logger.warning(f"Suspicious user agent: {request.headers.get('user-agent')}")
    
    response = await call_next(request)
    return response
```

## Testing CORS Configuration

### 1. Test Script

```bash
#!/bin/bash
# test-cors.sh

echo "Testing CORS configuration..."

# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v \
  http://localhost:8000/api/v1/users

# Test actual request
curl -X GET \
  -H "Origin: https://yourdomain.com" \
  -H "Content-Type: application/json" \
  -v \
  http://localhost:8000/api/v1/users
```

## Deployment Checklist

- [ ] Update CORS origins for production domains
- [ ] Configure environment variables
- [ ] Enable security middleware
- [ ] Test CORS configuration
- [ ] Configure reverse proxy headers
- [ ] Set up monitoring and logging
- [ ] Test rate limiting (if enabled)
- [ ] Verify HTTPS configuration
- [ ] Test from different origins
- [ ] Review security headers

## Security Best Practices

1. **Never use wildcard origins in production**
2. **Always validate origins against a whitelist**
3. **Use HTTPS in production**
4. **Implement proper authentication and authorization**
5. **Monitor and log security events**
6. **Regular security audits**
7. **Keep dependencies updated**
8. **Use environment-specific configurations**

## Troubleshooting

### Common CORS Issues

1. **Preflight requests failing**: Check OPTIONS method handling
2. **Credentials not sent**: Ensure `withCredentials: true` in frontend
3. **Headers not allowed**: Update `allow_headers` configuration
4. **Origin not allowed**: Verify origin in `allow_origins` list

### Debug Commands

```bash
# Check CORS headers
curl -H "Origin: https://yourdomain.com" -I http://localhost:8000/api/v1/health

# Test preflight
curl -X OPTIONS -H "Origin: https://yourdomain.com" -H "Access-Control-Request-Method: GET" -v http://localhost:8000/api/v1/health
```

This configuration provides a robust, secure, and production-ready setup for your GrainChain Spends application.
