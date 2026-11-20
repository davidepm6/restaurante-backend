"""ventas metodo_pago

Revision ID: fc4bed2fec6e
Revises: 29054578217b
Create Date: 2026-11-19 21:16:34.066501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc4bed2fec6e'
down_revision: Union[str, Sequence[str], None] = '29054578217b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('ventas', sa.Column('metodo_pago', sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('ventas', 'metodo_pago')