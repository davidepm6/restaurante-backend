from sqlalchemy import Column, Integer, String, Numeric, Date
from app.database import Base

class Egreso(Base):
    __tablename__ = "egresos"

    id = Column(Integer, primary_key=True, index=True)
    concepto = Column(String(150), nullable=False)
    descripcion = Column(String(255), nullable=True)
    valor = Column(Numeric(10, 2), nullable=False)
    fecha = Column(Date, nullable=False)