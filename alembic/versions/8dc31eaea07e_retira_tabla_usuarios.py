"""retira tabla usuarios

Revision ID: 8dc31eaea07e
Revises: 6b5d57a8455f
Create Date: 2026-11-20 19:52:54.862310

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "8dc31eaea07e"
down_revision: Union[str, Sequence[str], None] = "6b5d57a8455f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # Conserva los nombres de las ventas antes de eliminar usuarios.
    op.execute(
        """
        UPDATE ventas
        SET registrada_por_nombre = usuarios.nombre
        FROM usuarios
        WHERE ventas.usuario_id = usuarios.id
        AND ventas.registrada_por_nombre IS NULL
        """
    )

    # Comandos generados por Alembic.
    op.drop_index(op.f("ix_usuarios_email"), table_name="usuarios")
    op.drop_index(op.f("ix_usuarios_id"), table_name="usuarios")
    op.drop_table("usuarios")

    # Eliminar el tipo enum que quedó sin uso.
    op.execute("DROP TYPE IF EXISTS rolusuario")


def downgrade() -> None:
    """Downgrade schema."""

    # Comandos generados por Alembic.
    op.create_table(
        "usuarios",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("nombre", sa.VARCHAR(length=100), autoincrement=False, nullable=False),
        sa.Column("email", sa.VARCHAR(length=150), autoincrement=False, nullable=False),
        sa.Column("password_hash", sa.VARCHAR(length=255), autoincrement=False, nullable=False),
        sa.Column(
            "rol",
            postgresql.ENUM(
                "ADMINISTRADOR",
                "EMPLEADO",
                name="rolusuario",
            ),
            autoincrement=False,
            nullable=False,
        ),
        sa.Column("activo", sa.BOOLEAN(), autoincrement=False, nullable=True),
        sa.Column(
            "creado_en",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            autoincrement=False,
            nullable=True,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("usuarios_pkey")),
    )
    op.create_index(
        op.f("ix_usuarios_id"),
        "usuarios",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_usuarios_email"),
        "usuarios",
        ["email"],
        unique=True,
    )