from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.core.db import get_db
from app.models import PaymentRequest, ExpenseSplit, Contract, Counterparty, ExpenseArticle, User, UserRole, Role, SubRegistrarAssignment, DistributorRequest
from app.common.enums import RequestStatus, RoleCode
from app.modules.users.schemas import UserOut
from app.core.security import get_current_user
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
    request = db.query(PaymentRequest).filter(and_(PaymentRequest.id == payload.request_id, PaymentRequest.deleted == False)).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    print(f"DEBUG: Request {request.id} has status: {request.status}")
    print(f"DEBUG: Allowed statuses: {[RequestStatus.APPROVED.value, RequestStatus.REGISTERED.value, RequestStatus.SUBMITTED.value]}")
    
    if request.status not in [RequestStatus.APPROVED.value, RequestStatus.REGISTERED.value, RequestStatus.SUBMITTED.value]:
        raise HTTPException(
            status_code=400, 
            detail=f"Request must be approved, registered, or submitted to be classified. Current status: {request.status}"
        )
    
    # Validate responsible registrar exists and has correct role
    registrar = db.query(User).filter(User.id == payload.responsible_registrar_id).first()
    if not registrar:
        raise HTTPException(status_code=404, detail="Responsible registrar not found")
    
    # Check if user has REGISTRAR role
    registrar_role = db.query(Role).filter(Role.code == RoleCode.REGISTRAR.value).first()
    if registrar_role:
        user_role = db.query(UserRole).filter(
            and_(
                UserRole.user_id == payload.responsible_registrar_id,
                UserRole.role_id == registrar_role.id,
                UserRole.valid_from <= date.today(),
                UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
            )
        ).first()
        if not user_role:
            raise HTTPException(
                status_code=400, 
                detail="User does not have REGISTRAR role"
            )
    
    # Validate expense splits
    total_amount = sum(split.amount for split in payload.expense_splits)
    if abs(total_amount - float(request.amount_total)) > 0.01:
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
        expense_splits=[schemas.ExpenseSplitOut.model_validate({
            **split.__dict__,
            'created_at': split.created_at.isoformat() if split.created_at else None,
            'updated_at': split.updated_at.isoformat() if split.updated_at else None
        }) for split in expense_splits],
        comment=payload.comment,
        total_amount=total_amount
    )

@router.post("/return", response_model=schemas.ReturnRequestOut)
def return_request(payload: schemas.ReturnRequestCreate, db: Session = Depends(get_db)):
    """Return request to executor for revision"""
    
    # Validate request exists
    request = db.query(PaymentRequest).filter(and_(PaymentRequest.id == payload.request_id, PaymentRequest.deleted == False)).first()
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
    return [schemas.ExpenseSplitOut.model_validate({
        **split.__dict__,
        'created_at': split.created_at.isoformat() if split.created_at else None,
        'updated_at': split.updated_at.isoformat() if split.updated_at else None
    }) for split in expense_splits]

# New Parallel Distribution Endpoints

