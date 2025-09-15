"""update_existing_requests_statuses

Revision ID: 3afe2971dede
Revises: 5cfd4f8ee69b
Create Date: 2025-09-15 10:28:29.919719

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3afe2971dede'
down_revision = '5cfd4f8ee69b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ensure all existing requests have valid statuses according to the new enum
    # This migration ensures data consistency after status unification
    
    # Convert status column to TEXT temporarily to avoid enum issues
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE TEXT")
    
    # Now perform the updates safely
    op.execute("""
        DO $$
        BEGIN
            -- First, let's check if there are any invalid statuses and fix them
            UPDATE payment_requests 
            SET status = 'DRAFT' 
            WHERE status NOT IN (
                'DRAFT', 'SUBMITTED', 'CLASSIFIED', 'ALLOCATED', 'RETURNED', 
                'APPROVED', 'APPROVED-ON-BEHALF', 'TO-PAY', 'IN-REGISTER', 
                'APPROVED-FOR-PAYMENT', 'PAID-FULL', 'PAID-PARTIAL', 
                'DECLINED', 'REJECTED', 'CANCELLED', 'DISTRIBUTED', 
                'REPORT_PUBLISHED', 'EXPORT_LINKED'
            );
            
            -- Update any remaining old status values to new ones
            -- (This is a safety measure in case some old values still exist)
            UPDATE payment_requests SET status = 'CLASSIFIED' WHERE status = 'REGISTERED';
            UPDATE payment_requests SET status = 'IN-REGISTER' WHERE status = 'IN_REGISTRY';
            UPDATE payment_requests SET status = 'PAID-FULL' WHERE status = 'PAID';
            UPDATE payment_requests SET status = 'CLASSIFIED' WHERE status = 'UNDER_REVIEW';
            
            RAISE NOTICE 'Updated payment request statuses successfully';
        END $$;
    """)
    
    # Convert status column back to enum type
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::payment_request_status")
    
    # Log the current status distribution
    op.execute("""
        DO $$
        DECLARE
            status_count RECORD;
        BEGIN
            RAISE NOTICE 'Updated payment request statuses. Current distribution:';
            FOR status_count IN 
                SELECT status, COUNT(*) as count 
                FROM payment_requests 
                WHERE deleted = false 
                GROUP BY status 
                ORDER BY count DESC
            LOOP
                RAISE NOTICE '  %: % заявок', status_count.status, status_count.count;
            END LOOP;
        END $$;
    """)


def downgrade() -> None:
    # Convert status column to TEXT temporarily to avoid enum issues
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE TEXT")
    
    # Reverse the mappings
    op.execute("""
        DO $$
        BEGIN
            -- Reverse the status mappings
            UPDATE payment_requests SET status = 'REGISTERED' WHERE status = 'CLASSIFIED';
            UPDATE payment_requests SET status = 'IN_REGISTRY' WHERE status = 'IN-REGISTER';
            UPDATE payment_requests SET status = 'PAID' WHERE status = 'PAID-FULL';
            UPDATE payment_requests SET status = 'UNDER_REVIEW' WHERE status = 'CLASSIFIED';
            
            RAISE NOTICE 'Reversed payment request status mappings';
        END $$;
    """)
    
    # Convert status column back to enum type
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::payment_request_status")
