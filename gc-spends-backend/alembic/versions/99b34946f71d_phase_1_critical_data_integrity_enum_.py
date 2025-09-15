"""Phase 1: Critical Data Integrity - Enum Types and Currency Handling

Revision ID: 99b34946f71d
Revises: d0b305a829a4
Create Date: 2025-09-15 23:19:37.725359

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '99b34946f71d'
down_revision = 'd0b305a829a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Phase 1.1: Clean up any existing objects
    op.execute("DROP TYPE IF EXISTS payment_request_status CASCADE;")
    op.execute("DROP TYPE IF EXISTS distribution_status CASCADE;")
    op.execute("DROP TYPE IF EXISTS document_status CASCADE;")
    op.execute("DROP TYPE IF EXISTS sub_registrar_assignment_status CASCADE;")
    op.execute("DROP TYPE IF EXISTS contract_type CASCADE;")
    op.execute("DROP TABLE IF EXISTS exchange_rates CASCADE;")
    
    # Phase 1.2: Create new enum types with lowercase values
    op.execute("""
        CREATE TYPE payment_request_status AS ENUM (
            'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'cancelled'
        );
    """)
    
    op.execute("""
        CREATE TYPE distribution_status AS ENUM (
            'pending', 'in_progress', 'completed', 'failed'
        );
    """)
    
    op.execute("""
        CREATE TYPE document_status AS ENUM (
            'required', 'uploaded', 'verified', 'rejected'
        );
    """)
    
    op.execute("""
        CREATE TYPE sub_registrar_assignment_status AS ENUM (
            'assigned', 'in_progress', 'completed', 'rejected'
        );
    """)
    
    op.execute("""
        CREATE TYPE contract_type AS ENUM (
            'general', 'export', 'service', 'supply'
        );
    """)
    
    # Phase 1.3: Create exchange_rates table
    op.execute("""
        CREATE TABLE exchange_rates (
            date DATE NOT NULL,
            currency_code VARCHAR(3) NOT NULL,
            rate NUMERIC(10,6) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (date, currency_code)
        );
    """)
    
    # Phase 1.4: Add base currency columns to payment_requests
    op.execute("""
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_requests' AND column_name = 'amount_base_currency') THEN
                ALTER TABLE payment_requests ADD COLUMN amount_base_currency NUMERIC(18,2);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_requests' AND column_name = 'base_currency_code') THEN
                ALTER TABLE payment_requests ADD COLUMN base_currency_code VARCHAR(3) DEFAULT 'USD';
            END IF;
        END $$;
    """)
    
    # Phase 1.5: Convert payment_requests status values
    op.execute("""
        UPDATE payment_requests 
        SET status = CASE 
            WHEN UPPER(status) = 'DRAFT' THEN 'draft'
            WHEN UPPER(status) = 'SUBMITTED' THEN 'submitted'
            WHEN UPPER(status) = 'CLASSIFIED' THEN 'under_review'
            WHEN UPPER(status) = 'RETURNED' THEN 'under_review'
            WHEN UPPER(status) = 'APPROVED' THEN 'approved'
            WHEN UPPER(status) = 'APPROVED_ON_BEHALF' THEN 'approved'
            WHEN UPPER(status) = 'TO_PAY' THEN 'approved'
            WHEN UPPER(status) = 'IN_REGISTER' THEN 'approved'
            WHEN UPPER(status) = 'APPROVED_FOR_PAYMENT' THEN 'approved'
            WHEN UPPER(status) = 'PAID_FULL' THEN 'paid'
            WHEN UPPER(status) = 'PAID_PARTIAL' THEN 'paid'
            WHEN UPPER(status) = 'REJECTED' THEN 'rejected'
            WHEN UPPER(status) = 'CANCELLED' THEN 'cancelled'
            WHEN UPPER(status) = 'CLOSED' THEN 'cancelled'
            WHEN UPPER(status) = 'DISTRIBUTED' THEN 'paid'
            WHEN UPPER(status) = 'SPLITED' THEN 'cancelled'
            WHEN UPPER(status) = 'REPORT_PUBLISHED' THEN 'paid'
            WHEN UPPER(status) = 'EXPORT_LINKED' THEN 'paid'
            ELSE 'draft'
        END;
    """)
    
    # Phase 1.6: Convert payment_requests distribution_status values
    op.execute("""
        UPDATE payment_requests 
        SET distribution_status = CASE 
            WHEN UPPER(distribution_status) = 'PENDING' THEN 'pending'
            WHEN UPPER(distribution_status) = 'IN_PROGRESS' THEN 'in_progress'
            WHEN UPPER(distribution_status) = 'COMPLETED' THEN 'completed'
            WHEN UPPER(distribution_status) = 'FAILED' THEN 'failed'
            ELSE 'pending'
        END;
    """)
    
    # Phase 1.7: Convert payment_requests columns to enum types
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status DROP DEFAULT;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::payment_request_status;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status SET DEFAULT 'draft';")
    
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status DROP DEFAULT;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status TYPE distribution_status USING distribution_status::distribution_status;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status SET DEFAULT 'pending';")
    
    # Phase 1.8: Convert sub_registrar_assignments status values
    op.execute("""
        UPDATE sub_registrar_assignments 
        SET status = CASE 
            WHEN UPPER(status) = 'ASSIGNED' THEN 'assigned'
            WHEN UPPER(status) = 'IN_PROGRESS' THEN 'in_progress'
            WHEN UPPER(status) = 'COMPLETED' THEN 'completed'
            WHEN UPPER(status) = 'REJECTED' THEN 'rejected'
            ELSE 'assigned'
        END;
    """)
    
    # Phase 1.9: Convert sub_registrar_assignments column to enum type
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status DROP DEFAULT;")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status TYPE sub_registrar_assignment_status USING status::sub_registrar_assignment_status;")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status SET DEFAULT 'assigned';")
    
    # Phase 1.10: Convert sub_registrar_reports document_status values
    op.execute("""
        UPDATE sub_registrar_reports 
        SET document_status = CASE 
            WHEN UPPER(document_status) = 'REQUIRED' THEN 'required'
            WHEN UPPER(document_status) = 'UPLOADED' THEN 'uploaded'
            WHEN UPPER(document_status) = 'VERIFIED' THEN 'verified'
            WHEN UPPER(document_status) = 'REJECTED' THEN 'rejected'
            ELSE 'required'
        END;
    """)
    
    # Phase 1.11: Convert sub_registrar_reports column to enum type
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status DROP DEFAULT;")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status TYPE document_status USING document_status::document_status;")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status SET DEFAULT 'required';")
    
    # Phase 1.12: Convert contracts contract_type values
    op.execute("""
        UPDATE contracts 
        SET contract_type = CASE 
            WHEN UPPER(contract_type) = 'GENERAL' THEN 'general'
            WHEN UPPER(contract_type) = 'EXPORT' THEN 'export'
            WHEN UPPER(contract_type) = 'SERVICE' THEN 'service'
            WHEN UPPER(contract_type) = 'SUPPLY' THEN 'supply'
            ELSE 'general'
        END;
    """)
    
    # Phase 1.13: Convert contracts column to enum type
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type DROP DEFAULT;")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type TYPE contract_type USING contract_type::contract_type;")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type SET DEFAULT 'general';")
    
    # Phase 1.14: Add constraints
    op.execute("""
        DO $$ 
        BEGIN
            -- Amount constraints
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_amount_positive' AND table_name = 'payment_requests') THEN
                ALTER TABLE payment_requests ADD CONSTRAINT chk_amount_positive CHECK (amount_total >= 0);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_vat_positive' AND table_name = 'payment_requests') THEN
                ALTER TABLE payment_requests ADD CONSTRAINT chk_vat_positive CHECK (vat_total >= 0);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_amount_net_positive' AND table_name = 'payment_request_lines') THEN
                ALTER TABLE payment_request_lines ADD CONSTRAINT chk_amount_net_positive CHECK (amount_net >= 0);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_quantity_positive' AND table_name = 'payment_request_lines') THEN
                ALTER TABLE payment_request_lines ADD CONSTRAINT chk_quantity_positive CHECK (quantity >= 0);
            END IF;
            
            -- Currency format constraints
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_currency_code_format' AND table_name = 'payment_requests') THEN
                ALTER TABLE payment_requests ADD CONSTRAINT chk_currency_code_format CHECK (currency_code ~ '^[A-Z]{3}$');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_base_currency_format' AND table_name = 'payment_requests') THEN
                ALTER TABLE payment_requests ADD CONSTRAINT chk_base_currency_format CHECK (base_currency_code ~ '^[A-Z]{3}$');
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_line_currency_format' AND table_name = 'payment_request_lines') THEN
                ALTER TABLE payment_request_lines ADD CONSTRAINT chk_line_currency_format CHECK (currency_code ~ '^[A-Z]{3}$');
            END IF;
            
            -- Exchange rate constraints
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_exchange_rate_positive' AND table_name = 'exchange_rates') THEN
                ALTER TABLE exchange_rates ADD CONSTRAINT chk_exchange_rate_positive CHECK (rate > 0);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_exchange_currency_format' AND table_name = 'exchange_rates') THEN
                ALTER TABLE exchange_rates ADD CONSTRAINT chk_exchange_currency_format CHECK (currency_code ~ '^[A-Z]{3}$');
            END IF;
        END $$;
    """)


def downgrade() -> None:
    # Remove constraints
    op.execute("ALTER TABLE exchange_rates DROP CONSTRAINT IF EXISTS chk_exchange_currency_format;")
    op.execute("ALTER TABLE exchange_rates DROP CONSTRAINT IF EXISTS chk_exchange_rate_positive;")
    op.execute("ALTER TABLE payment_request_lines DROP CONSTRAINT IF EXISTS chk_line_currency_format;")
    op.execute("ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS chk_base_currency_format;")
    op.execute("ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS chk_currency_code_format;")
    op.execute("ALTER TABLE payment_request_lines DROP CONSTRAINT IF EXISTS chk_quantity_positive;")
    op.execute("ALTER TABLE payment_request_lines DROP CONSTRAINT IF EXISTS chk_amount_net_positive;")
    op.execute("ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS chk_vat_positive;")
    op.execute("ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS chk_amount_positive;")
    
    # Convert enum columns back to VARCHAR
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type DROP DEFAULT;")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type TYPE VARCHAR(64);")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type SET DEFAULT 'general';")
    
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status DROP DEFAULT;")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status TYPE VARCHAR(50);")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status SET DEFAULT 'required';")
    
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status DROP DEFAULT;")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status TYPE VARCHAR(32);")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status SET DEFAULT 'assigned';")
    
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status DROP DEFAULT;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status TYPE VARCHAR(32);")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status SET DEFAULT 'pending';")
    
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status DROP DEFAULT;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE VARCHAR(32);")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status SET DEFAULT 'draft';")
    
    # Remove base currency columns
    op.execute("ALTER TABLE payment_requests DROP COLUMN IF EXISTS base_currency_code;")
    op.execute("ALTER TABLE payment_requests DROP COLUMN IF EXISTS amount_base_currency;")
    
    # Drop exchange rates table
    op.execute("DROP TABLE IF EXISTS exchange_rates;")
    
    # Drop enum types
    op.execute("DROP TYPE IF EXISTS contract_type;")
    op.execute("DROP TYPE IF EXISTS document_status;")
    op.execute("DROP TYPE IF EXISTS sub_registrar_assignment_status;")
    op.execute("DROP TYPE IF EXISTS distribution_status;")
    op.execute("DROP TYPE IF EXISTS payment_request_status;")
