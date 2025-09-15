"""unify_statuses_with_frontend

Revision ID: 5cfd4f8ee69b
Revises: 53a6cac1fb45
Create Date: 2025-09-15 10:22:49.550042

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5cfd4f8ee69b'
down_revision = '61f1c0ca3053'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Map existing data to new statuses
    # Map 'REGISTERED' to 'CLASSIFIED' (they are the same concept)
    op.execute("UPDATE payment_requests SET status = 'CLASSIFIED' WHERE status = 'REGISTERED'")
    
    # Map 'IN_REGISTRY' to 'IN-REGISTER' (frontend uses hyphen)
    op.execute("UPDATE payment_requests SET status = 'IN-REGISTER' WHERE status = 'IN_REGISTRY'")
    
    # Map 'PAID' to 'PAID-FULL' (more specific)
    op.execute("UPDATE payment_requests SET status = 'PAID-FULL' WHERE status = 'PAID'")
    
    # Map 'UNDER_REVIEW' to 'CLASSIFIED' (similar concept)
    op.execute("UPDATE payment_requests SET status = 'CLASSIFIED' WHERE status = 'UNDER_REVIEW'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all columns
    # For now, we'll leave the values in place
    pass
