"""Initialize empty database schema

Revision ID: 18fb4e44fc7f
Revises: 
Create Date: 2025-09-16 15:57:09.106781

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '18fb4e44fc7f'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM types
    contract_type = postgresql.ENUM(
        'general', 'export', 'service', 'supply',
        name='contract_type',
        create_type=True
    )
    contract_type.create(op.get_bind())
    
    distribution_status = postgresql.ENUM(
        'pending', 'in_progress', 'completed', 'failed',
        name='distribution_status',
        create_type=True
    )
    distribution_status.create(op.get_bind())
    
    document_status = postgresql.ENUM(
        'required', 'uploaded', 'verified', 'rejected',
        name='document_status',
        create_type=True
    )
    document_status.create(op.get_bind())
    
    payment_priority = postgresql.ENUM(
        'low', 'normal', 'high', 'urgent', 'critical',
        name='payment_priority',
        create_type=True
    )
    payment_priority.create(op.get_bind())
    
    payment_request_status = postgresql.ENUM(
        'draft', 'submitted', 'classified', 'returned', 'approved',
        'approved-on-behalf', 'to-pay', 'in-register', 'approved-for-payment',
        'paid-full', 'paid-partial', 'rejected', 'cancelled', 'closed',
        'distributed', 'report_published', 'export_linked', 'splited',
        name='payment_request_status',
        create_type=True
    )
    payment_request_status.create(op.get_bind())
    
    role_code = postgresql.ENUM(
        'admin', 'executor', 'registrar', 'sub_registrar', 'distributor', 'treasurer',
        name='role_code',
        create_type=True
    )
    role_code.create(op.get_bind())
    
    sub_registrar_assignment_status = postgresql.ENUM(
        'assigned', 'in_progress', 'completed', 'rejected',
        name='sub_registrar_assignment_status',
        create_type=True
    )
    sub_registrar_assignment_status.create(op.get_bind())

    # Create tables
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )
    
    op.create_table('roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    op.create_table('departments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('positions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.ForeignKeyConstraint(['department_id'], ['departments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('user_roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=False),
        sa.Column('valid_to', sa.Date(), nullable=True),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('user_positions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('position_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=False),
        sa.Column('valid_to', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['position_id'], ['positions.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('delegations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('from_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('to_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('position_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.ForeignKeyConstraint(['from_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['position_id'], ['positions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['to_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('counterparties',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('tax_id', sa.String(length=64), nullable=True),
        sa.Column('category', sa.String(length=128), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('currencies',
        sa.Column('code', sa.String(length=3), nullable=False),
        sa.Column('scale', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('code')
    )
    
    op.create_table('vat_rates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rate', sa.Numeric(precision=6, scale=3), nullable=False),
        sa.Column('name', sa.String(length=64), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('exchange_rates',
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('rate', sa.Numeric(precision=10, scale=6), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['currency_code'], ['currencies.code'], ),
        sa.PrimaryKeyConstraint('date', 'currency_code')
    )
    
    op.create_table('expense_articles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    op.create_table('article_required_docs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('article_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('doc_type', sa.String(length=64), nullable=False),
        sa.Column('is_mandatory', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['article_id'], ['expense_articles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('responsibilities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('article_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('position_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=False),
        sa.Column('valid_to', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['article_id'], ['expense_articles.id'], ),
        sa.ForeignKeyConstraint(['position_id'], ['positions.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('expense_article_role_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('article_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False),
        sa.Column('valid_from', sa.Date(), nullable=False),
        sa.Column('valid_to', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['article_id'], ['expense_articles.id'], ),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('payment_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('number', sa.String(length=64), nullable=False),
        sa.Column('created_by_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('counterparty_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('status', postgresql.ENUM('draft', 'submitted', 'classified', 'returned', 'approved', 'approved-on-behalf', 'to-pay', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'rejected', 'cancelled', 'closed', 'distributed', 'report_published', 'export_linked', 'splited', name='payment_request_status'), server_default=sa.text("'draft'"), nullable=False),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('amount_total', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('vat_total', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('amount_base_currency', sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column('base_currency_code', sa.String(length=3), server_default=sa.text("'USD'"), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('expense_article_text', sa.String(length=255), nullable=True),
        sa.Column('doc_number', sa.String(length=128), nullable=True),
        sa.Column('doc_date', sa.Date(), nullable=True),
        sa.Column('doc_type', sa.String(length=64), nullable=True),
        sa.Column('paying_company', sa.String(length=64), nullable=True),
        sa.Column('counterparty_category', sa.String(length=128), nullable=True),
        sa.Column('vat_rate', sa.String(length=64), nullable=True),
        sa.Column('product_service', sa.String(length=255), nullable=True),
        sa.Column('volume', sa.String(length=128), nullable=True),
        sa.Column('price_rate', sa.String(length=128), nullable=True),
        sa.Column('period', sa.String(length=128), nullable=True),
        sa.Column('responsible_registrar_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('distribution_status', postgresql.ENUM('pending', 'in_progress', 'completed', 'failed', name='distribution_status'), server_default=sa.text("'pending'"), nullable=False),
        sa.Column('priority', postgresql.ENUM('low', 'normal', 'high', 'urgent', 'critical', name='payment_priority'), server_default=sa.text("'normal'"), nullable=False),
        sa.Column('priority_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('original_request_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('split_sequence', sa.Integer(), nullable=True),
        sa.Column('is_split_request', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['counterparty_id'], ['counterparties.id'], ),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['currency_code'], ['currencies.code'], ),
        sa.ForeignKeyConstraint(['original_request_id'], ['payment_requests.id'], ),
        sa.ForeignKeyConstraint(['responsible_registrar_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('number')
    )
    
    op.create_table('payment_request_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('article_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('executor_position_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('registrar_position_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('distributor_position_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quantity', sa.Numeric(), nullable=False),
        sa.Column('amount_net', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('vat_rate_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('status', postgresql.ENUM('draft', 'submitted', 'classified', 'returned', 'approved', 'approved-on-behalf', 'to-pay', 'in-register', 'approved-for-payment', 'paid-full', 'paid-partial', 'rejected', 'cancelled', 'closed', 'distributed', 'report_published', 'export_linked', 'splited', name='payment_request_status'), server_default=sa.text("'draft'"), nullable=False),
        sa.Column('note', sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(['article_id'], ['expense_articles.id'], ),
        sa.ForeignKeyConstraint(['currency_code'], ['currencies.code'], ),
        sa.ForeignKeyConstraint(['distributor_position_id'], ['positions.id'], ),
        sa.ForeignKeyConstraint(['executor_position_id'], ['positions.id'], ),
        sa.ForeignKeyConstraint(['registrar_position_id'], ['positions.id'], ),
        sa.ForeignKeyConstraint(['request_id'], ['payment_requests.id'], ),
        sa.ForeignKeyConstraint(['vat_rate_id'], ['vat_rates.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('line_required_docs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('line_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('doc_type', sa.String(length=64), nullable=False),
        sa.Column('is_provided', sa.Boolean(), nullable=False),
        sa.Column('file_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['line_id'], ['payment_request_lines.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('line_contracts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('line_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contract_number', sa.String(length=128), nullable=False),
        sa.Column('amount_net', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('contract_date', sa.Date(), nullable=False),
        sa.Column('note', sa.String(length=1000), nullable=True),
        sa.ForeignKeyConstraint(['currency_code'], ['currencies.code'], ),
        sa.ForeignKeyConstraint(['line_id'], ['payment_request_lines.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('request_files',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('mime_type', sa.String(length=128), nullable=False),
        sa.Column('storage_path', sa.String(length=1000), nullable=False),
        sa.Column('doc_type', sa.String(length=64), nullable=False),
        sa.Column('uploaded_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['payment_requests.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('request_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('actor_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payload', sa.String(length=4000), nullable=False),
        sa.Column('snapshot_hash', sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(['actor_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['request_id'], ['payment_requests.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('expense_splits',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expense_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('comment', sa.String(length=1000), nullable=True),
        sa.Column('contract_id', sa.String(length=128), nullable=True),
        sa.Column('priority', sa.String(length=32), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['expense_item_id'], ['expense_articles.id'], ),
        sa.ForeignKeyConstraint(['request_id'], ['payment_requests.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('contracts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('counterparty_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contract_number', sa.String(length=128), nullable=False),
        sa.Column('contract_date', sa.Date(), nullable=False),
        sa.Column('contract_type', postgresql.ENUM('general', 'export', 'service', 'supply', name='contract_type'), nullable=False),
        sa.Column('validity_period', sa.String(length=128), nullable=True),
        sa.Column('rates', sa.String(length=1000), nullable=True),
        sa.Column('contract_info', sa.String(length=2000), nullable=True),
        sa.Column('contract_file_url', sa.String(length=500), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['counterparty_id'], ['counterparties.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('registrar_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('registrar_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_sub_registrar_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('expense_article_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('assigned_amount', sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column('registrar_comments', sa.String(length=2000), nullable=True),
        sa.Column('classification_date', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['assigned_sub_registrar_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['expense_article_id'], ['expense_articles.id'], ),
        sa.ForeignKeyConstraint(['registrar_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['request_id'], ['payment_requests.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('request_id')
    )
    
    op.create_table('sub_registrar_assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sub_registrar_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('status', postgresql.ENUM('assigned', 'in_progress', 'completed', 'rejected', name='sub_registrar_assignment_status'), server_default=sa.text("'assigned'"), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['payment_requests.id'], ),
        sa.ForeignKeyConstraint(['sub_registrar_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('sub_registrar_assignment_data',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sub_registrar_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_type', sa.String(length=64), nullable=True),
        sa.Column('document_number', sa.String(length=128), nullable=True),
        sa.Column('document_date', sa.Date(), nullable=True),
        sa.Column('amount_without_vat', sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column('vat_amount', sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column('currency_code', sa.String(length=3), nullable=True),
        sa.Column('original_document_status', sa.String(length=64), nullable=True),
        sa.Column('sub_registrar_comments', sa.String(length=2000), nullable=True),
        sa.Column('is_draft', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('is_published', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['payment_requests.id'], ),
        sa.ForeignKeyConstraint(['sub_registrar_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('request_id')
    )
    
    op.create_table('distributor_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('original_request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expense_article_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column('distributor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'in_progress', 'completed', 'failed', name='distribution_status'), server_default=sa.text("'pending'"), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['distributor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['expense_article_id'], ['expense_articles.id'], ),
        sa.ForeignKeyConstraint(['original_request_id'], ['payment_requests.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('sub_registrar_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sub_registrar_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('document_status', postgresql.ENUM('required', 'uploaded', 'verified', 'rejected', name='document_status'), nullable=False),
        sa.Column('report_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=32), server_default=sa.text("'DRAFT'"), nullable=False),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['request_id'], ['payment_requests.id'], ),
        sa.ForeignKeyConstraint(['sub_registrar_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('export_contracts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('contract_number', sa.String(length=128), nullable=False),
        sa.Column('contract_date', sa.Date(), nullable=False),
        sa.Column('counterparty_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('amount', sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column('currency_code', sa.String(length=3), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint(['counterparty_id'], ['counterparties.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('distributor_export_links',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('distributor_request_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('export_contract_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('linked_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('linked_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['distributor_request_id'], ['distributor_requests.id'], ),
        sa.ForeignKeyConstraint(['export_contract_id'], ['export_contracts.id'], ),
        sa.ForeignKeyConstraint(['linked_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('idempotency_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String(length=255), nullable=False),
        sa.Column('request_hash', sa.String(length=64), nullable=False),
        sa.Column('response_data', sa.JSON(), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('payment_priority_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('priority', postgresql.ENUM('low', 'normal', 'high', 'urgent', 'critical', name='payment_priority'), nullable=False),
        sa.Column('conditions', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('file_validation_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=True),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('allowed_extensions', sa.JSON(), nullable=False),
        sa.Column('max_size_mb', sa.Integer(), nullable=False),
        sa.Column('mime_types', sa.JSON(), nullable=False),
        sa.Column('is_required', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index(op.f('ix_idempotency_keys_key'), 'idempotency_keys', ['key'], unique=True)
    op.create_index(op.f('ix_idempotency_keys_request_hash'), 'idempotency_keys', ['request_hash'], unique=False)
    op.create_index('uk_split_group_sequence', 'payment_requests', ['original_request_id', 'split_sequence'], unique=True, postgresql_where='(original_request_id IS NOT NULL)')


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