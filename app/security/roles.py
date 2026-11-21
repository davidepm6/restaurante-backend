import enum


class RolUsuario(str, enum.Enum):
    ADMINISTRADOR = "ADMINISTRADOR"
    EMPLEADO = "EMPLEADO"