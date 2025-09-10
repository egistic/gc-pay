from alembic import op
import sqlalchemy as sa
import uuid

revision = '0001_init'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    pass  # use 'alembic revision --autogenerate -m "init"' then 'alembic upgrade head'

def downgrade():
    pass
