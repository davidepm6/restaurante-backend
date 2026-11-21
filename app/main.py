import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registra los modelos en Base)
from app.errores import registrar_manejadores
from app.routers import admin_empleados, categorias, egresos, financiero, me, productos, reportes, ventas

app = FastAPI(title="Sistema de Gestión de Restaurante", version="1.0.0")


def _origenes_permitidos() -> list[str]:
    bruto = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    return [o.strip().rstrip("/") for o in bruto.split(",") if o.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_origenes_permitidos(),
    allow_credentials=False,  # se usa el encabezado Authorization, no cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

registrar_manejadores(app, _origenes_permitidos())

app.include_router(me.router)
app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(egresos.router)
app.include_router(financiero.router)
app.include_router(reportes.router)
app.include_router(admin_empleados.router)


@app.get("/")
def root():
    return {"mensaje": "API del sistema de gestión de restaurante activa"}


@app.get("/health", tags=["Sistema"])
def health():
    return {"estado": "ok"}