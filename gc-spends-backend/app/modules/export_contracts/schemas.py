from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
import uuid

class ExportContractIn(BaseModel):
    contract_number: str
    contract_date: date
    counterparty_id: Optional[uuid.UUID] = None
    amount: Optional[float] = None
    currency_code: Optional[str] = None

class ExportContractOut(BaseModel):
    id: uuid.UUID
    contract_number: str
    contract_date: date
    counterparty_id: Optional[uuid.UUID]
    amount: Optional[float]
    currency_code: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ExportContractUpdate(BaseModel):
    contract_number: Optional[str] = None
    contract_date: Optional[date] = None
    counterparty_id: Optional[uuid.UUID] = None
    amount: Optional[float] = None
    currency_code: Optional[str] = None
    is_active: Optional[bool] = None

class ExportContractListOut(BaseModel):
    contracts: list[ExportContractOut]
    total: int
