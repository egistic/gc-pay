from __future__ import annotations

import uuid
from datetime import date, datetime  # <-- use Python type for annotations
from sqlalchemy import String, Boolean, Date as SA_Date, DateTime as SA_DateTime, ForeignKey, Numeric, text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.db import Base

# Users / Org / RBAC
class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    
    # Relationships
    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="user")

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(128))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

class Department(Base):
    __tablename__ = "departments"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(String(64))

class Position(Base):
    __tablename__ = "positions"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    department_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departments.id"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))

class UserRole(Base):
    __tablename__ = "user_roles"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id"))
    valid_from: Mapped[date] = mapped_column(SA_Date)           # <-- Python date in annotation
    valid_to: Mapped[date | None] = mapped_column(SA_Date, nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_roles")
    role: Mapped["Role"] = relationship("Role")

class UserPosition(Base):
    __tablename__ = "user_positions"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    position_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("positions.id"))
    valid_from: Mapped[date] = mapped_column(SA_Date)
    valid_to: Mapped[date | None] = mapped_column(SA_Date, nullable=True)

class Delegation(Base):
    __tablename__ = "delegations"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    from_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    to_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    role_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("roles.id"), nullable=True)
    position_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("positions.id"), nullable=True)
    start_date: Mapped[date] = mapped_column(SA_Date)
    end_date: Mapped[date] = mapped_column(SA_Date)
    reason: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))

# Dictionaries
class Counterparty(Base):
    __tablename__ = "counterparties"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    tax_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

class Currency(Base):
    __tablename__ = "currencies"
    code: Mapped[str] = mapped_column(String(3), primary_key=True)
    scale: Mapped[int] = mapped_column(default=2)

class VatRate(Base):
    __tablename__ = "vat_rates"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    rate: Mapped[float] = mapped_column(Numeric(6, 3))
    name: Mapped[str] = mapped_column(String(64))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

# Expense Articles
class ExpenseArticle(Base):
    __tablename__ = "expense_articles"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

class ArticleRequiredDoc(Base):
    __tablename__ = "article_required_docs"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("expense_articles.id"))
    doc_type: Mapped[str] = mapped_column(String(64))
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)

class Responsibility(Base):
    __tablename__ = "responsibilities"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("expense_articles.id"))
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id"))
    position_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("positions.id"))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)
    valid_from: Mapped[date] = mapped_column(SA_Date)
    valid_to: Mapped[date | None] = mapped_column(SA_Date, nullable=True)

class ExpenseArticleRoleAssignment(Base):
    __tablename__ = "expense_article_role_assignments"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("expense_articles.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id"))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    valid_from: Mapped[date] = mapped_column(SA_Date)
    valid_to: Mapped[date | None] = mapped_column(SA_Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    
    # Relationships
    article: Mapped["ExpenseArticle"] = relationship("ExpenseArticle")
    user: Mapped["User"] = relationship("User")
    role: Mapped["Role"] = relationship("Role")

# Requests
class PaymentRequest(Base):
    __tablename__ = "payment_requests"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    number: Mapped[str] = mapped_column(String(64), unique=True)
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    counterparty_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("counterparties.id"))
    title: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), server_default=text("'DRAFT'"))
    currency_code: Mapped[str] = mapped_column(ForeignKey("currencies.code"))
    amount_total: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    vat_total: Mapped[float] = mapped_column(Numeric(18, 2), default=0)
    due_date: Mapped[date] = mapped_column(SA_Date)
    expense_article_text: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Text field for expense article
    doc_number: Mapped[str | None] = mapped_column(String(128), nullable=True)  # Document number (separate from request number)
    doc_date: Mapped[date | None] = mapped_column(SA_Date, nullable=True)  # Document date
    doc_type: Mapped[str | None] = mapped_column(String(64), nullable=True)  # Document type
    # Additional fields for frontend
    paying_company: Mapped[str | None] = mapped_column(String(64), nullable=True)
    counterparty_category: Mapped[str | None] = mapped_column(String(128), nullable=True)
    vat_rate: Mapped[str | None] = mapped_column(String(64), nullable=True)
    product_service: Mapped[str | None] = mapped_column(String(255), nullable=True)
    volume: Mapped[str | None] = mapped_column(String(128), nullable=True)
    price_rate: Mapped[str | None] = mapped_column(String(128), nullable=True)
    period: Mapped[str | None] = mapped_column(String(128), nullable=True)
    responsible_registrar_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    distribution_status: Mapped[str] = mapped_column(String(32), server_default=text("'PENDING'"))
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

