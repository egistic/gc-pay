"""Create ENUM types and update columns

Revision ID: c144dd067aa7
Revises: 18fb4e44fc7f
Create Date: 2025-09-16 15:18:53.788681

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c144dd067aa7'
down_revision: Union[str, None] = '18fb4e44fc7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM types that match the current database state
    # These ENUMs already exist in the database, so this is just for Alembic tracking
    
    # ContractType enum
    contract_type = postgresql.ENUM(
        'general', 'export', 'service', 'supply',
        name='contract_type',
        create_type=False  # Don't create, it already exists
    )
    
    # DistributionStatus enum
    distribution_status = postgresql.ENUM(
        'pending', 'in_progress', 'completed', 'failed',
        name='distribution_status',
        create_type=False  # Don't create, it already exists
    )
    
    # DocumentStatus enum
    document_status = postgresql.ENUM(
        'required', 'uploaded', 'verified', 'rejected',
        name='document_status',
        create_type=False  # Don't create, it already exists
    )
    
    # PaymentPriority enum
    payment_priority = postgresql.ENUM(
        'low', 'normal', 'high', 'urgent', 'critical',
        name='payment_priority',
        create_type=False  # Don't create, it already exists
    )
    
    # PaymentRequestStatus enum
    payment_request_status = postgresql.ENUM(
        'draft', 'submitted', 'classified', 'returned', 'approved',
        'approved-on-behalf', 'to-pay', 'in-register', 'approved-for-payment',
        'paid-full', 'paid-partial', 'rejected', 'cancelled', 'closed',
        'distributed', 'report_published', 'export_linked', 'splited',
        name='payment_request_status',
        create_type=False  # Don't create, it already exists
    )
    
    # RoleCode enum
    role_code = postgresql.ENUM(
        'admin', 'executor', 'registrar', 'sub_registrar', 'distributor', 'treasurer',
        name='role_code',
        create_type=False  # Don't create, it already exists
    )
    
    # SubRegistrarAssignmentStatus enum
    sub_registrar_assignment_status = postgresql.ENUM(
        'assigned', 'in_progress', 'completed', 'rejected',
        name='sub_registrar_assignment_status',
        create_type=False  # Don't create, it already exists
    )


def downgrade() -> None:
    # In downgrade, we don't drop the ENUMs since they already existed
    pass
