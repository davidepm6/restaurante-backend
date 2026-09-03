from pydantic import BaseModel
from typing import List
from app.schemas.egreso import EgresoOut

class IngresosOut(BaseModel):
    fecha_inicio: str
    fecha_fin: str
    total_ingresos: float

class EgresosOut(BaseModel):
    fecha_inicio: str
    fecha_fin: str
    total_egresos: float
    egresos: List[EgresoOut]

class BalanceOut(BaseModel):
    fecha_inicio: str
    fecha_fin: str
    total_ingresos: float
    total_egresos: float
    balance: float