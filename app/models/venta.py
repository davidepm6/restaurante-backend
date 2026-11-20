from sqlalchemy import Column, DateTime, Integer, Numeric, String, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=True)  # solo ventas hechas con el login antiguo
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    total = Column(Numeric(10, 2), nullable=False, default=0)
    registrada_por = Column(String(64), nullable=True, index=True)  # clerk_user_id
    registrada_por_nombre = Column(String(150), nullable=True)
    metodo_pago = Column(String(20), nullable=True)  # EFECTIVO | TARJETA | TRANSFERENCIA (nulo en ventas antiguas)

    # Anulación (HU44): la venta nunca se borra, cambia de estado.
    estado = Column(String(20), nullable=False, server_default=text("'COMPLETADA'"))  # COMPLETADA | ANULADA
    anulada_en = Column(DateTime(timezone=True), nullable=True)
    anulada_por = Column(String(64), nullable=True)  # clerk_user_id
    anulada_por_nombre = Column(String(150), nullable=True)
    motivo_anulacion = Column(String(255), nullable=True)

    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")