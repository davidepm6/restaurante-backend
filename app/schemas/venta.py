from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class ItemVentaCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0, description="La cantidad debe ser mayor que cero")

class VentaCreate(BaseModel):
    items: List[ItemVentaCreate]

class DetalleVentaOut(BaseModel):
    producto_id: int
    nombre_producto: str
    cantidad: int
    precio_unitario: float
    subtotal: float

    class Config:
        from_attributes = True

class VentaOut(BaseModel):
    id: int
    fecha: datetime
    total: float
    detalles: List[DetalleVentaOut]

    class Config:
        from_attributes = True