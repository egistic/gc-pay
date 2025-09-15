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
    # Current statuses: draft, submitted, registered, under_review, approved, rejected, paid, cancelled, in_registry
    
    # Add missing statuses one by one
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'classified'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'allocated'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'returned'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'approved-on-behalf'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'to-pay'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'in-register'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'approved-for-payment'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'paid-full'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'paid-partial'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'declined'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'distributed'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'report_published'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'export_linked'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all columns
    # For now, we'll leave the values in place
    pass
