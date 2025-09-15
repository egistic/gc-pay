from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.modules.users.schemas import UserOut
from app.core.security import get_current_user
from . import schemas, crud
from typing import List
import uuid

router = APIRouter(prefix="/sub-registrar", tags=["sub-registrar"])

@router.get("/assignments", response_model=schemas.SubRegistrarAssignmentListOut)
def get_assignments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get all assignments for the current sub-registrar"""
    # Verify user has SUB_REGISTRAR role
    if not any(role.role.code == "SUB_REGISTRAR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SUB_REGISTRAR role required."
        )
    
    assignments = crud.get_sub_registrar_assignments(
        db=db, 
        sub_registrar_id=current_user.id,
        skip=skip, 
        limit=limit
    )
    
    return schemas.SubRegistrarAssignmentListOut(
        assignments=assignments,
        total=len(assignments)
    )

@router.get("/reports/{request_id}", response_model=schemas.SubRegistrarReportOut)
def get_report(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get sub-registrar report for a specific request"""
    # Verify user has SUB_REGISTRAR role
    if not any(role.role.code == "SUB_REGISTRAR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SUB_REGISTRAR role required."
        )
    
    report = crud.get_sub_registrar_report(db=db, request_id=request_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    return report

@router.post("/save-draft", response_model=schemas.SubRegistrarReportOut)
def save_draft_report(
    report: schemas.SubRegistrarReportIn,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Save a sub-registrar report as draft"""
    # Verify user has SUB_REGISTRAR role
    if not any(role.role.code == "SUB_REGISTRAR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SUB_REGISTRAR role required."
        )
    
    # Check if report already exists
    existing_report = crud.get_sub_registrar_report(db=db, request_id=report.request_id)
    if existing_report:
        # Update existing report
        update_data = schemas.SubRegistrarReportUpdate(
            document_status=report.document_status,
            report_data=report.report_data,
            status="DRAFT"
        )
        updated_report = crud.update_sub_registrar_report(
            db=db,
            request_id=report.request_id,
            report_update=update_data,
            sub_registrar_id=current_user.id
        )
        return updated_report
    else:
        # Create new report
        new_report = crud.create_sub_registrar_report(
            db=db,
            report=report,
            sub_registrar_id=current_user.id
        )
        return new_report

@router.post("/publish-report", response_model=schemas.SubRegistrarReportOut)
def publish_report(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Publish a sub-registrar report"""
    # Verify user has SUB_REGISTRAR role
    if not any(role.role.code == "SUB_REGISTRAR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SUB_REGISTRAR role required."
        )
    
    published_report = crud.publish_sub_registrar_report(
        db=db,
        request_id=request_id,
        sub_registrar_id=current_user.id
    )
    
    if not published_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or already published"
        )
    
    return published_report

@router.get("/assignments/all", response_model=schemas.SubRegistrarAssignmentListOut)
def get_all_assignments(
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get all sub-registrar assignments (for filtering purposes)"""
    # This endpoint can be used by any authenticated user for filtering
    assignments = crud.get_all_sub_registrar_assignments(
        db=db,
        skip=skip, 
        limit=limit
    )
    
    return schemas.SubRegistrarAssignmentListOut(
        assignments=assignments,
        total=len(assignments)
    )
