"""Initialize empty database schema

Revision ID: 64091dba3fd0
Revises: 
Create Date: 2025-09-16 15:43:24.258794

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '64091dba3fd0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    # Drop indexes
    op.drop_index('uk_split_group_sequence', table_name='payment_requests')
    op.drop_index(op.f('ix_idempotency_keys_request_hash'), table_name='idempotency_keys')
    op.drop_index(op.f('ix_idempotency_keys_key'), table_name='idempotency_keys')
    
    # Drop all tables in reverse order
    op.drop_table('file_validation_rules')
    op.drop_table('payment_priority_rules')
    op.drop_table('idempotency_keys')
    op.drop_table('distributor_export_links')
    op.drop_table('export_contracts')
    op.drop_table('sub_registrar_reports')
    op.drop_table('distributor_requests')
    op.drop_table('sub_registrar_assignment_data')
    op.drop_table('sub_registrar_assignments')
    op.drop_table('registrar_assignments')
    op.drop_table('contracts')
    op.drop_table('expense_splits')
    op.drop_table('request_events')
    op.drop_table('request_files')
    op.drop_table('line_contracts')
    op.drop_table('line_required_docs')
    op.drop_table('payment_request_lines')
    op.drop_table('payment_requests')
    op.drop_table('expense_article_role_assignments')
    op.drop_table('responsibilities')
    op.drop_table('article_required_docs')
    op.drop_table('expense_articles')
    op.drop_table('exchange_rates')
    op.drop_table('vat_rates')
    op.drop_table('currencies')
    op.drop_table('counterparties')
    op.drop_table('delegations')
    op.drop_table('user_positions')
    op.drop_table('user_roles')
    op.drop_table('positions')
    op.drop_table('departments')
    op.drop_table('roles')
    op.drop_table('users')
    
    # Drop ENUM types
    op.execute('DROP TYPE IF EXISTS sub_registrar_assignment_status CASCADE')
    op.execute('DROP TYPE IF EXISTS role_code CASCADE')
    op.execute('DROP TYPE IF EXISTS payment_request_status CASCADE')
    op.execute('DROP TYPE IF EXISTS payment_priority CASCADE')
    op.execute('DROP TYPE IF EXISTS document_status CASCADE')
    op.execute('DROP TYPE IF EXISTS distribution_status CASCADE')
    op.execute('DROP TYPE IF EXISTS contract_type CASCADE')
