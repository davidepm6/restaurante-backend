"""Carga datos de demostración (categorías y productos). Se puede ejecutar varias veces."""
import os
from urllib.parse import urlparse

from app.database import SessionLocal
from app.models.categoria import Categoria
from app.models.producto import Producto

DEMO = {
    "Entradas": [("Empanadas (x3)", 9000, 40), ("Nachos con queso", 14000, 25)],
    "Platos fuertes": [("Hamburguesa clásica", 22000, 30), ("Bandeja paisa", 32000, 20), ("Pechuga a la plancha", 26000, 25)],
    "Bebidas": [("Limonada natural", 6000, 60), ("Gaseosa 400 ml", 4500, 80), ("Jugo de mora", 7000, 50)],
    "Postres": [("Brownie con helado", 12000, 20), ("Tres leches", 10000, 18)],
}


def main() -> None:
    host = urlparse(os.getenv("DATABASE_URL", "")).hostname
    print(f"Base de datos destino: {host}")
    if input("¿Cargar datos de demostración aquí? (si/no): ").strip().lower() != "si":
        print("Cancelado.")
        return

    db = SessionLocal()
    try:
        for nombre_cat, productos in DEMO.items():
            categoria = db.query(Categoria).filter(Categoria.nombre == nombre_cat).first()
            if not categoria:
                categoria = Categoria(nombre=nombre_cat, descripcion=f"Categoría de demostración: {nombre_cat}")
                db.add(categoria)
                db.flush()
            for nombre, precio, stock in productos:
                existe = db.query(Producto).filter(
                    Producto.nombre == nombre, Producto.categoria_id == categoria.id
                ).first()
                if not existe:
                    db.add(Producto(nombre=nombre, precio=precio, stock=stock, categoria_id=categoria.id))
        db.commit()
        print("Datos de demostración cargados.")
    finally:
        db.close()


if __name__ == "__main__":
    main()