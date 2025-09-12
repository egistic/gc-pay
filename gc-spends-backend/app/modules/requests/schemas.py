import uuid
from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Optional

class RequestLineIn(BaseModel):
    executor_position_id: uuid.UUID
    quantity: float = Field(gt=0)
    amount_net: float = Field(ge=0)
    vat_rate_id: uuid.UUID
    currency_code: str
    note: str | None = None

class RequestCreate(BaseModel):
    counterparty_id: uuid.UUID
    title: str
    currency_code: str
    due_date: date
    expense_article_text: str | None = None  # Text field for expense article
    doc_number: str | None = None  # Document number (separate from request number)
    doc_date: date | None = None  # Document date
    doc_type: str | None = None  # Document type
    files: list[dict] | None = None  # List of uploaded files
    lines: list[RequestLineIn]
    # Additional fields for frontend
    paying_company: str | None = None
    counterparty_category: str | None = None
    vat_rate: str | None = None
    product_service: str | None = None
    volume: str | None = None
    price_rate: str | None = None
    period: str | None = None

class RequestUpdate(BaseModel):
    title: str | None = None
    counterparty_id: uuid.UUID | None = None
    currency_code: str | None = None
    due_date: date | None = None
    expense_article_text: str | None = None  # Text field for expense article
    doc_number: str | None = None  # Document number (separate from request number)
    doc_date: date | None = None  # Document date
    doc_type: str | None = None  # Document type
    files: list[dict] | None = None  # List of uploaded files
    lines: list[RequestLineIn] | None = None
    # Additional fields for frontend
    paying_company: str | None = None
    counterparty_category: str | None = None
    vat_rate: str | None = None
    product_service: str | None = None
    volume: str | None = None
    price_rate: str | None = None
    period: str | None = None

class RequestLineOut(BaseModel):
    id: uuid.UUID
    article_id: uuid.UUID | None = None
    executor_position_id: uuid.UUID
    registrar_position_id: uuid.UUID
    distributor_position_id: uuid.UUID
    quantity: float
    amount_net: float
    vat_rate_id: uuid.UUID
    currency_code: str
    status: str
    note: str | None = None

class RequestOut(BaseModel):
    id: uuid.UUID
    number: str
    title: str
    status: str
    created_by_user_id: uuid.UUID
    counterparty_id: uuid.UUID
    currency_code: str
    amount_total: float
    vat_total: float
    due_date: date
    expense_article_text: str | None = None  # Text field for expense article
    doc_number: str | None = None  # Document number (separate from request number)
    doc_date: date | None = None  # Document date
    doc_type: str | None = None  # Document type
    files: List[dict] = []  # List of uploaded files
    created_at: datetime | None = None
    updated_at: datetime | None = None
    responsible_registrar_id: uuid.UUID | None = None
    lines: List[RequestLineOut] = []
    # Additional fields for frontend
    paying_company: str | None = None
    counterparty_category: str | None = None
    vat_rate: str | None = None
    product_service: str | None = None
    volume: str | None = None
    price_rate: str | None = None
    period: str | None = None

class RequestListOut(BaseModel):
    id: uuid.UUID
    number: str
    title: str
    status: str
    created_by_user_id: uuid.UUID
    counterparty_id: uuid.UUID
    currency_code: str
    amount_total: float
    due_date: date
    expense_article_text: str | None = None  # Text field for expense article
    created_at: datetime | None = None
    updated_at: datetime | None = None
    responsible_registrar_id: uuid.UUID | None = None
    # Additional fields for frontend
    paying_company: str | None = None
    counterparty_category: str | None = None
    vat_rate: str | None = None
    product_service: str | None = None
    volume: str | None = None
    price_rate: str | None = None
    period: str | None = None
    doc_number: str | None = None
    doc_date: date | None = None
    doc_type: str | None = None
    files: list[dict] | None = None

class RequestSubmit(BaseModel):
    comment: str | None = None

class ExpenseSplitIn(BaseModel):
    article_id: uuid.UUID
    amount: float = Field(ge=0)
    comment: str | None = None

class RequestClassify(BaseModel):
    comment: str | None = None
    expense_splits: List[ExpenseSplitIn] = []

class RequestApprove(BaseModel):
    comment: str | None = None

class RequestReject(BaseModel):
    comment: str

class RequestAddToRegistry(BaseModel):
    comment: str | None = None

class RequestSendToDistributor(BaseModel):
    comment: str | None = None
    expense_splits: List[ExpenseSplitIn] = []

class RequestDistributorAction(BaseModel):
    action: str  # 'approve', 'decline', 'return'
    comment: str | None = None
    allocations: List[dict] = []  # Payment allocations for approval
    priority: str | None = None

# Statistics schemas
class ExpenseArticleInfo(BaseModel):
    id: str
    name: str
    code: str

class RequestStatistics(BaseModel):
    total_requests: int
    draft: int
    submitted: int
    classified: int
    approved: int
    in_registry: int
    rejected: int
    overdue: int
    expense_articles: List[ExpenseArticleInfo] = []

class DashboardMetrics(BaseModel):
    role: str
    statistics: RequestStatistics
    recent_requests: List[RequestListOut]
    total_amount: float
    currency: str
