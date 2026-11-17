from sqlalchemy import Column, Integer, ForeignKey, DateTime, Numeric, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=True)  # se conecta con Usuario en el Sprint 4 (JWT)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    total = Column(Numeric(10, 2), nullable=False, default=0)

    registrada_por = Column(String(64), nullable=True, index=True)  # clerk_user_id
    registrada_por_nombre = Column(String(150), nullable=True)

    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")