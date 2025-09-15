"""Phase 1: Critical Data Integrity - Enum Types and Currency Handling

Revision ID: ffe416ae00e8
Revises: 9d343828e9b2
Create Date: 2025-09-14 10:24:32.496994

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ffe416ae00e8'
down_revision = '9d343828e9b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Phase 1.1: Create enum types with new values
    # Note: Run cleanup_enums.sql first to remove existing enum types
    
    # Create new enum types with lowercase values
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
    
    # Phase 1.2: Create Exchange Rates Table
    op.create_table('exchange_rates',
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('rate', sa.Numeric(precision=10, scale=6), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('date', 'currency_code')
    )
    
    # Phase 1.3: Add Base Currency Support to Payment Requests
    op.add_column('payment_requests', sa.Column('amount_base_currency', sa.Numeric(precision=18, scale=2), nullable=True))
    op.add_column('payment_requests', sa.Column('base_currency_code', sa.String(length=3), nullable=True, server_default='USD'))
    
    # Phase 1.4: Convert Status Columns to Enum Types
    # Map existing uppercase values to new lowercase enum values
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
    
    # Convert columns to enum types
    # First remove the default, then change type, then add new default
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status DROP DEFAULT;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::payment_request_status;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status SET DEFAULT 'draft';")
    
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status DROP DEFAULT;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status TYPE distribution_status USING distribution_status::distribution_status;")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status SET DEFAULT 'pending';")
    
    # Convert other status columns
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
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status DROP DEFAULT;")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status TYPE sub_registrar_assignment_status USING status::sub_registrar_assignment_status;")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status SET DEFAULT 'assigned';")
    
    # Convert document status in sub_registrar_reports
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
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status TYPE document_status USING document_status::document_status;")
    
    # Convert contract types
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
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type TYPE contract_type USING contract_type::contract_type;")
    
    # Phase 1.5: Add Currency and Amount Constraints
    op.create_check_constraint('chk_amount_positive', 'payment_requests', 'amount_total >= 0')
    op.create_check_constraint('chk_vat_positive', 'payment_requests', 'vat_total >= 0')
    op.create_check_constraint('chk_amount_net_positive', 'payment_request_lines', 'amount_net >= 0')
    op.create_check_constraint('chk_quantity_positive', 'payment_request_lines', 'quantity >= 0')
    
    # Phase 1.6: Add Currency Code Constraints
    op.create_check_constraint('chk_currency_code_format', 'payment_requests', "currency_code ~ '^[A-Z]{3}$'")
    op.create_check_constraint('chk_base_currency_format', 'payment_requests', "base_currency_code ~ '^[A-Z]{3}$'")
    op.create_check_constraint('chk_line_currency_format', 'payment_request_lines', "currency_code ~ '^[A-Z]{3}$'")
    
    # Phase 1.7: Add Exchange Rate Constraints
    op.create_check_constraint('chk_exchange_rate_positive', 'exchange_rates', 'rate > 0')
    op.create_check_constraint('chk_exchange_currency_format', 'exchange_rates', "currency_code ~ '^[A-Z]{3}$'")


def downgrade() -> None:
    # Remove constraints
    op.drop_constraint('chk_exchange_currency_format', 'exchange_rates', type_='check')
    op.drop_constraint('chk_exchange_rate_positive', 'exchange_rates', type_='check')
    op.drop_constraint('chk_line_currency_format', 'payment_request_lines', type_='check')
    op.drop_constraint('chk_base_currency_format', 'payment_requests', type_='check')
    op.drop_constraint('chk_currency_code_format', 'payment_requests', type_='check')
    op.drop_constraint('chk_quantity_positive', 'payment_request_lines', type_='check')
    op.drop_constraint('chk_amount_net_positive', 'payment_request_lines', type_='check')
    op.drop_constraint('chk_vat_positive', 'payment_requests', type_='check')
    op.drop_constraint('chk_amount_positive', 'payment_requests', type_='check')
    
    # Convert enum columns back to VARCHAR
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type TYPE VARCHAR(64);")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status TYPE VARCHAR(50);")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status TYPE VARCHAR(32);")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status TYPE VARCHAR(32);")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE VARCHAR(32);")
    
    # Remove base currency columns
    op.drop_column('payment_requests', 'base_currency_code')
    op.drop_column('payment_requests', 'amount_base_currency')
    
    # Drop exchange rates table
    op.drop_table('exchange_rates')
    
    # Drop enum types
    op.execute("DROP TYPE contract_type;")
    op.execute("DROP TYPE document_status;")
    op.execute("DROP TYPE sub_registrar_assignment_status;")
    op.execute("DROP TYPE distribution_status;")
    op.execute("DROP TYPE payment_request_status;")
