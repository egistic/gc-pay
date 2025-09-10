from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import ExportContract
from . import schemas
from typing import List, Optional
import uuid

def get_export_contracts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    is_active: bool = True
) -> List[ExportContract]:
    """Get all export contracts"""
    query = db.query(ExportContract)
    if is_active is not None:
        query = query.filter(ExportContract.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()

def get_export_contract(
    db: Session,
    contract_id: uuid.UUID
) -> Optional[ExportContract]:
    """Get a specific export contract by ID"""
    return db.query(ExportContract).filter(
        ExportContract.id == contract_id
    ).first()

def create_export_contract(
    db: Session,
    contract: schemas.ExportContractIn
) -> ExportContract:
    """Create a new export contract"""
    db_contract = ExportContract(
        contract_number=contract.contract_number,
        contract_date=contract.contract_date,
        counterparty_id=contract.counterparty_id,
        amount=contract.amount,
        currency_code=contract.currency_code
    )
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

def update_export_contract(
    db: Session,
    contract_id: uuid.UUID,
    contract_update: schemas.ExportContractUpdate
) -> Optional[ExportContract]:
    """Update an existing export contract"""
    db_contract = db.query(ExportContract).filter(
        ExportContract.id == contract_id
    ).first()
    
    if not db_contract:
        return None
    
    if contract_update.contract_number is not None:
        db_contract.contract_number = contract_update.contract_number
    if contract_update.contract_date is not None:
        db_contract.contract_date = contract_update.contract_date
    if contract_update.counterparty_id is not None:
        db_contract.counterparty_id = contract_update.counterparty_id
    if contract_update.amount is not None:
        db_contract.amount = contract_update.amount
    if contract_update.currency_code is not None:
        db_contract.currency_code = contract_update.currency_code
    if contract_update.is_active is not None:
        db_contract.is_active = contract_update.is_active
    
    db.commit()
    db.refresh(db_contract)
    return db_contract

def delete_export_contract(
    db: Session,
    contract_id: uuid.UUID
) -> bool:
    """Delete an export contract (soft delete by setting is_active=False)"""
    db_contract = db.query(ExportContract).filter(
        ExportContract.id == contract_id
    ).first()
    
    if not db_contract:
        return False
    
    db_contract.is_active = False
    db.commit()
    return True
