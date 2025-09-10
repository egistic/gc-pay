from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class DistributorRequestOut(BaseModel):
    id: uuid.UUID
    original_request_id: uuid.UUID
    expense_article_id: uuid.UUID
    amount: float
    distributor_id: uuid.UUID
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class DistributorRequestListOut(BaseModel):
    requests: list[DistributorRequestOut]
    total: int

class ExportContractLinkIn(BaseModel):
    export_contract_id: uuid.UUID

class DistributorExportLinkOut(BaseModel):
    id: uuid.UUID
    distributor_request_id: uuid.UUID
    export_contract_id: uuid.UUID
    linked_at: datetime
    linked_by: uuid.UUID
    
    class Config:
        from_attributes = True
