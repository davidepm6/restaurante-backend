from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.producto import Producto
from app.models.categoria import Categoria
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoOut

router = APIRouter(prefix="/productos", tags=["Productos"])

@router.post("/", response_model=ProductoOut, status_code=201)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    categoria = db.query(Categoria).filter(Categoria.id == producto.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=400, detail="La categoría indicada no existe")
    nuevo = Producto(**producto.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.get("/", response_model=list[ProductoOut])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Producto).filter(Producto.activo == True).all()

@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto

@router.put("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(producto_id: int, datos: ProductoUpdate, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if datos.categoria_id is not None:
        categoria = db.query(Categoria).filter(Categoria.id == datos.categoria_id).first()
        if not categoria:
            raise HTTPException(status_code=400, detail="La categoría indicada no existe")
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(producto, campo, valor)
    db.commit()
    db.refresh(producto)
    return producto

@router.delete("/{producto_id}", status_code=200)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    # HU07: se desactiva (soft delete) para conservar el historial de ventas
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    producto.activo = False
    db.commit()
    return {"detail": "Producto desactivado correctamente"}