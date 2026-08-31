from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductoBase(BaseModel):
    nombre: str
    precio: float = Field(gt=0, description="El precio debe ser mayor que cero")
    stock: int = Field(ge=0)
    categoria_id: int

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    categoria_id: Optional[int] = None

class ProductoOut(ProductoBase):
    id: int
    activo: bool
    creado_en: datetime

    class Config:
        from_attributes = True