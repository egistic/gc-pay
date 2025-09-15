"""
Sub-Registrar Assignment Data Pydantic Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal


class SubRegistrarAssignmentDataBase(BaseModel):
    request_id: UUID
    document_type: Optional[str] = Field(None, max_length=64)
    document_number: Optional[str] = Field(None, max_length=128)
    document_date: Optional[date] = None
    amount_without_vat: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    vat_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency_code: Optional[str] = Field(None, max_length=3)
    original_document_status: Optional[str] = Field(None, max_length=64)
    sub_registrar_comments: Optional[str] = Field(None, max_length=2000)
    is_draft: bool = True
    is_published: bool = False


class SubRegistrarAssignmentDataCreate(SubRegistrarAssignmentDataBase):
    pass


class SubRegistrarAssignmentDataUpdate(BaseModel):
    document_type: Optional[str] = Field(None, max_length=64)
    document_number: Optional[str] = Field(None, max_length=128)
    document_date: Optional[date] = None
    amount_without_vat: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    vat_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    currency_code: Optional[str] = Field(None, max_length=3)
    original_document_status: Optional[str] = Field(None, max_length=64)
    sub_registrar_comments: Optional[str] = Field(None, max_length=2000)
    is_draft: Optional[bool] = None
    is_published: Optional[bool] = None


class SubRegistrarAssignmentDataOut(SubRegistrarAssignmentDataBase):
    id: UUID
    sub_registrar_id: UUID
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SubRegistrarAssignmentDataListOut(BaseModel):
    assignments: list[SubRegistrarAssignmentDataOut]
    total: int
    skip: int
    limit: int
