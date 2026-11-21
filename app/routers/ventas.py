from datetime import date, datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.detalle_venta import DetalleVenta
from app.models.producto import Producto
from app.security.roles import RolUsuario
from app.models.venta import Venta
from app.schemas.venta import AnulacionCreate, DetalleVentaOut, VentaCreate, VentaOut
from app.security.dependencies import requiere_rol
from app.zona_horaria import limites_dia

router = APIRouter(prefix="/ventas", tags=["Ventas"])


def _a_venta_out(venta: Venta) -> VentaOut:
    return VentaOut(
        id=venta.id,
        fecha=venta.fecha,
        total=float(venta.total),
        metodo_pago=venta.metodo_pago,
        estado=venta.estado,
        registrada_por_nombre=venta.registrada_por_nombre,
        anulada_en=venta.anulada_en,
        anulada_por_nombre=venta.anulada_por_nombre,
        motivo_anulacion=venta.motivo_anulacion,
        detalles=[
            DetalleVentaOut(
                producto_id=d.producto_id,
                nombre_producto=d.producto.nombre if d.producto else "Producto eliminado",
                cantidad=d.cantidad,
                precio_unitario=float(d.precio_unitario),
                subtotal=float(d.subtotal),
            )
            for d in venta.detalles
        ],
    )


@router.post("/", response_model=VentaOut, status_code=201)
def registrar_venta(
    venta: VentaCreate,
    db: Session = Depends(get_db),
    usuario=Depends(requiere_rol(RolUsuario.EMPLEADO, RolUsuario.ADMINISTRADOR)),
):
    if not venta.items:
        raise HTTPException(status_code=400, detail="La venta debe tener al menos un producto")

    # Si un mismo producto llega en varias líneas, se suman sus cantidades antes de validar el stock.
    cantidades: dict[int, int] = {}
    for item in venta.items:
        cantidades[item.producto_id] = cantidades.get(item.producto_id, 0) + item.cantidad

    # Se bloquea la fila de cada producto (en orden de id, para evitar bloqueos cruzados) hasta que
    # termine la transacción: dos ventas simultáneas no pueden vender el mismo stock dos veces.
    productos_map: dict[int, Producto] = {}
    for producto_id in sorted(cantidades):
        producto = (
            db.query(Producto)
            .filter(Producto.id == producto_id, Producto.activo == True)
            .with_for_update()
            .first()
        )
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto {producto_id} no encontrado o inactivo")
        if cantidades[producto_id] > producto.stock:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para '{producto.nombre}' (disponible: {producto.stock}, solicitado: {cantidades[producto_id]})",
            )
        productos_map[producto_id] = producto

    try:
        nueva_venta = Venta(
            total=0,
            registrada_por=usuario.clerk_user_id,
            registrada_por_nombre=usuario.nombre,
            metodo_pago=venta.metodo_pago.value,
        )
        db.add(nueva_venta)
        db.flush()

        total_venta = 0
        for producto_id, cantidad in cantidades.items():
            producto = productos_map[producto_id]
            subtotal = float(producto.precio) * cantidad
            total_venta += subtotal
            db.add(
                DetalleVenta(
                    venta_id=nueva_venta.id,
                    producto_id=producto.id,
                    cantidad=cantidad,
                    precio_unitario=producto.precio,
                    subtotal=subtotal,
                )
            )
            producto.stock -= cantidad

        nueva_venta.total = total_venta
        db.commit()
        db.refresh(nueva_venta)

    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo registrar la venta, no se guardó ningún cambio")

    return _a_venta_out(nueva_venta)


@router.get("/", response_model=List[VentaOut])
def listar_ventas(
    fecha_inicio: Optional[date] = Query(None, description="Formato YYYY-MM-DD"),
    fecha_fin: Optional[date] = Query(None, description="Formato YYYY-MM-DD"),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR)),
):
    query = db.query(Venta)

    if fecha_inicio:
        query = query.filter(Venta.fecha >= limites_dia(fecha_inicio, fecha_inicio)[0])
    if fecha_fin:
        query = query.filter(Venta.fecha < limites_dia(fecha_fin, fecha_fin)[1])

    return [_a_venta_out(v) for v in query.order_by(Venta.fecha.desc()).all()]


@router.get("/{venta_id}", response_model=VentaOut)
def obtener_venta(
    venta_id: int,
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR)),
):
    venta = db.query(Venta).filter(Venta.id == venta_id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return _a_venta_out(venta)


@router.post("/{venta_id}/anular", response_model=VentaOut)
def anular_venta(
    venta_id: int,
    datos: AnulacionCreate,
    db: Session = Depends(get_db),
    actor=Depends(requiere_rol(RolUsuario.ADMINISTRADOR)),
):
    # Se bloquea la venta: dos anulaciones simultáneas no pueden devolver el stock dos veces.
    venta = db.query(Venta).filter(Venta.id == venta_id).with_for_update().first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if venta.estado == "ANULADA":
        raise HTTPException(status_code=409, detail="La venta ya está anulada")

    try:
        # El stock vuelve en la misma transacción. Se incluye el producto aunque se haya desactivado.
        for detalle in sorted(venta.detalles, key=lambda d: d.producto_id):
            producto = (
                db.query(Producto).filter(Producto.id == detalle.producto_id).with_for_update().first()
            )
            if producto:
                producto.stock += detalle.cantidad

        venta.estado = "ANULADA"
        venta.anulada_en = datetime.now(timezone.utc)
        venta.anulada_por = actor.clerk_user_id
        venta.anulada_por_nombre = actor.nombre
        venta.motivo_anulacion = datos.motivo

        db.commit()
        db.refresh(venta)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="No se pudo anular la venta, no se guardó ningún cambio")

    return _a_venta_out(venta)