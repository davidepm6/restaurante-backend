from dataclasses import dataclass

import jwt as pyjwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import RolUsuario, Usuario
from app.security.clerk_auth import obtener_principal
from app.security.jwt import decodificar_token

security_scheme = HTTPBearer()


@dataclass
class Actor:
    """Quién hace la solicitud: token de Clerk o login antiguo (temporal hasta HU25)."""
    rol: RolUsuario
    origen: str  # "clerk" | "legado"
    id: int | None = None  # id local: solo existe con el login antiguo
    clerk_user_id: str | None = None
    nombre: str | None = None
    email: str | None = None


def _no_autenticado() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _actor_desde_clerk(request: Request) -> Actor:
    principal = obtener_principal(request)  # verifica firma, vigencia y origen
    if principal.role is None:
        raise HTTPException(status_code=403, detail="Cuenta pendiente de asignación de rol")
    email = principal.claims.get("email") or None
    nombre = principal.claims.get("nombre") or email
    return Actor(
        rol=RolUsuario(principal.role),
        origen="clerk",
        clerk_user_id=principal.clerk_user_id,
        nombre=nombre,
        email=email,
    )


def _actor_desde_login_antiguo(token: str, db: Session) -> Actor:
    try:
        payload = decodificar_token(token)
        email = payload.get("sub")
        if email is None:
            raise _no_autenticado()
    except JWTError:
        raise _no_autenticado()

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario is None or not usuario.activo:
        raise _no_autenticado()
    return Actor(rol=usuario.rol, origen="legado", id=usuario.id, nombre=usuario.nombre, email=usuario.email)


def obtener_usuario_actual(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> Actor:
    token = credentials.credentials
    try:
        algoritmo = pyjwt.get_unverified_header(token).get("alg")
    except pyjwt.PyJWTError:
        raise _no_autenticado()

    if algoritmo == "RS256":  # tokens de Clerk
        return _actor_desde_clerk(request)
    return _actor_desde_login_antiguo(token, db)  # HS256: login antiguo


def requiere_rol(*roles_permitidos: RolUsuario):
    def verificador(actor: Actor = Depends(obtener_usuario_actual)) -> Actor:
        if actor.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )
        return actor

    return verificador