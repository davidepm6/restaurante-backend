from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Optional, List

from app.database import get_db
from app.models.producto import Producto
from app.models.venta import Venta
from app.models.detalle_venta import DetalleVenta
from app.schemas.venta import VentaCreate, VentaOut, DetalleVentaOut

router = APIRouter(prefix="/ventas", tags=["Ventas"])


@router.post("/", response_model=VentaOut, status_code=201)
def registrar_venta(venta: VentaCreate, db: Session = Depends(get_db)):
    if not venta.items:
        raise HTTPException(status_code=400, detail="La venta debe tener al menos un producto")

    # 1. Cargar y validar todos los productos y el stock ANTES de tocar la base
    productos_map = {}
    for item in venta.items:
        producto = db.query(Producto).filter(
            Producto.id == item.producto_id,
            Producto.activo == True
        ).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado o inactivo")
        if item.cantidad > producto.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{producto.nombre}' (disponible: {producto.stock}, solicitado: {item.cantidad})"
            )
        productos_map[item.producto_id] = producto

    # 2. Todo lo siguiente ocurre en la misma transacción; si algo falla, se hace rollback
    try:
        nueva_venta = Venta(total=0)
        db.add(nueva_venta)
        db.flush()  # obtiene nueva_venta.id sin cerrar la transacción

        total_venta = 0
        detalles_creados = []

        for item in venta.items:
            producto = productos_map[item.producto_id]
            subtotal = float(producto.precio) * item.cantidad
            total_venta += subtotal

            detalle = DetalleVenta(
                venta_id=nueva_venta.id,
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_unitario=producto.precio,
                subtotal=subtotal
            )
            db.add(detalle)
            detalles_creados.append((detalle, producto.nombre))

            # HU12: actualizar stock en la misma transacción
            producto.stock -= item.cantidad

        nueva_venta.total = total_venta
        db.commit()
        db.refresh(nueva_venta)

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo registrar la venta, no se guardó ningún cambio")

    return VentaOut(
        id=nueva_venta.id,
        fecha=nueva_venta.fecha,
        total=float(nueva_venta.total),
        detalles=[
            DetalleVentaOut(
                producto_id=d.producto_id,
                nombre_producto=nombre,
                cantidad=d.cantidad,
                precio_unitario=float(d.precio_unitario),
                subtotal=float(d.subtotal)
            )
            for d, nombre in detalles_creados
        ]
    )


@router.get("/", response_model=List[VentaOut])
def listar_ventas(
    fecha_inicio: Optional[date] = Query(None, description="Formato YYYY-MM-DD"),
    fecha_fin: Optional[date] = Query(None, description="Formato YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    query = db.query(Venta)

    if fecha_inicio:
        query = query.filter(Venta.fecha >= datetime.combine(fecha_inicio, datetime.min.time()))
    if fecha_fin:
        query = query.filter(Venta.fecha <= datetime.combine(fecha_fin, datetime.max.time()))

    ventas = query.order_by(Venta.fecha.desc()).all()

    resultado = []
    for v in ventas:
        detalles = [
            DetalleVentaOut(
                producto_id=d.producto_id,
                nombre_producto=d.producto.nombre if d.producto else "Producto eliminado",
                cantidad=d.cantidad,
                precio_unitario=float(d.precio_unitario),
                subtotal=float(d.subtotal)
            )
            for d in v.detalles
        ]
        resultado.append(VentaOut(id=v.id, fecha=v.fecha, total=float(v.total), detalles=detalles))
    return resultado


@router.get("/{venta_id}", response_model=VentaOut)
def obtener_venta(venta_id: int, db: Session = Depends(get_db)):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    detalles = [
        DetalleVentaOut(
            producto_id=d.producto_id,
            nombre_producto=d.producto.nombre if d.producto else "Producto eliminado",
            cantidad=d.cantidad,
            precio_unitario=float(d.precio_unitario),
            subtotal=float(d.subtotal)
        )
        for d in venta.detalles
    ]
    return VentaOut(id=venta.id, fecha=venta.fecha, total=float(venta.total), detalles=detalles)