@router.get("/pending-requests", response_model=List[schemas.PendingRequestOut])
def get_pending_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get requests pending distribution"""
    # Verify user has REGISTRAR role
    if not any(role.role.code == "REGISTRAR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. REGISTRAR role required."
        )
    
    # Get requests that are approved/registered and pending distribution
    requests = db.query(PaymentRequest).filter(
        PaymentRequest.deleted == False
    ).filter(
        and_(
            PaymentRequest.status.in_([RequestStatus.APPROVED.value, RequestStatus.REGISTERED.value]),
            PaymentRequest.distribution_status == "PENDING"
        )
    ).offset(skip).limit(limit).all()
    
    return requests

@router.post("/send-requests", response_model=schemas.ParallelDistributionOut)
def send_requests_parallel(
    payload: schemas.ParallelDistributionCreate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Send requests to both SUB_REGISTRAR and DISTRIBUTOR in parallel"""
    # Verify user has REGISTRAR role
    registrar_role = db.query(Role).filter(Role.code == RoleCode.REGISTRAR.value).first()
    if registrar_role:
        user_role = db.query(UserRole).filter(
            and_(
                UserRole.user_id == current_user.id,
                UserRole.role_id == registrar_role.id,
                UserRole.valid_from <= date.today(),
                UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
            )
        ).first()
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. REGISTRAR role required."
            )
    
    # Check if this is a split request
    is_split_request = payload.original_request_id is not None
    
    if is_split_request:
        # For split requests, find the original request
        request = db.query(PaymentRequest).filter(and_(PaymentRequest.id == payload.original_request_id, PaymentRequest.deleted == False)).first()
        if not request:
            raise HTTPException(status_code=404, detail="Original request not found")
    else:
        # For regular requests, find by request_id
        request = db.query(PaymentRequest).filter(and_(PaymentRequest.id == payload.request_id, PaymentRequest.deleted == False)).first()
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
    
    # Validate request status
    if request.status not in [RequestStatus.APPROVED.value, RequestStatus.REGISTERED.value]:
        raise HTTPException(
            status_code=400, 
            detail="Request must be approved or registered to be distributed"
        )
    
    # Validate sub-registrar exists and has correct role
    sub_registrar = db.query(User).filter(User.id == payload.sub_registrar_id).first()
    if not sub_registrar:
        raise HTTPException(status_code=404, detail="Sub-registrar not found")
    
    # Validate distributor exists and has correct role
    distributor = db.query(User).filter(User.id == payload.distributor_id).first()
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")
    
    # Validate expense splits
    total_amount = sum(split.amount for split in payload.expense_splits)
    
    # For split requests, we don't validate against original request amount
    if not is_split_request and abs(total_amount - float(request.amount_total)) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Total split amount ({total_amount}) must equal request amount ({request.amount_total})"
        )
    
    # Validate expense items exist
    expense_item_ids = [split.expense_item_id for split in payload.expense_splits]
    existing_items = db.query(ExpenseArticle).filter(ExpenseArticle.id.in_(expense_item_ids)).all()
    if len(existing_items) != len(expense_item_ids):
        raise HTTPException(status_code=400, detail="One or more expense items not found")
    
    try:
        # If this is a split request, create a new payment request
        if is_split_request:
            # Generate new request number with suffix based on existing splits
            existing_splits = db.query(PaymentRequest).filter(
                PaymentRequest.deleted == False
            ).filter(
                PaymentRequest.number.like(f"{request.number}-%")
            ).count()
            split_number = existing_splits + 1
            
            new_request = PaymentRequest(
                id=payload.request_id,
                number=f"{request.number}-{split_number}",
                title=f"{request.title} (Часть {split_number})",
                amount_total=total_amount,
                currency_code=request.currency_code,
                counterparty_id=request.counterparty_id,
                created_by_user_id=request.created_by_user_id,
                status=RequestStatus.SUBMITTED.value,
                distribution_status="DISTRIBUTED",
                # Copy all required fields from original request
                due_date=request.due_date,
                vat_total=request.vat_total,
                expense_article_text=request.expense_article_text,
                doc_number=request.doc_number,
                doc_date=request.doc_date,
                doc_type=request.doc_type,
                paying_company=request.paying_company,
                counterparty_category=request.counterparty_category,
                vat_rate=request.vat_rate,
                product_service=request.product_service,
                volume=request.volume,
                price_rate=request.price_rate,
                period=request.period,
                responsible_registrar_id=request.responsible_registrar_id
            )
            db.add(new_request)
            
            # Flush to ensure the new request is available for foreign key references
            db.flush()
            
            # Create expense splits for the new request
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
        
        # Create sub-registrar assignment
        # For split requests, use the new request ID; for regular requests, use the original request ID
        assignment_request_id = payload.request_id if is_split_request else request.id
        sub_registrar_assignment = SubRegistrarAssignment(
            request_id=assignment_request_id,
            sub_registrar_id=payload.sub_registrar_id,
            status="ASSIGNED"
        )
        db.add(sub_registrar_assignment)
        
        # Create distributor requests (one per expense article)
        distributor_requests = []
        for split_data in payload.expense_splits:
            # For split requests, use the new request ID; for regular requests, use the original request ID
            original_request_id = payload.request_id if is_split_request else request.id
            distributor_request = DistributorRequest(
                original_request_id=original_request_id,
                expense_article_id=split_data.expense_item_id,
                amount=split_data.amount,
                distributor_id=payload.distributor_id,
                status="PENDING"
            )
            db.add(distributor_request)
            distributor_requests.append(distributor_request)
        
        # Flush to generate IDs for distributor requests
        db.flush()
        
        # Extract IDs after flush
        distributor_request_ids = [dr.id for dr in distributor_requests]
        
        # Update request status
        if not is_split_request:
            request.distribution_status = "DISTRIBUTED"
            request.status = RequestStatus.IN_REGISTRY.value
        
        # Create request event
        from app.models import RequestEvent
        # For split requests, use the new request ID; for regular requests, use the original request ID
        event_request_id = payload.request_id if is_split_request else request.id
        event = RequestEvent(
            request_id=event_request_id,
            event_type="DISTRIBUTED",
            actor_user_id=current_user.id,
            payload=f"Request distributed to sub-registrar and distributor. Total amount: {total_amount}"
        )
        db.add(event)
        
        db.commit()
        db.refresh(sub_registrar_assignment)
        
        return schemas.ParallelDistributionOut(
            request_id=payload.request_id,
            sub_registrar_assignment_id=sub_registrar_assignment.id,
            distributor_request_ids=distributor_request_ids,
            total_amount=total_amount,
            status="DISTRIBUTED"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to distribute request: {str(e)}"
        )

