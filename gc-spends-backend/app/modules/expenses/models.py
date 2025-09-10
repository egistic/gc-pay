import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, Date, ForeignKey
from app.core.db import Base

class ExpenseArticle(Base):
    __tablename__ = "expense_articles"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

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
    valid_from: Mapped[Date]
    valid_to: Mapped[Date] | None
