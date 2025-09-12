from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
# from app.core.security import get_current_user_id
from app.models import PaymentRequest
from pydantic import BaseModel
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import func

router = APIRouter(prefix="/registry", tags=["registry"])

# Schemas for payment registry
class RegistryEntryOut(BaseModel):
    id: uuid.UUID
    request_id: uuid.UUID
    request_number: str
    title: str
    counterparty_id: uuid.UUID
    amount_total: float
    currency_code: str
    due_date: str
    status: str
    added_at: datetime

class RegistryEntryCreate(BaseModel):
    request_id: uuid.UUID
    comment: str | None = None

class RegistryStatistics(BaseModel):
    total_entries: int
    total_amount: float
    currency: str
    overdue_count: int
    due_today_count: int

# Payment registry endpoints
@router.get("", response_model=List[RegistryEntryOut])
def get_payment_registry(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PaymentRequest).filter(and_(PaymentRequest.status == "IN_REGISTRY", PaymentRequest.deleted == False))
    
    if status:
        query = query.filter(PaymentRequest.status == status)
    
    requests = query.order_by(PaymentRequest.due_date).all()
    
    registry_entries = []
    for req in requests:
        entry = RegistryEntryOut(
            id=req.id,
            request_id=req.id,
            request_number=req.number,
            title=req.title,
            counterparty_id=req.counterparty_id,
            amount_total=float(req.amount_total),
            currency_code=req.currency_code,
            due_date=req.due_date.isoformat(),
            status=req.status,
            added_at=datetime.now()  # This would be tracked in a separate table in production
        )
        registry_entries.append(entry)
    
    return registry_entries

@router.get("/statistics", response_model=RegistryStatistics)
def get_registry_statistics(db: Session = Depends(get_db)):
    """Get payment registry statistics"""
    # Get all requests in registry
    registry_requests = db.query(PaymentRequest).filter(and_(PaymentRequest.status == "IN_REGISTRY", PaymentRequest.deleted == False)).all()
    
    total_entries = len(registry_requests)
    total_amount = sum(req.amount_total for req in registry_requests)
    
    # Calculate overdue and due today
    from datetime import date
    today = date.today()
    overdue_count = len([req for req in registry_requests if req.due_date < today])
    due_today_count = len([req for req in registry_requests if req.due_date == today])
    
    return RegistryStatistics(
        total_entries=total_entries,
        total_amount=total_amount,
        currency="KZT",  # Default currency
        overdue_count=overdue_count,
        due_today_count=due_today_count
    )

@router.get("/{registry_id}", response_model=RegistryEntryOut)
def get_registry_entry(registry_id: uuid.UUID, db: Session = Depends(get_db)):
    request = db.query(PaymentRequest).filter(
        PaymentRequest.deleted == False
    ).filter(
        PaymentRequest.id == registry_id,
        PaymentRequest.status == "IN_REGISTRY"
    ).first()
    
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registry entry not found")
    
    return RegistryEntryOut(
        id=request.id,
        request_id=request.id,
        request_number=request.number,
        title=request.title,
        counterparty_id=request.counterparty_id,
        amount_total=float(request.amount_total),
        currency_code=request.currency_code,
        due_date=request.due_date.isoformat(),
        status=request.status,
        added_at=datetime.now()
    )

@router.post("", response_model=RegistryEntryOut)
def create_registry_entry(
    payload: RegistryEntryCreate,
    db: Session = Depends(get_db)
):
    # Check if request exists and is approved
    request = db.query(PaymentRequest).filter(
        PaymentRequest.deleted == False
    ).filter(PaymentRequest.id == payload.request_id).first()
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    
    if request.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail="Only approved requests can be added to registry"
        )
    
    # Update request status to IN_REGISTRY
    request.status = "IN_REGISTRY"
    db.commit()
    db.refresh(request)
    
    return RegistryEntryOut(
        id=request.id,
        request_id=request.id,
        request_number=request.number,
        title=request.title,
        counterparty_id=request.counterparty_id,
        amount_total=float(request.amount_total),
        currency_code=request.currency_code,
        due_date=request.due_date.isoformat(),
        status=request.status,
        added_at=datetime.now()
    )

@router.put("/{registry_id}", response_model=RegistryEntryOut)
def update_registry_entry(
    registry_id: uuid.UUID,
    payload: RegistryEntryCreate,
    db: Session = Depends(get_db)
):
    request = db.query(PaymentRequest).filter(
        PaymentRequest.deleted == False
    ).filter(
        PaymentRequest.id == registry_id,
        PaymentRequest.status == "IN_REGISTRY"
    ).first()
    
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registry entry not found")
    
    # Update request if needed (for now, just return the existing entry)
    db.commit()
    db.refresh(request)
    
    return RegistryEntryOut(
        id=request.id,
        request_id=request.id,
        request_number=request.number,
        title=request.title,
        counterparty_id=request.counterparty_id,
        amount_total=float(request.amount_total),
        currency_code=request.currency_code,
        due_date=request.due_date.isoformat(),
        status=request.status,
        added_at=datetime.now()
    )

@router.delete("/{registry_id}", status_code=204)
def remove_from_registry(
    registry_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    request = db.query(PaymentRequest).filter(
        PaymentRequest.deleted == False
    ).filter(
        PaymentRequest.id == registry_id,
        PaymentRequest.status == "IN_REGISTRY"
    ).first()
    
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registry entry not found")
    
    # Change status back to APPROVED
    request.status = "APPROVED"
    db.commit()
    
    return None
