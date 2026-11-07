from fastapi import APIRouter, Depends

from app.security.clerk_auth import Principal, obtener_principal

router = APIRouter(tags=["Sesión"])


@router.get("/me")
def me(principal: Principal = Depends(obtener_principal)):
    return {"clerk_user_id": principal.clerk_user_id, "role": principal.role}