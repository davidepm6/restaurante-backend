import logging
import os
from dataclasses import dataclass, field
from typing import Any

from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from fastapi import HTTPException, Request

logger = logging.getLogger(__name__)


@dataclass
class Principal:
    """Usuario autenticado, obtenido del token de sesión de Clerk."""
    clerk_user_id: str
    role: str | None
    claims: dict[str, Any] = field(default_factory=dict)


def _partes_autorizadas() -> list[str]:
    bruto = os.getenv("CLERK_AUTHORIZED_PARTIES", "")
    return [p.strip() for p in bruto.split(",") if p.strip()]


def obtener_principal(request: Request) -> Principal:
    """Dependencia de FastAPI: verifica el token ANTES de cualquier lógica de negocio."""
    secret_key = os.getenv("CLERK_SECRET_KEY")
    jwt_key = os.getenv("CLERK_JWT_KEY")
    partes = _partes_autorizadas()

    if (not secret_key and not jwt_key) or not partes:
        logger.error("Clerk mal configurado: define CLERK_SECRET_KEY (o CLERK_JWT_KEY) y CLERK_AUTHORIZED_PARTIES")
        raise HTTPException(status_code=500, detail="Servicio de autenticación no configurado")

    no_autenticado = HTTPException(
        status_code=401, detail="No autenticado", headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        estado = authenticate_request(
            request,
            AuthenticateRequestOptions(
                secret_key=secret_key,
                jwt_key=jwt_key,
                authorized_parties=partes,
                accepts_token=["session_token"],
            ),
        )
    except Exception:
        logger.exception("Error verificando el token de Clerk")
        raise no_autenticado

    if not estado.is_signed_in:
        logger.info("Token rechazado: %s", estado.reason)  # el motivo se registra, no se devuelve
        raise no_autenticado

    claims = estado.payload or {}
    metadata = claims.get("metadata")
    rol = metadata.get("role") if isinstance(metadata, dict) else None
    return Principal(clerk_user_id=claims["sub"], role=rol, claims=claims)