from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tipos import NombreTexto


class ProductoBase(BaseModel):
    nombre: NombreTexto
    precio: float = Field(gt=0, description="El precio debe ser mayor que cero")
    stock: int = Field(ge=0)
    categoria_id: int


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    nombre: Optional[NombreTexto] = None
    precio: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    categoria_id: Optional[int] = None


class ProductoOut(ProductoBase):
    id: int
    activo: bool
    creado_en: datetime

    model_config = ConfigDict(from_attributes=True)