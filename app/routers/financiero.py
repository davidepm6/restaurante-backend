from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.database import get_db
from app.models.venta import Venta
from app.models.egreso import Egreso
from app.schemas.egreso import EgresoOut
from app.schemas.financiero import IngresosOut, EgresosOut, BalanceOut
from app.security.dependencies import requiere_rol
from app.security.roles import RolUsuario
from app.zona_horaria import limites_dia

router = APIRouter(prefix="/financiero", tags=["Financiero"])


def _calcular_ingresos(db: Session, fecha_inicio: date, fecha_fin: date) -> float:
    desde, hasta = limites_dia(fecha_inicio, fecha_fin)
    resultado = db.query(func.sum(Venta.total)).filter(
        Venta.estado == "COMPLETADA",
        Venta.fecha >= desde,
        Venta.fecha < hasta
    ).scalar()
    return float(resultado) if resultado is not None else 0.0


def _obtener_egresos(db: Session, fecha_inicio: date, fecha_fin: date):
    # Los egresos guardan solo la fecha, así que no tienen problema de zona horaria.
    return db.query(Egreso).filter(
        Egreso.fecha >= fecha_inicio,
        Egreso.fecha <= fecha_fin
    ).order_by(Egreso.fecha.desc()).all()


@router.get("/ingresos", response_model=IngresosOut)
def consultar_ingresos(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    total = _calcular_ingresos(db, fecha_inicio, fecha_fin)
    return IngresosOut(fecha_inicio=str(fecha_inicio), fecha_fin=str(fecha_fin), total_ingresos=total)


@router.get("/egresos", response_model=EgresosOut)
def consultar_egresos(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    egresos = _obtener_egresos(db, fecha_inicio, fecha_fin)
    total = sum(float(e.valor) for e in egresos)
    return EgresosOut(
        fecha_inicio=str(fecha_inicio),
        fecha_fin=str(fecha_fin),
        total_egresos=total,
        egresos=[EgresoOut.model_validate(e) for e in egresos]
    )


@router.get("/balance", response_model=BalanceOut)
def consultar_balance(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    total_ingresos = _calcular_ingresos(db, fecha_inicio, fecha_fin)
    egresos = _obtener_egresos(db, fecha_inicio, fecha_fin)
    total_egresos = sum(float(e.valor) for e in egresos)
    return BalanceOut(
        fecha_inicio=str(fecha_inicio),
        fecha_fin=str(fecha_fin),
        total_ingresos=total_ingresos,
        total_egresos=total_egresos,
        balance=total_ingresos - total_egresos
    )