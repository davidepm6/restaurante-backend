from datetime import date
from typing import List

from pydantic import BaseModel


class Periodo(BaseModel):
    desde: date
    hasta: date
    ventas: int
    ingresos: float
    egresos: float
    balance: float


class VentaDia(BaseModel):
    fecha: date
    ventas: int
    total: float


class VentaMetodo(BaseModel):
    metodo: str  # EFECTIVO | TARJETA | TRANSFERENCIA | SIN_METODO (ventas anteriores a HU43)
    ventas: int
    total: float


class ProductoVendido(BaseModel):
    producto_id: int
    producto: str
    cantidad: int
    total: float


class ProductoStockBajo(BaseModel):
    id: int
    nombre: str
    stock: int
    stock_minimo: int


class ResumenStockBajo(BaseModel):
    cantidad: int
    productos: List[ProductoStockBajo]


class RespuestaDashboard(BaseModel):
    hoy: date
    dia: Periodo
    mes: Periodo
    ventas_por_dia: List[VentaDia]
    por_metodo_pago: List[VentaMetodo]
    mas_vendidos: List[ProductoVendido]
    stock_bajo: ResumenStockBajo