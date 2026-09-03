from fastapi import FastAPI
from app.database import Base, engine
from app import models  # importa los modelos para que se registren en Base
from app.routers import categorias, productos, ventas, egresos, financiero

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Gestión de Restaurante", version="1.0.0")

app.include_router(egresos.router)
app.include_router(financiero.router)

app.include_router(ventas.router)

Base.metadata.create_all(bind=engine)

app.include_router(categorias.router)
app.include_router(productos.router)

@app.get("/")
def root():
    return {"mensaje": "API del sistema de gestión de restaurante activa"}