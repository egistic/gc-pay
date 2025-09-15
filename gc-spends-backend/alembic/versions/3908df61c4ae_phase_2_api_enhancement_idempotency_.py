"""phase_2_api_enhancement_idempotency_priority_file_management

Revision ID: 3908df61c4ae
Revises: 141ae1976b53
Create Date: 2025-09-14 10:36:03.075050

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3908df61c4ae'
down_revision = '141ae1976b53'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create PaymentPriority enum type
    payment_priority_enum = postgresql.ENUM(
        'LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL',
        name='paymentpriority',
        create_type=False
    )
    payment_priority_enum.create(op.get_bind())
    
    # Add priority fields to payment_requests table
    op.add_column('payment_requests', sa.Column('priority', payment_priority_enum, server_default='NORMAL', nullable=False))
    op.add_column('payment_requests', sa.Column('priority_score', sa.Numeric(5, 2), nullable=True))
    
    # Create idempotency_keys table
    op.create_table('idempotency_keys',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String(255), nullable=False),
        sa.Column('request_hash', sa.String(64), nullable=False),
        sa.Column('response_data', sa.JSON(), nullable=False),
        sa.Column('status_code', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key')
    )
    op.create_index(op.f('ix_idempotency_keys_key'), 'idempotency_keys', ['key'], unique=False)
    op.create_index(op.f('ix_idempotency_keys_request_hash'), 'idempotency_keys', ['request_hash'], unique=False)
    
    # Create payment_priority_rules table
    op.create_table('payment_priority_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000), nullable=True),
        sa.Column('priority', payment_priority_enum, nullable=False),
        sa.Column('conditions', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create file_validation_rules table
    op.create_table('file_validation_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.String(1000), nullable=True),
        sa.Column('file_type', sa.String(50), nullable=False),
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


def downgrade() -> None:
    # Drop tables
    op.drop_table('file_validation_rules')
    op.drop_table('payment_priority_rules')
    op.drop_table('idempotency_keys')
    
    # Remove columns from payment_requests
    op.drop_column('payment_requests', 'priority_score')
    op.drop_column('payment_requests', 'priority')
    
    # Drop enum type
    op.execute('DROP TYPE paymentpriority')
