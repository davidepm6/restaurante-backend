from pydantic import BaseModel, ConfigDict, Field
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

    model_config = ConfigDict(from_attributes=True)