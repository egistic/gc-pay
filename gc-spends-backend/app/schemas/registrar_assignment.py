"""
Registrar Assignment Pydantic Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class RegistrarAssignmentBase(BaseModel):
    request_id: UUID
    assigned_sub_registrar_id: Optional[UUID] = None
    expense_article_id: Optional[UUID] = None
    assigned_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    registrar_comments: Optional[str] = Field(None, max_length=2000)


class RegistrarAssignmentCreate(RegistrarAssignmentBase):
    pass


class RegistrarAssignmentUpdate(BaseModel):
    assigned_sub_registrar_id: Optional[UUID] = None
    expense_article_id: Optional[UUID] = None
    assigned_amount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    registrar_comments: Optional[str] = Field(None, max_length=2000)


class RegistrarAssignmentOut(RegistrarAssignmentBase):
    id: UUID
    registrar_id: UUID
    classification_date: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RegistrarAssignmentListOut(BaseModel):
    assignments: list[RegistrarAssignmentOut]
    total: int
    skip: int
    limit: int
