from pydantic import BaseModel, Field
from typing import Optional
from datetime import date

class EgresoBase(BaseModel):
    concepto: str
    descripcion: Optional[str] = None
    valor: float = Field(gt=0, description="El valor debe ser mayor que cero")
    fecha: date

class EgresoCreate(EgresoBase):
    pass

class EgresoOut(EgresoBase):
    id: int

    class Config:
        from_attributes = True