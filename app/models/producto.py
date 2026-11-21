from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, and_, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    precio = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    stock_minimo = Column(Integer, nullable=False, server_default=text("0"))  # 0 = sin alerta
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    categoria = relationship("Categoria", back_populates="productos")


def stock_bajo_sql():
    """Condición SQL de «stock bajo»: hay un mínimo definido y el stock llegó a él o está por debajo."""
    return and_(Producto.stock_minimo > 0, Producto.stock <= Producto.stock_minimo)