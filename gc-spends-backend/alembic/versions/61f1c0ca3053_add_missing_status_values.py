"""add_missing_status_values

Revision ID: 61f1c0ca3053
Revises: 5cfd4f8ee69b
Create Date: 2025-09-15 10:23:50.061482

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '61f1c0ca3053'
down_revision = '53a6cac1fb45'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add all missing status values to match frontend PaymentRequestStatus
    # Current statuses: DRAFT, SUBMITTED, REGISTERED, UNDER_REVIEW, APPROVED, REJECTED, PAID, CANCELLED, IN_REGISTRY
    
    # Add missing statuses one by one
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'CLASSIFIED'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'ALLOCATED'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'RETURNED'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'APPROVED-ON-BEHALF'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'TO-PAY'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'IN-REGISTER'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'APPROVED-FOR-PAYMENT'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'PAID-FULL'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'PAID-PARTIAL'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'DECLINED'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'DISTRIBUTED'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'REPORT_PUBLISHED'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'EXPORT_LINKED'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all columns
    # For now, we'll leave the values in place
    pass
