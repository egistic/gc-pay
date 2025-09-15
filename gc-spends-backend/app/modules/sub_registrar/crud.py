from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import SubRegistrarAssignment, SubRegistrarReport, PaymentRequest, User
from . import schemas
from typing import List, Optional
import uuid

def get_sub_registrar_assignments(
    db: Session, 
    sub_registrar_id: uuid.UUID,
    skip: int = 0, 
    limit: int = 100
) -> List[SubRegistrarAssignment]:
    """Get all assignments for a specific sub-registrar"""
    return db.query(SubRegistrarAssignment).filter(
        SubRegistrarAssignment.sub_registrar_id == sub_registrar_id
    ).offset(skip).limit(limit).all()

def get_sub_registrar_assignment(
    db: Session, 
    assignment_id: uuid.UUID
) -> Optional[SubRegistrarAssignment]:
    """Get a specific assignment by ID"""
    return db.query(SubRegistrarAssignment).filter(
        SubRegistrarAssignment.id == assignment_id
    ).first()

def create_sub_registrar_assignment(
    db: Session, 
    assignment: schemas.SubRegistrarAssignmentOut
) -> SubRegistrarAssignment:
    """Create a new sub-registrar assignment"""
    db_assignment = SubRegistrarAssignment(
        request_id=assignment.request_id,
        sub_registrar_id=assignment.sub_registrar_id,
        status=assignment.status
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

def get_sub_registrar_report(
    db: Session, 
    request_id: uuid.UUID
) -> Optional[SubRegistrarReport]:
    """Get sub-registrar report for a specific request"""
    return db.query(SubRegistrarReport).filter(
        SubRegistrarReport.request_id == request_id
    ).first()

def create_sub_registrar_report(
    db: Session, 
    report: schemas.SubRegistrarReportIn,
    sub_registrar_id: uuid.UUID
) -> SubRegistrarReport:
    """Create a new sub-registrar report"""
    db_report = SubRegistrarReport(
        request_id=report.request_id,
        sub_registrar_id=sub_registrar_id,
        document_status=report.document_status,
        report_data=report.report_data,
        status="DRAFT"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def update_sub_registrar_report(
    db: Session, 
    request_id: uuid.UUID,
    report_update: schemas.SubRegistrarReportUpdate,
    sub_registrar_id: uuid.UUID
) -> Optional[SubRegistrarReport]:
    """Update an existing sub-registrar report"""
    db_report = db.query(SubRegistrarReport).filter(
        and_(
            SubRegistrarReport.request_id == request_id,
            SubRegistrarReport.sub_registrar_id == sub_registrar_id
        )
    ).first()
    
    if not db_report:
        return None
    
    if report_update.document_status is not None:
        db_report.document_status = report_update.document_status
    if report_update.report_data is not None:
        db_report.report_data = report_update.report_data
    if report_update.status is not None:
        db_report.status = report_update.status
        if report_update.status == "PUBLISHED":
            from datetime import datetime
            db_report.published_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_report)
    return db_report

def publish_sub_registrar_report(
    db: Session, 
    request_id: uuid.UUID,
    sub_registrar_id: uuid.UUID
) -> Optional[SubRegistrarReport]:
    """Publish a sub-registrar report"""
    db_report = db.query(SubRegistrarReport).filter(
        and_(
            SubRegistrarReport.request_id == request_id,
            SubRegistrarReport.sub_registrar_id == sub_registrar_id
        )
    ).first()
    
    if not db_report:
        return None
    
    db_report.status = "PUBLISHED"
    from datetime import datetime
    db_report.published_at = datetime.utcnow()
    
    # Update the original payment request status
    payment_request = db.query(PaymentRequest).filter(
        and_(PaymentRequest.id == request_id, PaymentRequest.deleted == False)
    ).first()
    if payment_request:
        payment_request.distribution_status = "REPORT_PUBLISHED"
    
    db.commit()
    db.refresh(db_report)
    return db_report

def get_all_sub_registrar_assignments(
    db: Session,
    skip: int = 0, 
    limit: int = 1000
) -> List[SubRegistrarAssignment]:
    """Get all sub-registrar assignments (for filtering purposes)"""
    return db.query(SubRegistrarAssignment).offset(skip).limit(limit).all()
