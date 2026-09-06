from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, TokenOut
from app.security.hashing import verificar_password
from app.security.jwt import crear_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenOut)
def login(credenciales: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == credenciales.email).first()

    error_generico = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas"
    )

    if not usuario or not usuario.activo:
        raise error_generico
    if not verificar_password(credenciales.password, usuario.password_hash):
        raise error_generico

    token = crear_token({"sub": usuario.email, "rol": usuario.rol.value})
    return TokenOut(access_token=token, rol=usuario.rol.value)