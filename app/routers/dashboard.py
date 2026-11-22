from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import Date, cast, func, literal_column
from sqlalchemy.orm import Session

from app.dashboard import rellenar_dias
from app.database import get_db
from app.models.detalle_venta import DetalleVenta
from app.models.egreso import Egreso
from app.models.producto import Producto, stock_bajo_sql
from app.models.venta import Venta
from app.schemas.dashboard import (
    Periodo,
    ProductoStockBajo,
    ProductoVendido,
    RespuestaDashboard,
    ResumenStockBajo,
    VentaMetodo,
)
from app.security.dependencies import requiere_rol
from app.security.roles import RolUsuario
from app.zona_horaria import hoy_negocio, limites_dia

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

TOP_PRODUCTOS = 5
TOP_STOCK_BAJO = 5


def _periodo(db: Session, desde: date, hasta: date) -> Periodo:
    inicio, fin = limites_dia(desde, hasta)
    ventas, ingresos = (
        db.query(func.count(Venta.id), func.coalesce(func.sum(Venta.total), 0))
        .filter(Venta.estado == "COMPLETADA", Venta.fecha >= inicio, Venta.fecha < fin)
        .one()
    )
    egresos = (
        db.query(func.coalesce(func.sum(Egreso.valor), 0))
        .filter(Egreso.fecha >= desde, Egreso.fecha <= hasta)
        .scalar()
    )
    ingresos, egresos = float(ingresos), float(egresos)
    return Periodo(
        desde=desde,
        hasta=hasta,
        ventas=ventas,
        ingresos=ingresos,
        egresos=egresos,
        balance=round(ingresos - egresos, 2),
    )


def _ventas_por_dia(db: Session, hoy: date, dias: int):
    desde = hoy - timedelta(days=dias - 1)
    inicio, fin = limites_dia(desde, hoy)
    # El día se calcula en hora de Colombia dentro de la base de datos. El literal va escrito tal cual
    # (no como parámetro) para que el SELECT y el GROUP BY lleven exactamente la misma expresión.
    dia_colombia = cast(func.timezone(literal_column("'America/Bogota'"), Venta.fecha), Date)
    filas = (
        db.query(dia_colombia, func.count(Venta.id), func.coalesce(func.sum(Venta.total), 0))
        .filter(Venta.estado == "COMPLETADA", Venta.fecha >= inicio, Venta.fecha < fin)
        .group_by(dia_colombia)
        .all()
    )
    return rellenar_dias(desde, hoy, {fila[0]: (fila[1], float(fila[2])) for fila in filas})


def _por_metodo_pago(db: Session, desde: date, hasta: date) -> list[VentaMetodo]:
    inicio, fin = limites_dia(desde, hasta)
    metodo = func.coalesce(Venta.metodo_pago, literal_column("'SIN_METODO'"))
    filas = (
        db.query(metodo, func.count(Venta.id), func.coalesce(func.sum(Venta.total), 0))
        .filter(Venta.estado == "COMPLETADA", Venta.fecha >= inicio, Venta.fecha < fin)
        .group_by(metodo)
        .order_by(func.sum(Venta.total).desc())
        .all()
    )
    return [VentaMetodo(metodo=f[0], ventas=f[1], total=float(f[2])) for f in filas]


def _mas_vendidos(db: Session, desde: date, hasta: date) -> list[ProductoVendido]:
    inicio, fin = limites_dia(desde, hasta)
    filas = (
        db.query(
            Producto.id,
            Producto.nombre,
            func.sum(DetalleVenta.cantidad),
            func.sum(DetalleVenta.subtotal),
        )
        .join(DetalleVenta, DetalleVenta.producto_id == Producto.id)
        .join(Venta, Venta.id == DetalleVenta.venta_id)
        .filter(Venta.estado == "COMPLETADA", Venta.fecha >= inicio, Venta.fecha < fin)
        .group_by(Producto.id, Producto.nombre)
        .order_by(func.sum(DetalleVenta.cantidad).desc(), Producto.nombre)
        .limit(TOP_PRODUCTOS)
        .all()
    )
    return [
        ProductoVendido(producto_id=f[0], producto=f[1], cantidad=int(f[2]), total=float(f[3])) for f in filas
    ]


def _stock_bajo(db: Session) -> ResumenStockBajo:
    cantidad = (
        db.query(func.count(Producto.id)).filter(Producto.activo == True, stock_bajo_sql()).scalar()
    )
    productos = (
        db.query(Producto)
        .filter(Producto.activo == True, stock_bajo_sql())
        .order_by(Producto.stock, Producto.nombre)
        .limit(TOP_STOCK_BAJO)
        .all()
    )
    return ResumenStockBajo(
        cantidad=cantidad,
        productos=[
            ProductoStockBajo(id=p.id, nombre=p.nombre, stock=p.stock, stock_minimo=p.stock_minimo)
            for p in productos
        ],
    )


@router.get("", response_model=RespuestaDashboard)
def obtener_dashboard(
    dias: int = Query(14, ge=7, le=31, description="Días del gráfico de ventas, terminando hoy"),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR)),
):
    hoy = hoy_negocio()
    primero_del_mes = hoy.replace(day=1)
    return RespuestaDashboard(
        hoy=hoy,
        dia=_periodo(db, hoy, hoy),
        mes=_periodo(db, primero_del_mes, hoy),
        ventas_por_dia=_ventas_por_dia(db, hoy, dias),
        por_metodo_pago=_por_metodo_pago(db, primero_del_mes, hoy),
        mas_vendidos=_mas_vendidos(db, primero_del_mes, hoy),
        stock_bajo=_stock_bajo(db),
    )