@router.post("/split-request", response_model=schemas.SplitRequestOut)
def split_request_by_articles(
    payload: schemas.SplitRequestCreate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Split request by expense articles - creates separate requests for each expense article"""
    # Verify user has REGISTRAR role
    registrar_role = db.query(Role).filter(Role.code == RoleCode.REGISTRAR.value).first()
    if registrar_role:
        user_role = db.query(UserRole).filter(
            and_(
                UserRole.user_id == current_user.id,
                UserRole.role_id == registrar_role.id,
                UserRole.valid_from <= date.today(),
                UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
            )
        ).first()
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. REGISTRAR role required."
            )
    
    # Validate that we have at least 2 expense splits for splitting
    if len(payload.expense_splits) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 expense articles are required for splitting a request"
        )
    
    # Get original request
    original_request = db.query(PaymentRequest).filter(and_(PaymentRequest.id == payload.original_request_id, PaymentRequest.deleted == False)).first()
    if not original_request:
        raise HTTPException(status_code=404, detail="Original request not found")
    
    # Validate original request status
    if original_request.status not in [RequestStatus.APPROVED.value, RequestStatus.REGISTERED.value, RequestStatus.SUBMITTED.value]:
        raise HTTPException(
            status_code=400, 
            detail="Original request must be approved, registered, or submitted to be split"
        )
    
    # Validate sub-registrar exists and has correct role
    sub_registrar = db.query(User).filter(User.id == payload.sub_registrar_id).first()
    if not sub_registrar:
        raise HTTPException(status_code=404, detail="Sub-registrar not found")
    
    # Validate distributor exists and has correct role
    distributor = db.query(User).filter(User.id == payload.distributor_id).first()
    if not distributor:
        raise HTTPException(status_code=404, detail="Distributor not found")
    
    # Validate expense items exist
    expense_item_ids = [split.expense_item_id for split in payload.expense_splits]
    existing_items = db.query(ExpenseArticle).filter(ExpenseArticle.id.in_(expense_item_ids)).all()
    if len(existing_items) != len(expense_item_ids):
        raise HTTPException(status_code=400, detail="One or more expense items not found")
    
    # Validate total amount matches original request
    total_amount = sum(split.amount for split in payload.expense_splits)
    if abs(total_amount - float(original_request.amount_total)) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Total split amount ({total_amount}) must equal original request amount ({original_request.amount_total})"
        )
    
    try:
        # Mark original request as deleted (soft delete)
        original_request.deleted = True
        original_request.status = RequestStatus.CANCELLED.value
        original_request.distribution_status = "SPLIT"
        
        # Create split requests - one for each expense article
        split_requests = []
        for i, split_data in enumerate(payload.expense_splits, 1):
            # Generate split request number
            split_number = f"{original_request.number}-{i:02d}"
            
            # Create new payment request for this split
            split_request = PaymentRequest(
                id=uuid.uuid4(),
                number=split_number,
                title=f"{original_request.title} (Статья {i})",
                amount_total=split_data.amount,
                currency_code=original_request.currency_code,
                counterparty_id=original_request.counterparty_id,
                created_by_user_id=original_request.created_by_user_id,
                status=RequestStatus.REGISTERED.value,
                distribution_status="DISTRIBUTED",
                # Copy all informational fields from original request
                due_date=original_request.due_date,
                vat_total=original_request.vat_total,
                expense_article_text=original_request.expense_article_text,
                doc_number=original_request.doc_number,
                doc_date=original_request.doc_date,
                doc_type=original_request.doc_type,
                paying_company=original_request.paying_company,
                counterparty_category=original_request.counterparty_category,
                vat_rate=original_request.vat_rate,
                product_service=original_request.product_service,
                volume=original_request.volume,
                price_rate=original_request.price_rate,
                period=original_request.period,
                responsible_registrar_id=original_request.responsible_registrar_id,
                # Split request specific fields
                original_request_id=original_request.id,
                split_sequence=i,
                is_split_request=True,
                deleted=False  # New split requests are not deleted
            )
            db.add(split_request)
            split_requests.append(split_request)
        
        # Flush to ensure all split requests are created
        db.flush()
        
        # Create expense splits for each split request
        for i, (split_request, split_data) in enumerate(zip(split_requests, payload.expense_splits)):
            expense_split = ExpenseSplit(
                request_id=split_request.id,
                expense_item_id=split_data.expense_item_id,
                amount=split_data.amount,
                comment=split_data.comment,
                contract_id=split_data.contract_id,
                priority=split_data.priority
            )
            db.add(expense_split)
        
        # Create sub-registrar assignments for each split request
        sub_registrar_assignments = []
        for split_request in split_requests:
            assignment = SubRegistrarAssignment(
                request_id=split_request.id,
                sub_registrar_id=payload.sub_registrar_id,
                status="ASSIGNED"
            )
            db.add(assignment)
            sub_registrar_assignments.append(assignment)
        
        # Create distributor requests for each split request
        distributor_requests = []
        for split_request, split_data in zip(split_requests, payload.expense_splits):
            distributor_request = DistributorRequest(
                original_request_id=split_request.id,
                expense_article_id=split_data.expense_item_id,
                amount=split_data.amount,
                distributor_id=payload.distributor_id,
                status="PENDING"
            )
            db.add(distributor_request)
            distributor_requests.append(distributor_request)
        
        # Original request status already updated above (marked as deleted)
        
        # Create request events for original request and each split
        from app.models import RequestEvent
        
        # Event for original request
        original_event = RequestEvent(
            request_id=original_request.id,
            event_type="SPLIT_AND_DELETED",
            actor_user_id=current_user.id,
            payload=f"Request split into {len(split_requests)} separate requests and marked as deleted. Total amount: {total_amount}"
        )
        db.add(original_event)
        
        # Events for each split request
        for i, split_request in enumerate(split_requests, 1):
            split_event = RequestEvent(
                request_id=split_request.id,
                event_type="CREATED_FROM_SPLIT",
                actor_user_id=current_user.id,
                payload=f"Split request created from original request {original_request.number}. Article {i}, Amount: {split_request.amount_total}, Status: CLASSIFIED"
            )
            db.add(split_event)
        
        db.commit()
        
        # Extract IDs after commit
        split_request_ids = [sr.id for sr in split_requests]
        
        return schemas.SplitRequestOut(
            original_request_id=original_request.id,
            split_requests=split_request_ids,
            total_amount=total_amount,
            status="SPLIT"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to split request: {str(e)}"
        )

@router.get("/split-requests/{original_request_id}", response_model=List[schemas.PendingRequestOut])
def get_split_requests(
    original_request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get all split requests for an original request"""
    # Verify user has REGISTRAR role
    registrar_role = db.query(Role).filter(Role.code == RoleCode.REGISTRAR.value).first()
    if registrar_role:
        user_role = db.query(UserRole).filter(
            and_(
                UserRole.user_id == current_user.id,
                UserRole.role_id == registrar_role.id,
                UserRole.valid_from <= date.today(),
                UserRole.valid_to.is_(None) | (UserRole.valid_to >= date.today())
            )
        ).first()
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. REGISTRAR role required."
            )
    
    # Get all split requests for the original request (only non-deleted)
    split_requests = db.query(PaymentRequest).filter(
        PaymentRequest.deleted == False
    ).filter(
        and_(
            PaymentRequest.original_request_id == original_request_id,
            PaymentRequest.is_split_request == True,
            PaymentRequest.deleted == False
        )
    ).order_by(PaymentRequest.split_sequence).all()
    
    return split_requests

