# app/modules/priority/router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.db import get_db
from app.core.priority import PriorityCalculationService, create_default_priority_rules
from app.models import PaymentRequest, PaymentPriorityRule, PaymentPriority
from app.core.security import get_current_user
from app.models import User
from pydantic import BaseModel

router = APIRouter(prefix="/priority", tags=["priority"])

class PriorityRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    priority: PaymentPriority
    conditions: dict
    is_active: bool = True

class PriorityRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[PaymentPriority] = None
    conditions: Optional[dict] = None
    is_active: Optional[bool] = None

@router.post("/rules")
async def create_priority_rule(
    rule_data: PriorityRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new priority rule.
    """
    rule = PaymentPriorityRule(
        name=rule_data.name,
        description=rule_data.description,
        priority=rule_data.priority,
        conditions=rule_data.conditions,
        is_active=rule_data.is_active,
        created_by=current_user.id
    )
    
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    return {
        "id": str(rule.id),
        "name": rule.name,
        "description": rule.description,
        "priority": rule.priority,
        "conditions": rule.conditions,
        "is_active": rule.is_active,
        "created_at": rule.created_at
    }

@router.get("/rules")
async def list_priority_rules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    List priority rules.
    
    - **skip**: Number of records to skip
    - **limit**: Maximum number of records to return
    - **active_only**: If true, only return active rules
    """
    query = db.query(PaymentPriorityRule)
    
    if active_only:
        query = query.filter(PaymentPriorityRule.is_active == True)
    
    rules = query.offset(skip).limit(limit).all()
    
    return {
        "rules": [
            {
                "id": str(rule.id),
                "name": rule.name,
                "description": rule.description,
                "priority": rule.priority,
                "conditions": rule.conditions,
                "is_active": rule.is_active,
                "created_at": rule.created_at,
                "updated_at": rule.updated_at
            }
            for rule in rules
        ],
        "total": query.count(),
        "skip": skip,
        "limit": limit
    }

@router.get("/rules/{rule_id}")
async def get_priority_rule(
    rule_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific priority rule by ID.
    """
    rule = db.query(PaymentPriorityRule).filter(PaymentPriorityRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Priority rule not found")
    
    return {
        "id": str(rule.id),
        "name": rule.name,
        "description": rule.description,
        "priority": rule.priority,
        "conditions": rule.conditions,
        "is_active": rule.is_active,
        "created_at": rule.created_at,
        "updated_at": rule.updated_at
    }

@router.put("/rules/{rule_id}")
async def update_priority_rule(
    rule_id: str,
    rule_data: PriorityRuleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a priority rule.
    """
    rule = db.query(PaymentPriorityRule).filter(PaymentPriorityRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Priority rule not found")
    
    # Update fields if provided
    if rule_data.name is not None:
        rule.name = rule_data.name
    if rule_data.description is not None:
        rule.description = rule_data.description
    if rule_data.priority is not None:
        rule.priority = rule_data.priority
    if rule_data.conditions is not None:
        rule.conditions = rule_data.conditions
    if rule_data.is_active is not None:
        rule.is_active = rule_data.is_active
    
    db.commit()
    db.refresh(rule)
    
    return {
        "id": str(rule.id),
        "name": rule.name,
        "description": rule.description,
        "priority": rule.priority,
        "conditions": rule.conditions,
        "is_active": rule.is_active,
        "updated_at": rule.updated_at
    }

@router.delete("/rules/{rule_id}")
async def delete_priority_rule(
    rule_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a priority rule.
    """
    rule = db.query(PaymentPriorityRule).filter(PaymentPriorityRule.id == rule_id).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Priority rule not found")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Priority rule deleted successfully"}

@router.post("/calculate/{request_id}")
async def calculate_request_priority(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate priority for a specific payment request.
    """
    request = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Payment request not found")
    
    priority_service = PriorityCalculationService(db)
    priority, score = priority_service.calculate_priority(request)
    
    # Update the request with calculated priority
    request.priority = priority
    request.priority_score = score
    db.commit()
    
    return {
        "request_id": str(request.id),
        "calculated_priority": priority,
        "priority_score": score,
        "previous_priority": request.priority
    }

@router.get("/statistics")
async def get_priority_statistics(
    db: Session = Depends(get_db)
):
    """
    Get priority statistics for payment requests.
    """
    priority_service = PriorityCalculationService(db)
    stats = priority_service.get_priority_statistics()
    
    return {
        "priority_distribution": stats,
        "escalation_rules": priority_service.get_priority_escalation_rules()
    }

@router.post("/initialize-defaults")
async def initialize_default_priority_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Initialize default priority rules for the system.
    """
    create_default_priority_rules(db)
    
    return {"message": "Default priority rules initialized successfully"}

@router.get("/escalation-check")
async def check_escalation_requirements(
    db: Session = Depends(get_db)
):
    """
    Check which payment requests require escalation.
    """
    priority_service = PriorityCalculationService(db)
    
    # Get all payment requests that might need escalation
    requests = db.query(PaymentRequest).filter(
        PaymentRequest.deleted == False,
        PaymentRequest.priority.in_([
            PaymentPriority.HIGH,
            PaymentPriority.URGENT,
            PaymentPriority.CRITICAL
        ])
    ).all()
    
    escalation_required = []
    
    for request in requests:
        if priority_service.should_escalate(request):
            escalation_required.append({
                "request_id": str(request.id),
                "priority": request.priority,
                "created_at": request.created_at,
                "due_date": request.due_date
            })
    
    return {
        "escalation_required": escalation_required,
        "count": len(escalation_required)
    }
