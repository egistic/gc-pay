from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class SubRegistrarAssignmentOut(BaseModel):
    id: uuid.UUID
    request_id: uuid.UUID
    sub_registrar_id: uuid.UUID
    assigned_at: datetime
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubRegistrarReportIn(BaseModel):
    request_id: uuid.UUID
    document_status: str  # Не получены/Получены в полном объёме/Частично получены
    report_data: Optional[Dict[str, Any]] = None

class SubRegistrarReportOut(BaseModel):
    id: uuid.UUID
    request_id: uuid.UUID
    sub_registrar_id: uuid.UUID
    document_status: str
    report_data: Optional[Dict[str, Any]]
    status: str
    published_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubRegistrarReportUpdate(BaseModel):
    document_status: Optional[str] = None
    report_data: Optional[Dict[str, Any]] = None
    status: Optional[str] = None  # DRAFT or PUBLISHED

class SubRegistrarAssignmentListOut(BaseModel):
    assignments: list[SubRegistrarAssignmentOut]
    total: int
