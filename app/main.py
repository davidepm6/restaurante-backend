from fastapi import FastAPI
from app import models
from app.routers import auth, categorias, productos, ventas, egresos, financiero, reportes
from fastapi.middleware.cors import CORSMiddleware
from app.routers import me

app = FastAPI(title="Sistema de Gestión de Restaurante", version="1.0.0")

import os

def _origenes_permitidos() -> list[str]:
    bruto = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    return [o.strip().rstrip("/") for o in bruto.split(",") if o.strip()]

@app.get("/health", tags=["Sistema"])
def health():
    return {"estado": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origenes_permitidos(),
    allow_credentials=False,  # se usa el encabezado Authorization, no cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(categorias.router)
app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(egresos.router)
app.include_router(financiero.router)
app.include_router(reportes.router)
app.include_router(me.router)

@app.get("/")
def root():
    return {"mensaje": "API del sistema de gestión de restaurante activa"}