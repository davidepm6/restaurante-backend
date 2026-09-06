from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime
from io import BytesIO
import calendar

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.database import get_db
from app.models.venta import Venta
from app.models.detalle_venta import DetalleVenta
from app.models.producto import Producto
from app.models.egreso import Egreso
from app.security.dependencies import requiere_rol
from app.models.usuario import RolUsuario

router = APIRouter(prefix="/reportes", tags=["Reportes"])


def _armar_reporte(db: Session, fecha_inicio: date, fecha_fin: date) -> dict:
    ventas_total = db.query(func.sum(Venta.total)).filter(
        Venta.fecha >= datetime.combine(fecha_inicio, datetime.min.time()),
        Venta.fecha <= datetime.combine(fecha_fin, datetime.max.time())
    ).scalar() or 0

    egresos_total = db.query(func.sum(Egreso.valor)).filter(
        Egreso.fecha >= fecha_inicio, Egreso.fecha <= fecha_fin
    ).scalar() or 0

    productos_vendidos = db.query(
        Producto.nombre, func.sum(DetalleVenta.cantidad).label("cantidad_total")
    ).join(DetalleVenta, DetalleVenta.producto_id == Producto.id).join(
        Venta, Venta.id == DetalleVenta.venta_id
    ).filter(
        Venta.fecha >= datetime.combine(fecha_inicio, datetime.min.time()),
        Venta.fecha <= datetime.combine(fecha_fin, datetime.max.time())
    ).group_by(Producto.nombre).order_by(func.sum(DetalleVenta.cantidad).desc()).all()

    return {
        "fecha_inicio": str(fecha_inicio),
        "fecha_fin": str(fecha_fin),
        "ventas_totales": float(ventas_total),
        "ingresos": float(ventas_total),
        "egresos": float(egresos_total),
        "balance": float(ventas_total) - float(egresos_total),
        "productos_vendidos": [{"producto": p[0], "cantidad": p[1]} for p in productos_vendidos]
    }


def _generar_pdf(titulo: str, reporte: dict) -> BytesIO:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    y = 750

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, titulo)
    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Generado el: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    y -= 30

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, f"Periodo: {reporte['fecha_inicio']} a {reporte['fecha_fin']}")
    y -= 25

    c.setFont("Helvetica", 11)
    for etiqueta, valor in [
        ("Ventas totales", reporte["ventas_totales"]),
        ("Ingresos", reporte["ingresos"]),
        ("Egresos", reporte["egresos"]),
        ("Balance", reporte["balance"]),
    ]:
        c.drawString(50, y, f"{etiqueta}: ${valor:,.2f}")
        y -= 18

    y -= 15
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y, "Productos vendidos:")
    y -= 18
    c.setFont("Helvetica", 10)
    for item in reporte["productos_vendidos"]:
        c.drawString(60, y, f"- {item['producto']}: {item['cantidad']} unidades")
        y -= 15
        if y < 50:
            c.showPage()
            y = 750

    c.save()
    buffer.seek(0)
    return buffer


@router.get("/diario")
def reporte_diario(
    fecha: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    return _armar_reporte(db, fecha, fecha)


@router.get("/mensual")
def reporte_mensual(
    anio: int = Query(...),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    ultimo_dia = calendar.monthrange(anio, mes)[1]
    return _armar_reporte(db, date(anio, mes, 1), date(anio, mes, ultimo_dia))


@router.get("/diario/pdf")
def reporte_diario_pdf(
    fecha: date = Query(default_factory=date.today),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    reporte = _armar_reporte(db, fecha, fecha)
    pdf = _generar_pdf(f"Reporte diario - {fecha}", reporte)
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_{fecha}.pdf"}
    )


@router.get("/mensual/pdf")
def reporte_mensual_pdf(
    anio: int = Query(...),
    mes: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    ultimo_dia = calendar.monthrange(anio, mes)[1]
    reporte = _armar_reporte(db, date(anio, mes, 1), date(anio, mes, ultimo_dia))
    pdf = _generar_pdf(f"Reporte mensual - {mes}/{anio}", reporte)
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=reporte_{anio}_{mes}.pdf"}
    )