"""convert_uppercase_status_to_lowercase

Revision ID: 53a6cac1fb45
Revises: cd2f7cca1494
Create Date: 2025-09-14 19:11:46.794387

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '53a6cac1fb45'
down_revision = 'cd2f7cca1494'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert any existing uppercase status values to lowercase
    # Only update the main status field for now
    op.execute("UPDATE payment_requests SET status = LOWER(status::text)::payment_request_status WHERE status::text != LOWER(status::text)")


def downgrade() -> None:
    # This migration converts uppercase to lowercase, reverting would require knowing original case
    # For safety, we'll leave the values as lowercase
    pass
