"""
Registrar Assignment API Module
Handles registrar classification assignments
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.db import get_db
from app.models import RegistrarAssignment, PaymentRequest, User, ExpenseArticle
from app.schemas.registrar_assignment import (
    RegistrarAssignmentCreate,
    RegistrarAssignmentUpdate,
    RegistrarAssignmentOut,
    RegistrarAssignmentListOut
)
from app.core.security import get_current_user_id

router = APIRouter(prefix="/registrar-assignments", tags=["registrar-assignments"])


@router.post("/", response_model=RegistrarAssignmentOut, status_code=status.HTTP_201_CREATED)
async def create_registrar_assignment(
    assignment_data: RegistrarAssignmentCreate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Create a new registrar assignment"""
    
    # Check if request exists
    request = db.query(PaymentRequest).filter(PaymentRequest.id == assignment_data.request_id).first()
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment request not found"
        )
    
    # Check if request is in submitted status (only submitted requests can be classified)
    from app.common.enums import PaymentRequestStatus
    if request.status != PaymentRequestStatus.SUBMITTED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request must be in submitted status to be classified. Current status: {request.status}"
        )
    
    # Check if assignment already exists
    existing_assignment = db.query(RegistrarAssignment).filter(
        RegistrarAssignment.request_id == assignment_data.request_id
    ).first()
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registrar assignment already exists for this request"
        )
    
    # Get current user
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create new assignment
    assignment = RegistrarAssignment(
        request_id=assignment_data.request_id,
        registrar_id=current_user.id,
        assigned_sub_registrar_id=assignment_data.assigned_sub_registrar_id,
        expense_article_id=assignment_data.expense_article_id,
        assigned_amount=assignment_data.assigned_amount,
        registrar_comments=assignment_data.registrar_comments
    )
    
    # Update payment request status to 'classified'
    from app.common.enums import PaymentRequestStatus
    from datetime import datetime
    request.status = PaymentRequestStatus.CLASSIFIED.value
    request.updated_at = datetime.utcnow()
    
    # Create request event
    from app.models import RequestEvent
    event = RequestEvent(
        request_id=assignment_data.request_id,
        event_type="CLASSIFIED",
        actor_user_id=current_user.id,
        payload=f"Request classified by registrar and assigned to sub-registrar"
    )
    db.add(event)
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return assignment


@router.get("/{request_id}", response_model=RegistrarAssignmentOut)
async def get_registrar_assignment(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get registrar assignment by request ID"""
    
    assignment = db.query(RegistrarAssignment).filter(
        RegistrarAssignment.request_id == request_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registrar assignment not found"
        )
    
    return assignment


@router.put("/{request_id}", response_model=RegistrarAssignmentOut)
async def update_registrar_assignment(
    request_id: UUID,
    assignment_data: RegistrarAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Update registrar assignment"""
    
    assignment = db.query(RegistrarAssignment).filter(
        RegistrarAssignment.request_id == request_id
    ).first()
    
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registrar assignment not found"
        )
    
    # Update fields
    if assignment_data.assigned_sub_registrar_id is not None:
        assignment.assigned_sub_registrar_id = assignment_data.assigned_sub_registrar_id
    if assignment_data.expense_article_id is not None:
        assignment.expense_article_id = assignment_data.expense_article_id
    if assignment_data.assigned_amount is not None:
        assignment.assigned_amount = assignment_data.assigned_amount
    if assignment_data.registrar_comments is not None:
        assignment.registrar_comments = assignment_data.registrar_comments
    
    db.commit()
    db.refresh(assignment)
    
    return assignment


@router.get("/", response_model=RegistrarAssignmentListOut)
async def list_registrar_assignments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """List registrar assignments"""
    
    assignments = db.query(RegistrarAssignment).offset(skip).limit(limit).all()
    total = db.query(RegistrarAssignment).count()
    
    return RegistrarAssignmentListOut(
        assignments=assignments,
        total=total,
        skip=skip,
        limit=limit
    )
