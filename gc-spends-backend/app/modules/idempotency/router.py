# app/modules/idempotency/router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.db import get_db
from app.core.idempotency import cleanup_expired_keys, create_idempotency_key
from app.models import IdempotencyKey
from app.core.security import get_current_user
from app.models import User

router = APIRouter(prefix="/idempotency", tags=["idempotency"])

@router.post("/generate-key")
async def generate_idempotency_key(
    current_user: User = Depends(get_current_user)
):
    """
    Generate a new idempotency key for API requests.
    
    This endpoint generates a unique idempotency key that can be used
    in subsequent API requests to ensure idempotency.
    """
    key = create_idempotency_key()
    return {
        "idempotency_key": key,
        "expires_in_hours": 24,
        "usage": "Include this key in the 'Idempotency-Key' header of your requests"
    }

@router.get("/keys")
async def list_idempotency_keys(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    expired_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List idempotency keys for the current user.
    
    - **skip**: Number of records to skip
    - **limit**: Maximum number of records to return
    - **expired_only**: If true, only return expired keys
    """
    query = db.query(IdempotencyKey).filter(IdempotencyKey.user_id == current_user.id)
    
    if expired_only:
        query = query.filter(IdempotencyKey.expires_at < datetime.utcnow())
    else:
        query = query.filter(IdempotencyKey.expires_at >= datetime.utcnow())
    
    keys = query.offset(skip).limit(limit).all()
    
    return {
        "keys": [
            {
                "id": str(key.id),
                "key": key.key,
                "created_at": key.created_at,
                "expires_at": key.expires_at,
                "status_code": key.status_code,
                "is_expired": key.expires_at < datetime.utcnow()
            }
            for key in keys
        ],
        "total": query.count(),
        "skip": skip,
        "limit": limit
    }

@router.delete("/keys/{key_id}")
async def delete_idempotency_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific idempotency key.
    """
    key = db.query(IdempotencyKey).filter(
        IdempotencyKey.id == key_id,
        IdempotencyKey.user_id == current_user.id
    ).first()
    
    if not key:
        raise HTTPException(status_code=404, detail="Idempotency key not found")
    
    db.delete(key)
    db.commit()
    
    return {"message": "Idempotency key deleted successfully"}

@router.post("/cleanup")
async def cleanup_expired_idempotency_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clean up expired idempotency keys.
    
    This endpoint removes all expired idempotency keys from the database.
    """
    expired_count = cleanup_expired_keys(db)
    
    return {
        "message": f"Cleaned up {expired_count} expired idempotency keys",
        "expired_count": expired_count
    }

@router.get("/stats")
async def get_idempotency_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get idempotency statistics for the current user.
    """
    total_keys = db.query(IdempotencyKey).filter(IdempotencyKey.user_id == current_user.id).count()
    
    active_keys = db.query(IdempotencyKey).filter(
        IdempotencyKey.user_id == current_user.id,
        IdempotencyKey.expires_at >= datetime.utcnow()
    ).count()
    
    expired_keys = total_keys - active_keys
    
    # Get keys created in the last 24 hours
    last_24h = datetime.utcnow() - timedelta(hours=24)
    recent_keys = db.query(IdempotencyKey).filter(
        IdempotencyKey.user_id == current_user.id,
        IdempotencyKey.created_at >= last_24h
    ).count()
    
    return {
        "total_keys": total_keys,
        "active_keys": active_keys,
        "expired_keys": expired_keys,
        "recent_keys_24h": recent_keys
    }
