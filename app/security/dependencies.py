from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.security.clerk_auth import obtener_principal
from app.security.roles import RolUsuario

# HTTPBearer exige el encabezado Authorization y habilita el botón "Authorize" de Swagger.
security_scheme = HTTPBearer()


@dataclass
class Actor:
    """Quién hace la solicitud, según el token de sesión de Clerk."""
    rol: RolUsuario
    clerk_user_id: str
    nombre: str | None = None
    email: str | None = None


def obtener_usuario_actual(
    request: Request,
    _credenciales: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> Actor:
    principal = obtener_principal(request)  # verifica firma, vigencia y origen
    if principal.role is None:
        raise HTTPException(status_code=403, detail="Cuenta pendiente de asignación de rol")

    email = principal.claims.get("email") or None
    nombre = principal.claims.get("nombre") or email
    return Actor(
        rol=RolUsuario(principal.role),
        clerk_user_id=principal.clerk_user_id,
        nombre=nombre,
        email=email,
    )


def requiere_rol(*roles_permitidos: RolUsuario):
    def verificador(actor: Actor = Depends(obtener_usuario_actual)) -> Actor:
        if actor.rol not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )
        return actor

    return verificador