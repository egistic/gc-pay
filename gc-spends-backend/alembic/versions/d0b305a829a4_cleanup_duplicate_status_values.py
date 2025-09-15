"""cleanup_duplicate_status_values

Revision ID: d0b305a829a4
Revises: b72a2ab85df1
Create Date: 2025-09-15 18:35:14.855832

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd0b305a829a4'
down_revision = 'b72a2ab85df1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop views that depend on the status column first
    op.execute("DROP VIEW IF EXISTS active_payment_requests CASCADE")
    op.execute("DROP VIEW IF EXISTS active_payment_request_lines CASCADE")
    op.execute("DROP VIEW IF EXISTS active_request_files CASCADE")
    op.execute("DROP VIEW IF EXISTS active_request_events CASCADE")
    
    # Convert all status values to lowercase text first
    op.execute("""
        ALTER TABLE payment_requests 
        ALTER COLUMN status TYPE TEXT
    """)
    
    op.execute("""
        ALTER TABLE payment_request_lines 
        ALTER COLUMN status TYPE TEXT
    """)
    
    # Now update the values
    op.execute("""
        UPDATE payment_requests 
        SET status = 'classified' 
        WHERE UPPER(status) = 'REGISTERED'
    """)
    
    op.execute("""
        UPDATE payment_request_lines 
        SET status = 'classified' 
        WHERE UPPER(status) = 'REGISTERED'
    """)
    
    # Map duplicate statuses to their primary equivalents
    # allocated -> distributed (both mean "Распределена")
    op.execute("""
        UPDATE payment_requests 
        SET status = 'distributed' 
        WHERE status = 'allocated'
    """)
    
    # declined -> rejected (both mean "Отклонена")
    op.execute("""
        UPDATE payment_requests 
        SET status = 'rejected' 
        WHERE status = 'declined'
    """)
    
    # Convert all to lowercase
    op.execute("""
        UPDATE payment_requests 
        SET status = LOWER(status)
    """)
    
    op.execute("""
        UPDATE payment_request_lines 
        SET status = LOWER(status)
    """)
    
    # Update the enum type to remove duplicate values
    # First, create a new enum type without the duplicates
    op.execute("""
        CREATE TYPE payment_request_status_new AS ENUM (
            'DRAFT',
            'SUBMITTED', 
            'CLASSIFIED',
            'RETURNED',
            'APPROVED',
            'APPROVED-ON-BEHALF',
            'TO-PAY',
            'IN-REGISTER',
            'APPROVED-FOR-PAYMENT',
            'PAID-FULL',
            'PAID-PARTIAL',
            'REJECTED',
            'CANCELLED',
            'CLOSED',
            'DISTRIBUTED',
            'REPORT_PUBLISHED',
            'EXPORT_LINKED'
        )
    """)
    
    # Update the column to use the new enum type
    # First, drop the default constraint
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE payment_request_lines ALTER COLUMN status DROP DEFAULT")
    
    # Update the column types with case conversion
    op.execute("""
        ALTER TABLE payment_requests 
        ALTER COLUMN status TYPE payment_request_status_new 
        USING UPPER(status::text)::payment_request_status_new
    """)
    
    op.execute("""
        ALTER TABLE payment_request_lines 
        ALTER COLUMN status TYPE payment_request_status_new 
        USING UPPER(status::text)::payment_request_status_new
    """)
    
    # Restore the default values
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status SET DEFAULT 'DRAFT'")
    op.execute("ALTER TABLE payment_request_lines ALTER COLUMN status SET DEFAULT 'DRAFT'")
    
    # Drop the old enum type
    op.execute("DROP TYPE payment_request_status")
    
    # Rename the new enum type
    op.execute("ALTER TYPE payment_request_status_new RENAME TO payment_request_status")
    
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
    # Recreate the old enum type with all values
    op.execute("""
        CREATE TYPE payment_request_status_old AS ENUM (
            'DRAFT',
            'SUBMITTED', 
            'CLASSIFIED',
            'ALLOCATED',
            'RETURNED',
            'APPROVED',
            'APPROVED-ON-BEHALF',
            'TO-PAY',
            'IN-REGISTER',
            'APPROVED-FOR-PAYMENT',
            'PAID-FULL',
            'PAID-PARTIAL',
            'DECLINED',
            'REJECTED',
            'CANCELLED',
            'CLOSED',
            'DISTRIBUTED',
            'REPORT_PUBLISHED',
            'EXPORT_LINKED'
        )
    """)
    
    # Update columns back to old enum type
    op.execute("""
        ALTER TABLE payment_requests 
        ALTER COLUMN status TYPE payment_request_status_old 
        USING status::text::payment_request_status_old
    """)
    
    op.execute("""
        ALTER TABLE payment_request_lines 
        ALTER COLUMN status TYPE payment_request_status_old 
        USING status::text::payment_request_status_old
    """)
    
    # Drop the new enum type
    op.execute("DROP TYPE payment_request_status")
    
    # Rename back
    op.execute("ALTER TYPE payment_request_status_old RENAME TO payment_request_status")
    
    # Reverse the status mappings
    op.execute("""
        UPDATE payment_requests 
        SET status = 'ALLOCATED' 
        WHERE status = 'DISTRIBUTED'
    """)
    
    op.execute("""
        UPDATE payment_requests 
        SET status = 'DECLINED' 
        WHERE status = 'REJECTED'
    """)
