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
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'REGISTERED') THEN
                ALTER TYPE payment_request_status ADD VALUE 'REGISTERED';
                RAISE NOTICE 'Added REGISTERED to payment_request_status enum';
            ELSE
                RAISE NOTICE 'REGISTERED already exists in payment_request_status enum';
            END IF;
        END $$;
    """)
    
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'IN_REGISTRY') THEN
                ALTER TYPE payment_request_status ADD VALUE 'IN_REGISTRY';
                RAISE NOTICE 'Added IN_REGISTRY to payment_request_status enum';
            ELSE
                RAISE NOTICE 'IN_REGISTRY already exists in payment_request_status enum';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all columns
    # For now, we'll leave the values in place
    pass
