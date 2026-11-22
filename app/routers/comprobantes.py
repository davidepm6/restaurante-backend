import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session, selectinload

from app.comprobante import generar_pdf
from app.database import get_db
from app.models.detalle_venta import DetalleVenta
from app.models.venta import Venta
from app.security.dependencies import requiere_rol
from app.security.roles import RolUsuario

router = APIRouter(prefix="/ventas", tags=["Ventas"])


@router.get("/{venta_id}/comprobante", response_class=Response)
def descargar_comprobante(
    venta_id: int,
    db: Session = Depends(get_db),
    actor=Depends(requiere_rol(RolUsuario.EMPLEADO, RolUsuario.ADMINISTRADOR)),
):
    venta = (
        db.query(Venta)
        .options(selectinload(Venta.detalles).selectinload(DetalleVenta.producto))
        .filter(Venta.id == venta_id)
        .first()
    )
    # Un empleado solo puede obtener el comprobante de sus propias ventas; de las demás, «no existe».
    if not venta or (actor.rol == RolUsuario.EMPLEADO and venta.registrada_por != actor.clerk_user_id):
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    pdf = generar_pdf(venta, os.getenv("NOMBRE_NEGOCIO", "Restaurante"))
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="comprobante-{venta.id}.pdf"'},
    )