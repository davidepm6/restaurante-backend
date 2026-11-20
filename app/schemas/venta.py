from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MetodoPago(str, Enum):
    EFECTIVO = "EFECTIVO"
    TARJETA = "TARJETA"
    TRANSFERENCIA = "TRANSFERENCIA"


class ItemVentaCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0, description="La cantidad debe ser mayor que cero")


class VentaCreate(BaseModel):
    items: List[ItemVentaCreate]
    metodo_pago: MetodoPago


class DetalleVentaOut(BaseModel):
    producto_id: int
    nombre_producto: str
    cantidad: int
    precio_unitario: float
    subtotal: float

    model_config = ConfigDict(from_attributes=True)


class VentaOut(BaseModel):
    id: int
    fecha: datetime
    total: float
    metodo_pago: Optional[MetodoPago] = None
    detalles: List[DetalleVentaOut]

    model_config = ConfigDict(from_attributes=True)