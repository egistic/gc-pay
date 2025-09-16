"""Initialize empty database schema

Revision ID: 64091dba3fd0
Revises: 6c7ca75a1298
Create Date: 2025-09-16 15:43:24.258794

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64091dba3fd0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
