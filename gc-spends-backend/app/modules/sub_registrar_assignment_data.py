"""
Sub-Registrar Assignment Data API Module
Handles sub-registrar enrichment data
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.db import get_db
from app.models import SubRegistrarAssignmentData, PaymentRequest, User
from app.schemas.sub_registrar_assignment_data import (
    SubRegistrarAssignmentDataCreate,
    SubRegistrarAssignmentDataUpdate,
    SubRegistrarAssignmentDataOut,
    SubRegistrarAssignmentDataListOut
)
from app.core.security import get_current_user_id

router = APIRouter(prefix="/sub-registrar-assignment-data", tags=["sub-registrar-assignment-data"])


@router.post("/", response_model=SubRegistrarAssignmentDataOut, status_code=status.HTTP_201_CREATED)
async def create_sub_registrar_assignment_data(
    assignment_data: SubRegistrarAssignmentDataCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Create sub-registrar assignment data"""
    
    # Check if request exists
    request = db.query(PaymentRequest).filter(PaymentRequest.id == assignment_data.request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found"
        )
    
    # Check if assignment data already exists
    existing_data = db.query(SubRegistrarAssignmentData).filter(
        SubRegistrarAssignmentData.request_id == assignment_data.request_id
    ).first()
    if existing_data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sub-registrar assignment data already exists for this request"
        )
    
    # Get current user
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create new assignment data
    data = SubRegistrarAssignmentData(
        request_id=assignment_data.request_id,
        sub_registrar_id=current_user.id,
        document_type=assignment_data.document_type,
        document_number=assignment_data.document_number,
        document_date=assignment_data.document_date,
        amount_without_vat=assignment_data.amount_without_vat,
        vat_amount=assignment_data.vat_amount,
        currency_code=assignment_data.currency_code,
        original_document_status=assignment_data.original_document_status,
        sub_registrar_comments=assignment_data.sub_registrar_comments,
        is_draft=assignment_data.is_draft,
        is_published=assignment_data.is_published
    )
    
    db.add(data)
    db.commit()
    db.refresh(data)
    
    return data


@router.get("/{request_id}", response_model=SubRegistrarAssignmentDataOut)
async def get_sub_registrar_assignment_data(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get sub-registrar assignment data by request ID"""
    
    data = db.query(SubRegistrarAssignmentData).filter(
        SubRegistrarAssignmentData.request_id == request_id
    ).first()
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sub-registrar assignment data not found"
        )
    
    return data


@router.put("/{request_id}", response_model=SubRegistrarAssignmentDataOut)
async def update_sub_registrar_assignment_data(
    request_id: UUID,
    assignment_data: SubRegistrarAssignmentDataUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Update sub-registrar assignment data"""
    
    data = db.query(SubRegistrarAssignmentData).filter(
        SubRegistrarAssignmentData.request_id == request_id
    ).first()
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sub-registrar assignment data not found"
        )
    
    # Update fields
    if assignment_data.document_type is not None:
        data.document_type = assignment_data.document_type
    if assignment_data.document_number is not None:
        data.document_number = assignment_data.document_number
    if assignment_data.document_date is not None:
        data.document_date = assignment_data.document_date
    if assignment_data.amount_without_vat is not None:
        data.amount_without_vat = assignment_data.amount_without_vat
    if assignment_data.vat_amount is not None:
        data.vat_amount = assignment_data.vat_amount
    if assignment_data.currency_code is not None:
        data.currency_code = assignment_data.currency_code
    if assignment_data.original_document_status is not None:
        data.original_document_status = assignment_data.original_document_status
    if assignment_data.sub_registrar_comments is not None:
        data.sub_registrar_comments = assignment_data.sub_registrar_comments
    if assignment_data.is_draft is not None:
        data.is_draft = assignment_data.is_draft
    if assignment_data.is_published is not None:
        data.is_published = assignment_data.is_published
        if assignment_data.is_published:
            from datetime import datetime
            data.published_at = datetime.utcnow()
    
    db.commit()
    db.refresh(data)
    
    return data


@router.post("/{request_id}/publish", response_model=SubRegistrarAssignmentDataOut)
async def publish_sub_registrar_assignment_data(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Publish sub-registrar assignment data"""
    
    data = db.query(SubRegistrarAssignmentData).filter(
        SubRegistrarAssignmentData.request_id == request_id
    ).first()
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sub-registrar assignment data not found"
        )
    
    # Publish the data
    data.is_draft = False
    data.is_published = True
    from datetime import datetime
    data.published_at = datetime.utcnow()
    
    # Update the payment request status to 'report_published'
    request = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    if request:
        from app.common.enums import PaymentRequestStatus
        request.status = PaymentRequestStatus.REPORT_PUBLISHED.value
        request.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(data)
    
    return data


@router.get("/", response_model=SubRegistrarAssignmentDataListOut)
async def list_sub_registrar_assignment_data(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """List sub-registrar assignment data"""
    
    data_list = db.query(SubRegistrarAssignmentData).offset(skip).limit(limit).all()
    total = db.query(SubRegistrarAssignmentData).count()
    
    return SubRegistrarAssignmentDataListOut(
        assignments=data_list,
        total=total,
        skip=skip,
        limit=limit
    )
