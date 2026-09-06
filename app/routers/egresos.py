from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.egreso import Egreso
from app.schemas.egreso import EgresoCreate, EgresoOut
from app.security.dependencies import requiere_rol
from app.models.usuario import RolUsuario

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


@router.get("/", response_model=list[EgresoOut])
def listar_egresos(
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR))
):
    return db.query(Egreso).order_by(Egreso.fecha.desc()).all()


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