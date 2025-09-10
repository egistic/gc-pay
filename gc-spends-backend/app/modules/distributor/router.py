from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.modules.users.schemas import UserOut
from app.core.security import get_current_user
from . import schemas, crud
from typing import List
import uuid

router = APIRouter(prefix="/distributor", tags=["distributor"])

@router.get("/requests", response_model=schemas.DistributorRequestListOut)
def get_distributor_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get all distributor requests for the current distributor"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    requests = crud.get_distributor_requests(
        db=db,
        distributor_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return schemas.DistributorRequestListOut(
        requests=requests,
        total=len(requests)
    )

@router.get("/requests/{request_id}", response_model=schemas.DistributorRequestOut)
def get_distributor_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get a specific distributor request by ID"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    request = crud.get_distributor_request(db=db, request_id=request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distributor request not found"
        )
    
    return request

@router.put("/requests/{request_id}/export-contract", response_model=schemas.DistributorExportLinkOut)
def link_export_contract(
    request_id: uuid.UUID,
    link_data: schemas.ExportContractLinkIn,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Link a distributor request to an export contract"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    export_link = crud.link_export_contract(
        db=db,
        distributor_request_id=request_id,
        export_contract_id=link_data.export_contract_id,
        linked_by=current_user.id
    )
    
    if not export_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distributor request not found"
        )
    
    return export_link

@router.get("/requests/{request_id}/enriched")
def get_enriched_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get distributor request with enriched data from sub-registrar reports"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    enriched_data = crud.get_enriched_distributor_request(
        db=db,
        request_id=request_id
    )
    
    if not enriched_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distributor request not found"
        )
    
    return enriched_data