class PaymentRequestLine(Base):
    __tablename__ = "payment_request_lines"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"))
    article_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("expense_articles.id"))
    executor_position_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("positions.id"))
    registrar_position_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("positions.id"))
    distributor_position_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("positions.id"))
    quantity: Mapped[float]
    amount_net: Mapped[float] = mapped_column(Numeric(18, 2))
    vat_rate_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vat_rates.id"))
    currency_code: Mapped[str] = mapped_column(ForeignKey("currencies.code"))
    status: Mapped[str] = mapped_column(String(32), server_default=text("'DRAFT'"))
    note: Mapped[str | None] = mapped_column(String(1000), nullable=True)

class LineRequiredDoc(Base):
    __tablename__ = "line_required_docs"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    line_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_request_lines.id"))
    doc_type: Mapped[str] = mapped_column(String(64))
    is_provided: Mapped[bool] = mapped_column(Boolean, default=False)
    file_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("request_files.id"), nullable=True)

class LineContract(Base):
    __tablename__ = "line_contracts"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    line_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_request_lines.id"))
    contract_number: Mapped[str] = mapped_column(String(128))
    amount_net: Mapped[float] = mapped_column(Numeric(18, 2))
    currency_code: Mapped[str] = mapped_column(ForeignKey("currencies.code"))
    contract_date: Mapped[date] = mapped_column(SA_Date)
    note: Mapped[str | None] = mapped_column(String(1000), nullable=True)

class RequestFile(Base):
    __tablename__ = "request_files"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"))
    file_name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(128))
    storage_path: Mapped[str] = mapped_column(String(1000))
    doc_type: Mapped[str] = mapped_column(String(64))
    uploaded_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

class RequestEvent(Base):
    __tablename__ = "request_events"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"))
    event_type: Mapped[str] = mapped_column(String(64))
    actor_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    payload: Mapped[str] = mapped_column(String(4000))
    snapshot_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"))
    expense_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("expense_articles.id"))
    amount: Mapped[float] = mapped_column(Numeric(18, 2))
    comment: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    contract_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    priority: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    counterparty_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("counterparties.id"))
    contract_number: Mapped[str] = mapped_column(String(128))
    contract_date: Mapped[date] = mapped_column(SA_Date)
    contract_type: Mapped[str] = mapped_column(String(64))  # elevator, service_provider
    validity_period: Mapped[str | None] = mapped_column(String(128), nullable=True)  # Срок действия
    rates: Mapped[str | None] = mapped_column(String(1000), nullable=True)  # Тарифы
    contract_info: Mapped[str | None] = mapped_column(String(2000), nullable=True)  # Информация по договору
    contract_file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # Файл договора
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

# New Workflow Models for REGISTRAR/SUB_REGISTRAR/DISTRIBUTOR

class SubRegistrarAssignment(Base):
    __tablename__ = "sub_registrar_assignments"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"))
    sub_registrar_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    assigned_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    status: Mapped[str] = mapped_column(String(32), server_default=text("'ASSIGNED'"))
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))

class DistributorRequest(Base):
    __tablename__ = "distributor_requests"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    original_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"))
    expense_article_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("expense_articles.id"))
    amount: Mapped[float] = mapped_column(Numeric(18, 2))
    distributor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(32), server_default=text("'PENDING'"))
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))

class SubRegistrarReport(Base):
    __tablename__ = "sub_registrar_reports"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_requests.id"))
    sub_registrar_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    document_status: Mapped[str] = mapped_column(String(50))  # Не получены/Получены в полном объёме/Частично получены
    report_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(32), server_default=text("'DRAFT'"))
    published_at: Mapped[datetime | None] = mapped_column(SA_DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))

class ExportContract(Base):
    __tablename__ = "export_contracts"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    contract_number: Mapped[str] = mapped_column(String(128))
    contract_date: Mapped[date] = mapped_column(SA_Date)
    counterparty_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("counterparties.id"), nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    currency_code: Mapped[str | None] = mapped_column(String(3), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))

class DistributorExportLink(Base):
    __tablename__ = "distributor_export_links"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    distributor_request_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("distributor_requests.id"))
    export_contract_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("export_contracts.id"))
    linked_at: Mapped[datetime] = mapped_column(SA_DateTime, server_default=text("CURRENT_TIMESTAMP"))
    linked_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
