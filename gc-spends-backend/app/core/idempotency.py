# app/core/idempotency.py
import hashlib
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Request, Response, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models import IdempotencyKey, User
from app.core.security import get_current_user

class IdempotencyMiddleware:
    """
    Middleware for handling idempotency keys in API requests.
    Ensures that duplicate requests with the same idempotency key return the same response.
    """
    
    def __init__(self, app, expire_hours: int = 24):
        self.app = app
        self.expire_hours = expire_hours
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Only process POST, PUT, PATCH requests
        if request.method not in ["POST", "PUT", "PATCH"]:
            await self.app(scope, receive, send)
            return
        
        # Check for idempotency key in headers
        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            await self.app(scope, receive, send)
            return
        
        # Get user from request (if available)
        user_id = getattr(request.state, 'user_id', None)
        if not user_id:
            await self.app(scope, receive, send)
            return
        
        # Create a custom response handler
        response_data = {}
        status_code = 200
        
        async def send_wrapper(message):
            nonlocal response_data, status_code
            
            if message["type"] == "http.response.start":
                status_code = message["status"]
            elif message["type"] == "http.response.body":
                if message.get("body"):
                    try:
                        response_data = json.loads(message["body"].decode())
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        response_data = {"data": message["body"].decode()}
            
            await send(message)
        
        # Check if this idempotency key already exists
        db = next(get_db())
        try:
            existing_key = db.query(IdempotencyKey).filter(
                IdempotencyKey.key == idempotency_key,
                IdempotencyKey.user_id == user_id
            ).first()
            
            if existing_key:
                # Check if the key has expired
                if existing_key.expires_at < datetime.utcnow():
                    # Delete expired key
                    db.delete(existing_key)
                    db.commit()
                else:
                    # Return cached response
                    response = JSONResponse(
                        content=existing_key.response_data,
                        status_code=existing_key.status_code,
                        headers={"X-Idempotency-Key": idempotency_key}
                    )
                    await response(scope, receive, send)
                    return
            
            # Process the request and capture response
            await self.app(scope, receive, send_wrapper)
            
            # Store the response for future idempotent requests
            if response_data:
                # Calculate request hash for additional validation
                body = await request.body()
                request_hash = hashlib.sha256(body).hexdigest()
                
                # Create new idempotency key record
                new_key = IdempotencyKey(
                    key=idempotency_key,
                    request_hash=request_hash,
                    response_data=response_data,
                    status_code=status_code,
                    expires_at=datetime.utcnow() + timedelta(hours=self.expire_hours),
                    user_id=user_id
                )
                
                db.add(new_key)
                db.commit()
                
        except Exception as e:
            # If there's an error, just process normally
            await self.app(scope, receive, send)
        finally:
            db.close()

def get_idempotency_key(request: Request) -> Optional[str]:
    """Extract idempotency key from request headers."""
    return request.headers.get("Idempotency-Key")

def validate_idempotency_key(
    idempotency_key: Optional[str] = Depends(get_idempotency_key)
) -> Optional[str]:
    """Validate idempotency key format."""
    if idempotency_key:
        # Basic validation - should be a valid UUID or alphanumeric string
        if len(idempotency_key) < 10 or len(idempotency_key) > 255:
            raise HTTPException(
                status_code=400,
                detail="Idempotency-Key must be between 10 and 255 characters"
            )
        
        # Check for valid characters (alphanumeric, hyphens, underscores)
        if not all(c.isalnum() or c in '-_' for c in idempotency_key):
            raise HTTPException(
                status_code=400,
                detail="Idempotency-Key contains invalid characters"
            )
    
    return idempotency_key

def create_idempotency_key() -> str:
    """Generate a new idempotency key."""
    return str(uuid.uuid4())

def cleanup_expired_keys(db: Session) -> int:
    """Clean up expired idempotency keys."""
    expired_count = db.query(IdempotencyKey).filter(
        IdempotencyKey.expires_at < datetime.utcnow()
    ).count()
    
    db.query(IdempotencyKey).filter(
        IdempotencyKey.expires_at < datetime.utcnow()
    ).delete()
    
    db.commit()
    return expired_count
