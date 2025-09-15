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
    # Map 'registered' to 'classified' (they are the same concept)
    op.execute("UPDATE payment_requests SET status = 'classified' WHERE status = 'registered'")
    
    # Map 'in_registry' to 'in-register' (frontend uses hyphen)
    op.execute("UPDATE payment_requests SET status = 'in-register' WHERE status = 'in_registry'")
    
    # Map 'paid' to 'paid-full' (more specific)
    op.execute("UPDATE payment_requests SET status = 'paid-full' WHERE status = 'paid'")
    
    # Map 'under_review' to 'classified' (similar concept)
    op.execute("UPDATE payment_requests SET status = 'classified' WHERE status = 'under_review'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all columns
    # For now, we'll leave the values in place
    pass
