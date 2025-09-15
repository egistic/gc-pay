"""Add registrar and sub-registrar assignment tables only

Revision ID: b72a2ab85df1
Revises: 921bfccec735
Create Date: 2025-09-15 14:01:08.539415

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b72a2ab85df1'
down_revision = '3afe2971dede'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create registrar_assignments table
    op.create_table('registrar_assignments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('request_id', sa.Uuid(), nullable=False),
        sa.Column('registrar_id', sa.Uuid(), nullable=False),
        sa.Column('assigned_sub_registrar_id', sa.Uuid(), nullable=True),
        sa.Column('expense_article_id', sa.Uuid(), nullable=True),
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
    
    # Create sub_registrar_assignment_data table
    op.create_table('sub_registrar_assignment_data',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('request_id', sa.Uuid(), nullable=False),
        sa.Column('sub_registrar_id', sa.Uuid(), nullable=False),
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


def downgrade() -> None:
    op.drop_table('sub_registrar_assignment_data')
    op.drop_table('registrar_assignments')
