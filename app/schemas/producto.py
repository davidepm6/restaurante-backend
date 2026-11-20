from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tipos import NombreTexto

PRECIO_MAXIMO = 99_999_999
STOCK_MAXIMO = 1_000_000


class ProductoBase(BaseModel):
    nombre: NombreTexto
    precio: float = Field(gt=0, le=PRECIO_MAXIMO, description="Precio en pesos, mayor que cero")
    stock: int = Field(ge=0, le=STOCK_MAXIMO)
    categoria_id: int


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: Optional[NombreTexto] = None
    precio: Optional[float] = Field(default=None, gt=0, le=PRECIO_MAXIMO)
    stock: Optional[int] = Field(default=None, ge=0, le=STOCK_MAXIMO)
    categoria_id: Optional[int] = None


class ProductoOut(ProductoBase):
    id: int
    activo: bool
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)