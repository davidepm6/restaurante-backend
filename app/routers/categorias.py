from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.categoria import Categoria
from app.models.producto import Producto
from app.security.roles import RolUsuario
from app.schemas.categoria import CategoriaCreate, CategoriaOut, CategoriaUpdate
from app.security.dependencies import obtener_usuario_actual, requiere_rol

router = APIRouter(prefix="/categorias", tags=["Categorías"])


def _nombre_en_uso(db: Session, nombre: str, excluir_id: int | None = None) -> bool:
    consulta = db.query(Categoria).filter(func.lower(Categoria.nombre) == nombre.lower())
    if excluir_id is not None:
        consulta = consulta.filter(Categoria.id != excluir_id)
    return consulta.first() is not None


@router.post("/", response_model=CategoriaOut, status_code=201)
def crear_categoria(
    categoria: CategoriaCreate,
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR)),
):
    if _nombre_en_uso(db, categoria.nombre):
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")
    nueva = Categoria(**categoria.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/", response_model=list[CategoriaOut])
def listar_categorias(
    db: Session = Depends(get_db),
    _=Depends(obtener_usuario_actual),
):
    return db.query(Categoria).order_by(Categoria.nombre).all()


@router.get("/{categoria_id}", response_model=CategoriaOut)
def obtener_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
    _=Depends(obtener_usuario_actual),
):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria


@router.put("/{categoria_id}", response_model=CategoriaOut)
def actualizar_categoria(
    categoria_id: int,
    datos: CategoriaUpdate,
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR)),
):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    if datos.nombre is not None and _nombre_en_uso(db, datos.nombre, excluir_id=categoria_id):
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(categoria, campo, valor)
    db.commit()
    db.refresh(categoria)
    return categoria


@router.delete("/{categoria_id}", status_code=204)
def eliminar_categoria(
    categoria_id: int,
    db: Session = Depends(get_db),
    _=Depends(requiere_rol(RolUsuario.ADMINISTRADOR)),
):
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    total = db.query(Producto).filter(Producto.categoria_id == categoria_id).count()
    if total:
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar: la categoría tiene {total} producto(s) asociado(s), activos o desactivados.",
        )
    db.delete(categoria)
    db.commit()
    return None