from math import ceil

from fastapi import Query

TAMANIO_POR_DEFECTO = 25
TAMANIO_MAXIMO = 100


class ParametrosPagina:
    """Parámetros ?pagina=1&tamanio=25, comunes a todos los listados paginados."""

    def __init__(
        self,
        pagina: int = Query(1, ge=1, description="Número de página, empezando en 1"),
        tamanio: int = Query(
            TAMANIO_POR_DEFECTO, ge=1, le=TAMANIO_MAXIMO, description=f"Resultados por página (máximo {TAMANIO_MAXIMO})"
        ),
    ):
        self.pagina = pagina
        self.tamanio = tamanio

    @property
    def desplazamiento(self) -> int:
        return (self.pagina - 1) * self.tamanio


def total_paginas(total: int, tamanio: int) -> int:
    """Al menos 1, aunque no haya resultados."""
    return max(1, ceil(total / tamanio))