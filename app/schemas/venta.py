from datetime import datetime
from enum import Enum
from typing import Annotated, List, Optional

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


class MetodoPago(str, Enum):
    EFECTIVO = "EFECTIVO"
    TARJETA = "TARJETA"
    TRANSFERENCIA = "TRANSFERENCIA"


class EstadoVenta(str, Enum):
    COMPLETADA = "COMPLETADA"
    ANULADA = "ANULADA"


MotivoTexto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=255)]


class ItemVentaCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0, description="La cantidad debe ser mayor que cero")


class VentaCreate(BaseModel):
    items: List[ItemVentaCreate]
    metodo_pago: MetodoPago


class AnulacionCreate(BaseModel):
    motivo: MotivoTexto


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
    estado: EstadoVenta = EstadoVenta.COMPLETADA
    registrada_por_nombre: Optional[str] = None
    anulada_en: Optional[datetime] = None
    anulada_por_nombre: Optional[str] = None
    motivo_anulacion: Optional[str] = None
    detalles: List[DetalleVentaOut]

    model_config = ConfigDict(from_attributes=True)


class ResumenVentas(BaseModel):
    """Totales de TODO lo que cumple los filtros, no solo de la página actual."""

    total_vendido: float
    completadas: int
    anuladas: int


class PaginaVentas(BaseModel):
    items: List[VentaOut]
    total: int
    pagina: int
    tamanio: int
    paginas: int
    resumen: ResumenVentas


class EmpleadoVentas(BaseModel):
    """Un empleado que ha registrado ventas (para el filtro de la pantalla de Ventas)."""

    id: str
    nombre: Optional[str] = None