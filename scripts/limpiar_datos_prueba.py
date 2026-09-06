from app.database import SessionLocal
from app.models.detalle_venta import DetalleVenta
from app.models.producto import Producto
from app.models.categoria import Categoria

db = SessionLocal()

categorias_prueba = db.query(Categoria).filter(Categoria.nombre.like("Cat-%")).all()
ids_categorias = [c.id for c in categorias_prueba]

if not ids_categorias:
    print("No se encontraron categorías de prueba (patrón 'Cat-%').")
else:
    productos_prueba = db.query(Producto).filter(Producto.categoria_id.in_(ids_categorias)).all()
    ids_productos = [p.id for p in productos_prueba]

    print(f"Categorías de prueba encontradas: {len(categorias_prueba)}")
    print(f"Productos asociados: {len(productos_prueba)}")
    for c in categorias_prueba:
        print(f"  - [{c.id}] {c.nombre}")

    confirmar = input("¿Eliminar estos datos de prueba? (si/no): ").strip().lower()
    if confirmar == "si":
        if ids_productos:
            db.query(DetalleVenta).filter(DetalleVenta.producto_id.in_(ids_productos)).delete(synchronize_session=False)
            db.query(Producto).filter(Producto.id.in_(ids_productos)).delete(synchronize_session=False)
        db.query(Categoria).filter(Categoria.id.in_(ids_categorias)).delete(synchronize_session=False)
        db.commit()
        print("Datos de prueba eliminados correctamente.")
    else:
        print("Operación cancelada.")

db.close()