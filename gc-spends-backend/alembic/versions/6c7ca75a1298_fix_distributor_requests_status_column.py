"""Fix database constraints and indexes

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
    # Column status already has the correct ENUM type from base migration
    # No need to change the column type or default value
    
    # Update exchange_rates.created_at to NOT NULL
    op.alter_column('exchange_rates', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=False,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    
    # Fix idempotency_keys.key unique constraint
    # Safely drop constraint and index if they exist
    op.execute("ALTER TABLE idempotency_keys DROP CONSTRAINT IF EXISTS idempotency_keys_key_key")
    op.execute("DROP INDEX IF EXISTS ix_idempotency_keys_key")
    
    # Create the unique index
    op.create_index(op.f('ix_idempotency_keys_key'), 'idempotency_keys', ['key'], unique=True)
    
    # Remove uk_split_group_sequence index
    op.drop_index('uk_split_group_sequence', table_name='payment_requests')


def downgrade() -> None:
    # Revert distributor_requests.status back to VARCHAR
    # distributor_requests.status already has correct ENUM type from base migration
    # No need to revert it
    
    # Revert exchange_rates.created_at to nullable
    op.alter_column('exchange_rates', 'created_at',
               existing_type=postgresql.TIMESTAMP(),
               nullable=True,
               existing_server_default=sa.text('CURRENT_TIMESTAMP'))
    
    # Revert idempotency_keys changes
    op.execute("DROP INDEX IF EXISTS " + op.f('ix_idempotency_keys_key'))
    op.create_index('ix_idempotency_keys_key', 'idempotency_keys', ['key'], unique=False)
    op.create_unique_constraint('idempotency_keys_key_key', 'idempotency_keys', ['key'])
    
    # Restore uk_split_group_sequence index
    op.create_index('uk_split_group_sequence', 'payment_requests', ['original_request_id', 'split_sequence'], unique=True, postgresql_where='(original_request_id IS NOT NULL)')
