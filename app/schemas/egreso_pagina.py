from typing import List

from pydantic import BaseModel

from app.schemas.egreso import EgresoOut


class PaginaEgresos(BaseModel):
    items: List[EgresoOut]
    total: int
    pagina: int
    tamanio: int
    paginas: int
    # Suma de TODOS los egresos del rango consultado, no solo de la página actual.
    total_egresos: float