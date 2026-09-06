from fastapi import FastAPI
from app.database import Base, engine
from app import models
from app.routers import auth, categorias, productos, ventas, egresos, financiero, reportes
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Gestión de Restaurante", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción, restringir al dominio real del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(egresos.router)
app.include_router(financiero.router)
app.include_router(reportes.router)


@app.get("/")
def root():
    return {"mensaje": "API del sistema de gestión de restaurante activa"}