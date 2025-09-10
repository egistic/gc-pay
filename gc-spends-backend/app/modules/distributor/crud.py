from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import DistributorRequest, DistributorExportLink, PaymentRequest, SubRegistrarReport
from . import schemas
from typing import List, Optional
import uuid

def get_distributor_requests(
    db: Session,
    distributor_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100
) -> List[DistributorRequest]:
    """Get all distributor requests for a specific distributor"""
    return db.query(DistributorRequest).filter(
        DistributorRequest.distributor_id == distributor_id
    ).offset(skip).limit(limit).all()

def get_distributor_request(
    db: Session,
    request_id: uuid.UUID
) -> Optional[DistributorRequest]:
    """Get a specific distributor request by ID"""
    return db.query(DistributorRequest).filter(
        DistributorRequest.id == request_id
    ).first()

def create_distributor_request(
    db: Session,
    original_request_id: uuid.UUID,
    expense_article_id: uuid.UUID,
    amount: float,
    distributor_id: uuid.UUID
) -> DistributorRequest:
    """Create a new distributor request"""
    db_request = DistributorRequest(
        original_request_id=original_request_id,
        expense_article_id=expense_article_id,
        amount=amount,
        distributor_id=distributor_id
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def link_export_contract(
    db: Session,
    distributor_request_id: uuid.UUID,
    export_contract_id: uuid.UUID,
    linked_by: uuid.UUID
) -> Optional[DistributorExportLink]:
    """Link a distributor request to an export contract"""
    # Check if request exists
    request = db.query(DistributorRequest).filter(
        DistributorRequest.id == distributor_request_id
    ).first()
    
    if not request:
        return None
    
    # Create the link
    db_link = DistributorExportLink(
        distributor_request_id=distributor_request_id,
        export_contract_id=export_contract_id,
        linked_by=linked_by
    )
    db.add(db_link)
    
    # Update request status
    request.status = "LINKED"
    
    # Update original payment request status
    payment_request = db.query(PaymentRequest).filter(
        PaymentRequest.id == request.original_request_id
    ).first()
    if payment_request:
        payment_request.distribution_status = "EXPORT_LINKED"
    
    db.commit()
    db.refresh(db_link)
    return db_link

def get_enriched_distributor_request(
    db: Session,
    request_id: uuid.UUID
) -> Optional[dict]:
    """Get distributor request with enriched data from sub-registrar reports"""
    request = db.query(DistributorRequest).filter(
        DistributorRequest.id == request_id
    ).first()
    
    if not request:
        return None
    
    # Get sub-registrar report for the original request
    report = db.query(SubRegistrarReport).filter(
        SubRegistrarReport.request_id == request.original_request_id
    ).first()
    
    # Get export contract links
    export_links = db.query(DistributorExportLink).filter(
        DistributorExportLink.distributor_request_id == request_id
    ).all()
    
    return {
        "request": request,
        "sub_registrar_report": report,
        "export_links": export_links
    }
