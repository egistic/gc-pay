"""Fix distributor_requests status column

Revision ID: 6c7ca75a1298
Revises: c144dd067aa7
Create Date: 2025-09-16 15:21:30.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6c7ca75a1298'
down_revision: Union[str, None] = 'c144dd067aa7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, drop the default value
    op.alter_column('distributor_requests', 'status',
               existing_type=sa.VARCHAR(length=32),
               server_default=None,
               existing_nullable=False)
    
    # Then change the column type
    op.alter_column('distributor_requests', 'status',
               existing_type=sa.VARCHAR(length=32),
               type_=sa.Enum('pending', 'in_progress', 'completed', 'failed', name='distribution_status'),
               existing_nullable=False,
               postgresql_using='CASE WHEN status = \'PENDING\' THEN \'pending\'::distribution_status ELSE \'pending\'::distribution_status END')
    
    # Set the new default value
    op.alter_column('distributor_requests', 'status',
               existing_type=sa.Enum('pending', 'in_progress', 'completed', 'failed', name='distribution_status'),
               server_default=sa.text("'pending'::distribution_status"),
               existing_nullable=False)
    
    # Update exchange_rates.created_at to NOT NULL
    op.alter_column('exchange_rates', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    
    # Fix idempotency_keys.key unique constraint
    op.drop_constraint('idempotency_keys_key_key', 'idempotency_keys', type_='unique')
    op.drop_index('ix_idempotency_keys_key', table_name='idempotency_keys')
    op.create_index(op.f('ix_idempotency_keys_key'), 'idempotency_keys', ['key'], unique=True)
    
    # Remove uk_split_group_sequence index
    op.drop_index('uk_split_group_sequence', table_name='payment_requests', postgresql_where='(original_request_id IS NOT NULL)')


def downgrade() -> None:
    # Revert distributor_requests.status back to VARCHAR
    op.alter_column('distributor_requests', 'status',
               existing_type=sa.Enum('pending', 'in_progress', 'completed', 'failed', name='distribution_status'),
               server_default=None,
               existing_nullable=False)
    
    op.alter_column('distributor_requests', 'status',
               existing_type=sa.Enum('pending', 'in_progress', 'completed', 'failed', name='distribution_status'),
               type_=sa.VARCHAR(length=32),
               existing_nullable=False,
               postgresql_using='status::text')
    
    op.alter_column('distributor_requests', 'status',
               existing_type=sa.VARCHAR(length=32),
               server_default=sa.text("'PENDING'::character varying"),
               existing_nullable=False)
    
    # Revert exchange_rates.created_at to nullable
    op.alter_column('exchange_rates', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    
    # Revert idempotency_keys changes
    op.drop_index(op.f('ix_idempotency_keys_key'), table_name='idempotency_keys')
    op.create_index('ix_idempotency_keys_key', 'idempotency_keys', ['key'], unique=False)
    op.create_unique_constraint('idempotency_keys_key_key', 'idempotency_keys', ['key'])
    
    # Restore uk_split_group_sequence index
    op.create_index('uk_split_group_sequence', 'payment_requests', ['original_request_id', 'split_sequence'], unique=True, postgresql_where='(original_request_id IS NOT NULL)')
