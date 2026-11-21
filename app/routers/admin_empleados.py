import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx
from clerk_backend_api import Clerk, models
from fastapi import APIRouter, Depends, HTTPException

from app.security.roles import RolUsuario
from app.schemas.empleado import (
    EmpleadoOut,
    EmpleadosOut,
    EstadoUpdate,
    InvitacionCreate,
    InvitacionOut,
    RolUpdate,
)
from app.security.dependencies import Actor, requiere_rol

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/empleados", tags=["Empleados"])
solo_admin = requiere_rol(RolUsuario.ADMINISTRADOR)
ROLES_VALIDOS = {"ADMINISTRADOR", "EMPLEADO"}


def get_clerk():
    """Cliente de la API de Clerk (se reemplaza por uno falso en las pruebas)."""
    secret = os.getenv("CLERK_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=500, detail="Servicio de usuarios no configurado")
    with Clerk(bearer_auth=secret) as clerk:
        yield clerk


# ---------- conversión de objetos de Clerk a nuestros esquemas ----------

def _fecha(ms: Any) -> datetime | None:
    if isinstance(ms, (int, float)):
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc)
    return None


def _rol_de(metadata: Any) -> str | None:
    rol = metadata.get("role") if isinstance(metadata, dict) else None
    return rol if rol in ROLES_VALIDOS else None


def _email_principal(usuario: Any) -> str | None:
    correos = getattr(usuario, "email_addresses", None) or []
    principal_id = getattr(usuario, "primary_email_address_id", None)
    for correo in correos:
        if getattr(correo, "id", None) == principal_id:
            return getattr(correo, "email_address", None)
    return getattr(correos[0], "email_address", None) if correos else None


def _a_empleado(usuario: Any, id_actual: str | None) -> EmpleadoOut:
    partes = [getattr(usuario, "first_name", None), getattr(usuario, "last_name", None)]
    nombre = " ".join(p for p in partes if isinstance(p, str) and p) or _email_principal(usuario) or "Sin nombre"
    return EmpleadoOut(
        id=usuario.id,
        nombre=nombre,
        email=_email_principal(usuario),
        rol=_rol_de(getattr(usuario, "public_metadata", None)),
        activo=not bool(getattr(usuario, "banned", False)),
        ultimo_acceso=_fecha(getattr(usuario, "last_sign_in_at", None)),
        es_actual=usuario.id == id_actual,
    )


def _es_pendiente(invitacion: Any) -> bool:
    estado = getattr(invitacion, "status", None)
    estado = getattr(estado, "value", estado)
    return estado in (None, "pending")


def _a_invitacion(invitacion: Any) -> InvitacionOut:
    return InvitacionOut(
        id=invitacion.id,
        email=invitacion.email_address,
        rol=_rol_de(getattr(invitacion, "public_metadata", None)),
        creada_en=_fecha(getattr(invitacion, "created_at", None)),
    )


def _fallo_clerk(error: Exception) -> HTTPException:
    logger.exception("Falló una operación con Clerk")
    if isinstance(error, models.ClerkBaseError) and error.status_code == 404:
        return HTTPException(status_code=404, detail="Usuario no encontrado")
    return HTTPException(
        status_code=502,
        detail="No se pudo completar la operación con el servicio de usuarios",
    )


def _no_a_si_mismo(actor: Actor, user_id: str) -> None:
    if actor.clerk_user_id == user_id:
        raise HTTPException(
            status_code=400,
            detail="No puedes cambiar tu propio rol ni desactivar tu propia cuenta.",
        )


# ---------- endpoints ----------

@router.get("/", response_model=EmpleadosOut)
def listar(actor: Actor = Depends(solo_admin), clerk: Clerk = Depends(get_clerk)):
    try:
        usuarios = clerk.users.list(request={"limit": 100})
        invitaciones = clerk.invitations.list(limit=100)
    except (models.ClerkBaseError, httpx.RequestError) as error:
        raise _fallo_clerk(error)

    return EmpleadosOut(
        usuarios=[_a_empleado(u, actor.clerk_user_id) for u in usuarios],
        invitaciones=[_a_invitacion(i) for i in invitaciones if _es_pendiente(i)],
    )


@router.post("/invitaciones", response_model=InvitacionOut, status_code=201)
def invitar(
    datos: InvitacionCreate,
    actor: Actor = Depends(solo_admin),
    clerk: Clerk = Depends(get_clerk),
):
    frontend = os.getenv("FRONTEND_URL")
    if not frontend:
        raise HTTPException(status_code=500, detail="Falta configurar FRONTEND_URL")

    try:
        invitacion = clerk.invitations.create(
            request={
                "email_address": datos.email,
                "public_metadata": {"role": datos.rol},
                "redirect_url": f"{frontend.rstrip('/')}/sign-up",
            }
        )
    except models.ClerkBaseError as error:
        if error.status_code in (400, 422):
            raise HTTPException(
                status_code=409,
                detail="Ya existe una cuenta o una invitación pendiente para ese correo.",
            )
        raise _fallo_clerk(error)
    except httpx.RequestError as error:
        raise _fallo_clerk(error)

    return _a_invitacion(invitacion)


@router.delete("/invitaciones/{invitacion_id}", status_code=204)
def revocar_invitacion(
    invitacion_id: str,
    actor: Actor = Depends(solo_admin),
    clerk: Clerk = Depends(get_clerk),
):
    try:
        clerk.invitations.revoke(invitation_id=invitacion_id)
    except (models.ClerkBaseError, httpx.RequestError) as error:
        raise _fallo_clerk(error)


@router.put("/{user_id}/rol", response_model=EmpleadoOut)
def cambiar_rol(
    user_id: str,
    datos: RolUpdate,
    actor: Actor = Depends(solo_admin),
    clerk: Clerk = Depends(get_clerk),
):
    _no_a_si_mismo(actor, user_id)
    try:
        usuario = clerk.users.update_metadata(user_id=user_id, public_metadata={"role": datos.rol})
    except (models.ClerkBaseError, httpx.RequestError) as error:
        raise _fallo_clerk(error)
    return _a_empleado(usuario, actor.clerk_user_id)


@router.put("/{user_id}/estado", response_model=EmpleadoOut)
def cambiar_estado(
    user_id: str,
    datos: EstadoUpdate,
    actor: Actor = Depends(solo_admin),
    clerk: Clerk = Depends(get_clerk),
):
    _no_a_si_mismo(actor, user_id)
    try:
        if datos.activo:
            usuario = clerk.users.unban(user_id=user_id)
        else:
            usuario = clerk.users.ban(user_id=user_id)
    except (models.ClerkBaseError, httpx.RequestError) as error:
        raise _fallo_clerk(error)
    return _a_empleado(usuario, actor.clerk_user_id)