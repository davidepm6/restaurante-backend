from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.egreso import Egreso
from app.paginacion import ParametrosPagina, total_paginas
from app.schemas.egreso import EgresoCreate, EgresoOut
from app.schemas.egreso_pagina import PaginaEgresos
from app.security.dependencies import requiere_rol
from app.security.roles import RolUsuario

router = APIRouter(prefix="/egresos", tags=["Egresos"])


@router.post("/", response_model=EgresoOut, status_code=201)
def registrar_egreso(
    egreso: EgresoCreate,
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    nuevo = Egreso(**egreso.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=PaginaEgresos)
def listar_egresos(
    fecha_inicio: Optional[date] = Query(None, description="Formato YYYY-MM-DD"),
    fecha_fin: Optional[date] = Query(None, description="Formato YYYY-MM-DD"),
    pagina: ParametrosPagina = Depends(),
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        raise HTTPException(status_code=400, detail="La fecha inicial no puede ser posterior a la final")

    filtros = []
    if fecha_inicio:
        filtros.append(Egreso.fecha >= fecha_inicio)
    if fecha_fin:
        filtros.append(Egreso.fecha <= fecha_fin)

    # Total y suma de TODO el rango (no solo de la página), en una sola consulta.
    total, suma = (
        db.query(func.count(Egreso.id), func.coalesce(func.sum(Egreso.valor), 0))
        .filter(*filtros)
        .one()
    )

    # Se ordena también por id para que la paginación sea estable cuando dos egresos comparten fecha.
    egresos = (
        db.query(Egreso)
        .filter(*filtros)
        .order_by(Egreso.fecha.desc(), Egreso.id.desc())
        .offset(pagina.desplazamiento)
        .limit(pagina.tamanio)
        .all()
    )

    return PaginaEgresos(
        items=[EgresoOut.model_validate(e) for e in egresos],
        total=total,
        pagina=pagina.pagina,
        tamanio=pagina.tamanio,
        paginas=total_paginas(total, pagina.tamanio),
        total_egresos=float(suma),
    )


@router.get("/{egreso_id}", response_model=EgresoOut)
def obtener_egreso(
    egreso_id: int,
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    egreso = db.query(Egreso).filter(Egreso.id == egreso_id).first()
    if not egreso:
        raise HTTPException(status_code=404, detail="Egreso no encontrado")
    return egreso