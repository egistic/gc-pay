"""add_missing_enum_values

Revision ID: cd2f7cca1494
Revises: 601859670843
Create Date: 2025-09-14 19:08:13.483490

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cd2f7cca1494'
down_revision = '601859670843'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add missing enum values to payment_request_status
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'registered'")
    op.execute("ALTER TYPE payment_request_status ADD VALUE 'in_registry'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all columns
    # For now, we'll leave the values in place
    pass
