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
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE payment_requests SET status = UPPER(status::text)::payment_request_status")
    
    # Update payment_request_status enum to use uppercase values
    op.execute("ALTER TYPE payment_request_status RENAME TO payment_request_status_old")
    op.execute("CREATE TYPE payment_request_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')")
    
    # Then alter the column type
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::text::payment_request_status")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status SET DEFAULT 'DRAFT'::payment_request_status")
    op.execute("DROP TYPE payment_request_status_old")
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE payment_requests SET distribution_status = UPPER(distribution_status::text)::distribution_status")
    
    # Update distribution_status enum to use uppercase values
    op.execute("ALTER TYPE distribution_status RENAME TO distribution_status_old")
    op.execute("CREATE TYPE distribution_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')")
    
    # Then alter the column type
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status TYPE distribution_status USING distribution_status::text::distribution_status")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status SET DEFAULT 'PENDING'::distribution_status")
    op.execute("DROP TYPE distribution_status_old")
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE sub_registrar_reports SET document_status = UPPER(document_status::text)::document_status")
    
    # Update document_status enum to use uppercase values
    op.execute("ALTER TYPE document_status RENAME TO document_status_old")
    op.execute("CREATE TYPE document_status AS ENUM ('REQUIRED', 'UPLOADED', 'VERIFIED', 'REJECTED')")
    
    # Then alter the column type
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status TYPE document_status USING document_status::text::document_status")
    op.execute("DROP TYPE document_status_old")
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE sub_registrar_assignments SET status = UPPER(status::text)::sub_registrar_assignment_status")
    
    # Update sub_registrar_assignment_status enum to use uppercase values
    op.execute("ALTER TYPE sub_registrar_assignment_status RENAME TO sub_registrar_assignment_status_old")
    op.execute("CREATE TYPE sub_registrar_assignment_status AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')")
    
    # Then alter the column type
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status TYPE sub_registrar_assignment_status USING status::text::sub_registrar_assignment_status")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status SET DEFAULT 'ASSIGNED'::sub_registrar_assignment_status")
    op.execute("DROP TYPE sub_registrar_assignment_status_old")
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE contracts SET contract_type = UPPER(contract_type::text)::contract_type")
    
    # Update contract_type enum to use uppercase values
    op.execute("ALTER TYPE contract_type RENAME TO contract_type_old")
    op.execute("CREATE TYPE contract_type AS ENUM ('GENERAL', 'EXPORT', 'SERVICE', 'SUPPLY')")
    
    # Then alter the column type
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type TYPE contract_type USING contract_type::text::contract_type")
    op.execute("DROP TYPE contract_type_old")
    
    # First, update the data to uppercase using text conversion
    op.execute("UPDATE payment_requests SET priority = UPPER(priority::text)::payment_priority")
    
    # Update payment_priority enum to use uppercase values
    op.execute("ALTER TYPE payment_priority RENAME TO payment_priority_old")
    op.execute("CREATE TYPE payment_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL')")
    
    # Then alter the column type
    op.execute("ALTER TABLE payment_requests ALTER COLUMN priority TYPE payment_priority USING priority::text::payment_priority")
    op.execute("DROP TYPE payment_priority_old")


def downgrade() -> None:
    # Revert payment_request_status enum to lowercase values
    op.execute("ALTER TYPE payment_request_status RENAME TO payment_request_status_old")
    op.execute("CREATE TYPE payment_request_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'cancelled')")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN status TYPE payment_request_status USING status::text::payment_request_status")
    op.execute("DROP TYPE payment_request_status_old")
    
    # Revert distribution_status enum to lowercase values
    op.execute("ALTER TYPE distribution_status RENAME TO distribution_status_old")
    op.execute("CREATE TYPE distribution_status AS ENUM ('pending', 'in_progress', 'completed', 'failed')")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN distribution_status TYPE distribution_status USING distribution_status::text::distribution_status")
    op.execute("DROP TYPE distribution_status_old")
    
    # Revert document_status enum to lowercase values
    op.execute("ALTER TYPE document_status RENAME TO document_status_old")
    op.execute("CREATE TYPE document_status AS ENUM ('required', 'uploaded', 'verified', 'rejected')")
    op.execute("ALTER TABLE sub_registrar_reports ALTER COLUMN document_status TYPE document_status USING document_status::text::document_status")
    op.execute("DROP TYPE document_status_old")
    
    # Revert sub_registrar_assignment_status enum to lowercase values
    op.execute("ALTER TYPE sub_registrar_assignment_status RENAME TO sub_registrar_assignment_status_old")
    op.execute("CREATE TYPE sub_registrar_assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'rejected')")
    op.execute("ALTER TABLE sub_registrar_assignments ALTER COLUMN status TYPE sub_registrar_assignment_status USING status::text::sub_registrar_assignment_status")
    op.execute("DROP TYPE sub_registrar_assignment_status_old")
    
    # Revert contract_type enum to lowercase values
    op.execute("ALTER TYPE contract_type RENAME TO contract_type_old")
    op.execute("CREATE TYPE contract_type AS ENUM ('general', 'export', 'service', 'supply')")
    op.execute("ALTER TABLE contracts ALTER COLUMN contract_type TYPE contract_type USING contract_type::text::contract_type")
    op.execute("DROP TYPE contract_type_old")
    
    # Revert payment_priority enum to lowercase values
    op.execute("ALTER TYPE payment_priority RENAME TO payment_priority_old")
    op.execute("CREATE TYPE payment_priority AS ENUM ('low', 'normal', 'high', 'urgent', 'critical')")
    op.execute("ALTER TABLE payment_requests ALTER COLUMN priority TYPE payment_priority USING priority::text::payment_priority")
    op.execute("DROP TYPE payment_priority_old")
