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
    
    # First, let's check if there are any invalid statuses and fix them
    op.execute("""
        UPDATE payment_requests 
        SET status = 'draft' 
        WHERE status NOT IN (
            'draft', 'submitted', 'classified', 'allocated', 'returned', 
            'approved', 'approved-on-behalf', 'to-pay', 'in-register', 
            'approved-for-payment', 'paid-full', 'paid-partial', 
            'declined', 'rejected', 'cancelled', 'distributed', 
            'report_published', 'export_linked'
        );
    """)
    
    # Update any remaining old status values to new ones
    # (This is a safety measure in case some old values still exist)
    op.execute("UPDATE payment_requests SET status = 'classified' WHERE status = 'registered'")
    op.execute("UPDATE payment_requests SET status = 'in-register' WHERE status = 'in_registry'")
    op.execute("UPDATE payment_requests SET status = 'paid-full' WHERE status = 'paid'")
    op.execute("UPDATE payment_requests SET status = 'classified' WHERE status = 'under_review'")
    
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
    # Note: This migration only ensures data consistency
    # No downgrade needed as it only fixes invalid data
    pass
