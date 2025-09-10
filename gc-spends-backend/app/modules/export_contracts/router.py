from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.modules.users.schemas import UserOut
from app.core.security import get_current_user
from . import schemas, crud
from typing import List
import uuid

router = APIRouter(prefix="/export-contracts", tags=["export-contracts"])

@router.get("/", response_model=schemas.ExportContractListOut)
def get_export_contracts(
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get all export contracts"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    contracts = crud.get_export_contracts(
        db=db,
        skip=skip,
        limit=limit,
        is_active=is_active
    )
    
    return schemas.ExportContractListOut(
        contracts=contracts,
        total=len(contracts)
    )

@router.get("/{contract_id}", response_model=schemas.ExportContractOut)
def get_export_contract(
    contract_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Get a specific export contract by ID"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    contract = crud.get_export_contract(db=db, contract_id=contract_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export contract not found"
        )
    
    return contract

@router.post("/", response_model=schemas.ExportContractOut)
def create_export_contract(
    contract: schemas.ExportContractIn,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Create a new export contract"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    new_contract = crud.create_export_contract(db=db, contract=contract)
    return new_contract

@router.put("/{contract_id}", response_model=schemas.ExportContractOut)
def update_export_contract(
    contract_id: uuid.UUID,
    contract_update: schemas.ExportContractUpdate,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Update an existing export contract"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    updated_contract = crud.update_export_contract(
        db=db,
        contract_id=contract_id,
        contract_update=contract_update
    )
    
    if not updated_contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export contract not found"
        )
    
    return updated_contract

@router.delete("/{contract_id}")
def delete_export_contract(
    contract_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(get_current_user)
):
    """Delete an export contract (soft delete)"""
    # Verify user has DISTRIBUTOR role
    if not any(role.role.code == "DISTRIBUTOR" for role in current_user.user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. DISTRIBUTOR role required."
        )
    
    success = crud.delete_export_contract(db=db, contract_id=contract_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export contract not found"
        )
    
    return {"message": "Export contract deleted successfully"}
