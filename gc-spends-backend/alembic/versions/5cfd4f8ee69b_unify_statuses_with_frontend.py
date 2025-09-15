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
    # Only update if the source values exist in the data and target values exist in the enum
    
    # Map 'REGISTERED' to 'CLASSIFIED' (they are the same concept)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'REGISTERED' LIMIT 1) AND
               EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'CLASSIFIED') THEN
                UPDATE payment_requests SET status = 'CLASSIFIED' WHERE status = 'REGISTERED';
                RAISE NOTICE 'Mapped REGISTERED to CLASSIFIED';
            ELSE
                RAISE NOTICE 'Skipping REGISTERED to CLASSIFIED mapping - source or target not found';
            END IF;
        END $$;
    """)
    
    # Map 'IN_REGISTRY' to 'IN-REGISTER' (frontend uses hyphen)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'IN_REGISTRY' LIMIT 1) AND
               EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'IN-REGISTER') THEN
                UPDATE payment_requests SET status = 'IN-REGISTER' WHERE status = 'IN_REGISTRY';
                RAISE NOTICE 'Mapped IN_REGISTRY to IN-REGISTER';
            ELSE
                RAISE NOTICE 'Skipping IN_REGISTRY to IN-REGISTER mapping - source or target not found';
            END IF;
        END $$;
    """)
    
    # Map 'PAID' to 'PAID-FULL' (more specific)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'PAID' LIMIT 1) AND
               EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'PAID-FULL') THEN
                UPDATE payment_requests SET status = 'PAID-FULL' WHERE status = 'PAID';
                RAISE NOTICE 'Mapped PAID to PAID-FULL';
            ELSE
                RAISE NOTICE 'Skipping PAID to PAID-FULL mapping - source or target not found';
            END IF;
        END $$;
    """)
    
    # Map 'UNDER_REVIEW' to 'CLASSIFIED' (similar concept)
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'UNDER_REVIEW' LIMIT 1) AND
               EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'CLASSIFIED') THEN
                UPDATE payment_requests SET status = 'CLASSIFIED' WHERE status = 'UNDER_REVIEW';
                RAISE NOTICE 'Mapped UNDER_REVIEW to CLASSIFIED';
            ELSE
                RAISE NOTICE 'Skipping UNDER_REVIEW to CLASSIFIED mapping - source or target not found';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and updating all columns
    # For now, we'll leave the values in place
    pass
