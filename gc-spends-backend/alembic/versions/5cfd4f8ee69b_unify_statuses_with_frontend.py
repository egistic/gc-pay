"""unify_statuses_with_frontend

Revision ID: 5cfd4f8ee69b
Revises: 53a6cac1fb45
Create Date: 2025-09-15 10:22:49.550042

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5cfd4f8ee69b'
down_revision = '53a6cac1fb45'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Map existing data to new statuses
    # First drop views that depend on the status column
    
    # Drop views that depend on the status column
    op.execute("DROP VIEW IF EXISTS active_payment_requests CASCADE")
    op.execute("DROP VIEW IF EXISTS active_payment_request_lines CASCADE")
    op.execute("DROP VIEW IF EXISTS active_request_files CASCADE")
    op.execute("DROP VIEW IF EXISTS active_request_events CASCADE")
    
    # Convert status column to TEXT temporarily
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE TEXT")
    
    # Now perform the mappings safely
    op.execute("""
        DO $$
        BEGIN
            -- Map 'REGISTERED' to 'CLASSIFIED' (they are the same concept)
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'REGISTERED' LIMIT 1) AND
               EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'CLASSIFIED') THEN
                UPDATE payment_requests SET status = 'CLASSIFIED' WHERE status = 'REGISTERED';
                RAISE NOTICE 'Mapped REGISTERED to CLASSIFIED';
            ELSE
                RAISE NOTICE 'Skipping REGISTERED to CLASSIFIED mapping - source or target not found';
            END IF;
            
            -- Map 'IN_REGISTRY' to 'IN-REGISTER' (frontend uses hyphen)
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'IN_REGISTRY' LIMIT 1) AND
               EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'IN-REGISTER') THEN
                UPDATE payment_requests SET status = 'IN-REGISTER' WHERE status = 'IN_REGISTRY';
                RAISE NOTICE 'Mapped IN_REGISTRY to IN-REGISTER';
            ELSE
                RAISE NOTICE 'Skipping IN_REGISTRY to IN-REGISTER mapping - source or target not found';
            END IF;
            
            -- Map 'PAID' to 'PAID-FULL' (more specific)
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'PAID' LIMIT 1) AND
               EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'PAID-FULL') THEN
                UPDATE payment_requests SET status = 'PAID-FULL' WHERE status = 'PAID';
                RAISE NOTICE 'Mapped PAID to PAID-FULL';
            ELSE
                RAISE NOTICE 'Skipping PAID to PAID-FULL mapping - source or target not found';
            END IF;
            
            -- Map 'UNDER_REVIEW' to 'CLASSIFIED' (similar concept)
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'UNDER_REVIEW' LIMIT 1) AND
               EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'payment_request_status'::regtype AND enumlabel = 'CLASSIFIED') THEN
                UPDATE payment_requests SET status = 'CLASSIFIED' WHERE status = 'UNDER_REVIEW';
                RAISE NOTICE 'Mapped UNDER_REVIEW to CLASSIFIED';
            ELSE
                RAISE NOTICE 'Skipping UNDER_REVIEW to CLASSIFIED mapping - source or target not found';
            END IF;
        END $$;
    """)
    
    # Convert status column back to enum type
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::payment_request_status")
    
    # Recreate the views
    op.execute("""
        CREATE VIEW active_payment_requests AS
        SELECT * FROM payment_requests WHERE deleted = false
    """)
    
    op.execute("""
        CREATE VIEW active_payment_request_lines AS
        SELECT * FROM payment_request_lines
    """)
    
    op.execute("""
        CREATE VIEW active_request_files AS
        SELECT * FROM request_files
    """)
    
    op.execute("""
        CREATE VIEW active_request_events AS
        SELECT * FROM request_events
    """)


def downgrade() -> None:
    # Drop views that depend on the status column
    op.execute("DROP VIEW IF EXISTS active_payment_requests CASCADE")
    op.execute("DROP VIEW IF EXISTS active_payment_request_lines CASCADE")
    op.execute("DROP VIEW IF EXISTS active_request_files CASCADE")
    op.execute("DROP VIEW IF EXISTS active_request_events CASCADE")
    
    # Convert status column to TEXT temporarily
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE TEXT")
    
    # Reverse the mappings
    op.execute("""
        DO $$
        BEGIN
            -- Reverse 'CLASSIFIED' to 'REGISTERED' (they are the same concept)
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'CLASSIFIED' LIMIT 1) THEN
                UPDATE payment_requests SET status = 'REGISTERED' WHERE status = 'CLASSIFIED';
                RAISE NOTICE 'Reversed CLASSIFIED to REGISTERED';
            END IF;
            
            -- Reverse 'IN-REGISTER' to 'IN_REGISTRY' (frontend uses hyphen)
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'IN-REGISTER' LIMIT 1) THEN
                UPDATE payment_requests SET status = 'IN_REGISTRY' WHERE status = 'IN-REGISTER';
                RAISE NOTICE 'Reversed IN-REGISTER to IN_REGISTRY';
            END IF;
            
            -- Reverse 'PAID-FULL' to 'PAID' (more specific)
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'PAID-FULL' LIMIT 1) THEN
                UPDATE payment_requests SET status = 'PAID' WHERE status = 'PAID-FULL';
                RAISE NOTICE 'Reversed PAID-FULL to PAID';
            END IF;
            
            -- Reverse 'CLASSIFIED' to 'UNDER_REVIEW' (similar concept)
            IF EXISTS (SELECT 1 FROM payment_requests WHERE status = 'CLASSIFIED' LIMIT 1) THEN
                UPDATE payment_requests SET status = 'UNDER_REVIEW' WHERE status = 'CLASSIFIED';
                RAISE NOTICE 'Reversed CLASSIFIED to UNDER_REVIEW';
            END IF;
        END $$;
    """)
    
    # Convert status column back to enum type
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::payment_request_status")
    
    # Recreate the views
    op.execute("""
        CREATE VIEW active_payment_requests AS
        SELECT * FROM payment_requests WHERE deleted = false
    """)
    
    op.execute("""
        CREATE VIEW active_payment_request_lines AS
        SELECT * FROM payment_request_lines
    """)
    
    op.execute("""
        CREATE VIEW active_request_files AS
        SELECT * FROM request_files
    """)
    
    op.execute("""
        CREATE VIEW active_request_events AS
        SELECT * FROM request_events
    """)
