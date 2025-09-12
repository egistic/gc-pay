from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
import uuid
from datetime import date, datetime
from typing import List, Optional
from app.core.db import get_db
from app.core.security import get_current_user_id
from app.models import PaymentRequest, PaymentRequestLine, User
from . import schemas
from app.common.enums import RequestStatus

router = APIRouter(prefix="/requests", tags=["requests"])

def _next_number(db: Session) -> str:
    cnt = db.query(func.count(PaymentRequest.id)).scalar() or 0
    return f"REQ-{cnt+1:06d}"

@router.post("/create", response_model=schemas.RequestOut, status_code=201)
@router.post("", response_model=schemas.RequestOut, status_code=201)
def create_request(payload: schemas.RequestCreate, db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    try:
        # Log incoming request data for debugging
        print(f"Creating request with payload: {payload.model_dump()}")
        
        number = _next_number(db)
        # Use authenticated user ID
        current_user = db.query(User).filter(User.id == current_user_id).first()
        if not current_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate required fields
        if not payload.counterparty_id:
            raise HTTPException(status_code=400, detail="Counterparty ID is required")
        if not payload.title:
            raise HTTPException(status_code=400, detail="Title is required")
        if not payload.currency_code:
            raise HTTPException(status_code=400, detail="Currency code is required")
        if not payload.due_date:
            raise HTTPException(status_code=400, detail="Due date is required")
        if not payload.lines or len(payload.lines) == 0:
            raise HTTPException(status_code=400, detail="At least one line item is required")
        
        req = PaymentRequest(
            number=number,
            created_by_user_id=current_user.id,  # Use authenticated user
            counterparty_id=payload.counterparty_id,
            title=payload.title,
            status=RequestStatus.DRAFT.value,
            currency_code=payload.currency_code,
            amount_total=0,
            vat_total=0,
            due_date=payload.due_date,
            expense_article_text=payload.expense_article_text,
            doc_number=payload.doc_number,
            doc_date=payload.doc_date,
            doc_type=payload.doc_type,
            # Additional fields for frontend
            paying_company=payload.paying_company,
            counterparty_category=payload.counterparty_category,
            vat_rate=payload.vat_rate,
            product_service=payload.product_service,
            volume=payload.volume,
            price_rate=payload.price_rate,
            period=payload.period,
        )
        db.add(req)
        db.flush()
        
        total = 0
        for line in payload.lines:
            # Validate line data
            if not line.executor_position_id:
                raise HTTPException(status_code=400, detail="Executor position ID is required for line items")
            if line.quantity <= 0:
                raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
            if line.amount_net < 0:
                raise HTTPException(status_code=400, detail="Amount cannot be negative")
            if not line.vat_rate_id:
                raise HTTPException(status_code=400, detail="VAT rate ID is required for line items")
            if not line.currency_code:
                raise HTTPException(status_code=400, detail="Currency code is required for line items")
            
            # Get appropriate positions for different roles
            # For now, use the same position for all roles, but this can be enhanced later
            # to assign different positions based on business logic
            registrar_position_id = line.executor_position_id
            distributor_position_id = line.executor_position_id
            
            db.add(PaymentRequestLine(
                request_id=req.id,
                executor_position_id=line.executor_position_id,
                registrar_position_id=registrar_position_id,
                distributor_position_id=distributor_position_id,
                quantity=line.quantity,
                amount_net=line.amount_net,
                vat_rate_id=line.vat_rate_id,
                currency_code=line.currency_code,
                status=RequestStatus.DRAFT.value,
                note=line.note
            ))
            total += float(line.amount_net)
        
        req.amount_total = total
        
        # Handle file uploads if provided
        if payload.files:
            from app.models import RequestFile
            for file_data in payload.files:
                # Create RequestFile record for each uploaded file
                request_file = RequestFile(
                    request_id=req.id,
                    file_name=file_data.get('name', ''),
                    mime_type=file_data.get('mimeType', 'application/octet-stream'),
                    storage_path=file_data.get('url', ''),
                    doc_type=file_data.get('docType', ''),
                    uploaded_by=current_user.id
                )
                db.add(request_file)
        
        db.commit()
        db.refresh(req)
        
        print(f"Successfully created request {req.id} with total amount {total}")
        return _get_request_with_lines(req.id, db)
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the full error for debugging
        print(f"Error creating request: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        # Rollback the transaction
        db.rollback()
        
        # Return a generic error message
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/statistics", response_model=schemas.RequestStatistics)
def get_request_statistics(
    role: Optional[str] = Query(None, description="Filter by role"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get request statistics based on role and user"""
    query = db.query(PaymentRequest)
    
    # Apply role-based filtering
    if role == "EXECUTOR":
        # For executor role, show only requests created by current user
        query = query.filter(PaymentRequest.created_by_user_id == current_user_id)
    elif role == "registrar":
        # Registrar sees submitted and registered requests
        query = query.filter(PaymentRequest.status.in_([RequestStatus.SUBMITTED.value, RequestStatus.REGISTERED.value]))
    elif role == "distributor":
        # Distributor sees approved requests
        query = query.filter(PaymentRequest.status == RequestStatus.APPROVED.value)
    elif role == "treasurer":
        # Treasurer sees requests in registry
        query = query.filter(PaymentRequest.status == RequestStatus.IN_REGISTRY.value)
    
    # Get all requests for statistics
    all_requests = query.all()
    
    # Calculate statistics
    total_requests = len(all_requests)
    draft = len([r for r in all_requests if r.status == RequestStatus.DRAFT.value])
    submitted = len([r for r in all_requests if r.status == RequestStatus.SUBMITTED.value])
    classified = len([r for r in all_requests if r.status == RequestStatus.REGISTERED.value])
    approved = len([r for r in all_requests if r.status == RequestStatus.APPROVED.value])
    in_registry = len([r for r in all_requests if r.status == RequestStatus.IN_REGISTRY.value])
    rejected = len([r for r in all_requests if r.status == RequestStatus.REJECTED.value])
    
    # Calculate overdue requests (submitted more than 5 hours ago)
    overdue = 0  # Simplified for now
    
    # Get expense articles used in requests for the specific role
    from app.models import PaymentRequestLine, ExpenseArticle
    expense_articles_query = db.query(ExpenseArticle).join(
        PaymentRequestLine, PaymentRequestLine.article_id == ExpenseArticle.id
    ).join(
        PaymentRequest, PaymentRequest.id == PaymentRequestLine.request_id
    )
    
    # Apply same role filtering to expense articles
    if role == "EXECUTOR":
        expense_articles_query = expense_articles_query.filter(
            PaymentRequest.created_by_user_id == current_user_id
        )
    elif role == "registrar":
        expense_articles_query = expense_articles_query.filter(
            PaymentRequest.status.in_([RequestStatus.SUBMITTED.value, RequestStatus.REGISTERED.value])
        )
    elif role == "distributor":
        expense_articles_query = expense_articles_query.filter(
            PaymentRequest.status == RequestStatus.APPROVED.value
        )
    elif role == "treasurer":
        expense_articles_query = expense_articles_query.filter(
            PaymentRequest.status == RequestStatus.IN_REGISTRY.value
        )
    
    # Get only active expense articles that are actually used in requests
    expense_articles = expense_articles_query.filter(
        ExpenseArticle.is_active == True
    ).distinct().all()
    
    return schemas.RequestStatistics(
        total_requests=total_requests,
        draft=draft,
        submitted=submitted,
        classified=classified,
        approved=approved,
        in_registry=in_registry,
        rejected=rejected,
        overdue=overdue,
        expense_articles=[{
            "id": str(article.id),
            "name": article.name,
            "code": article.code
        } for article in expense_articles]
    )

@router.get("/list", response_model=List[schemas.RequestListOut])
def get_requests(
    role: Optional[str] = Query(None, description="User role"),
    user_id: Optional[uuid.UUID] = Query(None, description="User ID"),
    status: Optional[str] = Query(None, description="Request status"),
    responsible_registrar_id: Optional[uuid.UUID] = Query(None, description="Responsible registrar ID"),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get list of payment requests with optional filtering"""
    query = db.query(PaymentRequest)
    
    # Apply role-based filtering
    if role == "EXECUTOR":
        # For executor role, show only requests created by current user
        query = query.filter(PaymentRequest.created_by_user_id == current_user_id)
    elif role == "registrar":
        query = query.filter(PaymentRequest.status.in_([RequestStatus.SUBMITTED.value, RequestStatus.REGISTERED.value]))
    elif role == "distributor":
        query = query.filter(PaymentRequest.status == RequestStatus.APPROVED.value)
    elif role == "treasurer":
        query = query.filter(PaymentRequest.status == RequestStatus.IN_REGISTRY.value)
    
    # Apply status filter
    if status:
        query = query.filter(PaymentRequest.status == status)
    
    # Apply responsible registrar filter
    if responsible_registrar_id:
        query = query.filter(PaymentRequest.responsible_registrar_id == responsible_registrar_id)
    
    # Order by creation date (newest first)
    requests = query.order_by(PaymentRequest.created_at.desc()).all()
    
    # Convert to RequestListOut with all required fields
    result = []
    for req in requests:
        req_dict = {
            'id': req.id,
            'number': req.number,
            'title': req.title,
            'status': req.status,
            'created_by_user_id': req.created_by_user_id,
            'counterparty_id': req.counterparty_id,
            'currency_code': req.currency_code,
            'amount_total': req.amount_total,
            'due_date': req.due_date,
            'expense_article_text': req.expense_article_text,
            'created_at': req.created_at,
            'updated_at': req.updated_at,
            'paying_company': req.paying_company,
            'counterparty_category': req.counterparty_category,
            'vat_rate': req.vat_rate,
            'product_service': req.product_service,
            'volume': req.volume,
            'price_rate': req.price_rate,
            'period': req.period,
            'doc_number': req.doc_number,
            'doc_date': req.doc_date,
            'doc_type': req.doc_type,
            'responsible_registrar_id': req.responsible_registrar_id,
            'files': []  # Files are handled separately
        }
        result.append(schemas.RequestListOut.model_validate(req_dict))
    
    return result

@router.get("/metrics/dashboard", response_model=schemas.DashboardMetrics)
def get_dashboard_metrics(
    role: str = Query(..., description="User role"),
    user_id: Optional[uuid.UUID] = Query(None, description="User ID"),
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """Get dashboard metrics for specific role"""
    # Get statistics
    stats = get_request_statistics(role=role, user_id=user_id, db=db, current_user_id=current_user_id)
    
    # Get recent requests (last 10) - simplified
    query = db.query(PaymentRequest)
    
    # Apply role-based filtering for recent requests
    if role == "EXECUTOR":
        # For executor role, show only requests created by current user
        query = query.filter(PaymentRequest.created_by_user_id == current_user_id)
    elif role == "registrar":
        query = query.filter(PaymentRequest.status.in_([RequestStatus.SUBMITTED.value, RequestStatus.REGISTERED.value]))
    elif role == "distributor":
        query = query.filter(PaymentRequest.status == RequestStatus.APPROVED.value)
    elif role == "treasurer":
        query = query.filter(PaymentRequest.status == RequestStatus.IN_REGISTRY.value)
    
    recent_requests = query.order_by(PaymentRequest.number.desc()).limit(10).all()
    recent_requests_data = [schemas.RequestListOut.model_validate(req.__dict__) for req in recent_requests]
    
    # Calculate total amount
    total_amount = sum(req.amount_total for req in recent_requests)
    
    return schemas.DashboardMetrics(
        role=role,
        statistics=stats,
        recent_requests=recent_requests_data,
        total_amount=total_amount,
        currency="KZT"  # Default currency
    )

@router.get("/{request_id}", response_model=schemas.RequestOut)
def get_request(request_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_request_with_lines(request_id, db)

@router.get("/{request_id}/events")
def get_request_events(request_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all events for a request"""
    from app.models import RequestEvent
    events = db.query(RequestEvent).filter(
        RequestEvent.request_id == request_id
    ).order_by(RequestEvent.id.desc()).all()
    
    print(f"DEBUG: Found {len(events)} events for request {request_id}")
    for event in events:
        print(f"DEBUG: Event {event.id} - {event.event_type} - {event.payload}")
    
    return [
        {
            "id": str(event.id),
            "event_type": event.event_type,
            "actor_user_id": str(event.actor_user_id),
            "payload": event.payload,
            "created_at": str(event.id)  # Using ID as timestamp for now
        }
        for event in events
    ]

@router.put("/{request_id}", response_model=schemas.RequestOut)
def update_request(
    request_id: uuid.UUID, 
    payload: schemas.RequestUpdate, 
    db: Session = Depends(get_db)
):
    req = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Allow updates if status is DRAFT or REJECTED
    if req.status not in [RequestStatus.DRAFT.value, RequestStatus.REJECTED.value]:
        raise HTTPException(status_code=409, detail="Only DRAFT or REJECTED requests can be updated")
    
    # If request was rejected, change status back to DRAFT when updated
    if req.status == RequestStatus.REJECTED.value:
        req.status = RequestStatus.DRAFT.value
        
        # Create event for status change
        from app.models import RequestEvent
        status_change_event = RequestEvent(
            request_id=request_id,
            event_type="STATUS_CHANGED",
            actor_user_id=req.created_by_user_id,
            payload="Статус изменен с REJECTED на DRAFT - заявка отправлена на редактирование"
        )
        db.add(status_change_event)
    
    # Update fields
    if payload.title is not None:
        req.title = payload.title
    if payload.counterparty_id is not None:
        req.counterparty_id = payload.counterparty_id
    if payload.currency_code is not None:
        req.currency_code = payload.currency_code
    if payload.due_date is not None:
        req.due_date = payload.due_date
    if payload.expense_article_text is not None:
        req.expense_article_text = payload.expense_article_text
    if payload.doc_number is not None:
        req.doc_number = payload.doc_number
    if payload.doc_date is not None:
        req.doc_date = payload.doc_date
    if payload.doc_type is not None:
        req.doc_type = payload.doc_type
    # Update additional fields for frontend
    if payload.paying_company is not None:
        req.paying_company = payload.paying_company
    if payload.counterparty_category is not None:
        req.counterparty_category = payload.counterparty_category
    if payload.vat_rate is not None:
        req.vat_rate = payload.vat_rate
    if payload.product_service is not None:
        req.product_service = payload.product_service
    if payload.volume is not None:
        req.volume = payload.volume
    if payload.price_rate is not None:
        req.price_rate = payload.price_rate
    if payload.period is not None:
        req.period = payload.period
    
    # Update lines if provided
    if payload.lines is not None:
        # Delete existing lines
        db.query(PaymentRequestLine).filter(
            PaymentRequestLine.request_id == request_id
        ).delete()
        
        # Add new lines
        total = 0
        for line in payload.lines:
            db.add(PaymentRequestLine(
                request_id=request_id,
                article_id=line.article_id,
                executor_position_id=line.executor_position_id,
                registrar_position_id=line.executor_position_id,
                distributor_position_id=line.executor_position_id,
                quantity=line.quantity,
                amount_net=line.amount_net,
                vat_rate_id=line.vat_rate_id,
                currency_code=line.currency_code,
                status=RequestStatus.DRAFT.value,
                note=line.note
            ))
            total += float(line.amount_net)
        req.amount_total = total
    
    db.commit()
    db.refresh(req)
    return _get_request_with_lines(request_id, db)

@router.delete("/{request_id}", status_code=204)
def delete_request(request_id: uuid.UUID, db: Session = Depends(get_db)):
    req = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Delete all related data first
    # 1. Delete request events
    from app.models import RequestEvent
    db.query(RequestEvent).filter(
        RequestEvent.request_id == request_id
    ).delete()
    
    # 2. Delete request lines
    db.query(PaymentRequestLine).filter(
        PaymentRequestLine.request_id == request_id
    ).delete()
    
    # 3. Delete the request
    db.delete(req)
    db.commit()
    return None

@router.post("/{request_id}/submit", response_model=schemas.RequestOut)
def submit_request(
    request_id: uuid.UUID, 
    payload: schemas.RequestSubmit,
    db: Session = Depends(get_db)
):
    req = db.get(PaymentRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.DRAFT.value:
        raise HTTPException(status_code=409, detail="Only DRAFT can be submitted")
    
    req.status = RequestStatus.SUBMITTED.value
    db.commit()
    db.refresh(req)
    return _get_request_with_lines(request_id, db)

@router.post("/{request_id}/classify", response_model=schemas.RequestOut)
def classify_request(
    request_id: uuid.UUID,
    payload: schemas.RequestClassify,
    db: Session = Depends(get_db)
):
    req = db.get(PaymentRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.SUBMITTED.value:
        raise HTTPException(status_code=409, detail="Only SUBMITTED requests can be classified")
    
    # Update request lines with expense splits
    if payload.expense_splits:
        # Delete existing lines
        db.query(PaymentRequestLine).filter(
            PaymentRequestLine.request_id == request_id
        ).delete()
        
        # Add new lines from expense splits
        total = 0
        for split in payload.expense_splits:
            # Use the specific user ID provided
            registrar_user_id = uuid.UUID("8e1ff15d-79ea-48a6-ba30-59f64dcc9f6d")
            
            # Get or create a position for this user
            from app.models import Position, Department
            from app.models import VatRate
            
            # First, get or create a default department
            default_department = db.query(Department).first()
            if not default_department:
                # Create a default department
                default_department = Department(
                    name="Default Department",
                    code="DEFAULT"
                )
                db.add(default_department)
                db.flush()  # Flush to get the ID
            
            # Get or create a position for the registrar user
            position = db.query(Position).filter(
                Position.title == f"Position for User {registrar_user_id}"
            ).first()
            
            if not position:
                # Create a position for this user
                position = Position(
                    department_id=default_department.id,
                    title=f"Position for User {registrar_user_id}",
                    description="Temporary position for classify request",
                    is_active=True
                )
                db.add(position)
                db.flush()  # Flush to get the ID
            
            # Get default VAT rate
            default_vat_rate = db.query(VatRate).filter(VatRate.is_active == True).first()
            if not default_vat_rate:
                raise HTTPException(status_code=400, detail="No VAT rates available")
            
            db.add(PaymentRequestLine(
                request_id=request_id,
                article_id=split.article_id,
                executor_position_id=position.id,
                registrar_position_id=position.id,
                distributor_position_id=position.id,
                quantity=1.0,  # Default quantity
                amount_net=split.amount,
                vat_rate_id=default_vat_rate.id,
                currency_code=req.currency_code,
                status=RequestStatus.REGISTERED.value,
                note=split.comment
            ))
            total += float(split.amount)
        
        req.amount_total = total
    
    req.status = RequestStatus.REGISTERED.value
    db.commit()
    db.refresh(req)
    return _get_request_with_lines(request_id, db)

@router.post("/{request_id}/approve", response_model=schemas.RequestOut)
def approve_request(
    request_id: uuid.UUID,
    payload: schemas.RequestApprove,
    db: Session = Depends(get_db)
):
    req = db.get(PaymentRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.REGISTERED.value:
        raise HTTPException(status_code=409, detail="Only CLASSIFIED requests can be approved")
    
    req.status = RequestStatus.APPROVED.value
    db.commit()
    db.refresh(req)
    return _get_request_with_lines(request_id, db)

@router.post("/{request_id}/reject", response_model=schemas.RequestOut)
def reject_request(
    request_id: uuid.UUID,
    payload: schemas.RequestReject,
    db: Session = Depends(get_db)
):
    req = db.get(PaymentRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in [RequestStatus.SUBMITTED.value, RequestStatus.REGISTERED.value]:
        raise HTTPException(status_code=409, detail="Only SUBMITTED or REGISTERED requests can be rejected")
    
    req.status = RequestStatus.REJECTED.value
    
    # Create rejection event
    from app.models import RequestEvent
    rejection_event = RequestEvent(
        request_id=request_id,
        event_type="REJECTED",
        actor_user_id=req.created_by_user_id,  # For now, use request creator as actor
        payload=payload.comment or "Заявка отклонена"
    )
    db.add(rejection_event)
    
    db.commit()
    db.refresh(req)
    return _get_request_with_lines(request_id, db)

@router.post("/{request_id}/add-to-registry", response_model=schemas.RequestOut)
def add_to_registry(
    request_id: uuid.UUID,
    payload: schemas.RequestAddToRegistry,
    db: Session = Depends(get_db)
):
    req = db.get(PaymentRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.APPROVED.value:
        raise HTTPException(status_code=409, detail="Only APPROVED requests can be added to registry")
    
    req.status = RequestStatus.IN_REGISTRY.value
    db.commit()
    db.refresh(req)
    return _get_request_with_lines(request_id, db)

@router.post("/{request_id}/send-to-distributor", response_model=schemas.RequestOut)
def send_to_distributor(
    request_id: uuid.UUID,
    payload: schemas.RequestSendToDistributor,
    db: Session = Depends(get_db)
):
    """Send classified request to distributor for contract management and normative checks"""
    req = db.get(PaymentRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.REGISTERED.value:
        raise HTTPException(status_code=409, detail="Only REGISTERED requests can be sent to distributor")
    
    # Update status to approved (ready for distributor)
    req.status = RequestStatus.APPROVED.value
    
    # TODO: Here we would add logic for:
    # 1. Contract validation
    # 2. Normative checks
    # 3. Assignment to specific distributor based on expense article
    # 4. Notification to distributor
    
    db.commit()
    db.refresh(req)
    return _get_request_with_lines(request_id, db)

@router.post("/{request_id}/distributor-action", response_model=schemas.RequestOut)
def distributor_action(
    request_id: uuid.UUID,
    payload: schemas.RequestDistributorAction,
    db: Session = Depends(get_db)
):
    """Handle distributor actions: approve, decline, or return request"""
    req = db.get(PaymentRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != RequestStatus.APPROVED.value:
        raise HTTPException(status_code=409, detail="Only APPROVED requests can be processed by distributor")
    
    if payload.action == "approve":
        # Approve and send to treasurer
        req.status = RequestStatus.TO_PAY.value
        # TODO: Add payment allocations logic
    elif payload.action == "decline":
        # Decline request
        req.status = RequestStatus.DECLINED.value
    elif payload.action == "return":
        # Return to registrar
        req.status = RequestStatus.RETURNED.value
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'approve', 'decline', or 'return'")
    
    db.commit()
    db.refresh(req)
    return _get_request_with_lines(request_id, db)

def _get_request_with_lines(request_id: uuid.UUID, db: Session) -> schemas.RequestOut:
    """Helper function to get request with lines and files"""
    req = db.query(PaymentRequest).filter(PaymentRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Get request lines
    lines = db.query(PaymentRequestLine).filter(
        PaymentRequestLine.request_id == request_id
    ).all()
    
    lines_data = [schemas.RequestLineOut.model_validate(line.__dict__) for line in lines]
    
    # Get request files
    from app.models import RequestFile
    files = db.query(RequestFile).filter(
        RequestFile.request_id == request_id
    ).all()
    
    files_data = [{
        "id": str(file.id),
        "name": file.file_name,
        "url": file.storage_path,
        "mimeType": file.mime_type,
        "docType": file.doc_type
    } for file in files]
    
    request_data = req.__dict__.copy()
    request_data['lines'] = lines_data
    request_data['files'] = files_data
    return schemas.RequestOut.model_validate(request_data)
