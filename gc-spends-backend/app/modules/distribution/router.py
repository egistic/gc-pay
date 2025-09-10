from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.core.db import get_db
from app.models import PaymentRequest, ExpenseSplit, Contract, Counterparty, ExpenseArticle, User, UserRole, Role
from app.common.enums import RequestStatus, RoleCode
from app.modules.users.schemas import UserOut
from . import schemas
import uuid
from datetime import date, datetime
from typing import List, Optional

router = APIRouter(prefix="/distribution", tags=["distribution"])

@router.get("/contract-status/{counterparty_id}", response_model=schemas.ContractStatusOut)
def get_contract_status(counterparty_id: uuid.UUID, db: Session = Depends(get_db)):
    """Check if counterparty has an active contract for elevator or service provider categories"""
    
    # Get counterparty
    counterparty = db.query(Counterparty).filter(Counterparty.id == counterparty_id).first()
    if not counterparty:
        raise HTTPException(status_code=404, detail="Counterparty not found")
    
    # Check if counterparty category requires contract check
    if counterparty.category not in ["Элеватор", "Поставщик Услуг"]:
        return schemas.ContractStatusOut(has_contract=False)
    
    # Look for active contract
    contract = db.query(Contract).filter(
        and_(
            Contract.counterparty_id == counterparty_id,
            Contract.is_active == True,
            Contract.contract_type.in_(["elevator", "service_provider"])
        )
    ).first()
    
    if contract:
        return schemas.ContractStatusOut(
            has_contract=True,
            contract_number=contract.contract_number,
            contract_date=contract.contract_date,
            contract_type=contract.contract_type,
            validity_period=contract.validity_period,
            rates=contract.rates,
            contract_info=contract.contract_info,
            contract_file_url=contract.contract_file_url
        )
    else:
        return schemas.ContractStatusOut(has_contract=False)

@router.get("/sub-registrars", response_model=List[UserOut])
def get_sub_registrars(db: Session = Depends(get_db)):
    """Get all users with SUB_REGISTRAR role"""
    
    # Get SUB_REGISTRAR role
    sub_registrar_role = db.query(Role).filter(Role.code == RoleCode.SUB_REGISTRAR.value).first()
    if not sub_registrar_role:
        return []
    
    # Get users with SUB_REGISTRAR role
    user_roles = db.query(UserRole).filter(
        and_(
            UserRole.role_id == sub_registrar_role.id,
            UserRole.valid_from <= date.today(),
            UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
        )
    ).all()
    
    user_ids = [ur.user_id for ur in user_roles]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    
    return [UserOut.model_validate(user.__dict__) for user in users]

@router.post("/classify", response_model=schemas.DistributionOut)
def classify_request(payload: schemas.DistributionCreate, db: Session = Depends(get_db)):
    """Classify payment request and assign to sub-registrar"""
    
    # Validate request exists and is in correct status
    request = db.query(PaymentRequest).filter(PaymentRequest.id == payload.request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.status not in [RequestStatus.APPROVED.value, RequestStatus.REGISTERED.value]:
        raise HTTPException(
            status_code=400, 
            detail="Request must be approved or registered to be classified"
        )
    
    # Validate responsible registrar exists and has correct role
    registrar = db.query(User).filter(User.id == payload.responsible_registrar_id).first()
    if not registrar:
        raise HTTPException(status_code=404, detail="Responsible registrar not found")
    
    # Check if user has SUB_REGISTRAR role
    sub_registrar_role = db.query(Role).filter(Role.code == RoleCode.SUB_REGISTRAR.value).first()
    if sub_registrar_role:
        user_role = db.query(UserRole).filter(
            and_(
                UserRole.user_id == payload.responsible_registrar_id,
                UserRole.role_id == sub_registrar_role.id,
                UserRole.valid_from <= date.today(),
                UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
            )
        ).first()
        if not user_role:
            raise HTTPException(
                status_code=400, 
                detail="User does not have SUB_REGISTRAR role"
            )
    
    # Validate expense splits
    total_amount = sum(split.amount for split in payload.expense_splits)
    if abs(total_amount - request.amount_total) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Total split amount ({total_amount}) must equal request amount ({request.amount_total})"
        )
    
    # Validate expense items exist
    expense_item_ids = [split.expense_item_id for split in payload.expense_splits]
    existing_items = db.query(ExpenseArticle).filter(ExpenseArticle.id.in_(expense_item_ids)).all()
    if len(existing_items) != len(expense_item_ids):
        raise HTTPException(status_code=400, detail="One or more expense items not found")
    
    # Delete existing expense splits for this request
    db.query(ExpenseSplit).filter(ExpenseSplit.request_id == payload.request_id).delete()
    
    # Create new expense splits
    expense_splits = []
    for split_data in payload.expense_splits:
        expense_split = ExpenseSplit(
            request_id=payload.request_id,
            expense_item_id=split_data.expense_item_id,
            amount=split_data.amount,
            comment=split_data.comment,
            contract_id=split_data.contract_id,
            priority=split_data.priority
        )
        db.add(expense_split)
        expense_splits.append(expense_split)
    
    # Update request with responsible registrar
    request.responsible_registrar_id = payload.responsible_registrar_id
    request.status = RequestStatus.IN_REGISTRY.value
    
    # Create request event
    from app.models import RequestEvent
    event = RequestEvent(
        request_id=payload.request_id,
        event_type="CLASSIFIED",
        actor_user_id=payload.responsible_registrar_id,
        payload=f"Request classified and assigned to sub-registrar. Total amount: {total_amount}"
    )
    db.add(event)
    
    db.commit()
    db.refresh(request)
    
    # Refresh expense splits to get IDs
    for split in expense_splits:
        db.refresh(split)
    
    return schemas.DistributionOut(
        request_id=request.id,
        responsible_registrar_id=request.responsible_registrar_id,
        expense_splits=[schemas.ExpenseSplitOut.model_validate(split.__dict__) for split in expense_splits],
        comment=payload.comment,
        total_amount=total_amount
    )

@router.post("/return", response_model=schemas.ReturnRequestOut)
def return_request(payload: schemas.ReturnRequestCreate, db: Session = Depends(get_db)):
    """Return request to executor for revision"""
    
    # Validate request exists
    request = db.query(PaymentRequest).filter(PaymentRequest.id == payload.request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request.status not in [RequestStatus.APPROVED.value, RequestStatus.REGISTERED.value, RequestStatus.IN_REGISTRY.value]:
        raise HTTPException(
            status_code=400,
            detail="Request cannot be returned in current status"
        )
    
    # Update request status
    request.status = RequestStatus.RETURNED.value
    
    # Create request event
    from app.models import RequestEvent
    event = RequestEvent(
        request_id=payload.request_id,
        event_type="RETURNED",
        actor_user_id=request.created_by_user_id,  # Assuming current user is the one returning
        payload=f"Request returned to executor: {payload.comment}"
    )
    db.add(event)
    
    db.commit()
    db.refresh(request)
    
    return schemas.ReturnRequestOut(
        request_id=request.id,
        comment=payload.comment,
        returned_at=datetime.now().isoformat()
    )

@router.get("/expense-splits/{request_id}", response_model=List[schemas.ExpenseSplitOut])
def get_expense_splits(request_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get expense splits for a request"""
    
    expense_splits = db.query(ExpenseSplit).filter(ExpenseSplit.request_id == request_id).all()
    return [schemas.ExpenseSplitOut.model_validate(split.__dict__) for split in expense_splits]

