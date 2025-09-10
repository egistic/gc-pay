from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import date

# Expense Split Schemas
class ExpenseSplitCreate(BaseModel):
    expense_item_id: uuid.UUID
    amount: float
    comment: Optional[str] = None
    contract_id: Optional[str] = None
    priority: Optional[str] = "medium"

class ExpenseSplitOut(BaseModel):
    id: uuid.UUID
    request_id: uuid.UUID
    expense_item_id: uuid.UUID
    amount: float
    comment: Optional[str] = None
    contract_id: Optional[str] = None
    priority: Optional[str] = None
    created_at: str
    updated_at: str

# Distribution Schemas
class DistributionCreate(BaseModel):
    request_id: uuid.UUID
    responsible_registrar_id: uuid.UUID
    expense_splits: List[ExpenseSplitCreate]
    comment: Optional[str] = None

class DistributionOut(BaseModel):
    request_id: uuid.UUID
    responsible_registrar_id: uuid.UUID
    expense_splits: List[ExpenseSplitOut]
    comment: Optional[str] = None
    total_amount: float

# Contract Status Schemas
class ContractStatusOut(BaseModel):
    has_contract: bool
    contract_number: Optional[str] = None
    contract_date: Optional[date] = None
    contract_type: Optional[str] = None
    validity_period: Optional[str] = None
    rates: Optional[str] = None
    contract_info: Optional[str] = None
    contract_file_url: Optional[str] = None

# Return Request Schema
class ReturnRequestCreate(BaseModel):
    request_id: uuid.UUID
    comment: str

class ReturnRequestOut(BaseModel):
    request_id: uuid.UUID
    comment: str
    returned_at: str

# Parallel Distribution Schemas
class ParallelDistributionCreate(BaseModel):
    request_id: uuid.UUID
    sub_registrar_id: uuid.UUID
    distributor_id: uuid.UUID
    expense_splits: List[ExpenseSplitCreate]
    comment: Optional[str] = None

class ParallelDistributionOut(BaseModel):
    request_id: uuid.UUID
    sub_registrar_assignment_id: uuid.UUID
    distributor_request_ids: List[uuid.UUID]
    total_amount: float
    status: str

class PendingRequestOut(BaseModel):
    id: uuid.UUID
    number: str
    title: str
    amount_total: float
    currency_code: str
    counterparty_id: uuid.UUID
    status: str
    distribution_status: str
    created_at: str
    
    class Config:
        from_attributes = True
