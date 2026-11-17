from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr

RolNombre = Literal["ADMINISTRADOR", "EMPLEADO"]


class InvitacionCreate(BaseModel):
    email: EmailStr
    rol: RolNombre


class RolUpdate(BaseModel):
    rol: RolNombre


class EstadoUpdate(BaseModel):
    activo: bool


class EmpleadoOut(BaseModel):
    id: str
    nombre: str
    email: str | None = None
    rol: RolNombre | None = None
    activo: bool
    ultimo_acceso: datetime | None = None
    es_actual: bool = False


class InvitacionOut(BaseModel):
    id: str
    email: str
    rol: RolNombre | None = None
    creada_en: datetime | None = None


class EmpleadosOut(BaseModel):
    usuarios: list[EmpleadoOut]
    invitaciones: list[InvitacionOut]