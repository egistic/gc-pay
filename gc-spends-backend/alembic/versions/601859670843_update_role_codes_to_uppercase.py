"""update_role_codes_to_uppercase

Revision ID: 601859670843
Revises: 3908df61c4ae
Create Date: 2025-09-14 18:58:37.974775

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '601859670843'
down_revision = '3908df61c4ae'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop views that depend on columns we're about to modify
    op.execute("DROP VIEW IF EXISTS active_payment_requests CASCADE")
    
    # Check if payment_request_status enum exists, if not create it
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_request_status') THEN
                CREATE TYPE payment_request_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'cancelled');
            END IF;
        END $$;
    """)
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE payment_requests SET status = UPPER(status::text)")
    
    # Update payment_request_status enum to use uppercase values
    op.execute("ALTER TYPE payment_request_status RENAME TO payment_request_status_old")
    op.execute("CREATE TYPE payment_request_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')")
    
    # Then alter the column type (remove default first, change type, then set new default)
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::text::payment_request_status")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status SET DEFAULT 'DRAFT'::payment_request_status")
    op.execute("DROP TYPE payment_request_status_old CASCADE")
    
    # Check if distribution_status enum exists, if not create it
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'distribution_status') THEN
                CREATE TYPE distribution_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');
            END IF;
        END $$;
    """)
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE payment_requests SET distribution_status = UPPER(distribution_status::text)")
    
    # Update distribution_status enum to use uppercase values
    op.execute("ALTER TYPE distribution_status RENAME TO distribution_status_old")
    op.execute("CREATE TYPE distribution_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')")
    
    # Then alter the column type (remove default first, change type, then set new default)
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status DROP DEFAULT")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status TYPE distribution_status USING distribution_status::text::distribution_status")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status SET DEFAULT 'PENDING'::distribution_status")
    op.execute("DROP TYPE distribution_status_old CASCADE")
    
    # Check if document_status enum exists, if not create it
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
                CREATE TYPE document_status AS ENUM ('required', 'uploaded', 'verified', 'rejected');
            END IF;
        END $$;
    """)
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE sub_registrar_reports SET document_status = UPPER(document_status::text)")
    
    # Update document_status enum to use uppercase values
    op.execute("ALTER TYPE document_status RENAME TO document_status_old")
    op.execute("CREATE TYPE document_status AS ENUM ('REQUIRED', 'UPLOADED', 'VERIFIED', 'REJECTED')")
    
    # Then alter the column type (remove default first, change type, then set new default)
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status DROP DEFAULT")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status TYPE document_status USING document_status::text::document_status")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status SET DEFAULT 'REQUIRED'::document_status")
    op.execute("DROP TYPE document_status_old CASCADE")
    
    # Check if sub_registrar_assignment_status enum exists, if not create it
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sub_registrar_assignment_status') THEN
                CREATE TYPE sub_registrar_assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'rejected');
            END IF;
        END $$;
    """)
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE sub_registrar_assignments SET status = UPPER(status::text)")
    
    # Update sub_registrar_assignment_status enum to use uppercase values
    op.execute("ALTER TYPE sub_registrar_assignment_status RENAME TO sub_registrar_assignment_status_old")
    op.execute("CREATE TYPE sub_registrar_assignment_status AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')")
    
    # Then alter the column type (remove default first, change type, then set new default)
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status TYPE sub_registrar_assignment_status USING status::text::sub_registrar_assignment_status")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status SET DEFAULT 'ASSIGNED'::sub_registrar_assignment_status")
    op.execute("DROP TYPE sub_registrar_assignment_status_old CASCADE")
    
    # Check if contract_type enum exists, if not create it
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_type') THEN
                CREATE TYPE contract_type AS ENUM ('general', 'export', 'service', 'supply');
            END IF;
        END $$;
    """)
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE contracts SET contract_type = UPPER(contract_type::text)")
    
    # Update contract_type enum to use uppercase values
    op.execute("ALTER TYPE contract_type RENAME TO contract_type_old")
    op.execute("CREATE TYPE contract_type AS ENUM ('GENERAL', 'EXPORT', 'SERVICE', 'SUPPLY')")
    
    # Then alter the column type (remove default first, change type, then set new default)
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type DROP DEFAULT")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type TYPE contract_type USING contract_type::text::contract_type")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type SET DEFAULT 'GENERAL'::contract_type")
    op.execute("DROP TYPE contract_type_old CASCADE")
    
    # Check if payment_priority enum exists, if not create it
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_priority') THEN
                -- Check if paymentpriority exists (with different case)
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymentpriority') THEN
                    -- Rename existing enum to standard name
                    ALTER TYPE paymentpriority RENAME TO payment_priority;
                ELSE
                    CREATE TYPE payment_priority AS ENUM ('low', 'normal', 'high', 'urgent', 'critical');
                END IF;
            END IF;
        END $$;
    """)
    
    # Update payment_priority enum to use uppercase values first
    op.execute("ALTER TYPE paymentpriority RENAME TO payment_priority_old")
    op.execute("CREATE TYPE paymentpriority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL')")
    
    # Then update the data to uppercase using text conversion
    op.execute("UPDATE payment_requests SET priority = UPPER(priority::text)::payment_priority_old")
    
    # Then alter the column type (remove default first, change type, then set new default)
    op.execute("ALTER TABLE payment_requests ALTER COLUMN priority DROP DEFAULT")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN priority TYPE paymentpriority USING priority::text::paymentpriority")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN priority SET DEFAULT 'NORMAL'::paymentpriority")
    op.execute("DROP TYPE payment_priority_old CASCADE")
    
    # Recreate the view with uppercase values
    op.execute("""
        CREATE VIEW active_payment_requests AS
        SELECT * FROM payment_requests 
        WHERE status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED')
    """)


def downgrade() -> None:
    # Drop views that depend on the status column
    op.execute("DROP VIEW IF EXISTS active_payment_requests CASCADE")
    
    # Revert payment_request_status enum to lowercase values
    op.execute("ALTER TYPE payment_request_status RENAME TO payment_request_status_old")
    op.execute("CREATE TYPE payment_request_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'cancelled')")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::text::payment_request_status")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status SET DEFAULT 'draft'::payment_request_status")
    op.execute("DROP TYPE payment_request_status_old CASCADE")
    
    # Recreate the view with lowercase values
    op.execute("""
        CREATE VIEW active_payment_requests AS
        SELECT * FROM payment_requests 
        WHERE status IN ('draft', 'submitted', 'under_review', 'approved')
    """)
    
    # Revert distribution_status enum to lowercase values
    op.execute("ALTER TYPE distribution_status RENAME TO distribution_status_old")
    op.execute("CREATE TYPE distribution_status AS ENUM ('pending', 'in_progress', 'completed', 'failed')")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status DROP DEFAULT")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status TYPE distribution_status USING distribution_status::text::distribution_status")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status SET DEFAULT 'pending'::distribution_status")
    op.execute("DROP TYPE distribution_status_old CASCADE")
    
    # Revert document_status enum to lowercase values
    op.execute("ALTER TYPE document_status RENAME TO document_status_old")
    op.execute("CREATE TYPE document_status AS ENUM ('required', 'uploaded', 'verified', 'rejected')")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status DROP DEFAULT")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status TYPE document_status USING document_status::text::document_status")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status SET DEFAULT 'required'::document_status")
    op.execute("DROP TYPE document_status_old CASCADE")
    
    # Revert sub_registrar_assignment_status enum to lowercase values
    op.execute("ALTER TYPE sub_registrar_assignment_status RENAME TO sub_registrar_assignment_status_old")
    op.execute("CREATE TYPE sub_registrar_assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'rejected')")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status DROP DEFAULT")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status TYPE sub_registrar_assignment_status USING status::text::sub_registrar_assignment_status")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status SET DEFAULT 'assigned'::sub_registrar_assignment_status")
    op.execute("DROP TYPE sub_registrar_assignment_status_old CASCADE")
    
    # Revert contract_type enum to lowercase values
    op.execute("ALTER TYPE contract_type RENAME TO contract_type_old")
    op.execute("CREATE TYPE contract_type AS ENUM ('general', 'export', 'service', 'supply')")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type DROP DEFAULT")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type TYPE contract_type USING contract_type::text::contract_type")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type SET DEFAULT 'general'::contract_type")
    op.execute("DROP TYPE contract_type_old CASCADE")
    
    # Revert payment_priority enum to lowercase values
    op.execute("ALTER TYPE paymentpriority RENAME TO payment_priority_old")
    op.execute("CREATE TYPE paymentpriority AS ENUM ('low', 'normal', 'high', 'urgent', 'critical')")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN priority DROP DEFAULT")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN priority TYPE paymentpriority USING priority::text::paymentpriority")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN priority SET DEFAULT 'normal'::paymentpriority")
    op.execute("DROP TYPE payment_priority_old CASCADE")
